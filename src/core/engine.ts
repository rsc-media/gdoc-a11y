import type { DocModel, Issue, ScanResult, Severity } from './model';
import { checkAltText } from './checks/altText';
import { checkHeadings } from './checks/headings';
import { checkLinks } from './checks/links';
import { checkContrast } from './checks/contrast';
import { checkTitle } from './checks/title';
import { checkTables } from './checks/tables';
import { checkDrawings } from './checks/drawings';
import { checkTextSize } from './checks/textSize';

const CHECKS = [
  checkAltText,
  checkHeadings,
  checkLinks,
  checkContrast,
  checkTitle,
  checkTables,
  checkDrawings,
  checkTextSize,
];

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, review: 2 };

/** Run all checks against a document model. Pure; safe to call from Node or Apps Script. */
export function runChecks(model: DocModel): ScanResult {
  const issues: Issue[] = CHECKS.flatMap((check) => check(model));

  // Stable sort: severity first, then document order (path), preserving check order for ties.
  const indexed = issues.map((issue, i) => ({ issue, i }));
  indexed.sort((a, b) => {
    const sev = SEVERITY_ORDER[a.issue.severity] - SEVERITY_ORDER[b.issue.severity];
    if (sev !== 0) return sev;
    const pathCmp = comparePaths(a.issue.ref.path, b.issue.ref.path);
    if (pathCmp !== 0) return pathCmp;
    return a.i - b.i;
  });

  // Assign stable, unique ids.
  const counts = { error: 0, warning: 0, review: 0 };
  const usedIds = new Set<string>();
  const finalized = indexed.map(({ issue }) => {
    counts[issue.severity] += 1;
    let id = `${issue.checkId}:${issue.ref.path.join('.')}${
      issue.ref.runIndex !== undefined ? `:r${issue.ref.runIndex}` : ''
    }`;
    let n = 1;
    while (usedIds.has(id)) id = `${id}#${++n}`;
    usedIds.add(id);
    return { ...issue, id };
  });

  return { issues: finalized, counts, scannedAt: new Date().toISOString() };
}

function comparePaths(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = (a[i] as number) - (b[i] as number);
    if (d !== 0) return d;
  }
  return a.length - b.length;
}
