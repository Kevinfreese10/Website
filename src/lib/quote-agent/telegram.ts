/**
 * Minimal Telegram Bot API client for the quote agent. HTML parse mode with escaping, so text taken
 * from client emails can't break formatting or inject links. If Telegram isn't configured the calls
 * are no-ops that return false (the twice-daily email digest still reaches Kevin).
 */
import { getTelegramConfig, PORTAL_URL } from './config';
import { escapeHtml } from './filters';

export const tgEscape = (s: string) => escapeHtml(s).replace(/&#39;/g, "'");

type Button = { text: string; callback_data?: string; url?: string };

async function call(method: string, body: Record<string, unknown>): Promise<any> {
  const cfg = getTelegramConfig();
  if (!cfg) return null;
  const res = await fetch(`https://api.telegram.org/bot${cfg.token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!json?.ok) console.error(`[quote-agent] Telegram ${method} failed:`, json?.description || res.status);
  return json?.result ?? null;
}

export async function sendTelegram(html: string, buttons?: Button[][], silent = false): Promise<number | null> {
  const cfg = getTelegramConfig();
  if (!cfg) return null;
  const result = await call('sendMessage', {
    chat_id: cfg.chatId,
    text: html.slice(0, 4000),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    disable_notification: silent,
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
  return result?.message_id ?? null;
}

export async function editTelegram(messageId: number, html: string): Promise<void> {
  const cfg = getTelegramConfig();
  if (!cfg) return;
  await call('editMessageText', { chat_id: cfg.chatId, message_id: messageId, text: html.slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: true });
}

export async function answerCallback(callbackQueryId: string, text: string): Promise<void> {
  await call('answerCallbackQuery', { callback_query_id: callbackQueryId, text: text.slice(0, 190) });
}

/** The three buttons on every review alert (decision 6). */
export function draftButtons(draftId: string): Button[][] {
  return [[
    { text: '✅ Send to client', callback_data: `qa:send:${draftId}` },
    { text: '🗑 Discard', callback_data: `qa:discard:${draftId}` },
  ], [
    { text: '✏️ Open in portal', url: `${PORTAL_URL}/admin/quote-drafts?id=${encodeURIComponent(draftId)}` },
  ]];
}
