'use server';
/**
 * @fileOverview An AI agent for generating service details and SEO content.
 * 
 * - generateServiceDetails - A function that creates content for a service based on its title.
 * - GenerateServiceDetailsInput - The input type for the generateServiceDetails function.
 * - GenerateServiceDetailsOutput - The return type for the generateServiceDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateServiceDetailsInputSchema = z.object({
  title: z.string().describe('The title of the service.'),
  price: z.number().optional().describe('The price of the service in ZAR, if known.'),
  isPriceTbc: z.boolean().optional().describe('Whether the price is quote-based / TBC.'),
  turnaroundTime: z.string().optional().describe('The turnaround time if known.'),
});
export type GenerateServiceDetailsInput = z.infer<typeof GenerateServiceDetailsInputSchema>;

const GenerateServiceDetailsOutputSchema = z.object({
  correctedTitle: z.string().describe('The corrected and polished version of the service title.'),
  shortDescription: z.string().describe('A concise, one-sentence description of the service.'),
  longDescription: z.string().describe('A detailed, paragraph-long description of the service, highlighting its benefits and features.'),
  turnaroundTime: z.string().describe('A typical turnaround time for this service (e.g., "5-7 working days").'),
  whatsIncluded: z.array(z.string()).describe("A bulleted list of what is included in the service package."),
  clientRequirements: z.array(z.string()).describe("A bulleted list of documents or information required from the client before work can begin."),
  metaTitle: z.string().describe('An SEO-optimized meta title formatted strictly as "Product Title | Price | Turnaround Time". CRITICAL: It must be under 60 characters.'),
  metaDescription: z.string().describe('An SEO-optimized meta description. CRITICAL: It must be under 160 characters.'),
  metaKeywords: z.array(z.string()).describe('A list of 3-5 relevant SEO keywords or keyphrases.'),
});
export type GenerateServiceDetailsOutput = z.infer<typeof GenerateServiceDetailsOutputSchema>;

export async function generateServiceDetails(
  input: GenerateServiceDetailsInput
): Promise<GenerateServiceDetailsOutput> {
  return generateServiceDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateServiceDetailsPrompt',
  model: 'googleai/gemini-3.5-flash',
  input: {schema: GenerateServiceDetailsInputSchema},
  output: {schema: GenerateServiceDetailsOutputSchema},
  prompt: `You are an expert copywriter and SEO specialist for "My Accountant", a financial services company in South Africa.

  Your task is to generate compelling and accurate content for a specific service based on its title and details. The content must be tailored to a South African audience and follow modern SEO best practices for Google Search Console indexing.

  First, review the following service title for any spelling or grammatical errors and provide a corrected, polished version in the 'correctedTitle' field.

  Service Title: {{{title}}}
  {{#if price}}
  Known Price: R{{{price}}}
  {{/if}}
  {{#if isPriceTbc}}
  Pricing Mode: Quote-Based / TBC
  {{/if}}
  {{#if turnaroundTime}}
  Known Turnaround Time: {{{turnaroundTime}}}
  {{/if}}

  Then, please generate the following content based on these strict guidelines:

  - **Short Description**: A concise, one-sentence description of the service.
  - **Long Description**: A detailed long description (one paragraph) explaining what the service is, who it's for, and its benefits.
  - **Turnaround Time**: A typical turnaround time for this service (e.g., "5-7 working days" or "24 hours").
  - **What's Included**: A list of 3-5 key deliverables or components that the client receives as part of this service.
  - **Client Requirements**: A list of 3-5 essential documents or pieces of information the client *must* provide before work can begin.
  
  ---
  
  **SEO Information (Strict Guidelines):**

  - **Meta Title (Title Tag)**:
    - **Format Requirement**: MUST follow the exact format:
      \`Product Title | Price | Turnaround Time\`
    - **Pricing formatting**:
      - If numerical price is provided: format as \`R{price}\` (e.g. \`R750\` or \`R1,850\`).
      - If price is quote-based or unknown: use \`Quote\`.
    - **Turnaround formatting**: Use short duration (e.g. \`24 Hours\`, \`2-3 Days\`, \`5-7 Days\`).
    - **Length Rule**: CRITICAL: Must be strictly **under 60 characters** (max 59 characters). If the product title is long, use an abbreviated/concise version of the title so the entire \`Title | Price | Turnaround\` string never exceeds 59 characters.
    - **Examples**:
      - \`Tax Clearance Certificate | R750 | 24 Hours\` (45 chars)
      - \`Annual Financial Statements | R1,850 | 5-7 Days\` (47 chars)
      - \`CIPC Company Registration | R1,450 | 2-3 Days\` (46 chars)
      - \`Bookkeeping Retainer | Quote | Monthly\` (39 chars)

  - **Meta Description**:
    - **Purpose**: The snippet below the title in search results.
    - **Rules**:
      - CRITICAL: Must be **under 160 characters long**.
      - Include primary and secondary keywords naturally.
      - Make it actionable and compelling (use verbs like "get", "order", "ensure").
      - Must accurately match the service content.
    - **Example**: Get your Tax Clearance Certificate fast and hassle-free. Order online and receive it within 24 hours from My Accountant.

  - **Meta Keywords**:
    - **Purpose**: For internal reference or other search engines.
    - **Rules**:
      - Provide a list of 3–5 relevant keywords or keyphrases.
    - **Example**: tax clearance, SARS, compliance certificate, My Accountant
  `,
});

function sanitizeMetaTitle(title: string): string {
  if (!title) return '';
  const trimmed = title.trim();
  if (trimmed.length <= 59) return trimmed;
  return trimmed.substring(0, 59).trim();
}

const generateServiceDetailsFlow = ai.defineFlow(
  {
    name: 'generateServiceDetailsFlow',
    inputSchema: GenerateServiceDetailsInputSchema,
    outputSchema: GenerateServiceDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output) {
      output.metaTitle = sanitizeMetaTitle(output.metaTitle);
    }
    return output!;
  }
);
