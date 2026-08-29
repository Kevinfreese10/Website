'use server';
/**
 * @fileOverview AI agent for generating social media advertising content.
 * 
 * - generateSocialAds - Creates high-converting Facebook ad copy for products.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdInputSchema = z.object({
  id: z.string().describe('The unique ID of the item.'),
  productName: z.string(),
  price: z.number().optional(),
  turnaroundTime: z.string().optional(),
  description: z.string(),
  category: z.string(),
  url: z.string(),
});

const SocialAdInputSchema = z.object({
  products: z.array(AdInputSchema).describe('List of items to generate ads for.'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'educational']).default('professional'),
});
export type SocialAdInput = z.infer<typeof SocialAdInputSchema>;

const AdVariantSchema = z.object({
  productId: z.string().describe('Must match the input ID of the item.'),
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
  model: 'googleai/gemini-3.5-flash',
  input: { schema: SocialAdInputSchema },
  output: { schema: SocialAdOutputSchema },
  prompt: `You are an expert social media copywriter specializing in Facebook ads for the South African accounting and tax industry.
  
  Your goal is to generate high-converting, highly professional ad copy for the following items (services, static pages, or blog posts). 
  Always refer to the advertising company as "My Accountant" (never refer to it as "MyAcc" or "MyAcc.co.za").
  The tone should be: {{{tone}}}.
  
  **INSTRUCTIONS**:
  1. **Mapping**: For each ad, the 'productId' field MUST exactly match the 'id' field from the input item.
  2. **Hook**: 
     - Start with an attention-grabbing opening line to stop the scroll.
     - CRITICAL: If the item is a service (meaning it has a 'price' and 'turnaroundTime' provided), you MUST explicitly include the Service name (productName), the price, and the completion (turnaround) time directly within the Hook text in a natural, high-converting way (e.g., "Need to register your business? Get your Private Company Registration sorted in 5-7 working days for just R650!").
     - If the item is a blog post or static page (no price/turnaroundTime provided), start the Hook with a relatable pain point, a bold statement, or an engaging question aligned with the page/blog topic instead.
     - CRITICAL: Do NOT use markdown bold formatting (like **key**) anywhere in the Hook.
  3. **Body Structure**:
     - Format the body into **2-3 short, clean paragraphs** separated by double line breaks (\\n\\n). Do NOT produce a single wall of text.
     - Include a separate list (using professional emojis like ✅ or 🔹) highlighting 2-3 concrete value points, benefits, or key takeaways. CRITICAL: Each item in this list MUST be on its own line, separated by a newline character (\\n).
     - **Conditional Info**: If the item has a 'price' and 'turnaroundTime' provided in the list below, you MUST output a dedicated, clean line formatted exactly like (without any asterisks or markdown bold):
       💰 PRICE: R[price] | ⏱️ TURNAROUND: [turnaroundTime]
       If the item is a Blog Post or Page (no price provided), do NOT output this line, and instead focus on educational highlights or informative summaries to capture interest.
     - Mention the direct link within the body text naturally.
     - CRITICAL: Do NOT use markdown bold formatting (like **key**) anywhere in the Body.
  4. **CTA**: Provide a clear, professional call to action that directs users to the provided URL (e.g., "Read the full guide online: {{{url}}}" or "Get started online today: {{{url}}}"). Do NOT use markdown bold formatting (like **key**) in the CTA.
  5. **Context**: Use South African business and tax terminology correctly (SARS, CIPC, Pty Ltd, VAT, etc.).
  6. **Emojis**: Use emojis selectively and professionally to structure readability. Avoid excessive or random icons.
  
  **ITEMS TO ADVERTISE**:
  {{#each products}}
  - ID: "{{this.id}}"
  - Name/Title: "{{this.productName}}"
  {{#if this.price}}- Price: R{{this.price}}{{/if}}
  {{#if this.turnaroundTime}}- Turnaround: {{this.turnaroundTime}}{{/if}}
  - Link: {{{this.url}}}
  - Description: "{{this.description}}"
  - Category/Type: "{{this.category}}"
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

export type SocialAdResult = {
  success: boolean;
  ads?: SocialAdOutput['ads'];
  error?: string;
};

export async function generateSocialAds(input: SocialAdInput): Promise<SocialAdResult> {
  try {
    console.log("[generateSocialAds] Starting ad generation flow...");
    console.log("[generateSocialAds] GEMINI_API_KEY exists in env:", !!process.env.GEMINI_API_KEY);
    const res = await generateSocialAdFlow(input);
    console.log("[generateSocialAds] Ad generation flow successfully completed.");
    return { success: true, ads: res.ads };
  } catch (error: any) {
    console.error("[generateSocialAds] RUNTIME ERROR during ad generation:");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    return { success: false, error: error.message || 'An unknown error occurred during generation.' };
  }
}
