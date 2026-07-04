# Functional Specification — Docs Accessibility Checker v1

This document defines _what_ the add-on does. The _how_ is in the
[design spec](design-spec.md).

## 1. Overview

The add-on adds an **Extensions ▸ Docs Accessibility Checker ▸ Check document** menu item
to Google Docs. It opens a sidebar that scans the currently open document and lists
accessibility issues in plain language, grouped by check, each with:

- a **severity** — `Error` (fails WCAG), `Warning` (probably a problem), or
  `Review` (needs human judgment; we can't verify automatically)
- **"Why this matters"** — one sentence, no jargon, about the human impact
- **"How to fix it"** — concrete steps in Docs terms
- a **Locate** button — moves the user's cursor/selection to the element in the document
- a **Fix** action where the API permits (alt text, link text)
- the WCAG success criterion as small secondary text (e.g., "WCAG 1.1.1") for users who
  need it for compliance paperwork

## 2. User stories

1. _As a teacher with no accessibility training_, I want to be told what's wrong with my
   handout in words I understand, so I can fix it before sharing it with students.
2. _As a government employee_, I want each finding tied to a WCAG criterion, so I can
   document compliance.
3. _As a screen-reader user's colleague_, I want one-click fixes, so that doing the right
   thing is faster than ignoring it.

## 3. Checks

Severity legend: **E** = Error, **W** = Warning, **R** = Review (manual).

### CHK-01 Image alternative text — WCAG 1.1.1 (E)

- **Detects:** inline and positioned images whose alt description is empty or missing.
- **Also warns (W)** when alt text is a filename-like string (`IMG_1234.jpg`, ends in an
  image extension) or longer than 250 characters.
- **Why it matters (user-facing):** "People using screen readers hear the alt text instead
  of seeing the image. Without it, they get silence."
- **Quick fix:** text field in the issue card → writes `setAltDescription()` on the image.
  A "decorative image" hint explains that truly decorative images can use a brief label
  like "decorative" (Docs has no first-class decorative flag).

### CHK-02 Heading structure — WCAG 1.3.1, 2.4.6 (E/W)

- **Detects:**
  - **E — Skipped level:** a heading more than one level deeper than the previous heading
    (e.g., Heading 1 → Heading 3).
  - **W — No headings:** document has ≥ 3 paragraphs of body text (~1 page) and no
    headings at all.
  - **W — Empty heading:** a paragraph styled as a heading with no text (often a leftover
    blank line).
  - **W — Fake heading:** a short (< 120 chars), single-line paragraph of `Normal text`
    that is entirely bold and/or ≥ 4 pt larger than body text — looks like a heading but
    isn't one structurally.
- **Why it matters:** "Screen-reader users jump between headings the way sighted readers
  skim. Bold text isn't a heading to them — only real heading styles are."
- **Fix guidance:** point to the styles dropdown; no automated fix in v1 (changing
  structure needs the author's intent).

### CHK-03 Link text — WCAG 2.4.4 (W)

- **Detects** links whose visible text is:
  - a vague phrase: `click here`, `here`, `read more`, `more`, `link`, `this`,
    `learn more`, `see more`, `details` (case-insensitive, trimmed, exact match);
  - a raw URL (`https://…` shown as the text itself), longer than 40 characters;
  - empty/whitespace.
- **Why it matters:** "Screen readers can read a list of just the links on a page.
  Ten links that all say 'click here' are useless out of context."
- **Quick fix:** text field → replaces the link's display text, preserving the URL.

### CHK-04 Text color contrast — WCAG 1.4.3 (E)

- **Detects** text runs whose contrast ratio against their background is below **4.5:1**
  (normal text) or **3:1** (large text: ≥ 18 pt, or ≥ 14 pt bold), using the WCAG relative
  luminance formula.
- Background = the run's highlight color if set, else the document/page background, else
  white. Runs shorter than 2 non-whitespace characters are ignored.
- **Why it matters:** "Low-contrast text is hard or impossible to read for people with low
  vision — and for anyone in sunlight."
- **Fix guidance:** shows the measured ratio vs. required ratio; suggests darkening the
  text color. No auto-fix in v1 (color choice is a design decision).

### CHK-05 Document title — WCAG 2.4.2 (W)

- **Detects** a document still named `Untitled document` (or the locale variant reported
  by the API).
- **Why it matters:** "The file name is the first thing assistive tech announces, and it's
  what everyone sees in Drive, tabs, and search results."
- **Fix guidance:** rename via the title box (the `documents.currentonly` scope cannot
  rename the file, so this stays guidance-only).

### CHK-06 Tables — WCAG 1.3.1 (R)

- **Detects** every table and asks the author to review it. Docs tables have no true
  header-cell semantics the API can verify, so this is a guided manual check:
  - **R — Review header row:** every table gets one card listing what to confirm: first
    row acts as headers (and is formatted via _Table properties ▸ pin header row_ where
    available), the table reads sensibly left-to-right/top-to-bottom, no merged/split
    layout tricks.
  - **W — Layout table suspicion:** a table where ≥ 80% of cells contain no text, or a
    single-row/single-column table longer than 3 cells — likely being used for visual
    layout.
- **Why it matters:** "Screen readers announce tables cell by cell. A table used for page
  layout turns your document into a maze."

### CHK-07 Drawings, charts and equations — WCAG 1.1.1 (R)

- **Detects** inline drawings and embedded charts. Apps Script exposes **no alt-text API**
  for these, so each gets a Review card telling the user exactly how to check/fix it by
  hand (select the object ▸ three-dot menu ▸ Alt text).
- **Why it matters:** same as images — invisible content for screen-reader users.

## 4. Sidebar behavior

### 4.1 States

1. **Idle / first open:** short intro ("Check this document for common accessibility
   problems") + primary button **Check my document**.
2. **Scanning:** button disabled, progress note ("Reading your document…"). Scans are
   synchronous server calls; target < 10 s on a 50-page doc.
3. **Results:**
   - Summary strip: `N errors · N warnings · N to review` — or a celebratory
     "No issues found 🎉 — a few things only you can check" leading into the Review items.
   - Issues grouped by check, groups collapsible, ordered: Errors, Warnings, Review.
   - Each card: icon + one-line title (e.g., "Image is missing alt text"), snippet of
     context (nearby text / link text / heading text, ≤ 80 chars), Locate button,
     Fix control if available, expandable "Why this matters / How to fix it".
4. **Error:** friendly failure card ("Something went wrong reading the document") with a
   Retry button and a link to file a GitHub issue.

### 4.2 Actions

- **Locate:** server call moves the cursor (or selects the element) via a Position/Range
  built from the element reference; Docs scrolls to the cursor. If the element was deleted
  since the scan, show "This item has changed — re-scan" on the card.
- **Fix (alt text / link text):** applies the change, marks the card resolved (strikes
  through + moves to a "Fixed" group), does **not** force a full re-scan.
- **Re-scan:** always available from the summary strip.
- Element references are structural paths captured at scan time; any edit may invalidate
  them (acceptable v1 limitation, communicated via the "re-scan" hint).

### 4.3 Tone rules (applies to all user-facing strings)

- Lead with the human impact, never the WCAG number.
- Never say "violation", "non-compliant", "failure" in card titles.
- Every "How to fix it" names the exact Docs menu path.
- Reading level target: plain English, ~8th grade.

## 5. Menu and lifecycle

- `onInstall(e)` → calls `onOpen(e)` (standard add-on pattern).
- `onOpen(e)` → adds menu: **Check document** (opens sidebar), **Help** (opens GitHub
  README). Menu must work in `AuthMode.NONE` (no document access before the user runs it).
- Sidebar title: "Accessibility Checker".

## 6. Permissions and privacy

- OAuth scopes: `https://www.googleapis.com/auth/documents.currentonly`,
  `https://www.googleapis.com/auth/script.container.ui`. **Nothing else.**
- No external network calls, no analytics, no data leaves the document. The privacy policy
  states this plainly; it is a selling point for schools and government users.

## 7. Non-functional requirements

- Scan of a 50-page text-heavy document: < 10 s (Apps Script 6-min execution limit is the
  hard ceiling; we stay far under it).
- Sidebar works at Google's fixed 300 px width; keyboard-navigable; the sidebar itself
  meets WCAG AA (an accessibility tool must be accessible: focus order, visible focus,
  4.5:1 contrast, ARIA where needed).
- All engine logic unit-tested in Node; adapter logic exercised by the Phase-4 seeded
  end-to-end document.

## 8. Acceptance test (end-to-end)

A seeded test document containing: 2 images without alt text, 1 image with filename alt
text, an H1→H3 skip, a bold-line fake heading, a "click here" link, a raw-URL link, a
low-contrast light-gray paragraph, one data table, one mostly-empty layout table, and one
drawing. A full scan must report every seeded issue (and nothing else), Locate must land
on each, alt-text and link-text fixes must apply, and a re-scan after fixing everything
fixable must show only the Review items.
