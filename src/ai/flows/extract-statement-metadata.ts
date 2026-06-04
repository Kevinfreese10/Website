'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractStatementMetadataInputSchema = z.object({
  statementPdf: z.string().describe(
    "A document of a bank statement (image or PDF), as a data URI."
  ),
});
export type ExtractStatementMetadataInput = z.infer<typeof ExtractStatementMetadataInputSchema>;

const ExtractStatementMetadataOutputSchema = z.object({
  bankName: z.string().optional().describe("The name of the bank (e.g. FNB, Standard Bank, Nedbank, Capitec, ABSA, etc.). Fallback to 'Unknown'."),
  accountNumber: z.string().optional().describe("The bank account number. If not found, return 'Unknown'."),
  holderName: z.string().optional().describe("The name of the account holder. If not found, return 'Unknown'."),
  startDate: z.string().optional().describe("The start date of the statement period in 'YYYY-MM-DD' format. If not found, look at the first transaction date."),
  endDate: z.string().optional().describe("The end date of the statement period in 'YYYY-MM-DD' format. If not found, look at the last transaction date."),
  openingBalance: z.number().optional().describe("The opening balance from the statement. Fallback to 0 if not found."),
  closingBalance: z.number().optional().describe("The closing balance from the statement. Fallback to 0 if not found."),
  currency: z.string().optional().describe("The currency of the statement (e.g. ZAR, USD, etc.).").default("ZAR"),
  confidence: z.number().min(0).max(100).optional().describe("Confidence score (0-100) on the extracted metadata.").default(80),
});
export type ExtractStatementMetadataOutput = z.infer<typeof ExtractStatementMetadataOutputSchema>;

const prompt = ai.definePrompt({
  name: 'extractStatementMetadataPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: ExtractStatementMetadataInputSchema },
  output: { schema: ExtractStatementMetadataOutputSchema },
  prompt: `You are an expert financial document extraction agent. Your task is to identify and extract the bank account details, period range, and balances from the provided bank statement.

  Please extract:
  1. bankName: The name of the bank (e.g. FNB, Nedbank, Capitec, Standard Bank, ABSA, Mercantile, etc.).
  2. accountNumber: The full account number. Look for labels like 'Account No', 'Account Number', or checking/savings details. If masked, return the masked version.
  3. holderName: The holder or company name the statement is addressed to.
  4. startDate: The first day of the statement period (YYYY-MM-DD). Look for statement period dates, or the date of the first transaction.
  5. endDate: The last day of the statement period (YYYY-MM-DD). Look for statement period dates, or the date of the last transaction.
  6. openingBalance: The starting/opening balance of the statement.
  7. closingBalance: The ending/closing balance of the statement.
  8. currency: Default to ZAR if South African, or detect the currency code.

  If you cannot find any of these fields, return null or omit them from the output object. DO NOT guess if there is absolutely no evidence, but do scan the entire document pages carefully.
  
  Analyze the following document:
  {{media url=statementPdf}}
  `,
});

const extractStatementMetadataFlow = ai.defineFlow(
  {
    name: 'extractStatementMetadataFlow',
    inputSchema: ExtractStatementMetadataInputSchema,
    outputSchema: ExtractStatementMetadataOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function extractStatementMetadata(
  input: ExtractStatementMetadataInput
): Promise<ExtractStatementMetadataOutput> {
  return extractStatementMetadataFlow(input);
}
