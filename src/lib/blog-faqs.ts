export type BlogFaqItem = {
  q: string;
  a: string;
};

/**
 * Curated, high-intent FAQ questions and answers for top search-volume blog posts.
 * Used for both on-page interactive accordion UI and Schema.org FAQPage structured data
 * to capture Google SERP rich snippets and AI overview citations.
 */
export const CURATED_BLOG_FAQS: Record<string, BlogFaqItem[]> = {
  'find-your-south-african-tax-reference-number-quick-guide': [
    {
      q: 'How can I find my SARS tax reference number online?',
      a: 'You can find your 10-digit SARS tax number online via SARS eFiling under Notice of Registration (IT150), through the official SARS Online Query System (SOQS), or via the SARS WhatsApp service by messaging 0800 00 7277.',
    },
    {
      q: 'What does a South African SARS tax number look like?',
      a: 'A South African SARS income tax reference number is a unique 10-digit number. For individuals, it begins with 0, 1, 2, or 3, whereas VAT registration numbers strictly begin with the digit 4.',
    },
    {
      q: 'How can I get my SARS tax number via SMS?',
      a: 'Send an SMS to SARS on 33063 with the keyword "TRN" followed by a space and your 13-digit South African ID number. SARS will reply with your tax reference number if your mobile number matches your eFiling profile.',
    },
    {
      q: 'Can I get a Tax Clearance Certificate (TCS PIN) once I have my tax number?',
      a: 'Yes. Once your tax number is active and all tax returns and debts are up to date, you can request a Tax Compliance Status (TCS) PIN for tenders, employment, or foreign investment directly via eFiling or let My Accountant issue it for R350.',
    },
  ],

  'ncr-registration-your-key-to-sa-credit-compliance': [
    {
      q: 'Who is required to register with the National Credit Regulator (NCR)?',
      a: 'Under the National Credit Act (NCA), any individual or business in South Africa that enters into credit agreements as a credit provider must register with the NCR, regardless of loan turnover or capital threshold.',
    },
    {
      q: 'How much does NCR registration cost in South Africa (2026)?',
      a: 'NCR registration fees comprise a non-refundable application fee (R550), an initial registration fee (starting from R2,000 based on total credit turnover), branch fees, and statutory criminal clearance fees. Use our free NCR fee calculator for an exact breakdown.',
    },
    {
      q: 'What documents are required for NCR registration?',
      a: 'Key requirements include a completed NCR Form 2, CIPC company registration documents, certified IDs of all directors, SAPS criminal record clearance (SAPS 91a / AFIS), tax compliance status PIN, and proof of bank account.',
    },
    {
      q: 'How long does it take to receive an NCR registration certificate?',
      a: 'NCR application processing typically takes between 20 to 60 working days once all compliant documentation, fee proofs, and police clearances have been submitted to the National Credit Regulator.',
    },
  ],

  'start-a-business-in-sa-for-under-r500-your-guide': [
    {
      q: 'What business can I start with R500 in South Africa?',
      a: 'With R500, you can launch service-based micro-businesses requiring minimal inventory, such as mobile car cleaning, home cleaning, freelance writing or social media management, tutoring, or snack and cold drink distribution.',
    },
    {
      q: 'How much does direct CIPC company registration cost?',
      a: 'Direct CIPC registration costs R175 for company name reservation and registration. Professional registration packages with share certificates, B-BBEE affidavit, and tax setup start at R950.',
    },
    {
      q: 'Do I need a registered company before starting a small business?',
      a: 'No. You can start operating immediately as a Sole Proprietor using your personal name and bank account. Once your revenue grows or you need corporate contracts and funding, you should register a Pty Ltd company.',
    },
  ],

  'remission-of-sars-interest--penalties-your-guide': [
    {
      q: 'Under what grounds will SARS grant remission of penalties?',
      a: 'SARS may remit administrative non-compliance penalties under Section 217 or Section 218 of the Tax Administration Act (TAA) for a first incidence of non-compliance, nominal non-compliance, or where exceptional circumstances occurred (such as serious illness, natural disaster, postal delay, or SARS system failure).',
    },
    {
      q: 'How do I submit a Request for Remission (RFR01) to SARS?',
      a: 'Log in to SARS eFiling, navigate to Returns > Dispute Resolution > Request for Remission (RFR01), select the relevant tax type and period, specify the statutory grounds under Section 217 or 218 of the TAA, attach supporting documentary evidence, and submit within 30 business days.',
    },
    {
      q: 'Can SARS remit interest charged on late tax payments?',
      a: 'Yes, but interest remission is strictly governed under Section 187(6) and 187(7) of the TAA. SARS will only waive interest if the taxpayer proves the delay was directly caused by circumstances beyond their control or SARS administrative error.',
    },
  ],

  'ncr-registration-your-essential-guide-in-south-africa': [
    {
      q: 'What is the difference between NCR Form 2 and NCR Form 40?',
      a: 'NCR Form 2 is the statutory application form submitted to register as a new credit provider under Section 40 of the NCA. NCR Form 40 is the annual compliance return and financial statistical report required from registered credit providers.',
    },
    {
      q: 'Do small micro-lenders or pawn brokers need to register with the NCR?',
      a: 'Yes. Following the removal of the R500,000 threshold in 2016, any person or entity in South Africa who provides credit with interest or finance charges must be registered with the National Credit Regulator, even if lending to just one consumer.',
    },
    {
      q: 'What is an NCR compliance audit and who performs it?',
      a: 'An NCR compliance audit is an independent review of a credit provider\'s loan agreements, interest calculations, credit life insurance, and statutory reporting. It must be conducted annually by a registered auditor or qualified accounting officer.',
    },
  ],
};
