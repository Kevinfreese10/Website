'use server';

import { ai } from '@/ai/genkit';

export async function generateCopywritingCopy({
  field,
  partnerName,
  additionalContext = '',
}: {
  field: 'heroTitle' | 'heroSubtitle' | 'aboutUs' | 'metaTitle' | 'metaDescription';
  partnerName: string;
  additionalContext?: string;
}) {
  try {
    let systemPrompt = '';
    let prompt = '';

    switch (field) {
      case 'heroTitle':
        systemPrompt = `You are a professional copywriter specializing in marketing for South African accounting practices.`;
        prompt = `Generate a single, extremely professional, and catchy Hero Headline (Title) for the landing page of an accounting practice named "${partnerName}".
        It should focus on trust, growth, tax compliance, or professional accounting services.
        ${additionalContext ? `Additional practice context: ${additionalContext}` : ''}
        CRITICAL: Return ONLY the headline text. Do not include quotes, preamble, or markdown. Keep it under 10 words.`;
        break;
      case 'heroSubtitle':
        systemPrompt = `You are a professional copywriter specializing in marketing for South African accounting practices.`;
        prompt = `Generate a professional, compelling Hero Subtitle for the landing page of an accounting practice named "${partnerName}".
        It should expand on the headline by mentioning services like tax, compliance, bookkeeping, and payroll.
        ${additionalContext ? `Additional practice context: ${additionalContext}` : ''}
        CRITICAL: Return ONLY the subtitle text. Do not include quotes, preamble, or markdown. Keep it under 20 words.`;
        break;
      case 'aboutUs':
        systemPrompt = `You are a professional copywriter specializing in marketing for South African accounting practices.`;
        prompt = `Write a beautiful, engaging "About Us" paragraph (about 3-4 sentences) for an accounting practice named "${partnerName}".
        It should sound professional, trustworthy, client-centric, and geared towards helping small businesses and individuals in South Africa.
        ${additionalContext ? `Additional practice details or values to include: ${additionalContext}` : ''}
        CRITICAL: Return ONLY the paragraph text. Do not include intro text, formatting, or markdown.`;
        break;
      case 'metaTitle':
        systemPrompt = `You are an SEO specialist focusing on South African accounting practices.`;
        prompt = `Generate a Google-optimized SEO Meta Title for the practice "${partnerName}".
        Format it like: [Main Service Focus/Hook] | ${partnerName}
        ${additionalContext ? `Additional practice details: ${additionalContext}` : ''}
        CRITICAL: Return ONLY the meta title text. It MUST be under 60 characters total. Do not include quotes.`;
        break;
      case 'metaDescription':
        systemPrompt = `You are an SEO specialist focusing on South African accounting practices.`;
        prompt = `Generate a Google-optimized SEO Meta Description for the practice "${partnerName}".
        It should explain what they offer (tax, accounting, payroll) and end with a call to action.
        ${additionalContext ? `Additional practice details: ${additionalContext}` : ''}
        CRITICAL: Return ONLY the meta description text. It MUST be under 160 characters total. Do not include quotes.`;
        break;
      default:
        throw new Error('Invalid field type');
    }

    const { text } = await ai.generate({
      prompt: `${systemPrompt}\n\nTask:\n${prompt}`,
    });

    return { success: true, text: text?.trim() || '' };
  } catch (error: any) {
    console.error('Error generating copywriting:', error);
    return { success: false, error: error.message || 'Failed to generate copy' };
  }
}
