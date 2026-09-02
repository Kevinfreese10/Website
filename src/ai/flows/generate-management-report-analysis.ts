'use server';

/**
 * @fileOverview AI Flow for Khai generating comprehensive executive management commentary,
 * financial health diagnostics, and strategic recommendations for South African entities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TopExpenseCategorySchema = z.object({
  name: z.string(),
  amount: z.number(),
  percentOfTotal: z.number(),
});

export const ManagementReportAnalysisInputSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  periodLabel: z.string().describe('The reporting period (e.g. "February 2026" or "FY2026 YTD").'),
  comparativePeriodLabel: z.string().optional().describe('The comparative period label (e.g. "January 2026").'),
  isVatRegistered: z.boolean().default(false),
  currentRevenue: z.number(),
  priorRevenue: z.number(),
  currentGrossProfit: z.number(),
  priorGrossProfit: z.number(),
  currentGrossMarginPct: z.number(),
  priorGrossMarginPct: z.number(),
  currentOpex: z.number(),
  priorOpex: z.number(),
  currentNetProfit: z.number(),
  priorNetProfit: z.number(),
  currentNetMarginPct: z.number(),
  priorNetMarginPct: z.number(),
  cashBalance: z.number(),
  priorCashBalance: z.number(),
  netCashChange: z.number(),
  debtorsBalance: z.number(),
  creditorsBalance: z.number(),
  overdueDebtorsAmount: z.number(),
  overdueCreditorsAmount: z.number(),
  topExpenseCategories: z.array(TopExpenseCategorySchema),
  vatDueOrRefund: z.number().optional(),
  provisionalTaxEstimate: z.number().optional(),
});
export type ManagementReportAnalysisInput = z.infer<typeof ManagementReportAnalysisInputSchema>;

export const ManagementReportAnalysisOutputSchema = z.object({
  executiveSummary: z.string().describe('Crisp 2-3 paragraph executive summary of overall financial performance and position.'),
  revenueAndMarginInsights: z.string().describe('Analysis of revenue trends, gross margin expansion/compression, and driver dynamics.'),
  costControlObservations: z.string().describe('Observations on operational expenditure, overhead efficiency, and significant expense categories.'),
  cashFlowAndLiquidity: z.string().describe('Evaluation of cash runway, working capital cycle, debtors collection, and liquidity buffer.'),
  taxAndStatutoryHealth: z.string().describe('Status on VAT compliance, provisional tax obligations, and statutory provisions.'),
  keyRecommendations: z.array(z.string()).describe('3-5 specific, high-priority, actionable recommendations for management/directors.'),
  healthScore: z.number().min(1).max(100).describe('Financial health score from 1 to 100.'),
  riskFlags: z.array(z.string()).describe('Immediate risks or red flags detected (e.g. negative cashflow, high debtor aging, shrinking margin).'),
});
export type ManagementReportAnalysisOutput = z.infer<typeof ManagementReportAnalysisOutputSchema>;

export async function generateManagementReportAnalysis(
  input: ManagementReportAnalysisInput
): Promise<ManagementReportAnalysisOutput> {
  return generateManagementReportAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'managementReportAnalysisPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: ManagementReportAnalysisInputSchema },
  output: { schema: ManagementReportAnalysisOutputSchema },
  prompt: `You are 'Khai', an elite South African Chartered Accountant (CA(SA)) and Senior AI Financial Controller.
You are compiling a formal Executive Management Accounts Pack & Commentary for the directors of **{{companyName}}**.

### REPORTING CONTEXT:
- **Reporting Period**: {{periodLabel}} (Comparative: {{comparativePeriodLabel}})
- **VAT Registered**: {{#if isVatRegistered}}Yes (15% VAT Vendor){{else}}No{{/if}}

### FINANCIAL METRICS:
1. **Revenue**: Current = R {{currentRevenue}}, Prior = R {{priorRevenue}}
2. **Gross Profit**: Current = R {{currentGrossProfit}} ({{currentGrossMarginPct}}%), Prior = R {{priorGrossProfit}} ({{priorGrossMarginPct}}%)
3. **Operational Expenses (OPEX)**: Current = R {{currentOpex}}, Prior = R {{priorOpex}}
4. **Net Profit**: Current = R {{currentNetProfit}} ({{currentNetMarginPct}}%), Prior = R {{priorNetProfit}} ({{priorNetMarginPct}}%)
5. **Cash & Liquidity**: Cash Balance = R {{cashBalance}} (Prior = R {{priorCashBalance}}, Net Movement = R {{netCashChange}})
6. **Working Capital**: Trade Debtors = R {{debtorsBalance}} (Overdue = R {{overdueDebtorsAmount}}), Trade Creditors = R {{creditorsBalance}} (Overdue = R {{overdueCreditorsAmount}})
7. **Top Expense Items**:
{{#each topExpenseCategories}}
   - {{this.name}}: R {{this.amount}} ({{this.percentOfTotal}}% of OPEX)
{{/each}}
8. **Statutory & Tax**:
   - Estimated VAT Position: R {{vatDueOrRefund}}
   - Estimated Provisional Tax: R {{provisionalTaxEstimate}}

### INSTRUCTIONS:
- Deliver an articulate, executive-ready board review that is incisive, commercial, and actionable.
- Format the executive summary and sections in clean, professional prose (using bold sub-headers where appropriate).
- Cite South African accounting realities (e.g., SARS compliance, VAT cashflow impact, working capital management, prudent OPEX control).
- Calculate and assign an objective Financial Health Score (1-100) based on profitability, cash runway, and margin sustainability.
- List any genuine risk flags (or note if financial health is robust).
- Provide 3 to 5 razor-sharp strategic recommendations.`,
});

const generateManagementReportAnalysisFlow = ai.defineFlow(
  {
    name: 'generateManagementReportAnalysisFlow',
    inputSchema: ManagementReportAnalysisInputSchema,
    outputSchema: ManagementReportAnalysisOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) {
      throw new Error('Failed to generate management report commentary.');
    }
    return output;
  }
);
