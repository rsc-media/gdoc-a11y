import type { DocModel, Issue, ParagraphNode, TextRun } from '../model';
import { snippet } from '../model';
import { STRINGS, VAGUE_LINK_PHRASES } from '../strings';

const RAW_URL = /^(https?:\/\/|www\.)/i;
const RAW_URL_MAX_OK_LENGTH = 40;

interface LinkSpan {
  url: string;
  text: string;
  ref: { path: number[]; runIndex: number };
}

/** Merge adjacent runs that share a URL into one logical link. */
function collectLinks(p: ParagraphNode): LinkSpan[] {
  const links: LinkSpan[] = [];
  let current: LinkSpan | null = null;
  p.runs.forEach((run: TextRun, i: number) => {
    if (run.linkUrl) {
      if (current && current.url === run.linkUrl) {
        current.text += run.text;
      } else {
        current = { url: run.linkUrl, text: run.text, ref: { path: p.ref.path, runIndex: i } };
        links.push(current);
      }
    } else {
      current = null;
    }
  });
  return links;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** CHK-03 — Link text (WCAG 2.4.4). */
export function checkLinks(model: DocModel): Issue[] {
  const issues: Issue[] = [];
  const vague = new Set<string>(VAGUE_LINK_PHRASES);

  for (const node of model.nodes) {
    if (node.kind !== 'paragraph') continue;
    for (const link of collectLinks(node)) {
      const text = link.text.trim();
      const base = {
        checkId: 'CHK-03' as const,
        wcag: '2.4.4',
        severity: 'warning' as const,
        ref: link.ref,
        fix: { type: 'setLinkText' as const, currentValue: link.text },
      };

      if (text === '') {
        issues.push({
          ...base,
          id: '',
          title: STRINGS.linkEmpty.title,
          context: snippet(link.url),
          whyItMatters: STRINGS.linkEmpty.why,
          howToFix: STRINGS.linkEmpty.how,
        });
      } else if (vague.has(normalize(text))) {
        issues.push({
          ...base,
          id: '',
          title: STRINGS.linkVague.title,
          context: `“${snippet(text, 60)}”`,
          whyItMatters: STRINGS.linkVague.why,
          howToFix: STRINGS.linkVague.how,
        });
      } else if (RAW_URL.test(text) && text.length > RAW_URL_MAX_OK_LENGTH) {
        issues.push({
          ...base,
          id: '',
          title: STRINGS.linkRawUrl.title,
          context: snippet(text, 60),
          whyItMatters: STRINGS.linkRawUrl.why,
          howToFix: STRINGS.linkRawUrl.how,
        });
      }
    }
  }
  return issues;
}
