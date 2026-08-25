/**
 * CIPC e-Services driver — stage mode. Uses the firm's customer code + password from env
 * (CIPC_CUSTOMER_CODE / CIPC_PASSWORD); a job may override with client credentials labelled
 * "cipc customer code" / "cipc password".
 *
 * ⚠ Selectors are unverified against a live session (see efiling.ts). Every step hands off on a
 * missing selector. The annual-return flow stops at the fee/summary screen; the final "Submit"
 * is only pressed after Kevin's decision.
 */
import type { PortalDriver, ProcedureContext } from '../types.js';
import { bailOnCaptcha, click, fill, firstVisible, textOf } from './helpers.js';

const LOGIN_URL = 'https://eservices.cipc.co.za/Login.aspx';

async function ensureLoggedIn(ctx: ProcedureContext) {
  const { page } = ctx;
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await bailOnCaptcha(ctx);
  const loggedIn = await page.locator('text=/Logout|Transact|Customer Balance/i').first().isVisible({ timeout: 4000 }).catch(() => false);
  if (loggedIn) { await ctx.log('Existing CIPC session reused'); return; }
  const code = ctx.credential('customer code') || process.env.CIPC_CUSTOMER_CODE;
  const password = ctx.credential('cipc password') || process.env.CIPC_PASSWORD;
  if (!code || !password) ctx.handoff('No CIPC customer code/password available (set CIPC_CUSTOMER_CODE / CIPC_PASSWORD on the worker).');
  await fill(ctx, ['input[id*="CustomerCode" i]', 'input[name*="customer" i]', 'input[placeholder*="Customer" i]'], code!, 'CIPC customer code');
  await fill(ctx, ['input[type="password"]'], password!, 'CIPC password');
  await click(ctx, ['input[type="submit"][value*="Login" i]', 'button:has-text("Login")', 'button[type="submit"]'], 'Login');
  await page.waitForLoadState('networkidle').catch(() => {});
  await bailOnCaptcha(ctx);
  const err = await textOf(page, ['.error, .alert-danger, [id*="lblError" i]', 'text=/invalid|incorrect|locked/i']);
  if (err.trim()) ctx.handoff(`CIPC login failed: ${err.trim().slice(0, 200)}`);
  await firstVisible(ctx, ['text=/Logout|Transact|Customer Balance/i'], 'CIPC home', 30_000);
  await ctx.screenshot('logged_in');
}

export const cipcDriver: PortalDriver = {
  id: 'cipc',
  credentialLabels: { username: ['cipc customer code'], password: ['cipc password'] },
  login: ensureLoggedIn,
  procedures: {
    smokeLogin: async (ctx) => { await ctx.screenshot('health'); return { notes: ['login ok'] }; },
    fileAnnualReturn: async (ctx, input) => {
      const { page } = ctx;
      const reg = String(input.registrationNumber || '').replace(/\s+/g, '');
      if (!reg) ctx.handoff('No registration number supplied.');
      await click(ctx, ['a:has-text("Transact")', 'text=/Transact/i'], 'Transact menu');
      await click(ctx, ['a:has-text("Annual Returns")', 'text=/File Annual Returns?/i'], 'Annual Returns');
      await fill(ctx, ['input[id*="EnterpriseNumber" i]', 'input[name*="enterprise" i]', 'input[placeholder*="Enterprise" i]'], reg, 'enterprise number');
      await click(ctx, ['input[type="submit"][value*="Validate" i]', 'button:has-text("Validate")', 'button:has-text("Search")'], 'Validate');
      await page.waitForLoadState('networkidle').catch(() => {});
      await ctx.screenshot('enterprise_found');
      const status = await textOf(page, ['text=/In Business|Deregistration|Final Deregistration/i']);
      if (/deregistration/i.test(status)) ctx.handoff(`Enterprise status is "${status.trim()}" — annual return cannot be filed; consider reinstatement.`);

      // Outstanding years are listed; we type the turnover per year from input.turnoverByYear
      // (string "2024: 850000; 2025: 900000" or object). Never a default figure.
      const raw = input.turnoverByYear;
      const byYear: Record<string, string> = typeof raw === 'string'
        ? Object.fromEntries(raw.split(/[;,\n]/).map(s => s.split(':').map(x => x.trim())).filter(p => p.length === 2) as [string, string][])
        : (raw || {});
      if (!Object.keys(byYear).length) ctx.handoff('No turnover figures supplied per year.');
      const rows = page.locator('table tr:has(input)');
      const n = await rows.count().catch(() => 0);
      const sheet: { label: string; value: string }[] = [{ label: 'Enterprise', value: reg }];
      for (let i = 0; i < n; i++) {
        const rowText = (await rows.nth(i).textContent().catch(() => '')) || '';
        const year = rowText.match(/20\d{2}/)?.[0];
        const inp = rows.nth(i).locator('input[type="text"]').first();
        if (!year || !(await inp.isVisible().catch(() => false))) continue;
        const t = byYear[year];
        if (!t) ctx.handoff(`Annual return year ${year} is outstanding but no turnover was supplied for it.`, sheet);
        await inp.fill(String(t).replace(/[^\d.]/g, ''));
        sheet.push({ label: `Turnover ${year}`, value: String(t) });
        await ctx.log(`Turnover ${year} entered`);
      }
      if (sheet.length === 1) ctx.handoff('No outstanding annual-return rows were found to fill.', sheet);
      const cont = page.locator('input[type="submit"][value*="Continue" i], button:has-text("Continue"), button:has-text("Calculate")').first();
      if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForLoadState('networkidle').catch(() => {}); }
      const fee = await textOf(page, ['text=/Total.*R\\s?[\\d,. ]+/i']);
      if (fee) sheet.push({ label: 'Fee shown', value: fee.trim().slice(0, 80) });
      const shot = await ctx.screenshot('review_before_submit');
      const decision = await ctx.stage(sheet, [shot]);
      if (decision === 'abandon') { const { AbandonedError } = await import('../types.js'); throw new AbandonedError(); }
      await click(ctx, ['input[type="submit"][value*="Submit" i]', 'button:has-text("Submit")', 'button:has-text("File")'], 'Submit');
      await page.waitForLoadState('networkidle').catch(() => {});
      const done = await ctx.screenshot('submitted');
      const ref = (await textOf(page, ['text=/(tracking|reference) (number|no)[:\\s]*[A-Z0-9-]+/i'])).match(/[A-Z0-9-]{6,}/)?.[0];
      return { reference: ref, notes: [done.url] };
    },
    fileCoR39: async (ctx) => { ctx.handoff('CoR39 director amendments are prepared but not yet driven automatically — file by hand with the values below.'); return {}; },
    changeAddress: async (ctx) => { ctx.handoff('Address changes (CoR21.1) are prepared but not yet driven automatically — file by hand with the values below.'); return {}; },
    reserveName: async (ctx) => { ctx.handoff('Name reservations are prepared but not yet driven automatically — file by hand with the values below.'); return {}; },
  },
};
