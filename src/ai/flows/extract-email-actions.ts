'use server';
/**
 * @fileOverview An AI agent for extracting actionable items from emails.
 *
 * - extractEmailActions - A function that extracts action items and suggests tasks from an email.
 * - ExtractEmailActionsInput - The input type for the extractEmailActions function.
 * - ExtractEmailActionsOutput - The return type for the extractEmailActions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractEmailActionsInputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The full body text of the email.'),
  senderName: z.string().describe('The display name of the sender.'),
  senderEmail: z.string().describe('The email address of the sender.'),
});
export type ExtractEmailActionsInput = z.infer<typeof ExtractEmailActionsInputSchema>;

const ExtractEmailActionsOutputSchema = z.object({
  actionItems: z.array(z.object({
    description: z.string().describe('A clear description of the action item.'),
    priority: z.enum(['high', 'medium', 'low']).describe('The priority level of this action item.'),
    type: z.enum([
      'document_request',
      'follow_up',
      'deadline',
      'payment',
      'meeting',
      'other',
    ]).describe('The type/category of this action item.'),
    suggestedDueDate: z.string().describe('An ISO 8601 date string if a deadline is mentioned or can be inferred, otherwise an empty string.'),
  })).describe('A list of actionable items extracted from the email.'),
  suggestedTaskTitle: z.string().describe('A concise, descriptive title suitable for creating a task from this email.'),
  suggestedTaskDescription: z.string().describe('A detailed description suitable for creating a task, summarizing what needs to be done.'),
});
export type ExtractEmailActionsOutput = z.infer<typeof ExtractEmailActionsOutputSchema>;

export type ExtractEmailActionsResult = {
  success: boolean;
  data?: ExtractEmailActionsOutput;
  error?: string;
};

export async function extractEmailActions(
  input: ExtractEmailActionsInput
): Promise<ExtractEmailActionsResult> {
  try {
    console.log("[extractEmailActions] Starting email action extraction flow...");
    console.log("[extractEmailActions] GEMINI_API_KEY exists in env:", !!process.env.GEMINI_API_KEY);
    const res = await extractEmailActionsFlow(input);
    console.log("[extractEmailActions] Email action extraction flow successfully completed.");
    return { success: true, data: res };
  } catch (error: any) {
    console.error("[extractEmailActions] RUNTIME ERROR during email action extraction:");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    return { success: false, error: error.message || 'An unknown error occurred during email action extraction.' };
  }
}

const prompt = ai.definePrompt({
  name: 'extractEmailActionsPrompt',
  model: 'googleai/gemini-3.5-flash-lite',
  input: { schema: ExtractEmailActionsInputSchema },
  output: { schema: ExtractEmailActionsOutputSchema },
  prompt: `You are an expert task extraction assistant for a South African accounting firm called "Tax Shop / My Accountant".

  **Your Task:**
  Analyze the following email and extract all actionable items. Also suggest a task title and description if a task were to be created from this email.

  **Instructions:**
  1.  Identify every action that needs to be taken in response to this email.
  2.  For each action item, determine its priority:
      - 'high': Urgent deadlines, SARS requirements, client complaints, payment issues.
      - 'medium': Document requests, follow-ups with reasonable timelines.
      - 'low': General inquiries, non-urgent information requests.
  3.  Classify each action by type: document_request, follow_up, deadline, payment, meeting, or other.
  4.  If a deadline or due date is mentioned or can be reasonably inferred, provide it as an ISO 8601 date string (e.g. "2025-06-15"). If no date is mentioned, use an empty string.
  5.  Generate a suggested task title that is concise and descriptive (e.g. "Follow up on SARS assessment for Client X").
  6.  Generate a suggested task description that summarizes what needs to be done, including relevant context from the email.
  7.  If the email contains no actionable items (e.g. it's spam or purely informational), return an empty actionItems array but still provide a reasonable task title and description.

  **Email Details:**
  From: {{{senderName}}} <{{{senderEmail}}}>
  Subject: {{{subject}}}
  Body:
  {{{body}}}
  `,
});

const extractEmailActionsFlow = ai.defineFlow(
  {
    name: 'extractEmailActionsFlow',
    inputSchema: ExtractEmailActionsInputSchema,
    outputSchema: ExtractEmailActionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
