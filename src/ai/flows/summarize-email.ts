'use server';
/**
 * @fileOverview An AI agent for summarizing incoming emails.
 *
 * - summarizeEmail - A function that generates a concise summary and extracts key information from an email.
 * - SummarizeEmailInput - The input type for the summarizeEmail function.
 * - SummarizeEmailOutput - The return type for the summarizeEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeEmailInputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The full body text of the email.'),
  senderName: z.string().describe('The display name of the sender.'),
});
export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

const SummarizeEmailOutputSchema = z.object({
  summary: z.string().describe('A concise 2-3 sentence summary of the email content.'),
  keyPoints: z.array(z.string()).describe('Bullet points of the key items or requests in the email.'),
  mentionedDeadlines: z.array(z.string()).describe('Any dates or deadlines mentioned in the email (e.g. "15 June 2025", "end of month").'),
  mentionedAmounts: z.array(z.string()).describe('Any monetary amounts mentioned in the email (e.g. "R5,000", "R1,200.50").'),
  referenceNumbers: z.array(z.string()).describe('Any reference numbers, case numbers, or tax reference numbers mentioned (e.g. SARS case numbers, invoice numbers).'),
});
export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;

export type SummarizeEmailResult = {
  success: boolean;
  data?: SummarizeEmailOutput;
  error?: string;
};

export async function summarizeEmail(
  input: SummarizeEmailInput
): Promise<SummarizeEmailResult> {
  try {
    console.log("[summarizeEmail] Starting email summarization flow...");
    console.log("[summarizeEmail] GEMINI_API_KEY exists in env:", !!process.env.GEMINI_API_KEY);
    const res = await summarizeEmailFlow(input);
    console.log("[summarizeEmail] Email summarization flow successfully completed.");
    return { success: true, data: res };
  } catch (error: any) {
    console.error("[summarizeEmail] RUNTIME ERROR during email summarization:");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    return { success: false, error: error.message || 'An unknown error occurred during email summarization.' };
  }
}

const prompt = ai.definePrompt({
  name: 'summarizeEmailPrompt',
  model: 'googleai/gemini-3.5-flash-lite',
  input: { schema: SummarizeEmailInputSchema },
  output: { schema: SummarizeEmailOutputSchema },
  prompt: `You are a professional email summarizer for a South African accounting firm called "Tax Shop / My Accountant".

  **Your Task:**
  Analyze the following email and produce a concise summary along with structured extracted data.

  **Instructions:**
  1.  Write a clear 2-3 sentence summary capturing the main purpose and any required actions.
  2.  Extract key points as bullet points — focus on actionable items, requests, or important information.
  3.  Identify any deadlines or dates mentioned (tax filing dates, meeting dates, payment due dates, etc.).
  4.  Extract any monetary amounts mentioned (Rands, fees, payments, refunds, etc.).
  5.  Extract any reference numbers (SARS reference numbers, invoice numbers, case numbers, tax numbers, company registration numbers, etc.).
  6.  If an array has no items, return an empty array.

  **Email Details:**
  From: {{{senderName}}}
  Subject: {{{subject}}}
  Body:
  {{{body}}}
  `,
});

const summarizeEmailFlow = ai.defineFlow(
  {
    name: 'summarizeEmailFlow',
    inputSchema: SummarizeEmailInputSchema,
    outputSchema: SummarizeEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
