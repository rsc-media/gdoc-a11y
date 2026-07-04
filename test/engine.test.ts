import { describe, expect, it } from 'vitest';
import { runChecks } from '../src/core/engine';
import { doc, heading, image, longBody, para, run, table } from './fixtures';

describe('engine', () => {
  it('returns a clean result for an accessible document', () => {
    const result = runChecks(
      doc([heading(1, 'Newsletter'), ...longBody(), image({ altDescription: 'School mascot' })]),
    );
    expect(result.issues).toHaveLength(0);
    expect(result.counts).toEqual({ error: 0, warning: 0, review: 0 });
  });

  it('finds every seeded issue exactly once (acceptance-style fixture)', () => {
    const model = doc(
      [
        heading(1, 'Report'),
        ...longBody(),
        image(), // error: missing alt
        heading(3, 'Skipped'), // error: H1 → H3
        para([run('click here', { linkUrl: 'https://example.org' })]), // warning: vague link
        para([run('faint text here', { foregroundColor: '#bbbbbb' })]), // error: contrast
        table(), // review
      ],
      { title: 'Untitled document' }, // warning: title
    );
    const result = runChecks(model);
    const byCheck = (id: string) => result.issues.filter((i) => i.checkId === id).length;
    expect(byCheck('CHK-01')).toBe(1);
    expect(byCheck('CHK-02')).toBe(1);
    expect(byCheck('CHK-03')).toBe(1);
    expect(byCheck('CHK-04')).toBe(1);
    expect(byCheck('CHK-05')).toBe(1);
    expect(byCheck('CHK-06')).toBe(1);
    expect(result.counts).toEqual({ error: 3, warning: 2, review: 1 });
  });

  it('sorts errors before warnings before review, then by document order', () => {
    const model = doc([table({ ref: { path: [0] } }), image({ ref: { path: [5] } })], {
      title: 'Untitled document',
    });
    const result = runChecks(model);
    const severities = result.issues.map((i) => i.severity);
    expect(severities).toEqual([...severities].sort((a, b) => order(a) - order(b)));
    expect(result.issues[0]?.checkId).toBe('CHK-01'); // the only error
  });

  it('assigns unique ids even for issues at the same location', () => {
    const t = table({ rows: 1, cols: 5, totalCells: 5, nonEmptyCells: 5 });
    const result = runChecks(doc([t]));
    const ids = result.issues.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('produces JSON-serializable results (google.script.run constraint)', () => {
    const result = runChecks(doc([image()]));
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

function order(s: string): number {
  return { error: 0, warning: 1, review: 2 }[s] as number;
}
