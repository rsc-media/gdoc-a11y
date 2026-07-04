/** Locate and quick-fix actions against the live document. */
import type { ElementRef, IssueFix } from '../core/model';
import { resolveElement, resolveRun } from './docsAdapter';

export interface ActionResult {
  ok: boolean;
  reason?: 'stale' | 'unsupported' | 'error';
  message?: string;
}

type Paragraph = GoogleAppsScript.Document.Paragraph;
type ListItem = GoogleAppsScript.Document.ListItem;

function asParagraphLike(el: GoogleAppsScript.Document.Element): Paragraph | ListItem | null {
  const t = el.getType();
  if (t === DocumentApp.ElementType.PARAGRAPH) return el.asParagraph();
  if (t === DocumentApp.ElementType.LIST_ITEM) return el.asListItem();
  return null;
}

/** Move the user's cursor/selection to the element behind an issue. */
export function locate(ref: ElementRef): ActionResult {
  const doc = DocumentApp.getActiveDocument();

  // Whole-document issues (e.g. title) have an empty path — nothing to locate.
  if (ref.path.length === 0) return { ok: true };

  const el = resolveElement(doc, ref.path);
  if (!el) return { ok: false, reason: 'stale' };

  try {
    if (ref.runIndex !== undefined) {
      const p = asParagraphLike(el);
      if (!p) return { ok: false, reason: 'stale' };
      const run = resolveRun(p, ref.runIndex);
      if (!run) return { ok: false, reason: 'stale' };
      const range = doc.newRange().addElement(run.text, run.start, run.endInclusive).build();
      doc.setSelection(range);
      return { ok: true };
    }

    if (ref.positionedIndex !== undefined) {
      // Positioned images can't be selected via Range; land the cursor on the
      // anchoring paragraph instead.
      doc.setCursor(doc.newPosition(el, 0));
      return { ok: true };
    }

    const range = doc.newRange().addElement(el).build();
    doc.setSelection(range);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'error', message: String(e) };
  }
}

/** Apply a quick fix. Verifies the target still matches its scan-time value first. */
export function applyFix(ref: ElementRef, fix: IssueFix, newValue: string): ActionResult {
  const doc = DocumentApp.getActiveDocument();
  const value = newValue.trim();
  if (value === '') return { ok: false, reason: 'unsupported', message: 'Empty value' };

  const el = resolveElement(doc, ref.path);
  if (!el) return { ok: false, reason: 'stale' };

  try {
    if (fix.type === 'setAltText') {
      if (el.getType() !== DocumentApp.ElementType.INLINE_IMAGE) {
        return { ok: false, reason: 'stale' };
      }
      const img = el.asInlineImage();
      if ((img.getAltDescription() ?? '') !== fix.currentValue) {
        return { ok: false, reason: 'stale' };
      }
      img.setAltDescription(value);
      return { ok: true };
    }

    if (fix.type === 'setLinkText') {
      const p = asParagraphLike(el);
      if (!p || ref.runIndex === undefined) return { ok: false, reason: 'stale' };

      // The issue may cover several adjacent runs sharing one URL; replace them all.
      const first = resolveRun(p, ref.runIndex);
      if (!first) return { ok: false, reason: 'stale' };
      const url = first.text.getLinkUrl(first.start);
      if (!url) return { ok: false, reason: 'stale' };

      const start = first.start;
      let endInclusive = first.endInclusive;
      for (let i = ref.runIndex + 1; ; i++) {
        const next = resolveRun(p, i);
        if (
          !next ||
          next.text.getText() !== first.text.getText() || // different Text element
          next.start !== endInclusive + 1 ||
          next.text.getLinkUrl(next.start) !== url
        ) {
          break;
        }
        endInclusive = next.endInclusive;
      }

      const current = first.text.getText().slice(start, endInclusive + 1);
      if (current !== fix.currentValue) return { ok: false, reason: 'stale' };

      first.text.deleteText(start, endInclusive);
      first.text.insertText(start, value);
      first.text.setLinkUrl(start, start + value.length - 1, url);
      return { ok: true };
    }

    return { ok: false, reason: 'unsupported' };
  } catch (e) {
    return { ok: false, reason: 'error', message: String(e) };
  }
}
