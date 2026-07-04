import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, requiredRatio } from '../src/core/contrast';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#1a73e8')).toEqual({ r: 26, g: 115, b: 232 });
  });
  it('parses 3-digit hex and no-hash forms', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('rejects garbage', () => {
    expect(hexToRgb('red')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
  });
});

describe('contrastRatio (WCAG reference pairs)', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });
  it('same color is 1:1', () => {
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
  it('#777777 on white is ~4.48 (just below AA normal text)', () => {
    const r = contrastRatio('#777777', '#ffffff');
    expect(r).toBeGreaterThan(4.4);
    expect(r).toBeLessThan(4.5);
  });
  it('#767676 on white is >= 4.5 (the classic AA-passing gray)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#123456', '#fedcba')).toBeCloseTo(
      contrastRatio('#fedcba', '#123456') as number,
      10,
    );
  });
});

describe('requiredRatio', () => {
  it('normal text needs 4.5', () => {
    expect(requiredRatio(11, false)).toBe(4.5);
    expect(requiredRatio(17, false)).toBe(4.5);
    expect(requiredRatio(13, true)).toBe(4.5);
  });
  it('large text needs 3', () => {
    expect(requiredRatio(18, false)).toBe(3);
    expect(requiredRatio(24, false)).toBe(3);
    expect(requiredRatio(14, true)).toBe(3);
  });
});
