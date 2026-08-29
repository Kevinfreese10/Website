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
  bankName: z.string().optional().describe("The name of the bank (e.g. FNB, Standard Bank, Nedbank, Capitec, ABSA, Investec, etc.). Fallback to 'Unknown'."),
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

export async function extractStatementMetadata(
  input: ExtractStatementMetadataInput
): Promise<ExtractStatementMetadataOutput> {
  const mimeType = input.statementPdf.split(';')[0].split(':')[1] || 'application/pdf';

  const { output } = await ai.generate({
    model: 'googleai/gemini-3.5-flash',
    output: { schema: ExtractStatementMetadataOutputSchema },
    prompt: [
      { text: `You are an expert OCR and financial document analysis agent.
Your task is to analyze the provided bank statement page(s) and extract the key metadata with 100% accuracy.

Strictly look for the following fields:
1. bankName: Identify which bank issued this statement (e.g. FNB, First National Bank, Standard Bank, Nedbank, Capitec, ABSA, Mercantile Bank, Investec, Discovery Bank, TymeBank, etc.). Return the short name/standard name of the bank.
2. accountNumber: The full bank account number. Search the header, footers, and overview sections extremely carefully. It is usually labeled with:
   - "Account Number", "Account No.", "Acc No.", "Acc. No.", "Account number", "Checking Account", "Current Account", "Savings Account"
   - In South Africa, it's typically 10 to 13 digits.
   - If it is masked (e.g., xxxxxx1234), return the masked version. DO NOT ignore it. If there is a "Portfolio Number" or "Client Number" that is used as the account ID, use that.
3. holderName: The full legal name or company name of the account holder/client. Look for the address block or "Account Holder" name.
4. startDate: The starting date of the statement period in YYYY-MM-DD format. Look for "Statement Period", "Period", or similar labels (e.g. "from 2026/04/01"). If there is no period label, use the date of the first transaction listed on the page.
5. endDate: The ending date of the statement period in YYYY-MM-DD format. Look for "Statement Period", "Period", or similar labels (e.g. "to 2026/04/30"). If there is no period label, use the date of the last transaction listed on the page.
6. openingBalance: The opening balance / starting balance of this period. Look for "Opening Balance", "Balance Brought Forward", "Prev Bal", "Brought Forward", or similar. If not found, look at the balance column on the first transaction or assume 0.
7. closingBalance: The closing balance / ending balance of this period. Look for "Closing Balance", "New Balance", "Balance Carried Forward", "Carried Forward", or similar.
8. currency: The three-letter currency code (e.g. ZAR, USD, EUR). Default to ZAR if it is a South African bank statement.

Scan the header, footer, and tables of the document carefully to extract these values.` },
      { media: { url: input.statementPdf, contentType: mimeType } }
    ]
  });

  if (!output) {
    throw new Error("Failed to extract statement metadata");
  }

  return output;
}

