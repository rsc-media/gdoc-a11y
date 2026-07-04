import type { DocModel, Issue, ParagraphNode } from '../model';
import { paragraphText, snippet } from '../model';
import { STRINGS } from '../strings';

/** Doc is "long enough to need headings" past this much body text. */
const MIN_BODY_PARAGRAPHS = 3;
const MIN_BODY_CHARS = 800;
const FAKE_HEADING_MAX_CHARS = 120;
const FAKE_HEADING_SIZE_DELTA_PT = 4;

/** CHK-02 — Heading structure (WCAG 1.3.1, 2.4.6). */
export function checkHeadings(model: DocModel): Issue[] {
  const issues: Issue[] = [];
  const paragraphs = model.nodes.filter((n): n is ParagraphNode => n.kind === 'paragraph');

  let previousLevel = 0;
  let sawHeading = false;
  let bodyParagraphs = 0;
  let bodyChars = 0;

  for (const p of paragraphs) {
    const text = paragraphText(p).trim();

    if (p.headingLevel > 0) {
      sawHeading = true;
      if (text === '') {
        issues.push({
          id: '',
          checkId: 'CHK-02',
          severity: 'warning',
          wcag: '1.3.1',
          title: STRINGS.headingEmpty.title,
          context: `Heading ${p.headingLevel} (empty)`,
          whyItMatters: STRINGS.headingEmpty.why,
          howToFix: STRINGS.headingEmpty.how,
          ref: p.ref,
        });
        continue; // empty headings don't advance the outline
      }
      if (previousLevel > 0 && p.headingLevel > previousLevel + 1) {
        issues.push({
          id: '',
          checkId: 'CHK-02',
          severity: 'error',
          wcag: '1.3.1',
          title: STRINGS.headingSkip.title,
          context: snippet(text),
          whyItMatters: STRINGS.headingSkip.why,
          howToFix: STRINGS.headingSkip.how,
          ref: p.ref,
          data: { from: previousLevel, to: p.headingLevel },
        });
      }
      previousLevel = p.headingLevel;
      continue;
    }

    if (text !== '' && !p.inTableCell) {
      bodyParagraphs += 1;
      bodyChars += text.length;
      if (isFakeHeading(p, text, model.bodyFontSizePt)) {
        issues.push({
          id: '',
          checkId: 'CHK-02',
          severity: 'warning',
          wcag: '1.3.1',
          title: STRINGS.headingFake.title,
          context: snippet(text),
          whyItMatters: STRINGS.headingFake.why,
          howToFix: STRINGS.headingFake.how,
          ref: p.ref,
        });
      }
    }
  }

  if (!sawHeading && bodyParagraphs >= MIN_BODY_PARAGRAPHS && bodyChars >= MIN_BODY_CHARS) {
    const first = paragraphs.find((p) => paragraphText(p).trim() !== '');
    issues.push({
      id: '',
      checkId: 'CHK-02',
      severity: 'warning',
      wcag: '2.4.6',
      title: STRINGS.headingNone.title,
      context: 'Whole document',
      whyItMatters: STRINGS.headingNone.why,
      howToFix: STRINGS.headingNone.how,
      ref: first ? first.ref : { path: [0] },
    });
  }

  return issues;
}

function isFakeHeading(p: ParagraphNode, text: string, bodyFontSizePt: number): boolean {
  if (text.length >= FAKE_HEADING_MAX_CHARS || text.includes('\n')) return false;
  const runs = p.runs.filter((r) => r.text.trim() !== '');
  if (runs.length === 0) return false;
  const allBold = runs.every((r) => r.bold);
  const allLarge = runs.every((r) => r.fontSizePt >= bodyFontSizePt + FAKE_HEADING_SIZE_DELTA_PT);
  return allBold || allLarge;
}
