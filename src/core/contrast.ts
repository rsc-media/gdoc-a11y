/** WCAG 2.x contrast math (https://www.w3.org/WAI/WCAG22/Techniques/general/G18). */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parse '#rgb' or '#rrggbb' (case-insensitive). Returns null if unparseable. */
export function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1] as string;
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(c: Rgb): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** Contrast ratio between two colors, 1–21. Returns null if either color is unparseable. */
export function contrastRatio(fgHex: string, bgHex: string): number | null {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  if (!fg || !bg) return null;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * WCAG 1.4.3 AA threshold: 3:1 for large text (>= 18 pt, or >= 14 pt bold),
 * 4.5:1 otherwise.
 */
export function requiredRatio(fontSizePt: number, bold: boolean): number {
  const large = fontSizePt >= 18 || (bold && fontSizePt >= 14);
  return large ? 3 : 4.5;
}
