import { describe, expect, it } from 'vitest';
import { checkLinks } from '../src/core/checks/links';
import { doc, para, run } from './fixtures';

describe('CHK-03 link text', () => {
  it('flags vague phrases regardless of case and punctuation', () => {
    for (const text of ['click here', 'Click Here!', 'HERE', 'Read more…']) {
      const p = para([run(text, { linkUrl: 'https://example.org/page' })]);
      expect(checkLinks(doc([p])), text).toHaveLength(1);
    }
  });

  it('passes descriptive link text', () => {
    const p = para([run('2026 enrollment form', { linkUrl: 'https://example.org/enroll' })]);
    expect(checkLinks(doc([p]))).toHaveLength(0);
  });

  it('does not flag non-link text that says "click here"', () => {
    expect(checkLinks(doc([para('click here')]))).toHaveLength(0);
  });

  it('flags a long raw URL shown as the link text', () => {
    const url = 'https://example.org/very/long/path/to/some/resource?with=query&params=1';
    const p = para([run(url, { linkUrl: url })]);
    const issues = checkLinks(doc([p]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.title).toContain('web address');
  });

  it('allows a short raw URL as link text', () => {
    const p = para([run('https://a11y.gov', { linkUrl: 'https://a11y.gov' })]);
    expect(checkLinks(doc([p]))).toHaveLength(0);
  });

  it('flags a link whose text is empty', () => {
    const p = para([run('  ', { linkUrl: 'https://example.org' })]);
    const issues = checkLinks(doc([p]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.title).toContain('no text');
  });

  it('merges adjacent runs of the same link before judging', () => {
    // "read" + " more" split across two styled runs of one link → one vague-link issue.
    const p = para([
      run('read', { linkUrl: 'https://example.org' }),
      run(' more', { linkUrl: 'https://example.org', bold: true }),
    ]);
    const issues = checkLinks(doc([p]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.fix?.currentValue).toBe('read more');
  });

  it('treats adjacent different-URL links separately', () => {
    const p = para([
      run('here', { linkUrl: 'https://a.example' }),
      run('here', { linkUrl: 'https://b.example' }),
    ]);
    expect(checkLinks(doc([p]))).toHaveLength(2);
  });
});
