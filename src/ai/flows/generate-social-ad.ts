'use server';
/**
 * @fileOverview AI agent for generating social media advertising content.
 * 
 * - generateSocialAds - Creates high-converting Facebook ad copy for products.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdInputSchema = z.object({
  id: z.string().describe('The unique ID of the product.'),
  productName: z.string(),
  price: z.number(),
  turnaroundTime: z.string(),
  description: z.string(),
  category: z.string(),
  url: z.string(),
});

const SocialAdInputSchema = z.object({
  products: z.array(AdInputSchema).describe('List of products to generate ads for.'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'educational']).default('professional'),
});
export type SocialAdInput = z.infer<typeof SocialAdInputSchema>;

const AdVariantSchema = z.object({
  productId: z.string().describe('Must match the input ID of the product.'),
  hook: z.string().describe('A catchy opening line to stop the scroll.'),
  body: z.string().describe('The main ad copy, highlighting benefits and pain points.'),
  cta: z.string().describe('A clear call to action.'),
  hashtags: z.string().describe('Relevant hashtags for searchability.'),
});

const SocialAdOutputSchema = z.object({
  ads: z.array(AdVariantSchema),
});
export type SocialAdOutput = z.infer<typeof SocialAdOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateSocialAdPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: SocialAdInputSchema },
  output: { schema: SocialAdOutputSchema },
  prompt: `You are an expert social media copywriter specializing in Facebook ads for the South African accounting and tax industry.
  
  Your goal is to generate high-converting ad copy for the following products. 
  The tone should be: {{{tone}}}.
  
  **INSTRUCTIONS**:
  1. **Mapping**: For each ad, the 'productId' field MUST exactly match the 'id' field from the input product.
  2. **Hook**: Start with a relatable pain point or a bold statement (e.g., "Tired of SARS deadlines?" or "Did you know 70% of SMEs pay too much tax?").
  3. **Body**: Briefly explain how the service solves the problem. Focus on benefits like "Peace of Mind," "Saving Time," and "Compliance." Use emojis effectively.
  4. **Mandatory Info**: You MUST explicitly mention the price and the turnaround time immediately after the hook (at the very start of the body text). You must also include the direct product link within the ad copy text.
  5. **CTA**: Provide a clear call to action that directs users to the provided URL.
  6. **Context**: Use South African terminology (SARS, CIPC, Pty Ltd, etc.).
  
  **PRODUCTS TO ADVERTISE**:
  {{#each products}}
  - ID: "{{this.id}}"
  - Product: "{{this.productName}}"
  - Price: R{{this.price}}
  - Turnaround: {{this.turnaroundTime}}
  - Link: {{{this.url}}}
  - Description: "{{this.description}}"
  ---
  {{/each}}
  
  Return the result as structured JSON matching the output schema exactly.`,
});

const generateSocialAdFlow = ai.defineFlow(
  {
    name: 'generateSocialAdFlow',
    inputSchema: SocialAdInputSchema,
    outputSchema: SocialAdOutputSchema,
  },
  async (input) => {
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        const { output } = await prompt(input);
        if (!output) throw new Error("AI returned empty output");
        return output;
      } catch (error: any) {
        lastError = error;
        const isTransient = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('Service Unavailable');
        if (retries > 1 && isTransient) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, (4 - retries) * 2000));
          continue;
        }
        break;
      }
    }
    throw lastError || new Error('Failed to generate social ads after retries.');
  }
);

export async function generateSocialAds(input: SocialAdInput): Promise<SocialAdOutput> {
  try {
    console.log("[generateSocialAds] Starting ad generation flow...");
    console.log("[generateSocialAds] GEMINI_API_KEY exists in env:", !!process.env.GEMINI_API_KEY);
    const res = await generateSocialAdFlow(input);
    console.log("[generateSocialAds] Ad generation flow successfully completed.");
    return res;
  } catch (error: any) {
    console.error("[generateSocialAds] RUNTIME ERROR during ad generation:");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    throw error;
  }
}
