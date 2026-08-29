'use server';

/**
 * @fileOverview An AI agent for web-grounded transaction allocation suggestions.
 * 
 * Uses Gemini search grounding to identify unknown merchants and suggest GL account,
 * VAT type, confidence, merchant metadata, and clean rule keywords.
 */

import { ai, getCustomAi } from '@/ai/genkit';
import { z } from 'zod';
import { VatType } from '@/lib/types';

const SuggestTransactionAllocationWebInputSchema = z.object({
  description: z.string().describe('The bank transaction description (e.g., "WOOLWORTHS #4223").'),
  chartOfAccounts: z.string().describe('A JSON string of the chart of accounts, with "id", "accountNumber", and "description" fields.'),
  isVatRegistered: z.boolean().optional().describe('Whether the client is registered for VAT.'),
  apiKey: z.string().optional().describe('An optional Google AI API key to use for this specific suggestion.'),
});

export type SuggestTransactionAllocationWebInput = z.infer<typeof SuggestTransactionAllocationWebInputSchema>;

export type SuggestTransactionAllocationWebOutput = {
  accountId: string;
  vatType: VatType;
  confidence: number;
  merchantName: string;
  merchantCategory: string;
  suggestedKeyword: string;
};

function extractJson(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[1] || jsonMatch[0];
  }
  return JSON.parse(cleaned);
}

export async function suggestTransactionAllocationWeb(
  input: SuggestTransactionAllocationWebInput
): Promise<SuggestTransactionAllocationWebOutput> {
  const customAi = getCustomAi(input.apiKey);

  const promptText = `You are an experienced South African Chartered Accountant. Your task is to perform web-grounded research on a bank transaction description, identify the merchant, and suggest the correct general ledger account and VAT type.

Use Google Search to look up the merchant or entity in the raw bank description.

Analyze the transaction description and choose the most appropriate account from the provided chart of accounts. Also, determine the correct VAT treatment.

**Client VAT Status**: The client is ${input.isVatRegistered ? 'REGISTERED' : 'NOT REGISTERED'} for VAT.

**CRITICAL INSTRUCTION**: If the client is NOT registered for VAT, you MUST set the 'vatType' to 'no_vat' for all transactions.

**CRITICAL INSTRUCTION ON LOW/NO INFORMATION**:
If the transaction description is generic (e.g., "CASH", "TRANSFER", "DEBIT ORDER", "PAYMENT", "MONTHLY FEE", "INTEREST"), obfuscated, or if web search yields no useful information about the merchant:
- Set 'confidence' to 0 (or less than 15).
- Set 'merchantName' to "Unknown / Generic".
- Set 'merchantCategory' to "General".
- Set 'suggestedKeyword' to the clean uppercase description.

**Transaction Description**: ${input.description}

**Chart of Accounts**:
\`\`\`json
${input.chartOfAccounts}
\`\`\`

Respond ONLY with a single raw JSON object matching the following structure (do not include any conversational intro or extra text):
{
  "accountId": "the exact account ID from the chart of accounts",
  "vatType": "the suggested VAT type string",
  "confidence": 95,
  "merchantName": "Identified Merchant Name",
  "merchantCategory": "Business Category",
  "suggestedKeyword": "CLEAN_UPPERCASE_KEYWORD"
}`;

  try {
    const response = await customAi.generate({
      model: 'googleai/gemini-3.5-flash',
      config: {
        googleSearchRetrieval: true,
      },
      prompt: promptText,
    });

    const parsed = extractJson(response.text || '{}');

    return {
      accountId: String(parsed.accountId || ''),
      vatType: (parsed.vatType as VatType) || 'no_vat',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      merchantName: String(parsed.merchantName || 'Identified Merchant'),
      merchantCategory: String(parsed.merchantCategory || 'General'),
      suggestedKeyword: String(parsed.suggestedKeyword || input.description).toUpperCase(),
    };
  } catch (err) {
    console.error("Error in suggestTransactionAllocationWeb:", err);
    return {
      accountId: '',
      vatType: 'no_vat',
      confidence: 0,
      merchantName: 'Unknown',
      merchantCategory: 'General',
      suggestedKeyword: input.description.toUpperCase(),
    };
  }
}
