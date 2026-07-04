import type { DocModel, Issue } from '../model';
import { snippet } from '../model';
import { STRINGS } from '../strings';

/** Below this, text is hard to read for many people (advisory best practice). */
const MIN_FONT_SIZE_PT = 10;
const MIN_RUN_CHARS = 2;

/** CHK-08 — Text size (advisory; closest WCAG mapping is 1.4.4 Resize Text). */
export function checkTextSize(model: DocModel): Issue[] {
  const issues: Issue[] = [];
  // One issue per (paragraph, size) combination to avoid per-run spam.
  const seen = new Set<string>();

  for (const node of model.nodes) {
    if (node.kind !== 'paragraph') continue;
    node.runs.forEach((run, i) => {
      const visible = run.text.replace(/\s+/g, '');
      if (visible.length < MIN_RUN_CHARS) return;
      if (run.fontSizePt >= MIN_FONT_SIZE_PT) return;

      const key = `${node.ref.path.join('.')}|${run.fontSizePt}`;
      if (seen.has(key)) return;
      seen.add(key);

      issues.push({
        id: '',
        checkId: 'CHK-08',
        severity: 'warning',
        wcag: '1.4.4',
        title: STRINGS.textTooSmall.title,
        context: snippet(run.text, 60),
        whyItMatters: STRINGS.textTooSmall.why,
        howToFix: STRINGS.textTooSmall.how,
        ref: { path: node.ref.path, runIndex: i },
        data: { sizePt: run.fontSizePt, minimumPt: MIN_FONT_SIZE_PT },
      });
    });
  }
  return issues;
}
