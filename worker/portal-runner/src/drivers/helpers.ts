import type { Page } from 'playwright';
import type { ProcedureContext } from '../types.js';

/**
 * Try several selectors in order; the first that appears within `timeoutMs` wins.
 * If none appear, hand the job off with a precise reason. Portals change their DOM without
 * notice; this is how a driver fails *closed* instead of clicking the wrong thing.
 */
export async function firstVisible(ctx: ProcedureContext, selectors: string[], what: string, timeoutMs = 20_000) {
  const { page } = ctx;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible().catch(() => false)) return loc;
    }
    await page.waitForTimeout(500);
  }
  await ctx.screenshot(`missing_${what.replace(/\s+/g, '_')}`);
  ctx.handoff(`Could not find ${what} on ${page.url()} — the portal layout may have changed.`);
}

export async function fill(ctx: ProcedureContext, selectors: string[], value: string, what: string) {
  const loc = await firstVisible(ctx, selectors, what);
  await loc.fill(value);
  await ctx.log(`Filled ${what}`);
}

export async function click(ctx: ProcedureContext, selectors: string[], what: string) {
  const loc = await firstVisible(ctx, selectors, what);
  await loc.click();
  await ctx.log(`Clicked ${what}`);
}

export async function textOf(page: Page, selectors: string[]): Promise<string> {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible().catch(() => false)) return (await loc.textContent().catch(() => '')) || '';
  }
  return '';
}

/** Detects a CAPTCHA and hands off — the worker never tries to solve one. */
export async function bailOnCaptcha(ctx: ProcedureContext) {
  const { page } = ctx;
  const captcha = await page.locator('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], [class*="captcha"], #captcha').first().isVisible().catch(() => false);
  if (captcha) { await ctx.screenshot('captcha'); ctx.handoff('The portal is showing a CAPTCHA. Complete this filing by hand (values below).'); }
}

/** Looks for an OTP prompt and relays it if present. Returns true when a code was entered. */
export async function relayOtpIfPrompted(ctx: ProcedureContext, opts: { inputSelectors: string[]; submitSelectors: string[]; promptSelectors: string[]; sentToSelectors?: string[] }): Promise<boolean> {
  const { page } = ctx;
  const prompted = await Promise.any(opts.promptSelectors.map(s => page.locator(s).first().waitFor({ state: 'visible', timeout: 8000 }).then(() => true))).catch(() => false);
  if (!prompted) return false;
  const sentTo = opts.sentToSelectors ? await textOf(page, opts.sentToSelectors) : '';
  await ctx.screenshot('otp_prompt');
  const code = await ctx.requestOtp(sentTo.trim() || undefined);
  await fill(ctx, opts.inputSelectors, code, 'OTP field');
  await click(ctx, opts.submitSelectors, 'OTP submit');
  await page.waitForLoadState('networkidle').catch(() => {});
  return true;
}
