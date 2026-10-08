'use server';
/**
 * @fileOverview An AI agent for proofreading text.
 * 
 * - proofreadNote - A function that corrects grammar, spelling, and tone of a given text.
 * - ProofreadNoteInput - The input type for the proofreadNote function.
 * - ProofreadNoteOutput - The return type for the proofreadNote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProofreadNoteInputSchema = z.object({
  text: z.string().describe('The raw text of the note to be proofread.'),
});
export type ProofreadNoteInput = z.infer<typeof ProofreadNoteInputSchema>;

const ProofreadNoteOutputSchema = z.object({
  proofreadText: z.string().describe("The corrected and improved version of the note. It should be grammatically correct, spell-checked, and have a friendly yet professional tone suitable for client communication."),
});
export type ProofreadNoteOutput = z.infer<typeof ProofreadNoteOutputSchema>;

export type ProofreadNoteResult = {
  success: boolean;
  proofreadText?: string;
  error?: string;
};

export async function proofreadNote(
  input: ProofreadNoteInput
): Promise<ProofreadNoteResult> {
  try {
    console.log("[proofreadNote] Starting proofreading flow...");
    console.log("[proofreadNote] GEMINI_API_KEY exists in env:", !!process.env.GEMINI_API_KEY);
    const res = await proofreadNoteFlow(input);
    console.log("[proofreadNote] Proofreading flow successfully completed.");
    return { success: true, proofreadText: res.proofreadText };
  } catch (error: any) {
    console.error("[proofreadNote] RUNTIME ERROR during proofreading:");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    return { success: false, error: error.message || 'An unknown error occurred during proofreading.' };
  }
}

const prompt = ai.definePrompt({
  name: 'proofreadNotePrompt',
  model: 'googleai/gemini-3.5-flash',
  input: { schema: ProofreadNoteInputSchema },
  output: { schema: ProofreadNoteOutputSchema },
  prompt: `You are an expert client communications specialist for a premier South African accounting firm, My Accountant. Your task is to proofread, polish, and warm up the following communication note meant for a client.

  **Instructions:**
  1.  **Warm Greeting**: Ensure the message starts with a warm, friendly greeting (e.g., "Hi [Client Name],", "Good day [Client Name],", or "Hello," if no name is present). If a greeting is already present, polish it to feel warm and natural.
  2.  **Friendly & Welcoming Tone**: Ensure the tone is genuinely warm, courteous, and helpful—never cold, abrupt, or purely bureaucratic. Use conversational warmth (e.g., "Hope you're having a wonderful week!", "Thank you for choosing us", "We're here to help if you have any questions").
  3.  **Spelling & Grammar**: Correct all spelling, grammar, punctuation, and typographical mistakes.
  4.  **Preserve Key Details**: Retain all specific information such as order numbers, URLs/links, bullet points, requirement names, and amounts.
  5.  **Polite Closing**: End with a warm, professional closing (e.g., "Warm regards,\nThe My Accountant Team" or "Kind regards,").

  **Original Note:**
  {{{text}}}
  `,
});

const proofreadNoteFlow = ai.defineFlow(
  {
    name: 'proofreadNoteFlow',
    inputSchema: ProofreadNoteInputSchema,
    outputSchema: ProofreadNoteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
