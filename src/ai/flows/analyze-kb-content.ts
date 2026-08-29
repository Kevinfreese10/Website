'use server';

/**
 * @fileOverview AI agents for analyzing Knowledge Base entries and integrating clarifications.
 * 
 * - analyzeKbContent: Analyzes the KB item to see if Khai understands it. Returns scoring, understanding summary, and clarifying questions.
 * - integrateKbClarifications: Integrates admin responses to clarifying questions back into the main KB content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schemas for analyzeKbContent
const AnalyzeKbContentInputSchema = z.object({
  question: z.string().describe('The question, topic, or title of the knowledge base resource.'),
  answer: z.string().describe('The answer, text details, or context description of the resource.'),
  sourceType: z.enum(['qa', 'text', 'link']).describe('The source type of the resource: standard Q&A, raw text, or website link description.'),
});
export type AnalyzeKbContentInput = z.infer<typeof AnalyzeKbContentInputSchema>;

const AnalyzeKbContentOutputSchema = z.object({
  understood: z.boolean().describe('Whether the information is fully clear, unambiguous, and complete enough for the AI (Khai) to confidently use for answering client queries.'),
  comprehensionScore: z.number().min(0).max(100).describe('A score from 0 to 100 representing how clear and complete the information is.'),
  summary: z.string().describe("A concise 1-2 sentence summary of what Khai understands from this resource. Start with 'I understand that...'"),
  questions: z.array(z.string()).describe('Up to 3 specific, simple, clarifying questions that would help fill in any gaps, ambiguities, or missing prerequisites.'),
  missingDetails: z.array(z.string()).describe('Short bullet points describing what specific details are vague or missing from the current text.'),
});
export type AnalyzeKbContentOutput = z.infer<typeof AnalyzeKbContentOutputSchema>;

export type AnalyzeKbContentResult = {
  success: boolean;
  data?: AnalyzeKbContentOutput;
  error?: string;
};

// Flow function for analyzeKbContent
export async function analyzeKbContent(
  input: AnalyzeKbContentInput
): Promise<AnalyzeKbContentResult> {
  try {
    console.log("[analyzeKbContent] Starting KB analysis flow...");
    const res = await analyzeKbContentFlow(input);
    console.log("[analyzeKbContent] KB analysis successfully completed.");
    return { success: true, data: res };
  } catch (error: any) {
    console.error("[analyzeKbContent] Error during KB analysis:", error);
    return { success: false, error: error.message || 'An unknown error occurred during analysis.' };
  }
}

const analyzePrompt = ai.definePrompt({
  name: 'analyzeKbContentPrompt',
  model: 'googleai/gemini-3.5-flash',
  input: { schema: AnalyzeKbContentInputSchema },
  output: { schema: AnalyzeKbContentOutputSchema },
  prompt: `You are Khai, the AI assistant for My Accountant. Your task is to evaluate the following knowledge base entry to ensure you understand it perfectly so you can explain it to clients.

**Information Source Type:** {{{sourceType}}}
**Topic / Question:** {{{question}}}
**Content / Answer Details:** {{{answer}}}

**Instructions for Analysis:**
1. Assess the text for clarity, completeness, and potential ambiguities:
   - If sourceType is 'qa' (Q&A Pair), does the answer directly, clearly, and comprehensively answer the question?
   - If sourceType is 'text' (Text Resource), is the information well-structured, easy to comprehend, and free of missing contexts or prerequisites?
   - If sourceType is 'link' (Reference Link), is the context description clear enough for you to know exactly when and why you should direct a client to this URL?
2. If there are missing details (e.g. "We submit payroll monthly" but doesn't mention the day of the month, required documents, or consequences of late submission), flag them.
3. Provide:
   - \`understood\`: Set to true ONLY if the content is highly clear and leaves no major questions unanswered. Set to false if there are gaps or ambiguities.
   - \`comprehensionScore\`: Rate the completeness and clarity from 0 (completely vague) to 100 (flawless and comprehensive). If there are any clarifying questions, the score should be below 95.
   - \`summary\`: Write a brief 1-2 sentence summary of what you understand from this entry (e.g. "I understand that VAT registrations require...").
   - \`questions\`: If you need clarifications to fully understand the entry, generate up to 3 simple, direct questions for the administrator. If the information is perfect, return an empty array.
   - \`missingDetails\`: List short bullets of what specific info is missing or ambiguous.
`,
});

const analyzeKbContentFlow = ai.defineFlow(
  {
    name: 'analyzeKbContentFlow',
    inputSchema: AnalyzeKbContentInputSchema,
    outputSchema: AnalyzeKbContentOutputSchema,
  },
  async (input) => {
    const { output } = await analyzePrompt(input);
    return output!;
  }
);


// Schemas for integrateKbClarifications
const IntegrateKbClarificationsInputSchema = z.object({
  question: z.string().describe('The question, topic, or title of the knowledge base resource.'),
  answer: z.string().describe('The current content or answer text details.'),
  sourceType: z.enum(['qa', 'text', 'link']).describe('The source type.'),
  clarifications: z.array(
    z.object({
      question: z.string().describe('The clarifying question that was asked.'),
      answer: z.string().describe('The admin\'s response to the clarifying question.'),
    })
  ).describe('A list of clarifying questions and their answers provided by the administrator.'),
});
export type IntegrateKbClarificationsInput = z.infer<typeof IntegrateKbClarificationsInputSchema>;

const IntegrateKbClarificationsOutputSchema = z.object({
  updatedAnswer: z.string().describe('The updated content text, with all clarifications seamlessly merged.'),
});
export type IntegrateKbClarificationsOutput = z.infer<typeof IntegrateKbClarificationsOutputSchema>;

export type IntegrateKbClarificationsResult = {
  success: boolean;
  updatedAnswer?: string;
  error?: string;
};

// Flow function for integrateKbClarifications
export async function integrateKbClarifications(
  input: IntegrateKbClarificationsInput
): Promise<IntegrateKbClarificationsResult> {
  try {
    console.log("[integrateKbClarifications] Starting KB integration flow...");
    const res = await integrateKbClarificationsFlow(input);
    console.log("[integrateKbClarifications] KB integration successfully completed.");
    return { success: true, updatedAnswer: res.updatedAnswer };
  } catch (error: any) {
    console.error("[integrateKbClarifications] Error during KB integration:", error);
    return { success: false, error: error.message || 'An unknown error occurred during integration.' };
  }
}

const integratePrompt = ai.definePrompt({
  name: 'integrateKbClarificationsPrompt',
  model: 'googleai/gemini-3.5-flash',
  input: { schema: IntegrateKbClarificationsInputSchema },
  output: { schema: IntegrateKbClarificationsOutputSchema },
  prompt: `You are Khai, the AI assistant. Your task is to update and enrich the existing knowledge base content by seamlessly integrating the administrator's clarifications.

**Topic / Question:** {{{question}}}
**Information Source Type:** {{{sourceType}}}
**Current Content / Answer:**
{{{answer}}}

**Clarifications Provided:**
{{#each clarifications}}
- **Question:** {{{this.question}}}
- **Answer:** {{{this.answer}}}
{{/each}}

**Instructions:**
1. Merge the new details from the clarifications directly into the current content.
2. Maintain the same structure and tone of the original content. If it was bullet points, keep bullet points. If it was paragraphs, keep paragraphs.
3. Do NOT lose or alter any of the existing details unless they are directly corrected or updated by the clarifications.
4. Ensure the resulting text flows naturally, is grammatically correct, and contains no placeholders.
5. Return only the updated text (cohesive, complete and polished) for the content field.
`,
});

const integrateKbClarificationsFlow = ai.defineFlow(
  {
    name: 'integrateKbClarificationsFlow',
    inputSchema: IntegrateKbClarificationsInputSchema,
    outputSchema: IntegrateKbClarificationsOutputSchema,
  },
  async (input) => {
    const { output } = await integratePrompt(input);
    return output!;
  }
);
