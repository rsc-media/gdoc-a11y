# Project Plan — Docs Accessibility Checker

A free, open-source Google Workspace Editor add-on that helps **inexperienced users** run
simple WCAG accessibility evaluations on their Google Docs — with plain-language
explanations and one-click fixes wherever possible.

- **Repository:** https://github.com/rsc-media/gdoc-a11y (public)
- **Distribution:** Google Workspace Marketplace (free listing)
- **License:** MIT
- **Status:** In development (started July 2026)

## 1. Problem statement

Most people who write documents have never heard of WCAG, yet their documents are read by
people who use screen readers, have low vision, or have cognitive differences. Existing
tools are either aimed at accessibility professionals, cost money (e.g., Grackle Docs), or
live outside the writing tool entirely. Google Docs itself offers no built-in accessibility
checker.

**Goal:** meet non-expert authors where they write, tell them in plain English what is
wrong, why it matters to a real person, and — where the API allows — fix it for them in one
click.

## 2. Target audience

- Teachers, school and university staff preparing course materials
- Government / non-profit staff subject to accessibility mandates (ADA, Section 508, EAA)
- Anyone asked to "make this document accessible" without training

Design consequence: **no jargon-first UI**. WCAG references are shown as secondary detail,
never as the headline.

## 3. Scope

### v1 (this project)

- Google Docs only
- Scan the currently open document from a sidebar
- Seven checks mapped to WCAG 2.2 AA (see [functional spec](functional-spec.md))
- Locate each issue in the document (move the user's cursor/selection to it)
- One-click fixes where possible (alt text, link text)
- Plain-language guidance for issues that require human judgment
- Published publicly on the Google Workspace Marketplace

### Later versions (documented, not built in v1)

- **Google Sheets adapter:** merged-cell warnings, header rows, tab names, contrast
- **Google Slides adapter:** image alt text, reading order, slide titles, contrast
- Exportable scan report (share with a colleague / include in compliance records)
- Localization (the architecture keeps all user-facing strings in one catalog)

### Out of scope

- Automated checking of things that genuinely need human judgment (we flag them as
  "manual checks" with guidance instead of pretending to verify them)
- PDF export remediation, Microsoft Office formats
- Full WCAG conformance certification — this is a helper, not an audit tool, and the UI
  says so

## 4. Architecture summary

Editor add-on built with Apps Script; TypeScript + esbuild locally, pushed with clasp.
The checks engine is host-agnostic (runs on a normalized document model), so Sheets and
Slides become new adapters, not rewrites. Details in the [design spec](design-spec.md).

Key constraint honored throughout: **minimal OAuth scopes** — `documents.currentonly`
(the narrowest Docs scope, non-sensitive) and `script.container.ui` (required for any
sidebar; classified sensitive by Google, see the publishing guide). The add-on can only
ever read the document it is open in, and sends nothing anywhere — there is no server.

## 5. Phases and milestones

| Phase | Deliverable                                              | Exit criterion                                      |
| ----- | -------------------------------------------------------- | --------------------------------------------------- |
| 0     | Toolchain (gh, clasp, logins)                            | `clasp push` works from this machine                |
| 1     | Planning docs (this doc, functional spec, design spec)   | Docs committed to repo                              |
| 2     | Repo scaffold + CI, published on GitHub                  | CI green on first push                              |
| 3     | Checks engine                                            | All unit tests pass in Node (no Apps Script needed) |
| 4     | Apps Script integration (adapter, sidebar, fixes)        | End-to-end pass on a seeded test doc                |
| 5     | Marketplace prep (policies, listing copy, assets, guide) | Every submission field has prepared content         |
| 6     | Submission                                               | Add-on live on the Marketplace                      |

## 6. Risks

| Risk                                                      | Likelihood      | Mitigation                                                                                            |
| --------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| Marketplace review requests changes                       | Medium          | Non-sensitive scopes only; privacy policy + ToS prepared up front; listing follows Google's checklist |
| Apps Script API gaps (e.g., no alt-text API for drawings) | Certain (known) | Ship those as "manual check" items with guidance rather than dropping them                            |
| Scan too slow on very large docs                          | Low–medium      | Single-pass tree walk; engine is O(n) in elements; test with a 100-page doc in Phase 4                |
| Brand verification delays (logo/name)                     | Medium          | Neutral name, original icon, no Google trademarks in the name                                         |
| Docs adds a native checker                                | Low             | Ours stays useful as a teaching tool; open source has no revenue to lose                              |

## 7. Success criteria for v1

1. Listed publicly on the Google Workspace Marketplace
2. A non-technical user can install it, scan a document, and fix at least alt-text and
   link-text issues without leaving Docs or reading any documentation
3. Every reported issue explains _why it matters_ in one sentence a layperson understands
4. All engine logic covered by unit tests; CI enforces lint + tests on every PR
5. Public repo with README good enough for an outside contributor to build and push their
   own dev copy

## 8. Maintenance

- GitHub Issues for bug reports (linked from the Marketplace listing and the sidebar)
- Semantic versioning; CHANGELOG.md; Marketplace updates pushed via versioned deployments
- CI on every PR; `main` is protected once published
