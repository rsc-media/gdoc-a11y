/** Builder helpers for hand-crafting DocModel fixtures in tests. */
import type {
  DocModel,
  DocNode,
  DrawingNode,
  ImageNode,
  ParagraphNode,
  TableNode,
  TextRun,
} from '../src/core/model';

export function run(text: string, overrides: Partial<TextRun> = {}): TextRun {
  return {
    text,
    bold: false,
    fontSizePt: 11,
    foregroundColor: '#000000',
    backgroundColor: null,
    linkUrl: null,
    ...overrides,
  };
}

export function para(
  runs: TextRun[] | string,
  overrides: Partial<Omit<ParagraphNode, 'kind' | 'runs'>> = {},
): ParagraphNode {
  return {
    kind: 'paragraph',
    ref: { path: [0] },
    headingLevel: 0,
    runs: typeof runs === 'string' ? [run(runs)] : runs,
    inTableCell: false,
    ...overrides,
  };
}

export function heading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  text: string,
  overrides: Partial<Omit<ParagraphNode, 'kind' | 'runs'>> = {},
): ParagraphNode {
  return para(text, { headingLevel: level, ...overrides });
}

export function image(overrides: Partial<Omit<ImageNode, 'kind'>> = {}): ImageNode {
  return {
    kind: 'image',
    ref: { path: [0] },
    altDescription: '',
    positioned: false,
    altSupported: true,
    ...overrides,
  };
}

export function table(overrides: Partial<Omit<TableNode, 'kind'>> = {}): TableNode {
  return {
    kind: 'table',
    ref: { path: [0] },
    rows: 3,
    cols: 3,
    nonEmptyCells: 9,
    totalCells: 9,
    ...overrides,
  };
}

export function drawing(overrides: Partial<Omit<DrawingNode, 'kind'>> = {}): DrawingNode {
  return {
    kind: 'drawing',
    ref: { path: [0] },
    drawingType: 'drawing',
    ...overrides,
  };
}

/** Build a model, auto-assigning sequential body paths to nodes that use the default. */
export function doc(nodes: DocNode[], overrides: Partial<Omit<DocModel, 'nodes'>> = {}): DocModel {
  const withPaths = nodes.map((n, i) =>
    n.ref.path.length === 1 && n.ref.path[0] === 0 ? { ...n, ref: { ...n.ref, path: [i] } } : n,
  );
  return {
    title: 'Team meeting notes',
    pageBackgroundColor: '#ffffff',
    bodyFontSizePt: 11,
    nodes: withPaths,
    ...overrides,
  };
}

/** ~900 chars of body text across 4 paragraphs — long enough to require headings. */
export function longBody(): ParagraphNode[] {
  const filler =
    'This paragraph exists to make the document long enough that the heading check ' +
    'considers structure necessary. It contains enough words to look like real prose ' +
    'that a reader would want to skim with headings. ';
  return [0, 1, 2, 3].map((i) => para(filler, { ref: { path: [i] } }));
}
