import { describe, expect, it } from 'vitest';
import { checkHeadings } from '../src/core/checks/headings';
import { doc, heading, longBody, para, run } from './fixtures';

describe('CHK-02 heading structure', () => {
  it('passes a well-structured document', () => {
    const issues = checkHeadings(
      doc([heading(1, 'Report'), ...longBody(), heading(2, 'Findings'), para('Body text.')]),
    );
    expect(issues).toHaveLength(0);
  });

  it('flags a skipped level (H1 → H3) as an error', () => {
    const issues = checkHeadings(doc([heading(1, 'Report'), heading(3, 'Detail')]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ severity: 'error', data: { from: 1, to: 3 } });
  });

  it('allows going back up levels (H3 → H1)', () => {
    const issues = checkHeadings(
      doc([heading(1, 'A'), heading(2, 'B'), heading(3, 'C'), heading(1, 'D')]),
    );
    expect(issues).toHaveLength(0);
  });

  it('does not flag the first heading regardless of level', () => {
    expect(checkHeadings(doc([heading(2, 'Starts at two'), para('text')]))).toHaveLength(0);
  });

  it('warns when a long document has no headings', () => {
    const issues = checkHeadings(doc(longBody()));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ severity: 'warning', wcag: '2.4.6' });
  });

  it('does not demand headings of a short note', () => {
    expect(checkHeadings(doc([para('Short note.'), para('Bye.')]))).toHaveLength(0);
  });

  it('warns on an empty heading and does not let it break outline tracking', () => {
    const issues = checkHeadings(
      doc([heading(1, 'Title'), heading(2, ''), heading(2, 'Real section')]),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.title).toContain('no text');
  });

  it('warns on a bold single-line "fake heading"', () => {
    const fake = para([run('Budget Overview', { bold: true })]);
    const issues = checkHeadings(doc([heading(1, 'Doc'), ...longBody().slice(0, 2), fake]));
    expect(issues.filter((i) => i.title.includes("isn't one"))).toHaveLength(1);
  });

  it('warns on an oversized single-line fake heading', () => {
    const fake = para([run('Budget Overview', { fontSizePt: 16 })]);
    const issues = checkHeadings(doc([fake]));
    expect(issues).toHaveLength(1);
  });

  it('does not flag bold text inside a long paragraph or bold table cells', () => {
    const longBold = para([run('A'.repeat(150), { bold: true })]);
    const cellBold = para([run('Total', { bold: true })], { inTableCell: true });
    expect(checkHeadings(doc([longBold, cellBold]))).toHaveLength(0);
  });
});
