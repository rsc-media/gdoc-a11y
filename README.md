# Docs Accessibility Checker

A free, open-source Google Workspace add-on that helps anyone — no accessibility training
required — find and fix common accessibility problems in Google Docs, explained in plain
language.

> **Status:** in development, preparing for Google Workspace Marketplace review.

## What it checks

| Check                                                               | WCAG (2.2 AA)    | Can it fix it for you?       |
| ------------------------------------------------------------------- | ---------------- | ---------------------------- |
| Images missing (or unhelpful) alt text                              | 1.1.1            | ✅ one-click fix             |
| Heading structure (skipped levels, fake bold headings, no headings) | 1.3.1 / 2.4.6    | guidance                     |
| Vague link text ("click here") and raw URLs                         | 2.4.4            | ✅ one-click fix             |
| Low text color contrast                                             | 1.4.3            | guidance with measured ratio |
| Untitled document                                                   | 2.4.2            | guidance                     |
| Tables (header rows, layout tables)                                 | 1.3.1            | guided manual review         |
| Drawings / charts alt text                                          | 1.1.1            | guided manual review         |
| Text smaller than 10 pt                                             | 1.4.4 (advisory) | guidance with measured size  |

Every finding says **why it matters** to a real reader and **how to fix it** with the
exact Docs menu path — WCAG numbers are shown only as fine print for compliance paperwork.

## Privacy

The add-on uses only two narrow permissions: read/write access to **the
document it is open in** (`documents.currentonly`) and permission to show its sidebar
(`script.container.ui`). It makes **no network calls**, has **no server**, and collects
**no data**. See the [privacy policy](docs/privacy-policy.md).

## Development

Prereqs: Node 20+, and [clasp](https://github.com/google/clasp) (`npm i -g @google/clasp`).

```sh
npm install
npm test          # unit tests (vitest) — engine runs entirely in Node
npm run lint      # eslint + prettier
npm run build     # bundles to dist/ (code.js, sidebar.html, appsscript.json)
```

To run your own development copy in Docs:

1. Enable the Apps Script API: https://script.google.com/home/usersettings
2. `clasp login`
3. `clasp create --type standalone --title "Docs Accessibility Checker (dev)" --rootDir dist`
   (creates `.clasp.json`, which stays untracked)
4. `npm run push` — builds and pushes to your script project
5. In the Apps Script editor (`clasp open-script`): **Run ▸ Test as add-on**, choose a
   Google Doc, then in the doc: **Extensions ▸ Docs Accessibility Checker ▸ Check document**

### Architecture

The checks engine (`src/core/`) is pure TypeScript operating on a normalized document
model — it never touches Apps Script APIs, which is what makes it unit-testable and
host-agnostic. `src/server/docsAdapter.ts` converts the live `DocumentApp` tree into that
model; a future Sheets or Slides adapter plugs into the same engine. The sidebar
(`src/sidebar/`) is dependency-free HTML/CSS/TS, inlined into a single file at build time.

Full details: [project plan](docs/project-plan.md) · [functional spec](docs/functional-spec.md)
· [design spec](docs/design-spec.md) · [publishing guide](docs/publishing-guide.md)

## Contributing

Issues and PRs welcome. `npm run lint && npm test` must pass; CI enforces both.

## License

[MIT](LICENSE)
