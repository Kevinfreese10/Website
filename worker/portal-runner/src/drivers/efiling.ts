/**
 * SARS eFiling driver — stage mode.
 *
 * ⚠ Selectors below were written against the public eFiling login and the general layout of the
 * Returns menus; they have NOT been verified against a live session from this environment.
 * Every step degrades to a hand-off (with screenshots) when a selector is missing, so a stale
 * selector costs a manual filing, never a wrong one. Run `--health` nightly.
 */
import type { PortalDriver, ProcedureContext } from '../types.js';
import { bailOnCaptcha, click, fill, firstVisible, relayOtpIfPrompted, textOf } from './helpers.js';

const LOGIN_URL = 'https://secure.sarsefiling.co.za/app/login';

async function ensureLoggedIn(ctx: ProcedureContext) {
  const { page } = ctx;
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await bailOnCaptcha(ctx);
  // Already logged in via persistent profile?
  const dashboard = await page.locator('text=/Tax Compliance Status|Returns Issued|My Profile/i').first().isVisible({ timeout: 4000 }).catch(() => false);
  if (dashboard) { await ctx.log('Existing eFiling session reused'); return; }

  const username = ctx.credential('username') || ctx.credential('user') || process.env.EFILING_USERNAME;
  const password = ctx.credential('password') || process.env.EFILING_PASSWORD;
  if (!username || !password) ctx.handoff('No eFiling username/password available for this job.');

  await fill(ctx, ['input[name="username"]', '#username', 'input[placeholder*="sername" i]'], username!, 'eFiling username');
  await click(ctx, ['button:has-text("Next")', 'button[type="submit"]'], 'Next');
  await fill(ctx, ['input[name="password"]', '#password', 'input[type="password"]'], password!, 'eFiling password');
  await click(ctx, ['button:has-text("Login")', 'button:has-text("Log in")', 'button[type="submit"]'], 'Login');
  await page.waitForLoadState('networkidle').catch(() => {});
  await bailOnCaptcha(ctx);

  await relayOtpIfPrompted(ctx, {
    promptSelectors: ['text=/one[- ]time pin|OTP|verification code/i'],
    sentToSelectors: ['text=/sent to .*/i'],
    inputSelectors: ['input[name*="otp" i]', 'input[placeholder*="OTP" i]', 'input[autocomplete="one-time-code"]', 'input[type="tel"]'],
    submitSelectors: ['button:has-text("Submit")', 'button:has-text("Verify")', 'button:has-text("Continue")', 'button[type="submit"]'],
  });

  const err = await textOf(page, ['.alert-danger', '[role="alert"]', 'text=/invalid|incorrect|locked/i']);
  if (err) ctx.handoff(`eFiling login failed: ${err.trim().slice(0, 200)}`);
  await firstVisible(ctx, ['text=/Returns|Tax Compliance Status|My Profile/i'], 'eFiling dashboard', 30_000);
  await ctx.screenshot('logged_in');
}

/** Select the taxpayer when the profile has several (practitioner portfolios). */
async function selectTaxpayer(ctx: ProcedureContext, name?: string) {
  if (!name) return;
  const { page } = ctx;
  const switcher = page.locator('text=/Taxpayer|Portfolio/i').first();
  if (await switcher.isVisible().catch(() => false)) {
    await switcher.click().catch(() => {});
    const opt = page.locator(`text=${JSON.stringify(name)}`).first();
    if (await opt.isVisible({ timeout: 5000 }).catch(() => false)) { await opt.click(); await ctx.log(`Selected taxpayer ${name}`); }
    else await ctx.log(`Taxpayer switcher present but "${name}" not listed — continuing on the current profile`);
  }
}

const nilReturn = (type: 'VAT201' | 'EMP201' | 'IRP6' | 'ITR14') => async (ctx: ProcedureContext, input: Record<string, any>) => {
  const { page } = ctx;
  await selectTaxpayer(ctx, input.entityName);
  await click(ctx, ['a:has-text("Returns")', 'nav >> text=Returns'], 'Returns menu');
  await click(ctx, [`a:has-text("${type}")`, `text=${type}`], `${type} menu`);
  await click(ctx, ['a:has-text("Returns Issued")', 'text=/Returns Issued/i'], 'Returns Issued');
  const period = String(input.taxPeriod || input.taxYear || '');
  const row = page.locator(`tr:has-text("${period}")`).first();
  if (!(await row.isVisible({ timeout: 15_000 }).catch(() => false))) { await ctx.screenshot('period_not_found'); ctx.handoff(`No issued ${type} for period "${period}" found on the Returns Issued list. Check the period or request the return first.`); }
  await row.locator('a, button').first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await ctx.screenshot('return_opened');

  // Nil: leave every amount field at zero. We verify nothing is pre-populated, we do not type figures.
  const amounts = page.locator('input[type="text"][name*="amount" i], input[inputmode="decimal"]');
  const n = await amounts.count().catch(() => 0);
  const nonZero: string[] = [];
  for (let i = 0; i < n; i++) { const v = (await amounts.nth(i).inputValue().catch(() => '')).replace(/[^\d.]/g, ''); if (v && Number(v) !== 0) nonZero.push(v); }
  if (nonZero.length) { await ctx.screenshot('prepopulated'); ctx.handoff(`${type} for ${period} has pre-populated non-zero amounts (${nonZero.slice(0, 3).join(', ')}). A nil return may be wrong — review by hand.`); }

  // Reach the declaration/summary screen but do NOT press File/Submit.
  const saveOrNext = page.locator('button:has-text("Save"), button:has-text("Next"), button:has-text("Calculate")').first();
  if (await saveOrNext.isVisible().catch(() => false)) { await saveOrNext.click(); await page.waitForLoadState('networkidle').catch(() => {}); }
  const summary = await ctx.screenshot('review_before_submit');
  const decision = await ctx.stage([{ label: 'Return', value: type }, { label: 'Period', value: period }, { label: 'Taxpayer', value: input.entityName || '(current profile)' }, { label: 'All amounts', value: '0.00' }], [summary]);
  if (decision === 'abandon') { const { AbandonedError } = await import('../types.js'); throw new AbandonedError(); }

  await click(ctx, ['button:has-text("File Return")', 'button:has-text("Submit")', 'button:has-text("File")'], 'File Return');
  const confirm = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
  if (await confirm.isVisible({ timeout: 5000 }).catch(() => false)) await confirm.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  const done = await ctx.screenshot('submitted');
  const ref = (await textOf(page, ['text=/reference (number|no)[:\\s]*[A-Z0-9-]+/i'])).match(/[A-Z0-9-]{6,}/)?.[0];
  return { reference: ref, notes: [`Screenshot: ${done.url}`] };
};

export const efilingDriver: PortalDriver = {
  id: 'efiling',
  credentialLabels: { username: ['efiling username', 'username'], password: ['efiling password', 'password'] },
  login: ensureLoggedIn,
  procedures: {
    smokeLogin: async (ctx) => { await ctx.screenshot('health'); return { notes: ['login ok'] }; },
    'submitReturn:VAT201': nilReturn('VAT201'),
    'submitReturn:EMP201': nilReturn('EMP201'),
    'submitReturn:IRP6': nilReturn('IRP6'),
    'submitReturn:ITR14': nilReturn('ITR14'),
    requestTCS: async (ctx, input) => {
      const { page } = ctx;
      await selectTaxpayer(ctx, input.entityName);
      await click(ctx, ['a:has-text("Tax Status")', 'text=/Tax Status/i'], 'Tax Status menu');
      await click(ctx, ['a:has-text("Tax Compliance Status Request")', 'text=/Compliance Status Request/i'], 'TCS Request');
      const purpose = String(input.purpose || 'good_standing').toLowerCase().includes('tender') ? 'Tender' : 'Good Standing';
      await click(ctx, [`label:has-text("${purpose}")`, `text=${purpose}`], `${purpose} option`);
      const shot = await ctx.screenshot('tcs_request_review');
      const decision = await ctx.stage([{ label: 'Request type', value: purpose }, { label: 'Taxpayer', value: input.entityName || '(current profile)' }], [shot]);
      if (decision === 'abandon') { const { AbandonedError } = await import('../types.js'); throw new AbandonedError(); }
      await click(ctx, ['button:has-text("Submit")', 'button:has-text("Request")'], 'Submit request');
      await page.waitForLoadState('networkidle').catch(() => {});
      await ctx.screenshot('tcs_submitted');
      const pin = (await textOf(page, ['text=/PIN[:\\s]*[A-Z0-9]{8,}/i'])).match(/[A-Z0-9]{8,}/)?.[0];
      return { reference: pin, notes: pin ? [`TCS PIN ${pin}`] : ['PIN not visible on confirmation screen — check the TCS dashboard'] };
    },
    verifyTcsPin: async (ctx, input) => {
      const { page } = ctx;
      await page.goto('https://secure.sarsefiling.co.za/app/tcs/verify', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await fill(ctx, ['input[name*="tax" i]', 'input[placeholder*="Tax" i]'], String(input.taxNumber || ''), 'tax reference');
      await fill(ctx, ['input[name*="pin" i]', 'input[placeholder*="PIN" i]'], String(input.tcsPin || ''), 'TCS PIN');
      await click(ctx, ['button:has-text("Verify")', 'button[type="submit"]'], 'Verify');
      await page.waitForLoadState('networkidle').catch(() => {});
      const shot = await ctx.screenshot('tcs_verification');
      const status = await textOf(page, ['text=/compliant|non-compliant/i']);
      return { notes: [`Status: ${status.trim() || 'unreadable'}`, shot.url] };
    },
  },
};
