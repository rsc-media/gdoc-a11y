/**
 * Host-agnostic document model. Checks operate ONLY on these plain types —
 * never on Apps Script APIs — so the engine is unit-testable in Node and
 * future Sheets/Slides support is just a new adapter.
 */

/**
 * Structural path from the document body to an element: child indices at each
 * level of the tree. Serializable across google.script.run; the host adapter
 * resolves it back to a live element. `runIndex` addresses a styled text run
 * within a paragraph; `positionedIndex` addresses a positioned (wrap-text)
 * image anchored to the paragraph.
 */
export interface ElementRef {
  path: number[];
  runIndex?: number;
  positionedIndex?: number;
}

export interface TextRun {
  text: string;
  bold: boolean;
  fontSizePt: number;
  /** '#rrggbb' */
  foregroundColor: string;
  /** highlight color, or null to inherit the page background */
  backgroundColor: string | null;
  linkUrl: string | null;
}

export interface ParagraphNode {
  kind: 'paragraph';
  ref: ElementRef;
  /** 0 = normal text, 1–6 = Heading 1–6 */
  headingLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  runs: TextRun[];
  inTableCell: boolean;
}

export interface ImageNode {
  kind: 'image';
  ref: ElementRef;
  altDescription: string;
  positioned: boolean;
  /** false when the host API cannot read/write alt text for this image type */
  altSupported: boolean;
}

export interface TableNode {
  kind: 'table';
  ref: ElementRef;
  rows: number;
  cols: number;
  nonEmptyCells: number;
  totalCells: number;
}

export interface DrawingNode {
  kind: 'drawing';
  ref: ElementRef;
  drawingType: 'drawing' | 'chart' | 'equation';
}

export type DocNode = ParagraphNode | ImageNode | TableNode | DrawingNode;

export interface DocModel {
  /** file name */
  title: string;
  /** '#rrggbb' */
  pageBackgroundColor: string;
  /** dominant body-text size in points (for fake-heading detection) */
  bodyFontSizePt: number;
  /** flattened nodes in document order */
  nodes: DocNode[];
}

export type Severity = 'error' | 'warning' | 'review';

export type CheckId =
  | 'CHK-01' // image alt text
  | 'CHK-02' // heading structure
  | 'CHK-03' // link text
  | 'CHK-04' // text contrast
  | 'CHK-05' // document title
  | 'CHK-06' // tables
  | 'CHK-07'; // drawings / charts / equations

export interface IssueFix {
  type: 'setAltText' | 'setLinkText';
  /** value at scan time; server re-verifies before writing */
  currentValue: string;
}

export interface Issue {
  /** stable within one scan */
  id: string;
  checkId: CheckId;
  severity: Severity;
  /** WCAG success criterion, e.g. '1.1.1' */
  wcag: string;
  title: string;
  /** <= 80 chars of nearby/affected text for the issue card */
  context: string;
  whyItMatters: string;
  howToFix: string;
  ref: ElementRef;
  fix?: IssueFix;
  /** extra display data, e.g. measured/required contrast ratio */
  data?: Record<string, string | number>;
}

export interface ScanResult {
  issues: Issue[];
  counts: { error: number; warning: number; review: number };
  scannedAt: string;
}

/** Combined plain text of a paragraph's runs. */
export function paragraphText(p: ParagraphNode): string {
  return p.runs.map((r) => r.text).join('');
}

/** Trim a context snippet for issue cards. */
export function snippet(text: string, max = 80): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}
