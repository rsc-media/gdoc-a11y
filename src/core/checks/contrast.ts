import type { DocModel, Issue } from '../model';
import { snippet } from '../model';
import { contrastRatio, requiredRatio } from '../contrast';
import { STRINGS } from '../strings';

const MIN_RUN_CHARS = 2;

/** CHK-04 — Text color contrast (WCAG 1.4.3, AA). */
export function checkContrast(model: DocModel): Issue[] {
  const issues: Issue[] = [];
  // One issue per (paragraph, fg, bg) combination to avoid per-run spam.
  const seen = new Set<string>();

  for (const node of model.nodes) {
    if (node.kind !== 'paragraph') continue;
    node.runs.forEach((run, i) => {
      const visible = run.text.replace(/\s+/g, '');
      if (visible.length < MIN_RUN_CHARS) return;

      const bg = run.backgroundColor ?? model.pageBackgroundColor;
      const ratio = contrastRatio(run.foregroundColor, bg);
      if (ratio === null) return; // unparseable color — skip rather than guess
      const required = requiredRatio(run.fontSizePt, run.bold);
      if (ratio >= required) return;

      const key = `${node.ref.path.join('.')}|${run.foregroundColor}|${bg}`;
      if (seen.has(key)) return;
      seen.add(key);

      issues.push({
        id: '',
        checkId: 'CHK-04',
        severity: 'error',
        wcag: '1.4.3',
        title: STRINGS.contrastLow.title,
        context: snippet(run.text, 60),
        whyItMatters: STRINGS.contrastLow.why,
        howToFix: STRINGS.contrastLow.how,
        ref: { path: node.ref.path, runIndex: i },
        data: {
          measured: Math.round(ratio * 100) / 100,
          required,
          foreground: run.foregroundColor,
          background: bg,
        },
      });
    });
  }
  return issues;
}
