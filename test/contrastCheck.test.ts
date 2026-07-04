import { describe, expect, it } from 'vitest';
import { checkContrast } from '../src/core/checks/contrast';
import { doc, para, run } from './fixtures';

describe('CHK-04 text contrast', () => {
  it('passes black on white', () => {
    expect(checkContrast(doc([para('Normal text')]))).toHaveLength(0);
  });

  it('flags light gray body text on white as an error with measured data', () => {
    const p = para([run('Faint disclaimer text', { foregroundColor: '#aaaaaa' })]);
    const issues = checkContrast(doc([p]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.data?.required).toBe(4.5);
    expect(Number(issues[0]?.data?.measured)).toBeLessThan(4.5);
  });

  it('applies the 3:1 threshold to large text', () => {
    // #949494 on white is ~3.5:1 — fails normal text, passes 18 pt large text.
    const gray = '#949494';
    expect(
      checkContrast(
        doc([para([run('Big heading text', { foregroundColor: gray, fontSizePt: 18 })])]),
      ),
    ).toHaveLength(0);
    expect(
      checkContrast(doc([para([run('Body text', { foregroundColor: gray, fontSizePt: 11 })])])),
    ).toHaveLength(1);
  });

  it('uses the run highlight color as background when set', () => {
    const p = para([
      run('Highlighted', { foregroundColor: '#ffffff', backgroundColor: '#ffff00' }),
    ]);
    expect(checkContrast(doc([p]))).toHaveLength(1); // white on yellow
  });

  it('uses the page background when no highlight is set', () => {
    const p = para([run('White text', { foregroundColor: '#ffffff' })]);
    expect(checkContrast(doc([p]))).toHaveLength(1); // white page default
    expect(checkContrast(doc([p], { pageBackgroundColor: '#000000' }))).toHaveLength(0);
  });

  it('ignores tiny runs and deduplicates same colors within a paragraph', () => {
    const p = para([
      run('a', { foregroundColor: '#cccccc' }), // < 2 visible chars → ignored
      run('faint one', { foregroundColor: '#cccccc' }),
      run('faint two', { foregroundColor: '#cccccc' }),
    ]);
    expect(checkContrast(doc([p]))).toHaveLength(1);
  });
});
