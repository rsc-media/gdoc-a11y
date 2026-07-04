# Privacy Policy — Docs Accessibility Checker

_Last updated: July 3, 2026_

Docs Accessibility Checker ("the add-on") is a free, open-source Google Workspace add-on
that checks the Google Doc you have open for common accessibility problems.

## The short version

The add-on runs entirely inside Google's Apps Script environment, reads only the document
it is open in, sends nothing to anyone, and stores nothing. There is no server, no
analytics, no advertising, and no data collection of any kind.

## What the add-on can access

The add-on requests two narrow, non-sensitive permissions:

- **View and manage the document it is installed in**
  (`https://www.googleapis.com/auth/documents.currentonly`) — used to read the open
  document's content when you press "Check my document," and to apply fixes you
  explicitly request (such as setting an image's alt text). It cannot see any other file
  in your Google Drive.
- **Display sidebars and other UI**
  (`https://www.googleapis.com/auth/script.container.ui`) — used to show the add-on's
  sidebar inside Google Docs.

## What we collect, store, and share

**Nothing.** Specifically:

- Document content is processed in memory during a scan and never stored, logged, or
  transmitted outside Google's Apps Script runtime.
- The add-on makes no external network requests.
- We collect no personal information, usage analytics, or telemetry.
- We share no data with third parties, because none is collected.
- No cookies or tracking technologies are used.

Use of information received from Google APIs adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## Your choices

You can uninstall the add-on at any time from **Extensions ▸ Add-ons ▸ Manage add-ons**
in Google Docs, or from your Google Account's
[third-party access settings](https://myaccount.google.com/permissions), which revokes
all permissions immediately.

## Open source

The complete source code is publicly available in the project repository, so anyone can
verify these statements: see the repository this document is published from.

## Changes to this policy

Changes will be published on this page with an updated date. Material changes will be
noted in the project changelog.

## Contact

Questions about this policy: open an issue in the project's GitHub repository, or email
murray@inmanfamily.org.
