'use server';
/**
 * @fileOverview An AI agent for matching and allocating bank transactions based on spreadsheet rows.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { allVatTypes } from '@/lib/vat-types';

const AllocationMatchSchema = z.object({
  transactionId: z.string().describe('The ID of the bank transaction being allocated.'),
  accountId: z.string().describe('The ID of the general ledger account, customer, or supplier from the client\'s database.'),
  accountType: z.enum(['account', 'supplier', 'customer']).describe('The type of allocation target.'),
  vatType: z.enum(allVatTypes.map(v => v.name) as unknown as [string, ...string[]]).describe('The suggested VAT type.'),
  confidence: z.number().min(0).max(100).describe('Matching confidence percentage (0-100).'),
  explanation: z.string().describe('Clear reasoning explaining how this was matched from the spreadsheet.'),
});

const AllocateFromSpreadsheetInputSchema = z.object({
  spreadsheetData: z.string().describe('JSON array of spreadsheet rows containing columns like Description/Merchant, Amount, Target Account/Category, VAT.'),
  unallocatedTransactions: z.array(z.any()).describe('List of unallocated transaction records.'),
  chartOfAccounts: z.string().describe('JSON string of the chart of accounts.'),
  customers: z.array(z.any()).describe('List of customers.'),
  suppliers: z.array(z.any()).describe('List of suppliers.'),
  isVatRegistered: z.boolean().describe('Whether the client is VAT registered.'),
});
export type AllocateFromSpreadsheetInput = z.infer<typeof AllocateFromSpreadsheetInputSchema>;

const AllocateFromSpreadsheetOutputSchema = z.object({
  matches: z.array(AllocationMatchSchema).describe('The list of matched allocations.'),
  summary: z.string().describe('Overall summary of the analysis and match results.'),
});
export type AllocateFromSpreadsheetOutput = z.infer<typeof AllocateFromSpreadsheetOutputSchema>;

export async function allocateFromSpreadsheet(
  input: AllocateFromSpreadsheetInput
): Promise<AllocateFromSpreadsheetOutput> {
  return allocateFromSpreadsheetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'allocateFromSpreadsheetPrompt',
  model: 'googleai/gemini-3.5-flash',
  input: { schema: AllocateFromSpreadsheetInputSchema },
  output: { schema: AllocateFromSpreadsheetOutputSchema },
  prompt: `You are 'Khai', an expert South African Chartered Accountant. Your task is to analyze an uploaded spreadsheet of transactions/allocations and map it to a list of unallocated bank transactions.

**CONTEXT:**
- **Client VAT Status**: {{#if isVatRegistered}}Registered for VAT{{else}}NOT Registered for VAT{{/if}}
- **Unallocated Bank Transactions**:
{{#each unallocatedTransactions}}
  - ID: "{{this.id}}", Date: "{{this.date}}", Description: "{{this.description}}", Amount: {{this.amount}}, isExpense: {{this.isExpense}}
{{/each}}

- **Spreadsheet Rows (JSON)**:
{{{spreadsheetData}}}

- **Chart of Accounts**:
{{{chartOfAccounts}}}

- **Customers**:
{{#each customers}}
  - ID: "{{this.id}}", Name: "{{this.name}}"
{{/each}}

- **Suppliers**:
{{#each suppliers}}
  - ID: "{{this.id}}", Name: "{{this.name}}"
{{/each}}

**INSTRUCTIONS:**
1. **Analyze spreadsheetData**: Read the spreadsheet rows. They might use various header names (e.g., "Merchant", "Description", "GL Account", "Account", "Category", "Amount", "Total", "Date"). Use semantic matching to understand the content.
2. **Match Transactions**: Find matching transactions in the 'Unallocated Bank Transactions' list. A match exists if:
   - The transaction description is semantically similar to the spreadsheet row's description/merchant (e.g., "PNP RETAILERS" matches "Pick 'n Pay").
   - And/or the amount is identical or very close.
   - If the spreadsheet contains a date, match rows that are within a few days of each other.
3. **Resolve Target Allocation**:
   - For each match, map the target account/category/supplier/customer from the spreadsheet to the exact ID in the database:
     - Check if it refers to a Customer name in the Customers list. If yes, set accountType to 'customer' and accountId to the customer's ID.
     - Check if it refers to a Supplier name in the Suppliers list. If yes, set accountType to 'supplier' and accountId to the supplier's ID.
     - Otherwise, find the closest matching General Ledger Account in the Chart of Accounts. Set accountType to 'account' and accountId to the Account's ID (which is its number, e.g. "3800/000").
4. **Determine VAT Type**:
   - If the client is NOT registered for VAT, set 'vatType' to 'no_vat' for all matches.
   - If registered for VAT, choose the most appropriate VAT type (e.g. 'standard_rated_purchases' for expenses, 'standard_rated_sales' for sales, or 'no_vat' if it's exempt or zero-rated).
5. **Confidence & Explanation**:
   - Only include a match in the 'matches' list if you have a confidence score of 70% or higher.
   - Provide a clear, professional explanation of the matching logic (e.g., "Matched description 'VODACOM' with spreadsheet row for account 'Telephone & Internet'").
6. **Overall Summary**: Provide a friendly, expert summary of the results (e.g. "I analyzed the spreadsheet and matched 8 of your 10 unallocated transactions. 2 could not be matched with high confidence.").

Return your suggestions as structured JSON matching the output schema.
`,
});

const allocateFromSpreadsheetFlow = ai.defineFlow(
  {
    name: 'allocateFromSpreadsheetFlow',
    inputSchema: AllocateFromSpreadsheetInputSchema,
    outputSchema: AllocateFromSpreadsheetOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
