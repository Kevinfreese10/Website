import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { ai } from '../src/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';

async function test() {
    console.log("Testing image generation via Genkit googleAI...");
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    
    try {
        const response = await ai.generate({
            model: 'googleai/imagen-4.0-generate-001',
            prompt: 'A professional clean modern corporate office desk with a laptop displaying financial graphs, warm volumetric lighting, realistic office background, highly detailed business photography.',
        });
        
        console.log("Image generation succeeded!");
        console.log("Response message keys:", Object.keys(response.message || {}));
        if (response.message) {
            console.log("Response message JSON:", JSON.stringify(response.message, null, 2).substring(0, 500));
            if (response.message.content) {
                console.log("Content type/length:", typeof response.message.content, response.message.content.length);
                response.message.content.forEach((part: any, idx: number) => {
                    console.log(`Part ${idx} keys:`, Object.keys(part));
                    console.log(`Part ${idx} text:`, part.text);
                    if (part.media) {
                        console.log(`Part ${idx} media url prefix:`, part.media.url?.substring(0, 100));
                        console.log(`Part ${idx} media contentType:`, part.media.contentType);
                    }
                });
            }
        }
        console.log("Response raw keys:", Object.keys(response.raw || {}));
    } catch (e: any) {
        console.error("Image generation failed:", e.message);
        console.error(e.stack);
    }
    process.exit(0);
}

test();
