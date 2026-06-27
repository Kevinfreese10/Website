'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TestimonialSchema = z.object({
  name: z.string().describe("Name of the client giving the testimonial"),
  role: z.string().describe("Role or profession of the client"),
  company: z.string().optional().describe("Company of the client (optional)"),
  quote: z.string().describe("The review/quote text"),
  rating: z.number().min(1).max(5).describe("Rating from 1 to 5 stars"),
});

const FaqSchema = z.object({
  question: z.string().describe("The FAQ question"),
  answer: z.string().describe("The FAQ answer"),
});

const LandingPageConfigOutputSchema = z.object({
  enabled: z.boolean(),
  slug: z.string(),
  heroTitle: z.string().describe("The primary heading at the top of the landing page"),
  heroSubtitle: z.string().describe("A supporting subtitle displayed under the hero title"),
  aboutUs: z.string().describe("The 'About Us' section text"),
  themePreset: z.enum(['custom', 'my_accountant', 'futuristic', 'tech_blue', 'facebook', 'lovable', 'monday', 'monday_crm', 'stripe', 'airbnb', 'linear', 'spotify', 'notion', 'apple']).optional(),
  primaryColor: z.string().describe("Primary brand color (hex format, starting with #)"),
  secondaryColor: z.string().optional().describe("Secondary brand color (hex format, starting with #)"),
  backgroundColor: z.string().optional().describe("Background color of the page (hex format, starting with #)"),
  textColor: z.string().optional().describe("Primary text color (hex format, starting with #)"),
  cardBackgroundColor: z.string().optional().describe("Background color for cards (hex format, starting with #)"),
  cardBorderColor: z.string().optional().describe("Border color for cards (hex format, starting with #)"),
  buttonColor: z.string().optional().describe("Main call-to-action button color (hex format, starting with #)"),
  buttonTextColor: z.string().optional().describe("Text color for buttons (hex format, starting with #)"),
  buttonStyle: z.enum(['solid', 'outline']).optional().describe("Button style"),
  showLogo: z.boolean().optional(),
  hideHeaderBranding: z.boolean().optional(),
  logoUrl: z.string().optional(),
  logoHeight: z.number().optional(),
  heroImageUrl: z.string().optional().describe("Hero background image URL. Do NOT change this unless explicitly requested or to choose a preselected one if empty."),
  heroOverlayOpacity: z.number().optional().describe("Overlay opacity (0 to 100)"),
  heroLayout: z.enum(['centered', 'split-left', 'split-right', 'background']).optional(),
  heroTextPosition: z.enum(['inside', 'below']).optional(),
  refundPolicy: z.string().optional(),
  popiaPolicy: z.string().optional(),
  termsAndConditions: z.string().optional(),
  heroTitleColor: z.string().optional().describe("Color of the hero title (hex format, starting with #)"),
  heroSubtitleColor: z.string().optional().describe("Color of the hero subtitle (hex format, starting with #)"),
  showServicesHero: z.boolean().optional(),
  servicesHeroImageUrl: z.string().optional(),
  servicesHeroOverlayOpacity: z.number().optional(),
  servicesHeroLayout: z.enum(['centered', 'split-left', 'split-right', 'background']).optional(),
  servicesHeroTitle: z.string().optional(),
  servicesHeroSubtitle: z.string().optional(),
  servicesHeroTextPosition: z.enum(['inside', 'below']).optional(),
  metaTitle: z.string().optional().describe("SEO Meta Title"),
  metaDescription: z.string().optional().describe("SEO Meta Description"),
  testimonials: z.array(TestimonialSchema).optional().describe("List of client testimonials"),
  faqs: z.array(FaqSchema).optional().describe("List of FAQ items"),
  showLeadForm: z.boolean().optional().describe("Whether to show the contact form"),
  fontFamily: z.enum(['sans', 'serif', 'mono', 'inter', 'outfit']).optional().describe("Typography/font-family style pairing"),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg']).optional().describe("Border radius styling for buttons and cards"),
  glassmorphism: z.boolean().optional().describe("Whether to use translucent card borders and background blur"),
  googleAnalyticsId: z.string().optional().describe("Google Analytics (G-XXXXXXXXXX) measurement ID"),
  metaPixelId: z.string().optional().describe("Meta Pixel Tracking ID"),
  showCalculator: z.boolean().optional().describe("Whether to render the interactive monthly retainer pricing calculator widget"),
});

export async function editLandingPageWithAI({
  currentConfig,
  instruction,
  partnerName,
}: {
  currentConfig: any;
  instruction: string;
  partnerName: string;
}) {
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      output: { schema: LandingPageConfigOutputSchema },
      prompt: `You are an expert web designer, developer, and marketing copywriter specializing in creating beautiful white-label landing pages for accounting and auditing practices.

Your task is to take the current landing page configuration for an accounting practice named "${partnerName}" and modify it based on the user's natural language instruction.

User Instruction: "${instruction}"

Current Page Configuration:
${JSON.stringify(currentConfig, null, 2)}

Instructions:
1. Parse the user's request carefully.
2. Modify relevant fields in the configuration to fully implement their request.
3. Keep all other fields that are NOT related to the user's request EXACTLY as they are in the current configuration. DO NOT blank out, delete, or modify existing image URLs, logo URLs, or document/policy texts (such as logoUrl, heroImageUrl, servicesHeroImageUrl, refundPolicy, popiaPolicy, termsAndConditions) unless explicitly instructed to do so. Keep their current values unchanged.
4. If you modify any specific color fields (such as primaryColor, secondaryColor, backgroundColor, textColor, cardBackgroundColor, cardBorderColor, buttonColor, buttonTextColor, heroTitleColor, heroSubtitleColor) to custom values, you MUST set the 'themePreset' field to 'custom'. Ensure all color codes start with '#' and are valid 6-character hex values (e.g. #059669).
5. If the user requests updates to the content (e.g. "change the headline to...", "rewrite the about us to focus on bookkeeping"), update those fields (e.g. heroTitle, heroSubtitle, aboutUs).
6. If the user requests FAQs or testimonials to be added or changed, update the 'faqs' and 'testimonials' arrays accordingly. Do not empty the existing arrays unless the user asks to replace them. If they want to add one, append it to the current list.
7. Return the full updated configuration object matching the output schema.`,
    });

    if (!output) {
      return { success: false, error: 'Failed to generate updated configuration.' };
    }

    return { success: true, config: output };
  } catch (error: any) {
    console.error('Error in editLandingPageWithAI:', error);
    return { success: false, error: error.message || 'Failed to edit landing page with AI' };
  }
}
