/**
 * Sidebar client. Renders ScanResult and calls the server via google.script.run.
 * Document text is untrusted: everything is built with createElement/textContent,
 * never innerHTML.
 */
import type { Issue, ScanResult, Severity } from '../core/model';
import { STRINGS } from '../core/strings';

const S = STRINGS.sidebar;
// HtmlService's serving pipeline strips "//"-to-end-of-line from inline
// scripts, even inside string literals — a literal URL here kills the whole
// bundle with an unterminated string. Build the "//" at runtime via atob
// (base64 "Ly8="), which no minifier constant-folds back into a literal.
const SLASHES = atob('Ly8=');
const REPO_URL = `https:${SLASHES}github.com/rsc-media/gdoc-a11y`;

/* Minimal ambient typing for the google.script.run bridge. */
interface ScriptRunner {
  withSuccessHandler(fn: (value: unknown) => void): ScriptRunner;
  withFailureHandler(fn: (error: Error) => void): ScriptRunner;
  scanDocument(): void;
  locateIssue(ref: Issue['ref']): void;
  applyIssueFix(ref: Issue['ref'], fix: NonNullable<Issue['fix']>, newValue: string): void;
}
declare const google: {
  script: {
    run: ScriptRunner;
    host: { editor: { focus(): void } };
  };
};

/** Surface any uncaught error in the sidebar itself — HtmlService has no visible console. */
window.onerror = (msg, _src, line, col) => {
  const box = document.getElementById('app') ?? document.body;
  const p = document.createElement('p');
  p.className = 'note';
  p.textContent = `Sidebar error: ${String(msg)} (line ${line ?? '?'}:${col ?? '?'})`;
  box.append(p);
};

const app = document.getElementById('app') as HTMLElement;
let lastResult: ScanResult | null = null;
const resolvedIds = new Set<string>();

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<{
    className: string;
    text: string;
    type: string;
    placeholder: string;
    href: string;
  }> = {},
  children: (HTMLElement | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  if (props.type && node instanceof HTMLInputElement) node.type = props.type;
  if (props.placeholder && node instanceof HTMLInputElement) node.placeholder = props.placeholder;
  if (props.href && node instanceof HTMLAnchorElement) {
    node.href = props.href;
    node.target = '_blank';
    node.rel = 'noopener';
  }
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function clear(): void {
  app.textContent = '';
}

/* ---------- states ---------- */

function renderIdle(): void {
  clear();
  app.append(el('p', { className: 'intro', text: S.intro }), scanButton(S.scanButton), footer());
}

function renderScanning(): void {
  clear();
  const btn = scanButton(S.scanButton);
  btn.disabled = true;
  app.append(btn, el('p', { className: 'status', text: S.scanning }), footer());
}

function renderError(message: string): void {
  clear();
  const retry = el('button', { className: 'primary', text: S.errorRetry });
  retry.addEventListener('click', startScan);
  app.append(
    el('div', { className: 'error-box' }, [
      el('p', { text: S.errorTitle }),
      el('p', { className: 'context', text: message }),
      retry,
      el('p', {}, [el('a', { href: `${REPO_URL}/issues`, text: S.errorReport })]),
    ]),
    footer(),
  );
}

function renderResults(result: ScanResult): void {
  clear();
  lastResult = result;

  app.append(scanButton(S.rescanButton));

  const open = result.issues.filter((i) => !resolvedIds.has(i.id));
  const counts = { error: 0, warning: 0, review: 0 };
  for (const i of open) counts[i.severity]++;

  const summary = el('div', { className: 'summary' });
  const h = el('h1', { className: 'visually-hidden', text: S.appTitle });
  summary.append(h);
  summary.setAttribute('tabindex', '-1');
  if (counts.error + counts.warning === 0) {
    summary.append(el('p', { className: 'all-clear', text: S.allClear }));
    if (counts.review > 0) summary.append(el('p', { className: 'sub', text: S.allClearSub }));
  } else {
    summary.append(
      el('p', {
        text: `${counts.error} ${S.groupError.toLowerCase()} · ${counts.warning} ${S.groupWarning.toLowerCase()} · ${counts.review} to review`,
      }),
    );
  }
  app.append(summary);

  const groups: { severity: Severity; label: string }[] = [
    { severity: 'error', label: S.groupError },
    { severity: 'warning', label: S.groupWarning },
    { severity: 'review', label: S.groupReview },
  ];
  for (const g of groups) {
    const issues = open.filter((i) => i.severity === g.severity);
    if (issues.length === 0) continue;
    const group = el('div', { className: `group ${g.severity}` });
    group.append(el('h2', { text: `${g.label} (${issues.length})` }));
    for (const issue of issues) group.append(card(issue));
    app.append(group);
  }

  const fixed = result.issues.filter((i) => resolvedIds.has(i.id));
  if (fixed.length > 0) {
    const group = el('div', { className: 'group fixed' });
    group.append(el('h2', { text: `${S.groupFixed} (${fixed.length})` }));
    for (const issue of fixed) {
      const c = card(issue);
      c.classList.add('resolved');
      group.append(c);
    }
    app.append(group);
  }

  app.append(footer());
  summary.focus();
}

/* ---------- pieces ---------- */

function scanButton(label: string): HTMLButtonElement {
  const btn = el('button', { className: 'primary', text: label });
  btn.addEventListener('click', startScan);
  return btn;
}

function card(issue: Issue): HTMLElement {
  const c = el('div', { className: `card ${issue.severity}` });
  c.append(el('p', { className: 'title', text: issue.title }));
  if (issue.context) c.append(el('p', { className: 'context', text: issue.context }));

  if (issue.checkId === 'CHK-04' && issue.data) {
    c.append(
      el('p', {
        className: 'context',
        text: `Contrast is ${issue.data.measured}:1 — needs at least ${issue.data.required}:1.`,
      }),
    );
  }

  if (issue.checkId === 'CHK-08' && issue.data) {
    c.append(
      el('p', {
        className: 'context',
        text: `This text is ${issue.data.sizePt} pt — aim for at least ${issue.data.minimumPt} pt.`,
      }),
    );
  }

  const note = el('p', { className: 'note' });
  note.hidden = true;

  const actions = el('div', { className: 'actions' });
  if (issue.ref.path.length > 0 && !resolvedIds.has(issue.id)) {
    const locateBtn = el('button', { text: S.locate });
    locateBtn.addEventListener('click', () => {
      locateBtn.disabled = true;
      google.script.run
        .withSuccessHandler((raw) => {
          locateBtn.disabled = false;
          const res = raw as { ok: boolean };
          if (!res.ok) {
            showNote(note, S.stale);
            return;
          }
          // Docs only scrolls to the new selection once the document has
          // focus again — without this the cursor moves invisibly.
          google.script.host.editor.focus();
        })
        .withFailureHandler(() => {
          locateBtn.disabled = false;
          showNote(note, S.stale);
        })
        .locateIssue(issue.ref);
    });
    actions.append(locateBtn);
  }
  c.append(actions);

  if (issue.fix && !resolvedIds.has(issue.id)) {
    const input = el('input', {
      type: 'text',
      placeholder: issue.fix.type === 'setAltText' ? S.fixPlaceholderAlt : S.fixPlaceholderLink,
    });
    input.setAttribute('aria-label', issue.title);
    const fixBtn = el('button', { text: S.fix });
    fixBtn.addEventListener('click', () => {
      const value = input.value.trim();
      if (value === '') {
        input.focus();
        return;
      }
      fixBtn.disabled = true;
      google.script.run
        .withSuccessHandler((raw) => {
          const res = raw as { ok: boolean };
          if (res.ok) {
            resolvedIds.add(issue.id);
            if (lastResult) renderResults(lastResult);
          } else {
            fixBtn.disabled = false;
            showNote(note, S.stale);
          }
        })
        .withFailureHandler(() => {
          fixBtn.disabled = false;
          showNote(note, S.stale);
        })
        .applyIssueFix(issue.ref, issue.fix as NonNullable<Issue['fix']>, value);
    });
    const row = el('div', { className: 'fixrow' }, [input, fixBtn]);
    c.append(row);
  }

  c.append(note);

  const details = el('details');
  details.append(
    el('summary', { text: `${S.whyLabel} · ${S.howLabel}` }),
    el('h3', { text: S.whyLabel }),
    el('p', { text: issue.whyItMatters }),
    el('h3', { text: S.howLabel }),
    el('p', { text: issue.howToFix }),
  );
  c.append(details);

  c.append(el('p', { className: 'wcag', text: `${S.wcagPrefix} ${issue.wcag}` }));
  return c;
}

function showNote(note: HTMLElement, text: string): void {
  note.textContent = text;
  note.hidden = false;
}

function footer(): HTMLElement {
  return el('footer', {}, [
    'Free & open source. ',
    el('a', { href: REPO_URL, text: 'Source & help' }),
  ]);
}

/* ---------- scan ---------- */

function startScan(): void {
  renderScanning();
  resolvedIds.clear();
  google.script.run
    .withSuccessHandler((raw) => renderResults(raw as ScanResult))
    .withFailureHandler((err) => renderError(err?.message ?? String(err)))
    .scanDocument();
}

try {
  renderIdle();
} catch (e) {
  app.textContent = `Sidebar failed to start: ${String(e)}`;
}
