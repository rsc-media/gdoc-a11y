import type { DocModel, Issue } from '../model';
import { STRINGS } from '../strings';

const LAYOUT_EMPTY_RATIO = 0.8;
const LAYOUT_STRIP_MIN_CELLS = 4;

/** CHK-06 — Tables (WCAG 1.3.1). */
export function checkTables(model: DocModel): Issue[] {
  const issues: Issue[] = [];
  for (const node of model.nodes) {
    if (node.kind !== 'table') continue;
    const context = `Table, ${node.rows} × ${node.cols}`;

    const emptyRatio = node.totalCells > 0 ? 1 - node.nonEmptyCells / node.totalCells : 0;
    const isStrip =
      (node.rows === 1 && node.cols >= LAYOUT_STRIP_MIN_CELLS) ||
      (node.cols === 1 && node.rows >= LAYOUT_STRIP_MIN_CELLS);

    if (emptyRatio >= LAYOUT_EMPTY_RATIO || isStrip) {
      issues.push({
        id: '',
        checkId: 'CHK-06',
        severity: 'warning',
        wcag: '1.3.1',
        title: STRINGS.tableLayout.title,
        context,
        whyItMatters: STRINGS.tableLayout.why,
        howToFix: STRINGS.tableLayout.how,
        ref: node.ref,
      });
    }

    issues.push({
      id: '',
      checkId: 'CHK-06',
      severity: 'review',
      wcag: '1.3.1',
      title: STRINGS.tableReview.title,
      context,
      whyItMatters: STRINGS.tableReview.why,
      howToFix: STRINGS.tableReview.how,
      ref: node.ref,
    });
  }
  return issues;
}
