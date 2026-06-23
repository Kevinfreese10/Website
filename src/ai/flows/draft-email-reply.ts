'use server';
/**
 * @fileOverview An AI agent for drafting professional email replies.
 *
 * - draftEmailReply - A function that generates a professional reply draft for an email.
 * - DraftEmailReplyInput - The input type for the draftEmailReply function.
 * - DraftEmailReplyOutput - The return type for the draftEmailReply function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';

const DraftEmailReplyInputSchema = z.object({
  subject: z.string().describe('The subject line of the original email.'),
  body: z.string().describe('The full body text of the original email being replied to.'),
  senderName: z.string().describe('The display name of the original sender.'),
  category: z.string().describe('The AI-detected category of the email (e.g. client_query, complaint, etc.).'),
  instructions: z.string().optional().describe('Optional admin instructions for the reply (e.g. "tell them the deadline is Friday", "ask for their tax number").'),
  knowledgeContext: z.string().optional().describe('Optional knowledge context fetched from Firestore.'),
});
export type DraftEmailReplyInput = z.infer<typeof DraftEmailReplyInputSchema>;

const DraftEmailReplyOutputSchema = z.object({
  replySubject: z.string().describe('The subject line for the reply email.'),
  replyBody: z.string().describe('The full body text of the drafted reply.'),
});
export type DraftEmailReplyOutput = z.infer<typeof DraftEmailReplyOutputSchema>;

export type DraftEmailReplyResult = {
  success: boolean;
  data?: DraftEmailReplyOutput;
  error?: string;
};

export async function draftEmailReply(
  input: Omit<DraftEmailReplyInput, 'knowledgeContext'> & { instructions?: string }
): Promise<DraftEmailReplyResult> {
  try {
    console.log("[draftEmailReply] Starting email reply drafting flow...");
    console.log("[draftEmailReply] GEMINI_API_KEY exists in env:", !!process.env.GEMINI_API_KEY);
    
    // 1. Fetch relevant services and FAQs from Firestore via Admin SDK
    let knowledgeContext = '';
    try {
      const adminDb = getAdminDb();
      
      const servicesSnap = await adminDb.collection('services').get();
      const servicesText = servicesSnap.docs.map(doc => {
        const d = doc.data();
        return `- Service: ${d.title}\n  Price: R${d.price}\n  Turnaround: ${d.turnaroundTime || 'N/A'}\n  Prerequisites: ${(d.clientRequirements || []).join(', ')}`;
      }).join('\n\n');

      const kbSnap = await adminDb.collection('knowledgeBase').get();
      const kbText = kbSnap.docs.map(doc => {
        const d = doc.data();
        return `- Q: ${d.question}\n  A: ${d.answer || d.textValue || ''}`;
      }).join('\n\n');

      knowledgeContext = `
RELEVANT SERVICES & PRICING:
${servicesText}

FIRM KNOWLEDGE BASE & OFFICE POLICIES:
${kbText}
      `.trim();
    } catch (dbErr: any) {
      console.warn("[draftEmailReply] Failed to fetch Firestore context:", dbErr.message);
    }

    const res = await draftEmailReplyFlow({
      ...input,
      knowledgeContext,
    });
    console.log("[draftEmailReply] Email reply drafting flow successfully completed.");
    return { success: true, data: res };
  } catch (error: any) {
    console.error("[draftEmailReply] RUNTIME ERROR during email reply drafting:");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    return { success: false, error: error.message || 'An unknown error occurred during email reply drafting.' };
  }
}

const prompt = ai.definePrompt({
  name: 'draftEmailReplyPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: DraftEmailReplyInputSchema },
  output: { schema: DraftEmailReplyOutputSchema },
  prompt: `You are a professional email reply drafter for a South African accounting firm called "Tax Shop / My Accountant".

  **Your Task:**
  Draft a professional reply to the following email. If the email contains queries about services, pricing, office hours, or refund policies, consult the **Knowledge Context** below to draft an accurate response.

  **Tone & Style Rules:**
  1. Use a professional yet warm and friendly tone, written in South African English.
  2. Start with "Hi {{{senderName}}}," followed by a blank line (exactly two newlines). Example: "Hi Kevin,\n\nThank you for..."
  3. Keep the reply concise and to the point.
  4. ALWAYS leave a blank line (exactly two newlines) between paragraphs or distinct sections.
  5. Sign off with a blank line (exactly two newlines) before "Kind regards," and a single newline before "My Accountant Team" (i.e., "\n\nKind regards,\nMy Accountant Team").
  6. If the email is a complaint, be empathetic and assure the sender their concern is being addressed.
  7. If it's a document submission, acknowledge receipt.
  8. If it's a query, provide a helpful response or let them know you'll follow up.
  9. For the reply subject, prefix with "Re: " followed by the original subject (unless it already starts with "Re:").
  10. Formatting lists: Format all lists of requirements, prerequisites, pricing, or key steps using clean bullet points (use "- " followed by a space) instead of long paragraphs. Always insert a blank line (two newlines) before starting the list, and after the end of the list. Ensure each item starts on a new line.
  11. CRITICAL: Never concatenate punctuation directly with the next word. Always ensure there is a single space after every comma (,), period (.), colon (:), and semi-colon (;). For example, write "service. The cost", NOT "service.The cost". Write "Freese, thank you", NOT "Freese,thank you".
  12. CRITICAL: Always ensure there is a space or a newline before and after any link/URL. Never concatenate text directly to a URL (e.g. write "...service here: https://url\n\nHere are...", NOT "...service here: https://urlHere are...").

  {{#if knowledgeContext}}
  **Knowledge Context (Use this to answer queries accurately):**
  {{{knowledgeContext}}}
  {{/if}}

  **Original Email Category:** {{{category}}}

  **Original Email:**
  From: {{{senderName}}}
  Subject: {{{subject}}}
  Body:
  {{{body}}}

  {{#if instructions}}
  **Admin Instructions for this reply:**
  {{{instructions}}}
  {{/if}}
  `,
});

const draftEmailReplyFlow = ai.defineFlow(
  {
    name: 'draftEmailReplyFlow',
    inputSchema: DraftEmailReplyInputSchema,
    outputSchema: DraftEmailReplyOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
