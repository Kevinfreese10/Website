/**
 * Client-message drafting for the AI order agent. Kevin's voice: plain South African English,
 * direct, names the document and why, no deadline threats, never promises a shorter turnaround
 * than the catalogue. Output is always a PROPOSAL; nothing here is sent.
 */

import type { Order, OrderServiceSnapshot } from '@/lib/types';

const VOICE = `You write short client messages for My Accountant, a South African accounting practice run by Kevin Freese.
Voice: plain South African English, warm but direct, no filler, no corporate phrasing, no exclamation marks, no emojis.
Never threaten deadlines or consequences. Never promise a turnaround. Never mention AI or automation.
Address the client by first name. Sign off "Kind regards\\nMy Accountant".`;

export async function draftChaseMessage(args: { order: Order; service: OrderServiceSnapshot; missing: string[]; instructions?: string }): Promise<string> {
  const { ai } = await import('@/ai/genkit');
  const first = (args.order.endCustomerName || args.order.customerName || '').trim().split(/\s+/)[0] || 'there';
  const { text } = await ai.generate({
    config: { temperature: 0.3 },
    prompt: `${VOICE}

Write a message to ${first} about their order for "${args.service.title}". We still need these items before we can continue:
${args.missing.map(m => `- ${m}`).join('\n')}

For each item, add one short clause on why it is needed or what a valid one looks like, in plain words.
${args.instructions ? `Playbook notes to respect: ${args.instructions}` : ''}
Tell them they can upload on their order page. Keep it under 140 words. Return only the message text.`,
  });
  return (text || '').trim();
}

export async function draftRejectionMessage(args: { order: Order; requirementLabel: string; fix: string }): Promise<string> {
  const { ai } = await import('@/ai/genkit');
  const first = (args.order.endCustomerName || args.order.customerName || '').trim().split(/\s+/)[0] || 'there';
  const { text } = await ai.generate({
    config: { temperature: 0.3 },
    prompt: `${VOICE}

Write a message to ${first}. The document they uploaded for "${args.requirementLabel}" can't be used. The reason, in our words: ${args.fix}
Explain the problem in one or two sentences and exactly what to upload instead. Under 90 words. Return only the message text.`,
  });
  return (text || '').trim();
}
