'use server';

/**
 * @fileOverview An AI agent for web-grounded transaction allocation suggestions.
 * 
 * Uses Gemini search grounding to identify unknown merchants, check CIPC company registration
 * and SARS VAT vendor status, and suggest the GL account, canonical VAT type, confidence,
 * merchant metadata, and clean rule keywords.
 */

import { ai, getCustomAi } from '@/ai/genkit';
import { z } from 'zod';
import { VatType } from '@/lib/types';

import { CANONICAL_VAT_TYPES, normalizeVatType } from '@/lib/vat-types';

const SuggestTransactionAllocationWebInputSchema = z.object({
  description: z.string().describe('The bank transaction description (e.g., "WOOLWORTHS #4223").'),
  chartOfAccounts: z.string().describe('A JSON string of the chart of accounts, with "id", "accountNumber", and "description" fields.'),
  isVatRegistered: z.boolean().optional().describe('Whether the client is registered for VAT.'),
  apiKey: z.string().optional().describe('An optional Google AI API key to use for this specific suggestion.'),
  paymentChannel: z.string().optional().describe('Payment channel if known (e.g. DEBIT_ORDER, POS, etc.)'),
  extractedVatNumber: z.string().optional().describe('Extracted 10-digit SA VAT number if available'),
  amount: z.number().optional().describe('Transaction amount in ZAR if available'),
});

export type SuggestTransactionAllocationWebInput = z.infer<typeof SuggestTransactionAllocationWebInputSchema>;

export type SuggestTransactionAllocationWebOutput = {
  accountId: string;
  vatType: VatType;
  confidence: number;
  merchantName: string;
  merchantCategory: string;
  suggestedKeyword: string;
  rationale?: string;
  cipcRegistered?: boolean;
  vatVendorStatus?: 'registered' | 'unregistered' | 'exempt' | 'unknown';
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

  const promptText = `You are an experienced South African Chartered Accountant. Your task is to perform web-grounded research on a bank transaction description, identify the merchant, check CIPC registration and SARS VAT vendor status, and suggest the correct general ledger account and canonical South African VAT type.

Use Google Search to look up the merchant or entity in the raw bank description.

Determine:
1. Merchant identity and standard industry category (e.g. "Fuel & Petroleum", "Supermarket Retail", "Telecommunications", "Software & IT").
2. CIPC company registration status (e.g. whether it is a registered South African (Pty) Ltd, CC, Inc, or State entity).
3. SARS VAT vendor status (registered vendor vs exempt entity vs unregistered).
4. Correct general ledger account from the provided chart of accounts.
5. Correct canonical VAT type from the 8 South African statutory VAT types.

**Client VAT Status**: The client is ${input.isVatRegistered ? 'REGISTERED' : 'NOT REGISTERED'} for VAT.

**CRITICAL INSTRUCTION ON CANONICAL VAT TYPES**:
The 'vatType' field MUST strictly be one of the following 8 canonical South African VAT types:
- 'standard_rated_purchases': Standard 15% VAT deductible business purchases (e.g., stationery, IT services, telephone, repairs, advertising, consulting, consumables).
- 'zero_rated_purchases': Specifically commercial fuel purchases (petrol, diesel under Section 11(1)(h) of the VAT Act) and zero-rated basic foodstuffs.
- 'exempt_purchases': Specifically bank fees, financial service charges, life insurance, and residential accommodation (Section 12 of the VAT Act).
- 'capital_goods_purchases': Capital equipment, motor vehicles, or plant machinery exceeding capital threshold.
- 'no_vat': Strictly for non-VAT registered vendors, SARS tax liability settlements (VAT201, EMP201, provisional tax), owner drawings, salaries, and internal bank transfers.
- 'standard_rated_sales', 'zero_rated_sales', 'exempt_sales': For income transactions only.

If the client is NOT registered for VAT (isVatRegistered === false), you MUST set 'vatType' to 'no_vat' for all transactions.

**CRITICAL INSTRUCTION ON LOW/NO INFORMATION**:
If the transaction description is generic (e.g., "CASH", "TRANSFER", "DEBIT ORDER", "PAYMENT", "MONTHLY FEE", "INTEREST"), obfuscated, or if web search yields no useful information about the merchant:
- Set 'confidence' to 0 (or less than 15).
- Set 'merchantName' to "Unknown / Generic".
- Set 'merchantCategory' to "General".
- Set 'suggestedKeyword' to the clean uppercase description.
- Set 'cipcRegistered' to false.
- Set 'vatVendorStatus' to "unknown".
- Set 'rationale' to "Insufficient data from bank description".

**Transaction Description**: ${input.description}
${input.amount !== undefined ? `**Transaction Amount**: R ${input.amount.toFixed(2)}` : ''}
${input.paymentChannel ? `**Payment Channel**: ${input.paymentChannel}` : ''}
${input.extractedVatNumber ? `**Extracted SA VAT Number**: ${input.extractedVatNumber}` : ''}

**Chart of Accounts**:
\`\`\`json
${input.chartOfAccounts}
\`\`\`

Respond ONLY with a single raw JSON object matching the following structure (do not include any conversational intro or extra text):
{
  "accountId": "the exact account ID from the chart of accounts",
  "vatType": "standard_rated_purchases | zero_rated_purchases | exempt_purchases | capital_goods_purchases | no_vat | standard_rated_sales | zero_rated_sales | exempt_sales",
  "confidence": 95,
  "merchantName": "Identified Merchant Name",
  "merchantCategory": "Business Category",
  "suggestedKeyword": "CLEAN_UPPERCASE_KEYWORD",
  "cipcRegistered": true,
  "vatVendorStatus": "registered | unregistered | exempt | unknown",
  "rationale": "Brief rationale detailing search evidence, CIPC entity structure, and statutory VAT justification"
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
      vatType: input.isVatRegistered === false ? 'no_vat' : normalizeVatType(parsed.vatType, (input.amount ?? -1) < 0),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      merchantName: String(parsed.merchantName || 'Identified Merchant'),
      merchantCategory: String(parsed.merchantCategory || 'General'),
      suggestedKeyword: String(parsed.suggestedKeyword || input.description).toUpperCase(),
      rationale: parsed.rationale ? String(parsed.rationale) : undefined,
      cipcRegistered: typeof parsed.cipcRegistered === 'boolean' ? parsed.cipcRegistered : undefined,
      vatVendorStatus: ['registered', 'unregistered', 'exempt', 'unknown'].includes(parsed.vatVendorStatus) ? parsed.vatVendorStatus : 'unknown',
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
      rationale: 'Web research failed or timed out',
      cipcRegistered: false,
      vatVendorStatus: 'unknown'
    };
  }
}
