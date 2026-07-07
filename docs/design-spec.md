# Design Specification — Docs Accessibility Checker v1

How the add-on is built. What it does is in the [functional spec](functional-spec.md).

## 1. Platform

Google Workspace **Editor add-on** for Google Docs:

- **Server side:** Google Apps Script (V8 runtime). Uses `DocumentApp` to read the open
  document, move the cursor, and apply fixes.
- **UI:** `HtmlService` sidebar (300 px, HTML/CSS/JS). Sidebar ⇄ server via
  `google.script.run`.
- **Scopes** (declared in `appsscript.json`; the narrowest set that lets a sidebar
  add-on function — note Google classifies `script.container.ui` as _sensitive_, see the
  publishing guide):
  - `https://www.googleapis.com/auth/documents.currentonly`
  - `https://www.googleapis.com/auth/script.container.ui`

Why not the card-based Workspace Add-on framework: CardService cannot express an
interactive grouped issue list with inline text fields and per-card actions; Editor
add-ons with HTML sidebars are the established pattern for this product category.

## 2. Architecture

The core rule: **checks never touch Apps Script APIs.** They run on a normalized document
model of plain objects. Host apps are adapters.

```
┌────────────────────────── sidebar (browser) ──────────────────────────┐
│ sidebar.html (+ inlined CSS/JS)                                       │
│   renders ScanResult, calls google.script.run.{scan,locate,applyFix}  │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ google.script.run (JSON-serializable)
┌──────────────────────────────┴───────────────────────── Apps Script ──┐
│ src/server/main.ts      onOpen / onInstall / showSidebar / endpoints  │
│ src/server/docsAdapter.ts   DocumentApp tree ──► DocModel             │
│ src/server/docsActions.ts   locate(ref) / applyFix(ref, fix)          │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ DocModel (plain objects)
┌──────────────────────────────┴────────────────── pure TS, no GAS ─────┐
│ src/core/model.ts       DocModel / node & style types / ElementRef    │
│ src/core/checks/*.ts    one file per check (CHK-01 … CHK-07)          │
│ src/core/engine.ts      runChecks(model) ──► ScanResult               │
│ src/core/strings.ts     all user-facing text (single catalog)         │
│ src/core/contrast.ts    WCAG relative luminance / ratio math          │
└───────────────────────────────────────────────────────────────────────┘
```

Sheets/Slides later = new adapter + model extensions; engine and sidebar unchanged.

## 3. Core types (`src/core/model.ts`)

```ts
export interface DocModel {
  title: string; // file name
  pageBackgroundColor: string; // '#rrggbb'
  bodyFontSizePt: number; // dominant body size, for fake-heading detection
  nodes: DocNode[]; // flattened, document order
}

export type DocNode = ParagraphNode | ImageNode | TableNode | DrawingNode;

export interface ParagraphNode {
  kind: 'paragraph';
  ref: ElementRef;
  headingLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = normal text
  runs: TextRun[]; // styled spans
  inTableCell: boolean;
}

export interface TextRun {
  text: string;
  bold: boolean;
  fontSizePt: number;
  foregroundColor: string; // '#rrggbb'
  backgroundColor: string | null; // highlight, null = inherit page bg
  linkUrl: string | null;
}

export interface ImageNode {
  kind: 'image';
  ref: ElementRef;
  altDescription: string;
  positioned: boolean;
}
export interface TableNode {
  kind: 'table';
  ref: ElementRef;
  rows: number;
  cols: number;
  nonEmptyCells: number;
  totalCells: number;
}
export interface DrawingNode {
  kind: 'drawing';
  ref: ElementRef;
  drawingType: 'drawing' | 'chart' | 'equation';
}

/** Structural path from the body to the element, e.g. child indices at each level.
 *  Serializable; resolved back to a live element by the adapter. */
export type ElementRef = { path: number[]; runIndex?: number };
```

`ScanResult` (engine output, JSON-serializable for `google.script.run`):

```ts
export interface Issue {
  id: string;              // stable within a scan: `${checkId}:${refPath}`
  checkId: 'CHK-01' | … | 'CHK-07';
  severity: 'error' | 'warning' | 'review';
  wcag: string;            // '1.1.1'
  title: string;           // "Image is missing alt text"
  context: string;         // ≤ 80 chars of nearby/affected text
  whyItMatters: string;
  howToFix: string;
  ref: ElementRef;
  fix?: { type: 'setAltText' | 'setLinkText'; currentValue: string };
  data?: Record<string, string | number>;  // e.g. contrast ratio measured/required
}

export interface ScanResult { issues: Issue[]; counts: { error: number; warning: number; review: number }; scannedAt: string; }
```

## 4. Docs adapter (`src/server/docsAdapter.ts`)

Single pass over `DocumentApp.getActiveDocument().getBody()` using
`getNumChildren()/getChild(i)` recursion, building `path` as it descends:

- `PARAGRAPH` / `LIST_ITEM` → `ParagraphNode`; heading level from `getHeading()`; runs by
  walking child `Text` elements and splitting on `getTextAttributeIndices()`.
- `INLINE_IMAGE` → `ImageNode` (`getAltDescription()`); positioned images via
  `paragraph.getPositionedImages()`.
- `TABLE` → `TableNode` (cell counts only; paragraphs inside cells are also walked, with
  `inTableCell: true`, so contrast/link checks still see them).
- `INLINE_DRAWING` → `DrawingNode`. Charts arrive as inline images whose
  source is a chart — v1 treats them as images (alt API exists for them).
- Colors: `getForegroundColor()` / `getBackgroundColor()` return `null` for defaults →
  adapter substitutes `#000000` / page background. Page background from
  `doc.getBody().getAttributes()[BACKGROUND_COLOR]`, default `#ffffff`.

**Locate** (`docsActions.ts`): resolve `ElementRef.path` by re-walking child indices; then
`doc.setCursor(doc.newPosition(element, offset))` or `setSelection(rangeBuilder…)` for
runs. Stale path (index out of bounds / wrong element type) → return
`{ ok: false, reason: 'stale' }`; sidebar shows the re-scan hint.

**applyFix:** `setAltText` → `image.setAltDescription(value)`; `setLinkText` → on the run's
text element, `deleteText(start, end)` + `insertText(start, value)` +
`setLinkUrl(start, start + value.length - 1, url)`. Both re-verify the element still
matches (`currentValue`) before writing; mismatch → stale response.

## 5. Sidebar (`src/sidebar/`)

Plain TypeScript + CSS, no framework (300 px sidebar; a framework is dead weight and a
review liability). `sidebar.html` + `sidebar.ts` + `sidebar.css` are **inlined into a
single `dist/sidebar.html`** at build time (HtmlService templates can't fetch external
local files).

- State machine: `idle → scanning → results | error` (§4.1 of the functional spec).
- Rendering: build DOM via `document.createElement` (no innerHTML with document content —
  document text is untrusted input for the sidebar; always assign via `textContent`).
- Accessibility of the sidebar itself: semantic buttons/headings, `aria-expanded` on
  group toggles, focus moved to results summary after scan, visible focus ring, AA
  contrast, works at 200% zoom.
- Google's add-on CSS package look is imitated with our own small stylesheet (the shared
  stylesheet URL is fine to reference too, but we self-host styles to keep zero external
  requests).

## 6. Build pipeline

```
npm run build
 ├─ esbuild src/server/main.ts  → dist/code.js        (bundle, IIFE-less "gas" style:
 │    top-level function declarations preserved via a tiny footer that re-exports
 │    onOpen/onInstall/showSidebar/scanDocument/locateIssue/applyIssueFix to globalThis)
 ├─ esbuild src/sidebar/sidebar.ts → (in-memory) + sidebar.css → inlined into
 │    dist/sidebar.html via scripts/build-sidebar.mjs
 └─ copy appsscript.json → dist/
clasp push   (dist/ is the clasp rootDir)
```

- Apps Script V8 accepts modern JS; esbuild target `es2020`, format `esm` is _not_ valid
  for GAS → use `format=iife` with `globalName` and explicit `globalThis.fn = fn`
  assignments for the six entrypoints (footer emitted by the build script).
- `.clasp.json` sets `rootDir: "dist"`; `dist/` is committed to `.gitignore` **except**
  nothing — `dist/` is fully gitignored; CI rebuilds it.

## 7. Manifest (`appsscript.json`)

```json
{
  "timeZone": "America/Denver",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/documents.currentonly",
    "https://www.googleapis.com/auth/script.container.ui"
  ],
  "addOns": {
    "common": {
      "name": "Docs Accessibility Checker",
      "logoUrl": "…",
      "layoutProperties": { "primaryColor": "#1a73e8" }
    },
    "docs": {}
  }
}
```

(The `addOns` block is finalized during Marketplace configuration; the menu-based editor
add-on works without it during development.)

## 8. Testing

- **Unit (vitest, Node):** every check gets pass/fail/edge fixtures as hand-built
  `DocModel` objects (`test/fixtures.ts` has builder helpers). Contrast math tested
  against published WCAG reference pairs. Engine test: seeded model → exact expected
  issue list.
- **Adapter/E2E (manual, Phase 4):** seeded Google Doc per functional spec §8; tested as
  an unpublished add-on (`clasp push` + Extensions menu in a real doc).
- **CI (GitHub Actions):** `npm ci && npm run lint && npm test && npm run build` on push
  and PR to `main`. A green build proves `dist/` is producible; pushing to Apps Script
  stays a manual/local step in v1.

## 9. Conventions

- TypeScript strict; ESLint (typescript-eslint recommended) + Prettier defaults.
- All user-visible strings live in `src/core/strings.ts` (single catalog → future i18n).
- Conventional Commits; SemVer; CHANGELOG.md.
- No runtime dependencies. Dev dependencies only (esbuild, typescript, vitest, eslint,
  prettier, @types/google-apps-script).
