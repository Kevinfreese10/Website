'use server';
/**
 * @fileOverview An AI agent for extracting transaction data from bank statements.
 *
 * - extractStatementData - A function that takes a bank statement and returns structured transaction data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractStatementDataInputSchema = z.object({
  statementFile: z.string().describe(
    "A document of a bank statement (PDF or Image), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  apiKey: z.string().optional().describe("An optional Google AI API key to use for this specific extraction."),
});
export type ExtractStatementDataInput = z.infer<typeof ExtractStatementDataInputSchema>;

const TransactionLineSchema = z.object({
    date: z.string().describe("The transaction date in 'YYYY-MM-DD' format."),
    description: z.string().describe("The full transaction description."),
    amount: z.number().describe("The transaction amount. Use negative numbers for debits/payments and positive numbers for credits/receipts."),
});

const ExtractStatementDataOutputSchema = z.object({
  transactions: z.array(TransactionLineSchema).describe("An array of all transactions from the statement."),
});
export type ExtractStatementDataOutput = z.infer<typeof ExtractStatementDataOutputSchema>;

/**
 * Wrapper function called by the application.
 */
export async function extractStatementData(
  input: ExtractStatementDataInput
): Promise<ExtractStatementDataOutput> {
  // Extract MIME type from data URI
  const mimeType = input.statementFile.split(';')[0].split(':')[1] || 'application/pdf';

  let currentAi = ai;

  if (input.apiKey) {
    const { genkit } = await import('genkit');
    const { googleAI } = await import('@genkit-ai/google-genai');
    
    currentAi = genkit({
      plugins: [googleAI({ apiKey: input.apiKey })],
    });
  }

  const { output } = await currentAi.generate({
    model: 'googleai/gemini-2.5-flash',
    output: { schema: ExtractStatementDataOutputSchema },
    prompt: [
      { text: `You are an expert OCR and financial data extraction agent specializing in South African bank statements.

Your task is to analyze the provided bank statement page(s) (PDF or Image) and extract every single transaction with 100% accuracy.

Strictly follow these rules:
1.  **Date**: Extract the transaction date, always formatted as YYYY-MM-DD. If the statement only contains day and month (e.g. 02/06 or 03 Jun), infer the correct year from the statement header or context.
2.  **Description**: Extract the full, untruncated description of the transaction as it appears on the statement.
3.  **Amount**: The transaction amount. It is CRITICAL to use negative numbers for any debits, payments, withdrawals, or money out, and positive numbers for any credits, deposits, receipts, or money in.
4.  **Bank Fees / Service Charges**: If a transaction row contains a bank fee or charge (often in a dedicated 'Fee', 'Charge', 'Fee*', or 'Service Fee' column, or explicitly listed on the same row), you MUST generate a separate, additional transaction line in the output for this fee. Do NOT combine the fee with the main transaction amount.
    - The fee transaction must have the same date as the parent transaction.
    - The fee description should append ' (BANK FEE)' to the parent description, or be formatted as 'Bank Fee: [Parent Description]'.
    - The fee amount must be a negative number (e.g. -10.00).
5.  **Numeric Formats**: South African statements often use spaces or commas as thousands separators (e.g., '10 000.00' or '-1 200,50') and currency symbols (e.g., 'R'). Clean these formats and parse them as proper floating-point numbers (e.g., 10000.00 or -1200.50).
6.  **Exclude Running Balances & Totals**: Never extract values from the 'Balance' column or any page sub-totals, totals, or overview summary boxes as transactions.

If the document is a scanned image, use advanced OCR to ensure every character is read correctly.` },
      { media: { url: input.statementFile, contentType: mimeType } }
    ],
  });

  if (!output) {
    throw new Error("Failed to extract statement transactions");
  }

  return output;
}

