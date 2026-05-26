import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: 'AIzaSyCA6NIJNhxhweEMkQIn8rj4dBDz4YIr4W0' })],
  model: 'googleai/gemini-2.5-flash',
});
