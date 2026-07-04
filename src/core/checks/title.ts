import type { DocModel, Issue } from '../model';
import { STRINGS } from '../strings';

/** CHK-05 — Document title (WCAG 2.4.2). */
export function checkTitle(model: DocModel): Issue[] {
  const t = model.title.trim().toLowerCase();
  if (t !== '' && t !== 'untitled document') return [];
  return [
    {
      id: '',
      checkId: 'CHK-05',
      severity: 'warning',
      wcag: '2.4.2',
      title: STRINGS.titleUntitled.title,
      context: model.title.trim() === '' ? '(no name)' : model.title,
      whyItMatters: STRINGS.titleUntitled.why,
      howToFix: STRINGS.titleUntitled.how,
      ref: { path: [] },
    },
  ];
}
