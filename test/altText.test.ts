import { describe, expect, it } from 'vitest';
import { checkAltText } from '../src/core/checks/altText';
import { doc, image, para } from './fixtures';

describe('CHK-01 image alt text', () => {
  it('flags an image with empty alt text as an error with a quick fix', () => {
    const issues = checkAltText(doc([image()]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      checkId: 'CHK-01',
      severity: 'error',
      wcag: '1.1.1',
      fix: { type: 'setAltText', currentValue: '' },
    });
  });

  it('flags whitespace-only alt text', () => {
    expect(checkAltText(doc([image({ altDescription: '   ' })]))).toHaveLength(1);
  });

  it('passes an image with reasonable alt text', () => {
    expect(
      checkAltText(doc([image({ altDescription: 'A bar chart of Q3 sales by region' })])),
    ).toHaveLength(0);
  });

  it('warns on filename-like alt text', () => {
    for (const alt of ['IMG_1234', 'photo.JPG', 'diagram.png', 'img-99']) {
      const issues = checkAltText(doc([image({ altDescription: alt })]));
      expect(issues, alt).toHaveLength(1);
      expect(issues[0]?.severity, alt).toBe('warning');
    }
  });

  it('warns on alt text longer than 250 chars', () => {
    const issues = checkAltText(doc([image({ altDescription: 'x'.repeat(251) })]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('warning');
  });

  it('downgrades to review when the host cannot read alt text', () => {
    const issues = checkAltText(doc([image({ altSupported: false, positioned: true })]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('review');
    expect(issues[0]?.fix).toBeUndefined();
  });

  it('ignores non-image nodes', () => {
    expect(checkAltText(doc([para('Just text')]))).toHaveLength(0);
  });
});
