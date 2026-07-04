import { describe, expect, it } from 'vitest';
import { checkTitle } from '../src/core/checks/title';
import { checkTables } from '../src/core/checks/tables';
import { checkDrawings } from '../src/core/checks/drawings';
import { doc, drawing, para, table } from './fixtures';

describe('CHK-05 document title', () => {
  it('warns on "Untitled document" (any case) and empty names', () => {
    expect(checkTitle(doc([], { title: 'Untitled document' }))).toHaveLength(1);
    expect(checkTitle(doc([], { title: 'untitled document' }))).toHaveLength(1);
    expect(checkTitle(doc([], { title: '   ' }))).toHaveLength(1);
  });
  it('passes a real name', () => {
    expect(checkTitle(doc([], { title: 'Q3 Budget Review' }))).toHaveLength(0);
  });
});

describe('CHK-06 tables', () => {
  it('emits one review card per table', () => {
    const issues = checkTables(doc([table(), table()]));
    expect(issues.filter((i) => i.severity === 'review')).toHaveLength(2);
  });
  it('adds a layout warning for mostly-empty tables', () => {
    const t = table({ rows: 4, cols: 4, totalCells: 16, nonEmptyCells: 2 });
    const issues = checkTables(doc([t]));
    expect(issues.filter((i) => i.severity === 'warning')).toHaveLength(1);
  });
  it('adds a layout warning for single-row strips', () => {
    const t = table({ rows: 1, cols: 5, totalCells: 5, nonEmptyCells: 5 });
    expect(checkTables(doc([t])).filter((i) => i.severity === 'warning')).toHaveLength(1);
  });
  it('does not call a full data table a layout table', () => {
    expect(checkTables(doc([table()])).filter((i) => i.severity === 'warning')).toHaveLength(0);
  });
});

describe('CHK-07 drawings', () => {
  it('emits a review card per drawing with a type label', () => {
    const issues = checkDrawings(doc([drawing(), drawing({ drawingType: 'chart' })]));
    expect(issues).toHaveLength(2);
    expect(issues[1]?.context).toBe('Chart');
  });
  it('ignores paragraphs', () => {
    expect(checkDrawings(doc([para('text')]))).toHaveLength(0);
  });
});
