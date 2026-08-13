'use server';
/**
 * @fileOverview An AI agent for triaging and categorizing incoming emails.
 *
 * - triageEmail - A function that categorizes an email by type, priority, and sentiment.
 * - TriageEmailInput - The input type for the triageEmail function.
 * - TriageEmailOutput - The return type for the triageEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TriageEmailInputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The full body text of the email.'),
  senderEmail: z.string().describe('The email address of the sender.'),
  senderName: z.string().describe('The display name of the sender.'),
});
export type TriageEmailInput = z.infer<typeof TriageEmailInputSchema>;

const TriageEmailOutputSchema = z.object({
  category: z.enum([
    'client_query',
    'document_submission',
    'payment_related',
    'sars_correspondence',
    'new_client_inquiry',
    'complaint',
    'partner_communication',
    'spam_marketing',
    'internal',
    'urgent_deadline',
    'other',
  ]).describe('The classified category of the email.'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).describe('The priority level of the email.'),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'angry']).describe('The detected sentiment of the email.'),
  reasoning: z.string().describe('A brief explanation of why the email was classified this way.'),
});
export type TriageEmailOutput = z.infer<typeof TriageEmailOutputSchema>;

export type TriageEmailResult = {
  success: boolean;
  data?: TriageEmailOutput;
  error?: string;
};

export async function triageEmail(
  input: TriageEmailInput
): Promise<TriageEmailResult> {
  try {
    console.log("[triageEmail] Starting email triage flow...");
    console.log("[triageEmail] GEMINI_API_KEY exists in env:", !!process.env.GEMINI_API_KEY);
    const res = await triageEmailFlow(input);
    console.log("[triageEmail] Email triage flow successfully completed.");
    return { success: true, data: res };
  } catch (error: any) {
    console.error("[triageEmail] RUNTIME ERROR during email triage:");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    return { success: false, error: error.message || 'An unknown error occurred during email triage.' };
  }
}

const prompt = ai.definePrompt({
  name: 'triageEmailPrompt',
  model: 'googleai/gemini-3.5-flash-lite',
  input: { schema: TriageEmailInputSchema },
  output: { schema: TriageEmailOutputSchema },
  prompt: `You are an expert email triage assistant for a South African accounting firm called "Tax Shop / My Accountant".

  **Firm Context:**
  This firm handles SARS (South African Revenue Service) correspondence, payroll processing, individual and company tax returns, company registrations (CIPC), bookkeeping, and general accounting services. Their clients are primarily South African businesses and individuals.

  **Your Task:**
  Analyze the following email and classify it by category, priority, and sentiment.

  **Priority Rules:**
  - Emails from @sars.gov.za domains should be classified as 'sars_correspondence' and given at least 'high' priority.
  - Complaints should always be 'high' or 'urgent' priority.
  - Document submissions are typically 'medium' priority.
  - Spam and marketing emails are always 'low' priority.
  - Emails mentioning imminent deadlines (within a week) should be 'urgent'.
  - New client inquiries are 'high' priority.
  - Payment-related emails are 'high' priority.

  **Email Details:**
  From: {{{senderName}}} <{{{senderEmail}}}>
  Subject: {{{subject}}}
  Body:
  {{{body}}}
  `,
});

const triageEmailFlow = ai.defineFlow(
  {
    name: 'triageEmailFlow',
    inputSchema: TriageEmailInputSchema,
    outputSchema: TriageEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
