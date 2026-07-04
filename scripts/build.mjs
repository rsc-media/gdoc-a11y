/**
 * Build for Apps Script:
 *  1. Bundle src/server/main.ts → dist/code.js (IIFE + globalThis re-exports,
 *     because Docs menus and google.script.run need top-level functions).
 *  2. Bundle src/sidebar/sidebar.ts + sidebar.css, inline both into
 *     src/sidebar/sidebar.html → dist/sidebar.html (HtmlService serves one file).
 *  3. Copy appsscript.json → dist/.
 */
import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';

const ENTRYPOINTS = [
  'onOpen',
  'onInstall',
  'showSidebar',
  'showHelp',
  'scanDocument',
  'locateIssue',
  'applyIssueFix',
];

await mkdir('dist', { recursive: true });

// 1. Server bundle
const server = await build({
  entryPoints: ['src/server/main.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'GDocA11y',
  target: 'es2020',
  write: false,
  charset: 'utf8',
});
const footer = ENTRYPOINTS.map(
  (fn) => `function ${fn}() { return GDocA11y.${fn}.apply(null, arguments); }`,
).join('\n');
await writeFile('dist/code.js', `${server.outputFiles[0].text}\n${footer}\n`);

// 2. Sidebar
const client = await build({
  entryPoints: ['src/sidebar/sidebar.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  charset: 'utf8',
});
const css = await readFile('src/sidebar/sidebar.css', 'utf8');
const template = await readFile('src/sidebar/sidebar.html', 'utf8');
const html = template
  .replace('/*__STYLES__*/', () => css)
  .replace('/*__SCRIPT__*/', () => client.outputFiles[0].text);
if (html.includes('__STYLES__') || html.includes('__SCRIPT__')) {
  throw new Error('sidebar.html placeholders were not replaced');
}
await writeFile('dist/sidebar.html', html);

// 3. Manifest
await copyFile('appsscript.json', 'dist/appsscript.json');

console.log('Built dist/: code.js, sidebar.html, appsscript.json');
