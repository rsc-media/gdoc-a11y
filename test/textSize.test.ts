import { describe, expect, it } from 'vitest';
import { checkTextSize } from '../src/core/checks/textSize';
import { doc, para, run } from './fixtures';

describe('CHK-08 text size', () => {
  it('passes normal 11 pt body text', () => {
    expect(checkTextSize(doc([para('Regular paragraph text')]))).toHaveLength(0);
  });

  it('passes text at exactly 10 pt', () => {
    expect(checkTextSize(doc([para([run('Fine print', { fontSizePt: 10 })])]))).toHaveLength(0);
  });

  it('warns on text below 10 pt with size data', () => {
    const issues = checkTextSize(doc([para([run('Tiny disclaimer', { fontSizePt: 8 })])]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      checkId: 'CHK-08',
      severity: 'warning',
      wcag: '1.4.4',
      data: { sizePt: 8, minimumPt: 10 },
    });
  });

  it('ignores tiny runs of fewer than 2 visible characters', () => {
    expect(checkTextSize(doc([para([run('a', { fontSizePt: 6 })])]))).toHaveLength(0);
    expect(checkTextSize(doc([para([run('   ', { fontSizePt: 6 })])]))).toHaveLength(0);
  });

  it('deduplicates same-size runs within a paragraph but keeps distinct sizes', () => {
    const p = para([
      run('eight point ', { fontSizePt: 8 }),
      run('more eight point', { fontSizePt: 8 }),
      run('six point', { fontSizePt: 6 }),
    ]);
    const issues = checkTextSize(doc([p]));
    expect(issues).toHaveLength(2);
  });

  it('flags small text inside table cells too', () => {
    const p = para([run('cell note', { fontSizePt: 7 })], { inTableCell: true });
    expect(checkTextSize(doc([p]))).toHaveLength(1);
  });
});
