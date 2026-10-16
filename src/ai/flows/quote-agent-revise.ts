import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ReviseDraftInputSchema = z.object({
  clientName: z.string(),
  clientFirstName: z.string(),
  subject: z.string(),
  sourceExcerpt: z.string(),
  currentDraftText: z.string(),
  instructions: z.string().describe("Kevin's instruction from Telegram"),
});

export const ReviseDraftOutputSchema = z.object({
  revisedParagraphs: z.array(z.string()).describe('The revised plain text paragraphs to send to the client. No greetings, no signature.'),
  summaryOfChanges: z.string().describe('One concise sentence summarizing the changes made.'),
});

export const reviseDraftFlow = ai.defineFlow(
  {
    name: 'quoteAgentReviseDraft',
    inputSchema: ReviseDraftInputSchema,
    outputSchema: ReviseDraftOutputSchema,
  },
  async (input) => {
    const prompt = `You are the executive drafting assistant for Kevin Freese, Director & Chartered Accountant at My Accountant (Pty) Ltd.
Kevin has received this client enquiry and instructed changes to the draft reply.

Client Name: ${input.clientName}
Subject: ${input.subject}
Original Enquiry:
${input.sourceExcerpt}

Current Draft Text:
${input.currentDraftText}

Kevin's Instructions:
"${input.instructions}"

Task:
1. Revise the reply paragraphs according to Kevin's exact instructions (e.g. adjust fees, add requirements, specify turnarounds, or change scope).
2. Write warm, professional, South African English business correspondence.
3. Return paragraphs array (each paragraph is 2-3 sentences). Do NOT include greeting line ("Hi ...") or sign-off ("Kevin Freese..."), as the template wraps those automatically.
4. Return a 1-sentence summary of what changed for Kevin's Telegram preview.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: ReviseDraftOutputSchema },
    });

    if (!output) throw new Error('Failed to revise draft with AI');
    return output;
  }
);
