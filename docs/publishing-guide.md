---
title: Publishing Guide
---

# Publishing Guide — Google Workspace Marketplace

How to take this add-on from the repo into users' hands. Console steps must be done by
the account owner (rio.media@riosalado.edu) in a browser; everything that can be prepared
in advance is in this file, ready to paste.

## Rollout paths

Pick the smallest path that fits where you are. They build on each other.

| Path                       | Who can use it                                  | Google review?                  | Admin needed?         | Use when                                       |
| -------------------------- | ----------------------------------------------- | ------------------------------- | --------------------- | ---------------------------------------------- |
| **A — Test-user pilot**    | A few named reviewers you share the script with | None                            | No                    | Technical/legal review, first hands-on testing |
| **B — Private / internal** | Anyone at riosalado.edu                         | None (private apps skip review) | Yes (Workspace admin) | College-wide pilot, clean install experience   |
| **C — Public launch**      | Anyone, worldwide                               | Yes (Google reviews)            | No                    | Final public release on the Marketplace        |

**Do Path A first, then Path B, then C.** Two things carry across all three:

- Scope classification (per the Cloud console): `documents.currentonly` is
  **non-sensitive**, but `script.container.ui` — required by every editor add-on that
  shows a sidebar — is classified **sensitive**. Neither is _restricted_, so the heavy
  third-party security assessment never applies. Practical effects:
  - **riosalado.edu users are exempt from verification** (Apps Script projects whose
    owner and users share a Workspace domain skip it), so Path A domain reviewers and
    all of Path B get a clean consent screen with no caps.
  - **Users outside riosalado.edu** of the unpublished app see Google's "unverified
    app" warning and count against a 100-user cap — workable for a few external
    reviewers (see Path A).
  - **Path C (public)** therefore includes standard OAuth verification (scope
    justification, sometimes a short demo video) — routine for editor add-ons.
- **Marketplace app visibility is locked once you save the App Configuration page**
  (Path B or C). You cannot flip Private to Public later, and the **Unlisted** option is
  equally permanent — an unlisted app can never become searchable, yet it still goes
  through public-class Google review. (For Path B choose Private; for Path C choose
  Public without Unlisted.) So Path B and Path C should each get their **own Google
  Cloud project**, and Path A needs no project at all. This keeps the eventual public
  listing clean.

## Prerequisites (one-time — already done for this project)

1. **Apps Script API enabled** — https://script.google.com/home/usersettings → toggle ON.
2. **clasp logged in** — `clasp login`.
3. **Script project created and pushed** — from the repo root:
   ```sh
   clasp create --type standalone --title "Docs Accessibility Checker" --rootDir dist
   npm run push
   ```
   The current project ID is in `.clasp.json`; open it with `clasp open-script`.

---

## Path A — Test-user pilot (share the script, no Marketplace, no admin)

Best for a handful of reviewers (technical, legal, a few teachers). No listing, no
publishing, no admin involvement. Each reviewer installs a **test deployment** of the
add-on for their own account and runs it on their own documents.

Reviewers on **riosalado.edu** get the clean two-permission consent screen: Apps Script
projects whose owner (rio.media) and users share a Workspace domain are exempt from OAuth
verification. Reviewers **outside** the domain will see Google's "unverified app"
interstitial (because `script.container.ui` is a sensitive scope) — they can proceed via
**Advanced ▸ Go to Docs Accessibility Checker (unsafe)**; Google caps an unverified app
at 100 such external users, which is fine for a pilot.

### A1. (Owner) Confirm your own test deployment works

1. `clasp open-script` → **Deploy ▸ Test deployments ▸ Install** → pick a Doc → **Execute**.
2. In the doc: **Extensions ▸ Docs Accessibility Checker ▸ Check document**. Run the
   acceptance test from the functional spec §8.

### A2. (Owner) Share the script project with reviewers

Test deployments require **edit** access to the script project (the code is open source
on GitHub anyway, so this exposes nothing new).

1. Open the project at script.google.com (`clasp open-script`).
2. Top-right **Share** (or open the project's file in Drive → Share).
3. Add each reviewer's Google account as **Editor**. Send them the "How reviewers install
   it" steps below.

> Domain (riosalado.edu) reviewers need nothing more. If external reviewers find the
> "unverified app" interstitial off-putting and a standard GCP project is attached
> (Path B/C), you can instead add them under Cloud console ▸ **APIs & Services ▸ OAuth
> consent screen ▸ Audience ▸ Test users** (up to 100) with the app in Testing status.

### A3. (Each reviewer) Install and use it

1. Open the script link the owner shared.
2. **Deploy ▸ Test deployments ▸ Install** → **Config: Installed for current user** →
   pick one of your own Google Docs → **Done** → select the test → **Execute**.
3. The doc opens with the add-on attached: **Extensions ▸ Docs Accessibility Checker ▸
   Check document**. It stays available in your Extensions menu for testing.

### A4. Collect feedback

Point reviewers at the repo's **GitHub Issues** for bugs/ideas (linked from the sidebar
footer). Legal/technical reviewers can review the exact scoped app plus the
[privacy policy](privacy-policy.md) and [terms](terms.md).

**Limitation:** editor add-ons can't be "sideloaded" to people you haven't shared the
script with — for anyone beyond a handful of accounts, move to Path B.

---

## Path B — Private / internal rollout (riosalado.edu only)

Best for a college-wide pilot: any Rio Salado account can install it like a normal
add-on, with a clean install experience and no Google review.

**rio.media@riosalado.edu is confirmed NOT a Workspace admin (2026-07-05)**, so Path B is
a two-person job — rio.media builds the listing, and Rio Salado IT (a super-admin) does
the allowlist/install. Line it up before starting:

| rio.media can do alone                                        | Needs Rio Salado IT (super-admin)                                                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create the private Marketplace listing (B2–B4) and publish it | Allowlist the app so the domain can install it (B5) — most .edu tenants block non-allowlisted Marketplace apps by default, so **without this step nobody can install it** |
| —                                                             | Possibly create the GCP project (B1) if project creation is locked down                                                                                                   |
| —                                                             | Optionally admin-install to a pilot org-unit so only the pilot group gets it                                                                                              |

> Use a **separate Google Cloud project** from the future public listing (Path C),
> because visibility is locked once published.

### B1. Google Cloud project

1. https://console.cloud.google.com → **New Project** → name e.g.
   `docs-a11y-internal`. Note the **Project Number**.
2. Apps Script editor ▸ **Project Settings ▸ Google Cloud Platform (GCP) Project ▸ Change
   project** → paste the number.
   > If project creation is blocked, Rio Salado IT restricts it — have an admin create the
   > project and grant rio.media the **Owner** role on it.

### B2. OAuth consent screen

Console ▸ **APIs & Services ▸ OAuth consent screen**. Same fields as the table in Path C
Step 2, with **User type: Internal** (available because rio.media is a Workspace account).
Internal apps skip verification entirely for domain users.

### B3. Versioned deployment

Apps Script editor ▸ **Deploy ▸ New deployment ▸ type: Add-on** → description `v0.9.0
(internal pilot)` → note the **deployment ID** (or `clasp deploy`).

### B4. Marketplace SDK — private

Console ▸ enable **Google Workspace Marketplace SDK** ▸ **App Configuration**:

- **App visibility: Private** (My Domain / riosalado.edu only)
- Installation settings: **Individual + admin install**
- App integration: **Editor add-on ▸ Docs**; paste the **deployment ID** (not script ID)
- OAuth scopes: the two scopes from `appsscript.json`
- Developer name: Rio Salado College Media; developer email: rio.media@riosalado.edu

Fill the **Store Listing** with the same copy/graphics as Path C Step 5, then **Publish**
(published immediately — no Google review for private apps).

### B5. Admin allowlist / install — hand to Rio Salado IT

rio.media can't do this step. Send IT the published app's name/ID and ask them to, in the
**Admin console ▸ Apps ▸ Google Workspace Marketplace apps**:

1. **Allowlist** the app (required — otherwise domain users are blocked from installing it).
2. Optionally **admin-install** it, scoped to a pilot **organizational unit**, so only the
   pilot group receives it.

They can then watch adoption and errors from the Admin console. Give them the
[privacy policy](privacy-policy.md), [terms](terms.md), and the two narrow scopes
for their review — that's usually all a security/privacy team needs to approve it.

---

## Path C — Public launch

The full public Marketplace listing. Use a **fresh Google Cloud project** (not the
internal one from Path B). Google reviews the app before it goes live.

### C1. Google Cloud project

1. https://console.cloud.google.com → **New Project** → name `docs-accessibility-checker`.
   Note the **Project Number**.
2. Apps Script editor ▸ **Project Settings ▸ GCP Project ▸ Change project** → paste it.

### C2. OAuth consent screen (brand verification)

Console ▸ **APIs & Services ▸ OAuth consent screen**:

| Field                 | Value                                                            |
| --------------------- | ---------------------------------------------------------------- |
| User type             | External                                                         |
| App name              | `Docs Accessibility Checker`                                     |
| User support email    | rio.media@riosalado.edu                                          |
| App logo              | upload `assets/icon-128.png` (own artwork, no Google trademarks) |
| App domain / homepage | https://rsc-media.github.io/gdoc-a11y                            |
| Privacy policy link   | `https://rsc-media.github.io/gdoc-a11y/privacy-policy.html`      |
| Terms of service link | `https://rsc-media.github.io/gdoc-a11y/terms.html`               |
| Authorized domains    | `github.io` (or your custom domain)                              |
| Scopes                | `…/auth/documents.currentonly`, `…/auth/script.container.ui`     |

`documents.currentonly` is non-sensitive, but `script.container.ui` is classified
**sensitive**, so expect standard **OAuth verification**: brand verification
(name/logo/domain match) plus a scope-usage justification, and Google sometimes requests
a short demo video showing the add-on using its scopes. No third-party security
assessment applies — that's only for _restricted_ scopes. This is the routine path for
every sidebar editor add-on; allow a few days to a few weeks. Submit and continue — the
Marketplace steps proceed in parallel.

**Homepage & domain verification (required):** the app homepage lives at
https://rsc-media.github.io/gdoc-a11y/ (`docs/index.md`) — it identifies the app,
describes functionality, explains each scope's purpose, and links the same privacy
policy URL as the consent screen. Google requires the homepage domain to be **verified
as yours**: in [Search Console](https://search.google.com/search-console), signed in as
rio.media, add the property `rsc-media.github.io/gdoc-a11y/` (URL-prefix type) and
verify with the **HTML-file method** — commit the `googleXXXX.html` file Google provides
into the repo's `docs/` folder and it's served automatically. (github.io subdomains are
verifiable this way; the "no third-party platforms" rule targets hosts like Google Sites
or social media where you can't prove subdomain ownership. If a reviewer objects anyway,
the fallback is pointing a college-owned subdomain, e.g. on learnatrio.com, at the Pages
site via CNAME — requires Rio Salado IT for DNS.)

Suggested scope justification (paste-adapt): "This editor add-on scans the currently
open Google Doc for accessibility problems. `documents.currentonly` reads the open
document's structure and applies user-requested fixes (image alt text, link text) to
that document only. `script.container.ui` displays the add-on's results sidebar inside
Google Docs. The add-on makes no external network requests and stores no data."

### C3. Versioned deployment

Apps Script editor ▸ **Deploy ▸ New deployment ▸ type: Add-on** → description `v1.0.0` →
note the **deployment ID** (or `clasp deploy`).

### C4. Host the policies (GitHub Pages) — already done

Repo Settings ▸ Pages ▸ Deploy from branch ▸ `main` / `docs/`. Privacy policy, terms, and
graphics already resolve at `https://rsc-media.github.io/gdoc-a11y/…`.

### C5. Marketplace SDK — public

Console ▸ enable **Google Workspace Marketplace SDK** ▸ **App Configuration**:

- App visibility: **Public**
- Installation settings: **Individual + admin install**
- App integration: **Editor add-on ▸ Docs**; paste the **deployment ID** (not script ID)
- OAuth scopes: the two scopes from `appsscript.json`
- Developer name: Rio Salado College Media; developer email: rio.media@riosalado.edu

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
- **Graphics (ready-made, served from GitHub Pages):**
  - 128×128 icon: `https://rsc-media.github.io/gdoc-a11y/assets/icon-128.png`
  - 32×32 icon: `https://rsc-media.github.io/gdoc-a11y/assets/icon-32.png`
  - 220×140 card banner: `https://rsc-media.github.io/gdoc-a11y/assets/banner-220x140.png`
  - 1280×800 screenshot: `https://rsc-media.github.io/gdoc-a11y/assets/screenshot-1280x800.png`
- **Support links:** homepage & support = GitHub repo URL; privacy & terms = Pages URLs.

### C6. Submit for review

App Configuration + Store Listing complete → **Publish**. Review typically takes a few
days to a few weeks for an editor add-on with minimal scopes. Respond to reviewer feedback in
the same console; each resubmission uses a new versioned deployment if code changed.

---

## Updating after launch

1. Bump `package.json` version + CHANGELOG entry.
2. `npm run push`, then create a new **versioned deployment** in Apps Script.
3. Update the deployment ID in Marketplace SDK ▸ App Configuration → re-publish (minor
   listing edits don't require re-review; scope changes do).
