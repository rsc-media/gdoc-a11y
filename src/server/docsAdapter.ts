/**
 * Docs adapter: converts the live DocumentApp tree into the host-agnostic
 * DocModel that the checks engine consumes. This file (and docsActions.ts)
 * are the only places that touch DocumentApp for reading.
 */
import type { DocModel, DocNode, ImageNode, ParagraphNode, TextRun } from '../core/model';

type Body = GoogleAppsScript.Document.Body;
type ContainerElement = GoogleAppsScript.Document.ContainerElement;
type Element = GoogleAppsScript.Document.Element;
type Paragraph = GoogleAppsScript.Document.Paragraph;
type ListItem = GoogleAppsScript.Document.ListItem;
type Text = GoogleAppsScript.Document.Text;
type Table = GoogleAppsScript.Document.Table;
type InlineImage = GoogleAppsScript.Document.InlineImage;

const DEFAULT_FONT_SIZE_PT = 11;
const DEFAULT_TEXT_COLOR = '#000000';
const DEFAULT_PAGE_COLOR = '#ffffff';

export function buildModel(doc: GoogleAppsScript.Document.Document): DocModel {
  const body = doc.getBody();
  const pageBackgroundColor = getPageBackground(body);
  const nodes: DocNode[] = [];

  walkContainer(body, [], false, pageBackgroundColor, nodes);

  return {
    title: doc.getName(),
    pageBackgroundColor,
    bodyFontSizePt: dominantBodyFontSize(nodes),
    nodes,
  };
}

function getPageBackground(body: Body): string {
  try {
    const attrs = body.getAttributes();
    const bg = attrs[DocumentApp.Attribute.BACKGROUND_COLOR] as string | null;
    return bg ?? DEFAULT_PAGE_COLOR;
  } catch {
    return DEFAULT_PAGE_COLOR;
  }
}

function walkContainer(
  container: Body | ContainerElement,
  path: number[],
  inTableCell: boolean,
  pageBg: string,
  out: DocNode[],
): void {
  const n = container.getNumChildren();
  for (let i = 0; i < n; i++) {
    const child = container.getChild(i);
    const childPath = path.concat(i);
    const type = child.getType();

    if (type === DocumentApp.ElementType.PARAGRAPH || type === DocumentApp.ElementType.LIST_ITEM) {
      const p = (
        type === DocumentApp.ElementType.PARAGRAPH ? child.asParagraph() : child.asListItem()
      ) as Paragraph | ListItem;
      out.push(paragraphNode(p, childPath, inTableCell));
      collectParagraphChildren(p, childPath, out);
      collectPositionedImages(p, childPath, out);
    } else if (type === DocumentApp.ElementType.TABLE) {
      const table = child.asTable();
      out.push(tableNode(table, childPath));
      walkTableCells(table, childPath, pageBg, out);
    }
    // Other body children (page breaks, TOC, horizontal rules) are not checked in v1.
  }
}

function paragraphNode(
  p: Paragraph | ListItem,
  path: number[],
  inTableCell: boolean,
): ParagraphNode {
  return {
    kind: 'paragraph',
    ref: { path },
    headingLevel: headingLevel(p.getHeading()),
    runs: extractRuns(p),
    inTableCell,
  };
}

function headingLevel(
  h: GoogleAppsScript.Document.ParagraphHeading,
): ParagraphNode['headingLevel'] {
  switch (h) {
    case DocumentApp.ParagraphHeading.HEADING1:
      return 1;
    case DocumentApp.ParagraphHeading.HEADING2:
      return 2;
    case DocumentApp.ParagraphHeading.HEADING3:
      return 3;
    case DocumentApp.ParagraphHeading.HEADING4:
      return 4;
    case DocumentApp.ParagraphHeading.HEADING5:
      return 5;
    case DocumentApp.ParagraphHeading.HEADING6:
      return 6;
    default:
      return 0; // NORMAL, TITLE, SUBTITLE → treated as body text in v1
  }
}

/**
 * Extract styled runs across all Text children of a paragraph.
 * Run indices must be reproducible: docsActions.ts re-runs this function to
 * resolve a runIndex back to (text element, start, end) for locate/fix.
 */
export function extractRuns(p: Paragraph | ListItem): TextRun[] {
  const runs: TextRun[] = [];
  const n = p.getNumChildren();
  for (let i = 0; i < n; i++) {
    const child = p.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.TEXT) continue;
    const text = child.asText();
    const s = text.getText();
    if (s.length === 0) continue;
    const indices = text.getTextAttributeIndices();
    for (let k = 0; k < indices.length; k++) {
      const start = indices[k] as number;
      const end = k + 1 < indices.length ? (indices[k + 1] as number) : s.length;
      runs.push({
        text: s.slice(start, end),
        bold: text.isBold(start) === true,
        fontSizePt: (text.getFontSize(start) as number | null) ?? DEFAULT_FONT_SIZE_PT,
        foregroundColor: (text.getForegroundColor(start) as string | null) ?? DEFAULT_TEXT_COLOR,
        backgroundColor: (text.getBackgroundColor(start) as string | null) ?? null,
        linkUrl: text.getLinkUrl(start),
      });
    }
  }
  return runs;
}

/** Map a runIndex back to its Text element and character range. Used by docsActions. */
export function resolveRun(
  p: Paragraph | ListItem,
  runIndex: number,
): { text: Text; start: number; endInclusive: number } | null {
  let idx = 0;
  const n = p.getNumChildren();
  for (let i = 0; i < n; i++) {
    const child = p.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.TEXT) continue;
    const text = child.asText();
    const s = text.getText();
    if (s.length === 0) continue;
    const indices = text.getTextAttributeIndices();
    for (let k = 0; k < indices.length; k++) {
      const start = indices[k] as number;
      const end = k + 1 < indices.length ? (indices[k + 1] as number) : s.length;
      if (idx === runIndex) return { text, start, endInclusive: end - 1 };
      idx++;
    }
  }
  return null;
}

function collectParagraphChildren(p: Paragraph | ListItem, path: number[], out: DocNode[]): void {
  const n = p.getNumChildren();
  for (let i = 0; i < n; i++) {
    const child = p.getChild(i);
    const type = child.getType();
    const childPath = path.concat(i);
    if (type === DocumentApp.ElementType.INLINE_IMAGE) {
      out.push(inlineImageNode(child.asInlineImage(), childPath));
    } else if (type === DocumentApp.ElementType.INLINE_DRAWING) {
      out.push({ kind: 'drawing', ref: { path: childPath }, drawingType: 'drawing' });
    } else if (type === DocumentApp.ElementType.EQUATION) {
      out.push({ kind: 'drawing', ref: { path: childPath }, drawingType: 'equation' });
    }
  }
}

function inlineImageNode(img: InlineImage, path: number[]): ImageNode {
  return {
    kind: 'image',
    ref: { path },
    altDescription: img.getAltDescription() ?? '',
    positioned: false,
    altSupported: true,
  };
}

function collectPositionedImages(p: Paragraph | ListItem, path: number[], out: DocNode[]): void {
  if (!('getPositionedImages' in p)) return; // ListItem lacks positioned images
  const images = (p as Paragraph).getPositionedImages();
  images.forEach((img, k) => {
    // PositionedImage has no documented alt-text API; feature-detect so we
    // upgrade automatically if Google adds it.
    const anyImg = img as unknown as { getAltDescription?: () => string | null };
    const supported = typeof anyImg.getAltDescription === 'function';
    out.push({
      kind: 'image',
      ref: { path, positionedIndex: k },
      altDescription: supported ? (anyImg.getAltDescription?.() ?? '') : '',
      positioned: true,
      altSupported: supported,
    });
  });
}

function tableNode(table: Table, path: number[]): DocNode {
  const rows = table.getNumRows();
  let cols = 0;
  let totalCells = 0;
  let nonEmptyCells = 0;
  for (let r = 0; r < rows; r++) {
    const row = table.getRow(r);
    const cells = row.getNumCells();
    cols = Math.max(cols, cells);
    for (let c = 0; c < cells; c++) {
      totalCells++;
      if (row.getCell(c).getText().trim() !== '') nonEmptyCells++;
    }
  }
  return { kind: 'table', ref: { path }, rows, cols, nonEmptyCells, totalCells };
}

function walkTableCells(table: Table, path: number[], pageBg: string, out: DocNode[]): void {
  const rows = table.getNumRows();
  for (let r = 0; r < rows; r++) {
    const row = table.getRow(r);
    const cells = row.getNumCells();
    for (let c = 0; c < cells; c++) {
      walkContainer(row.getCell(c), path.concat(r, c), true, pageBg, out);
    }
  }
}

/** Resolve an ElementRef path back to a live element by re-walking child indices. */
export function resolveElement(
  doc: GoogleAppsScript.Document.Document,
  path: number[],
): Element | null {
  let el: Element = doc.getBody() as unknown as Element;
  for (const index of path) {
    const container = el as unknown as {
      getNumChildren?: () => number;
      getChild?: (i: number) => Element;
    };
    // Table rows/cells use getRow/getCell, but both also expose getChild — the
    // generic container walk covers Body, Paragraph, Table, TableRow, TableCell.
    if (!container.getNumChildren || !container.getChild) return null;
    if (index < 0 || index >= container.getNumChildren()) return null;
    el = container.getChild(index);
  }
  return el;
}

function dominantBodyFontSize(nodes: DocNode[]): number {
  const counts = new Map<number, number>();
  for (const node of nodes) {
    if (node.kind !== 'paragraph' || node.headingLevel !== 0) continue;
    for (const run of node.runs) {
      const chars = run.text.trim().length;
      if (chars === 0) continue;
      counts.set(run.fontSizePt, (counts.get(run.fontSizePt) ?? 0) + chars);
    }
  }
  let best = DEFAULT_FONT_SIZE_PT;
  let bestCount = 0;
  counts.forEach((count, size) => {
    if (count > bestCount) {
      best = size;
      bestCount = count;
    }
  });
  return best;
}
