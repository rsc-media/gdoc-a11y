/**
 * Apps Script entrypoints. The build script re-exports these six functions to
 * globalThis so Docs menus and google.script.run can call them.
 */
import type { ElementRef, IssueFix, ScanResult } from '../core/model';
import { runChecks } from '../core/engine';
import { buildModel } from './docsAdapter';
import { applyFix, locate, type ActionResult } from './docsActions';
import { STRINGS } from '../core/strings';

const HELP_URL = 'https://github.com/REPO_PLACEHOLDER/gdoc-a11y#readme';

export function onInstall(e: GoogleAppsScript.Events.DocsOnOpen): void {
  onOpen(e);
}

export function onOpen(_e: GoogleAppsScript.Events.DocsOnOpen): void {
  // Must work in AuthMode.NONE: only builds the menu, touches nothing else.
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Check document', 'showSidebar')
    .addSeparator()
    .addItem('Help', 'showHelp')
    .addToUi();
}

export function showSidebar(): void {
  const html = HtmlService.createHtmlOutputFromFile('sidebar').setTitle(STRINGS.sidebar.appTitle);
  DocumentApp.getUi().showSidebar(html);
}

export function showHelp(): void {
  const html = HtmlService.createHtmlOutput(
    `<p style="font-family:sans-serif">Documentation and support: ` +
      `<a href="${HELP_URL}" target="_blank" rel="noopener">${HELP_URL}</a></p>`,
  )
    .setWidth(360)
    .setHeight(120);
  DocumentApp.getUi().showModalDialog(html, STRINGS.sidebar.appTitle);
}

/** Sidebar → server: scan the open document. */
export function scanDocument(): ScanResult {
  const doc = DocumentApp.getActiveDocument();
  const model = buildModel(doc);
  return runChecks(model);
}

/** Sidebar → server: move the cursor/selection to an issue. */
export function locateIssue(ref: ElementRef): ActionResult {
  return locate(ref);
}

/** Sidebar → server: apply a quick fix. */
export function applyIssueFix(ref: ElementRef, fix: IssueFix, newValue: string): ActionResult {
  return applyFix(ref, fix, newValue);
}
