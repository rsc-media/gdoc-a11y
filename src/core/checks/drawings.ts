import type { DocModel, Issue } from '../model';
import { STRINGS } from '../strings';

const TYPE_LABEL: Record<string, string> = {
  drawing: 'Drawing',
  chart: 'Chart',
  equation: 'Equation',
};

/** CHK-07 — Drawings, charts and equations (WCAG 1.1.1, manual review). */
export function checkDrawings(model: DocModel): Issue[] {
  const issues: Issue[] = [];
  for (const node of model.nodes) {
    if (node.kind !== 'drawing') continue;
    issues.push({
      id: '',
      checkId: 'CHK-07',
      severity: 'review',
      wcag: '1.1.1',
      title: STRINGS.drawingReview.title,
      context: TYPE_LABEL[node.drawingType] ?? 'Drawing',
      whyItMatters: STRINGS.drawingReview.why,
      howToFix: STRINGS.drawingReview.how,
      ref: node.ref,
    });
  }
  return issues;
}
