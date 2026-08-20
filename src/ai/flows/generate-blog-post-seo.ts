'use server';
/**
 * @fileOverview An AI agent for generating blog post and product SEO content.
 * 
 * - generateBlogPostSeo - A function that creates SEO content for a product or page based on its title, price, and turnaround.
 * - GenerateBlogPostSeoInput - The input type for the generateBlogPostSeo function.
 * - GenerateBlogPostSeoOutput - The return type for the generateBlogPostSeo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogPostSeoInputSchema = z.object({
  title: z.string().describe('The title of the product, service, or page.'),
  content: z.string().optional().describe('The full content of the page to analyze for deeper keyword context.'),
  price: z.number().optional().describe('The price in ZAR if set.'),
  isPriceTbc: z.boolean().optional().describe('Whether the price is quote-based/TBC.'),
  turnaroundTime: z.string().optional().describe('The turnaround time if known.'),
});
export type GenerateBlogPostSeoInput = z.infer<typeof GenerateBlogPostSeoInputSchema>;

const GenerateBlogPostSeoOutputSchema = z.object({
  metaTitle: z.string().describe('An SEO-optimized meta title formatted as "Product Title | Price | Turnaround Time". CRITICAL: It must be under 60 characters.'),
  metaDescription: z.string().describe('An SEO-optimized meta description. CRITICAL: It must be under 160 characters.'),
  metaKeywords: z.array(z.object({ value: z.string() })).describe('A list of 3-5 relevant SEO keywords or keyphrases.'),
});
export type GenerateBlogPostSeoOutput = z.infer<typeof GenerateBlogPostSeoOutputSchema>;

export type GenerateBlogPostSeoResult = {
  success: true;
  data: GenerateBlogPostSeoOutput;
} | {
  success: false;
  error: {
    message: string;
    isRateLimit: boolean;
  };
};

export async function generateBlogPostSeo(
  input: GenerateBlogPostSeoInput
): Promise<GenerateBlogPostSeoResult> {
  try {
    const data = await generateBlogPostSeoFlow(input);
    return { success: true, data };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isRateLimit = errorMsg.includes('429') || 
                        errorMsg.toLowerCase().includes('quota') || 
                        errorMsg.toLowerCase().includes('rate limit') ||
                        (error?.status === 429);
    
    return {
      success: false,
      error: {
        message: errorMsg,
        isRateLimit
      }
    };
  }
}

const prompt = ai.definePrompt({
  name: 'generateBlogPostSEOPrompt',
  model: 'googleai/gemini-3.5-flash-lite',
  input: {schema: GenerateBlogPostSeoInputSchema},
  output: {schema: GenerateBlogPostSeoOutputSchema},
  prompt: `You are an expert copywriter and SEO specialist for "My Accountant", a financial services company in South Africa.

  Your task is to generate compelling SEO content (Title, Description, and Keywords) for a product or service page based on its title, pricing, turnaround time, and context.
  
  **INSTRUCTIONS**:
  1. Analyze the context: Identify the most commercially relevant keywords.
  2. South African Context: Ensure keywords and descriptions use South African spelling and terminology (e.g., "VAT Registration", "CIPC", "SARS", "SME").
  3. Strict Metadata Lengths: 
     - Meta Title MUST be under 60 characters.
     - Meta Description MUST be under 160 characters.

  Page / Product Title: {{{title}}}
  {{#if price}}
  Price: R{{{price}}}
  {{/if}}
  {{#if isPriceTbc}}
  Pricing Mode: Quote-Based / TBC
  {{/if}}
  {{#if turnaroundTime}}
  Turnaround Time: {{{turnaroundTime}}}
  {{/if}}
  {{#if content}}
  Page Content Context:
  {{{content}}}
  {{/if}}

  Please generate the following content based on these strict guidelines:
  
  **SEO Information (Strict Guidelines):**

  - **Meta Title (Title Tag)**:
    - **Format Requirement**: MUST follow the exact format:
      \`Product Title | Price | Turnaround Time\`
    - **Pricing formatting**:
      - If price is provided: format as \`R{price}\` (e.g. \`R750\` or \`R1,850\`).
      - If price is quote-based or unknown: use \`Quote\`.
    - **Turnaround formatting**: Use short duration (e.g. \`24 Hours\`, \`2-3 Days\`, \`5-7 Days\`).
    - **Length Rule**: CRITICAL: Must be strictly **under 60 characters** (maximum 59 characters). If the product title is long, use an abbreviated/concise version of the title so the entire \`Title | Price | Turnaround\` string never exceeds 59 characters.
    - **Examples**:
      - \`Tax Clearance Certificate | R750 | 24 Hours\` (45 chars)
      - \`Annual Financial Statements | R1,850 | 5-7 Days\` (47 chars)
      - \`CIPC Company Registration | R1,450 | 2-3 Days\` (46 chars)
      - \`Monthly Bookkeeping Retainer | Quote | Monthly\` (46 chars)

  - **Meta Description**:
    - **Purpose**: The snippet below the title in search results.
    - **Rules**:
      - CRITICAL: Must be **under 160 characters long**.
      - Make it actionable, compelling, and relevant.

  - **Meta Keywords**:
    - **Purpose**: For search indexing.
    - **Rules**:
      - Provide a list of 3–5 relevant keywords or keyphrases as objects with a "value" property.
  `,
});

function sanitizeMetaTitle(title: string): string {
  if (!title) return '';
  const trimmed = title.trim();
  if (trimmed.length <= 59) return trimmed;
  return trimmed.substring(0, 59).trim();
}

const generateBlogPostSeoFlow = ai.defineFlow(
  {
    name: 'generateBlogPostSeoFlow',
    inputSchema: GenerateBlogPostSeoInputSchema,
    outputSchema: GenerateBlogPostSeoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output) {
      output.metaTitle = sanitizeMetaTitle(output.metaTitle);
    }
    return output!;
  }
);
