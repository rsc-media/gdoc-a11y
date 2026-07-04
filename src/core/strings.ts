/**
 * Every user-visible string lives here (single catalog → future i18n).
 * Tone rules (functional spec §4.3): lead with human impact, no jargon in
 * titles, name the exact Docs menu path in every "how to fix".
 */

export const STRINGS = {
  altTextMissing: {
    title: 'Image is missing alt text',
    why: 'People using screen readers hear the alt text instead of seeing the image. Without it, they get silence.',
    how: 'Type a short description of the image in the box below and press Fix — or select the image in the document, open the three-dot menu on it, and choose "Alt text". If the image is purely decorative, a brief label like "decorative" is fine.',
  },
  altTextFilename: {
    title: 'Alt text looks like a file name',
    why: 'Hearing "IMG underscore one two three four dot J P G" tells a screen-reader user nothing about the picture.',
    how: 'Replace it with a short description of what the image shows, using the box below or the image\'s three-dot menu ▸ "Alt text".',
  },
  altTextTooLong: {
    title: 'Alt text is very long',
    why: "Screen readers read alt text in one breath — listeners can't skim or skip around in it. A sentence or two is ideal.",
    how: 'Shorten the alt text to the essentials. If the image needs a long explanation, put it in the document text where everyone can read it.',
  },
  altTextUnsupported: {
    title: "Check this image's alt text by hand",
    why: "This image is positioned with text wrapping, and the add-on can't read its alt text automatically.",
    how: 'Select the image, open the three-dot menu on it, choose "Alt text", and make sure it has a short description.',
  },
  headingSkip: {
    title: 'Heading level is skipped',
    why: 'Screen-reader users navigate by heading levels like an outline. Jumping from Heading 1 to Heading 3 is like a book skipping from chapter to sub-sub-section — people wonder what they missed.',
    how: "Change this heading's style to the next level down from the previous heading (Format ▸ Paragraph styles, or the styles dropdown in the toolbar).",
  },
  headingNone: {
    title: 'Document has no headings',
    why: 'Screen-reader users jump between headings the way sighted readers skim. Without headings, the only way through is to listen to every word.',
    how: 'Break the document into sections and give each a heading using the styles dropdown in the toolbar (where it says "Normal text").',
  },
  headingEmpty: {
    title: 'Heading has no text',
    why: 'Empty headings are announced as blank stops in the outline — confusing noise for screen-reader users.',
    how: 'Click at the empty heading and either type its text or set the line back to "Normal text" in the styles dropdown.',
  },
  headingFake: {
    title: "This looks like a heading, but isn't one",
    why: 'Bold or large text looks like a heading, but screen readers only recognize real heading styles — this line is invisible in the document outline.',
    how: 'Select the line and choose a real heading style from the styles dropdown in the toolbar (where it says "Normal text").',
  },
  linkVague: {
    title: "Link text doesn't say where it goes",
    why: 'Screen readers can list all the links in a document. Ten links that all say "click here" are useless out of context.',
    how: 'Rewrite the link text to describe the destination, e.g. "enrollment form" instead of "click here". You can type it below and press Fix.',
  },
  linkRawUrl: {
    title: 'Link shows a long web address',
    why: 'A screen reader reads every character of a URL aloud — "h t t p s colon slash slash…". Descriptive words are far easier to hear and remember.',
    how: 'Replace the visible address with words describing the page, e.g. "school calendar". You can type it below and press Fix — the link will still point to the same address.',
  },
  linkEmpty: {
    title: 'Link has no text',
    why: 'A link with no text is announced as just "link" — there\'s no way to know what it is or where it goes.',
    how: 'Type text for the link below and press Fix, or delete the empty link in the document.',
  },
  contrastLow: {
    title: 'Text color is hard to read',
    why: 'Low-contrast text is hard or impossible to read for people with low vision — and for anyone reading in sunlight.',
    how: 'Select the text and pick a darker text color (or a lighter highlight) from the toolbar until it stands out clearly from the background.',
  },
  titleUntitled: {
    title: 'Document is still called "Untitled document"',
    why: "The file name is the first thing assistive tech announces, and it's what everyone sees in Drive, tabs, and search results.",
    how: 'Click the title box at the top-left of Docs and give the document a meaningful name.',
  },
  tableReview: {
    title: 'Check this table',
    why: 'Screen readers announce tables cell by cell, so structure matters more than looks.',
    how: 'Confirm that: the first row contains column headers; the table makes sense read left-to-right, top-to-bottom; and it isn\'t being used just to position things on the page. Right-click the table ▸ "Table properties" to pin the header row so it repeats on every page.',
  },
  tableLayout: {
    title: 'Table may be used for page layout',
    why: 'A table used only to position things on the page turns the document into a maze for screen-reader users, who hear it announced cell by cell.',
    how: 'If this table is just for layout, replace it with columns (Format ▸ Columns), tab stops, or images with text wrapping.',
  },
  drawingReview: {
    title: 'Drawing or chart needs alt text checked by hand',
    why: "Drawings and charts are invisible to screen-reader users unless they have alt text — and the add-on can't read it automatically for this type of object.",
    how: 'Select the object, open the three-dot menu on it (or right-click), choose "Alt text", and add a short description of what it shows.',
  },
  sidebar: {
    appTitle: 'Accessibility Checker',
    intro: 'Check this document for common accessibility problems, explained in plain language.',
    scanButton: 'Check my document',
    rescanButton: 'Check again',
    scanning: 'Reading your document…',
    allClear: 'No issues found 🎉',
    allClearSub: 'A few things only you can check are listed below.',
    groupError: 'Errors',
    groupWarning: 'Warnings',
    groupReview: 'Things to check yourself',
    groupFixed: 'Fixed this session',
    locate: 'Show me',
    fix: 'Fix',
    fixPlaceholderAlt: 'Describe the image…',
    fixPlaceholderLink: 'What is this link?',
    whyLabel: 'Why this matters',
    howLabel: 'How to fix it',
    stale: 'This item has changed — check the document again.',
    errorTitle: 'Something went wrong reading the document.',
    errorRetry: 'Try again',
    errorReport: 'Report a problem',
    wcagPrefix: 'WCAG',
  },
} as const;

/** Vague link phrases (compared lowercase, trimmed, punctuation stripped). */
export const VAGUE_LINK_PHRASES = [
  'click here',
  'here',
  'read more',
  'more',
  'link',
  'this',
  'learn more',
  'see more',
  'details',
] as const;
