import { describe, expect, it } from 'vitest';
import { detectAutomation, extractForwardedInfo, findContentProblems, isObviousSpam, isSenderAuthenticated, parseLead, htmlToText } from '../filters';

const human = { fromAddress: 'jane@acme.co.za', subject: 'Quote for company registration', headers: {} };

describe('detectAutomation (loop guard, decision 10d)', () => {
  it('drops our own sent mail', () => {
    expect(detectAutomation({ ...human, fromAddress: 'info@myacc.co.za' }).kind).toBe('own');
    expect(detectAutomation({ ...human, fromAddress: 'ai@myacc.co.za' }).kind).toBe('own');
  });
  it('does NOT drop website contact forms from no_reply@', () => {
    expect(detectAutomation({ ...human, fromAddress: 'no_reply@myacc.co.za' }).kind).toBe('human');
  });
  it('detects bounces', () => {
    expect(detectAutomation({ ...human, fromAddress: 'MAILER-DAEMON@mail.example.com' }).kind).toBe('bounce');
    expect(detectAutomation({ ...human, fromAddress: 'postmaster@example.com' }).kind).toBe('bounce');
    expect(detectAutomation({ ...human, headers: { returnPath: '<>' } }).kind).toBe('bounce');
    expect(detectAutomation({ ...human, subject: 'Undeliverable: Quotation MA-Q-1' }).kind).toBe('bounce');
  });
  it('detects auto-replies and bulk mail', () => {
    expect(detectAutomation({ ...human, headers: { autoSubmitted: 'auto-replied' } }).kind).toBe('automated');
    expect(detectAutomation({ ...human, headers: { autoSubmitted: 'no' } }).kind).toBe('human');
    expect(detectAutomation({ ...human, headers: { precedence: 'bulk' } }).kind).toBe('automated');
    expect(detectAutomation({ ...human, headers: { listUnsubscribe: '<mailto:x>' } }).kind).toBe('automated');
    expect(detectAutomation({ ...human, subject: 'Out of Office: back Monday' }).kind).toBe('automated');
    expect(detectAutomation({ ...human, subject: 'Automatic reply: Quotation' }).kind).toBe('automated');
  });
  it('a human called "postmasters-r-us" is not a bounce', () => {
    expect(detectAutomation({ ...human, fromAddress: 'postmasterpieces@art.co.za' }).kind).toBe('human');
  });
});

describe('isObviousSpam', () => {
  it('flags SEO pitches, passes real requests', () => {
    expect(isObviousSpam('x@seo.com', 'Get on the first page of Google', '')).toBe(true);
    expect(isObviousSpam('jane@acme.co.za', 'VAT registration', 'Please quote for VAT registration')).toBe(false);
  });
});

describe('isSenderAuthenticated', () => {
  it('requires a pass aligned to the domain', () => {
    expect(isSenderAuthenticated('mx; dkim=pass header.d=thinkestry.co.za; spf=pass', 'thinkestry.co.za')).toBe(true);
    expect(isSenderAuthenticated('mx; dkim=pass header.d=evil.com; spf=fail', 'thinkestry.co.za')).toBe(false);
    expect(isSenderAuthenticated('', 'thinkestry.co.za')).toBe(false);
  });
});

describe('parseLead / extractForwardedInfo', () => {
  it('parses the website contact form', () => {
    const l = parseLead('Name: Jane Dlamini\nEmail: jane@acme.co.za.\nCell Number: 082 000 0000\nMessage: Please quote CIDB registration');
    expect(l).toMatchObject({ name: 'Jane Dlamini', email: 'jane@acme.co.za', phone: '082 000 0000', message: 'Please quote CIDB registration' });
  });
  it('splits Kevin instructions from the forwarded message', () => {
    const r = extractForwardedInfo('Please quote this one\n\n-----Original Message-----\nFrom: Jane <jane@acme.co.za>\nHi');
    expect(r.kevinInstructions).toBe('Please quote this one');
    expect(r.remainingText.startsWith('-----Original Message-----')).toBe(true);
  });
});

describe('findContentProblems', () => {
  it('blocks WhatsApp and placeholders in the email', () => {
    expect(findContentProblems('<p>WhatsApp us</p>', [])).toHaveLength(1);
    expect(findContentProblems('<p>Hi {{NAME}}</p>', [])).toHaveLength(1);
  });
  it('blocks prices, links and credential requests in AI-written text only', () => {
    expect(findContentProblems('<p>R 1,500.00</p>', ['Thanks for your enquiry.'])).toEqual([]);
    expect(findContentProblems('', ['It will cost R1500'])).toContain('AI-written text contains a price or amount.');
    expect(findContentProblems('', ['That is 12,500.00 all in'])).toContain('AI-written text contains a price or amount.');
    expect(findContentProblems('', ['Pay at https://evil.example'])).toContain('AI-written text contains a link or email address.');
    expect(findContentProblems('', ['Email me at a@b.co'])).toContain('AI-written text contains a link or email address.');
    expect(findContentProblems('', ['Please send your eFiling login'])).toContain('AI-written text asks for credentials.');
  });
});

describe('htmlToText', () => {
  it('produces readable text with links', () => {
    expect(htmlToText('<p>Hi &amp; welcome</p><a href="https://x.co">Site</a>')).toBe('Hi & welcome\nSite (https://x.co)');
  });
});
