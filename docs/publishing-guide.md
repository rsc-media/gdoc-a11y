# Publishing Guide — Google Workspace Marketplace

Step-by-step instructions for taking this add-on from the repo to a public Marketplace
listing. Console steps must be done by the account owner in a browser; everything that
can be prepared in advance is in this file, ready to paste.

## Prerequisites (one-time)

1. **Apps Script API enabled** — https://script.google.com/home/usersettings → toggle ON.
2. **clasp logged in** — `clasp login` (opens a browser).
3. **Script project created** — from the repo root:
   ```sh
   clasp create --type standalone --title "Docs Accessibility Checker" --rootDir dist
   npm run push
   ```

## Step 1 — Test as an unpublished add-on

1. `clasp open-script` to open the Apps Script editor.
2. **Run ▸ Test as add-on** (or Deploy ▸ Test deployments in the new editor) → select a
   test Google Doc → Install.
3. In the doc: **Extensions ▸ Docs Accessibility Checker ▸ Check document**. First run
   triggers the consent screen (unverified-app warning is normal during development).
4. Run the acceptance test from the functional spec §8 (seeded document).

## Step 2 — Google Cloud project

Apps Script creates a hidden GCP project by default; Marketplace publishing requires a
**standard** one.

1. https://console.cloud.google.com → New Project → name: `docs-accessibility-checker`.
2. Note the **Project Number** (Dashboard page).
3. In the Apps Script editor: **Project Settings ▸ Google Cloud Platform (GCP) Project ▸
   Change project** → paste the project number.

## Step 3 — OAuth consent screen (brand verification)

Console → **APIs & Services ▸ OAuth consent screen**:

| Field                 | Value                                                        |
| --------------------- | ------------------------------------------------------------ |
| User type             | External                                                     |
| App name              | `Docs Accessibility Checker`                                 |
| User support email    | rio.media@riosalado.edu                                      |
| App logo              | `assets/icon-128.png` (own artwork, no Google trademarks)    |
| App domain / homepage | https://rsc-media.github.io/gdoc-a11y (see Step 5)           |
| Privacy policy link   | `https://rsc-media.github.io/gdoc-a11y/privacy-policy.html`  |
| Terms of service link | `https://rsc-media.github.io/gdoc-a11y/terms.html`           |
| Authorized domains    | `github.io` (or your custom domain)                          |
| Scopes                | `…/auth/documents.currentonly`, `…/auth/script.container.ui` |

Both scopes are **non-sensitive**, so no security assessment or demo video is required;
Google still performs lightweight **brand verification** (name/logo/domain match), which
can take a few days. Submit for verification and continue — the Marketplace steps can
proceed in parallel.

## Step 4 — Versioned deployment

In the Apps Script editor: **Deploy ▸ New deployment ▸ type: Add-on** → description
`v1.0.0` → note the **deployment ID** (or use `clasp deploy`).

## Step 5 — Host the policies (GitHub Pages)

Repo Settings ▸ Pages ▸ Deploy from branch ▸ `main` / `docs/`. The privacy policy and
terms then resolve as public URLs (needed by both the consent screen and the listing).

## Step 6 — Marketplace SDK

Console → enable **Google Workspace Marketplace SDK** → **App Configuration**:

- App visibility: **Public**
- Installation settings: **Individual + admin install**
- App integration: **Editor add-on ▸ Docs**; paste the Apps Script **deployment ID**
  (not the script ID)
- OAuth scopes: exactly the two scopes above
- Developer name: Murray Inman; developer email: rio.media@riosalado.edu

Then **Store Listing** — paste-ready copy:

- **App name:** Docs Accessibility Checker
- **Short description (≤ 120 chars):**
  `Find and fix common accessibility problems in your document — explained in plain language, no training needed.`
- **Detailed description:**

  > Docs Accessibility Checker helps anyone make their Google Docs easier for everyone to
  > read — including people who use screen readers or have low vision. No accessibility
  > training needed.
  >
  > Press one button and get a plain-language list of problems found in your document:
  > images missing alt text, headings that skip levels or are "fake" bold lines, links
  > that just say "click here", text colors that are too faint to read, tables that need
  > a header row, and more. Each finding explains WHY it matters to a real reader and HOW
  > to fix it — and for alt text and link text, one click fixes it for you.
  >
  > Built for teachers, government and non-profit staff, students, and anyone asked to
  > "make it accessible." Checks are mapped to WCAG 2.2 AA success criteria, shown as
  > fine print for your compliance paperwork.
  >
  > Private by design: the add-on reads only the document it's open in, makes no network
  > calls, and collects no data. Free and open source (MIT).

- **Category:** Productivity (or Education)
- **Graphics needed:** 128×128 and 32×32 app icons; at least one 1280×800 screenshot of
  the sidebar showing results in a real-looking doc; 220×140 card banner.
- **Support links:** homepage & support = GitHub repo URL; privacy & terms = Pages URLs.

## Step 7 — Submit for review

App Configuration + Store Listing complete → **Publish**. Review typically takes a few
days to two weeks for a non-sensitive-scope editor add-on. Respond to reviewer feedback
via the same console; each resubmission uses a new versioned deployment if code changed.

## Updating after launch

1. Bump `package.json` version + CHANGELOG entry.
2. `npm run push`, then create a new **versioned deployment** in Apps Script.
3. Update the deployment ID in Marketplace SDK ▸ App Configuration → re-publish (minor
   listing edits don't require re-review; scope changes do).
