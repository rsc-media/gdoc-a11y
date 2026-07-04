import type { DocModel, Issue } from '../model';
import { snippet } from '../model';
import { STRINGS } from '../strings';

const FILENAME_LIKE = /(^img[_-]?\d+)|(\.(png|jpe?g|gif|bmp|webp|svg|tiff?|heic)$)/i;
const MAX_ALT_LENGTH = 250;

/** CHK-01 — Image alternative text (WCAG 1.1.1). */
export function checkAltText(model: DocModel): Issue[] {
  const issues: Issue[] = [];
  for (const node of model.nodes) {
    if (node.kind !== 'image') continue;
    const base = { checkId: 'CHK-01' as const, wcag: '1.1.1', ref: node.ref };
    const alt = node.altDescription.trim();

    if (!node.altSupported) {
      issues.push({
        ...base,
        id: '',
        severity: 'review',
        title: STRINGS.altTextUnsupported.title,
        context: node.positioned ? 'Positioned image' : 'Image',
        whyItMatters: STRINGS.altTextUnsupported.why,
        howToFix: STRINGS.altTextUnsupported.how,
      });
    } else if (alt === '') {
      issues.push({
        ...base,
        id: '',
        severity: 'error',
        title: STRINGS.altTextMissing.title,
        context: node.positioned ? 'Positioned image' : 'Image',
        whyItMatters: STRINGS.altTextMissing.why,
        howToFix: STRINGS.altTextMissing.how,
        fix: { type: 'setAltText', currentValue: node.altDescription },
      });
    } else if (FILENAME_LIKE.test(alt)) {
      issues.push({
        ...base,
        id: '',
        severity: 'warning',
        title: STRINGS.altTextFilename.title,
        context: snippet(alt),
        whyItMatters: STRINGS.altTextFilename.why,
        howToFix: STRINGS.altTextFilename.how,
        fix: { type: 'setAltText', currentValue: node.altDescription },
      });
    } else if (alt.length > MAX_ALT_LENGTH) {
      issues.push({
        ...base,
        id: '',
        severity: 'warning',
        title: STRINGS.altTextTooLong.title,
        context: snippet(alt),
        whyItMatters: STRINGS.altTextTooLong.why,
        howToFix: STRINGS.altTextTooLong.how,
        fix: { type: 'setAltText', currentValue: node.altDescription },
        data: { length: alt.length },
      });
    }
  }
  return issues;
}
