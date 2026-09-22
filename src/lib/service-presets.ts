/**
 * @fileOverview Curated, sanitized standard presets for Product Prerequisites and Client Document Uploads.
 * Ensures consistent spelling, professional grammar, and standardized South African accounting terminology.
 */

export type PresetCategory<T> = {
  category: string;
  items: T[];
};

export type PrerequisitePreset = {
  id: string;
  title: string;
  description?: string;
};

export type DocumentRequirementPreset = {
  id: string;
  label: string;
  type: 'pdf' | 'excel' | 'image' | 'text' | 'any' | 'coida_industry' | 'datetime';
  helpText: string;
  isRequired: boolean;
  isSecret?: boolean;
  isConditional?: boolean;
  conditionalQuestion?: string;
  aiHint?: string;
};

/**
 * Curated standard prerequisites for South African accounting, tax, CIPC, and payroll services.
 */
export const STANDARD_PREREQUISITE_GROUPS: PresetCategory<PrerequisitePreset>[] = [
  {
    category: 'Identity & Legal Standing (KYC / FICA)',
    items: [
      {
        id: 'kyc_id_director',
        title: 'Certified copy of South African ID or valid passport for all active directors/shareholders (certified within 3 months)',
      },
      {
        id: 'kyc_proof_address',
        title: 'Proof of residential address not older than 3 months (utility bill, municipal account, or signed lease agreement)',
      },
      {
        id: 'kyc_business_address',
        title: 'Proof of physical business address / operating premises (municipal account or signed lease agreement)',
      },
      {
        id: 'kyc_mandate_poa',
        title: 'Signed Power of Attorney (Mandate) authorizing representation with statutory authorities',
      },
    ],
  },
  {
    category: 'Company & CIPC Registration',
    items: [
      {
        id: 'cipc_cor143',
        title: 'Active CIPC company registration certificate (COR14.3 / CK1 / CK2 / Standard MOI)',
      },
      {
        id: 'cipc_entity_standing',
        title: 'Active and compliant South African registered legal entity in good standing with the CIPC',
      },
      {
        id: 'cipc_name_reservation',
        title: 'Four (4) unique proposed company names listed in order of preference for CIPC name reservation',
      },
      {
        id: 'cipc_share_register',
        title: 'Signed share certificates, securities register, and resolution of directors',
      },
      {
        id: 'cipc_annual_turnover',
        title: 'Confirmed total annual turnover figure for the preceding financial year for CIPC return calculation',
      },
    ],
  },
  {
    category: 'SARS & Tax Compliance',
    items: [
      {
        id: 'sars_tax_number',
        title: 'Valid South African Revenue Service (SARS) Income Tax Reference Number',
      },
      {
        id: 'sars_efiling_access',
        title: 'Active SARS Registered Representative status or authorized SARS eFiling portfolio access',
      },
      {
        id: 'sars_tcs_pin',
        title: 'Active Tax Compliance Status (TCS) PIN or recent SARS Notice of Registration',
      },
      {
        id: 'sars_vat_number',
        title: 'Valid SARS Value-Added Tax (VAT) registration number (VAT vendor status)',
      },
      {
        id: 'sars_paye_number',
        title: 'Valid SARS Pay-As-You-Earn (PAYE / UIF / SDL) employer registration number',
      },
    ],
  },
  {
    category: 'Financial, Accounting & Banking Records',
    items: [
      {
        id: 'bank_confirmation_letter',
        title: 'Official bank account confirmation letter with account details and bank stamp (not older than 3 months)',
      },
      {
        id: 'bank_statements_pdf',
        title: 'Consecutive 6 to 12 months official bank statements in original electronic PDF format (no scans or photos)',
      },
      {
        id: 'bank_statements_csv',
        title: 'Electronic bank statement transaction export in CSV / Excel format for ledger processing',
      },
      {
        id: 'invoices_sales_purchases',
        title: 'Complete customer sales invoices and supplier purchase invoices/slips for the reporting period',
      },
      {
        id: 'prior_financial_statements',
        title: 'Prior year signed Annual Financial Statements and detailed Trial Balance',
      },
      {
        id: 'fixed_asset_register',
        title: 'Updated Fixed Asset Register including purchase dates, asset descriptions, and cost prices',
      },
    ],
  },
  {
    category: 'Payroll & Department of Employment and Labour (COIDA / UIF)',
    items: [
      {
        id: 'labour_coida_number',
        title: 'Department of Employment and Labour Compensation Fund (COIDA) 99-series reference number',
      },
      {
        id: 'labour_uif_number',
        title: 'Department of Employment and Labour Unemployment Insurance Fund (UIF) commercial reference number',
      },
      {
        id: 'labour_payroll_register',
        title: 'Full employee payroll register detailing employee names, ID numbers, designations, and gross earnings',
      },
      {
        id: 'labour_logs_letter',
        title: 'Valid Letter of Good Standing (LOGS) from the Compensation Commissioner',
      },
    ],
  },
  {
    category: 'Professional Engagement & Accounting Firm Mandate',
    items: [
      {
        id: 'mandate_scope_letter',
        title: 'Full legal name, professional registration details (SAICA / SAIPA / CIBA / SAIBA), and appointment letter',
      },
      {
        id: 'mandate_fee_terms',
        title: 'Agreed scope of accounting services, billing terms, and signed letter of engagement',
      },
      {
        id: 'mandate_contact_parties',
        title: 'Verified contact information (email, phone, physical address) for all authorized signatories',
      },
    ],
  },
];

/**
 * Curated standard client document uploads & intake data requirements: SARS eFiling credentials pack.
 */
export const SARS_EFILING_LOGIN_PACK: DocumentRequirementPreset[] = [
  {
    id: 'doc_sars_efiling_username',
    label: 'SARS eFiling Username',
    type: 'text',
    helpText: 'Primary eFiling username for your personal or company profile. Please ensure the username is active.',
    isRequired: true,
    aiHint: 'SARS eFiling login username.',
  },
  {
    id: 'doc_sars_efiling_password',
    label: 'SARS eFiling Password',
    type: 'text',
    helpText: '⚠️ IMPORTANT: Please test your password on sarsefiling.co.za before submitting to avoid delays or account lockouts. (Stored encrypted at rest).',
    isRequired: true,
    isSecret: true,
    aiHint: 'SARS eFiling login password.',
  },
  {
    id: 'doc_sars_efiling_otp_required',
    label: 'SARS eFiling OTP Required? (Yes / No)',
    type: 'text',
    helpText: 'Specify Yes or No (whether your login triggers an SMS OTP or SARS Mobile App push notification).',
    isRequired: true,
    aiHint: 'Confirmation of whether SARS eFiling login requires multi-factor authentication (OTP/App push).',
  },
  {
    id: 'doc_sars_efiling_otp_time',
    label: 'Best Time to Contact for SARS OTP',
    type: 'datetime',
    helpText: 'Select preferred date, time slot, and direct phone number so our team can coordinate live OTP approval.',
    isRequired: false,
    isConditional: true,
    conditionalQuestion: 'If OTP is required, when is the best time and number to contact you?',
    aiHint: 'Client preferred date, time window, and contact number for live OTP coordination.',
  },
];

/**
 * Curated standard client document requirement groups for South African statutory compliance,
 * tax, accounting, CIPC, banking, and labour requirements.
 */
export const STANDARD_DOCUMENT_REQUIREMENT_GROUPS: PresetCategory<DocumentRequirementPreset>[] = [
  {
    category: 'SARS eFiling Login & OTP Pack',
    items: SARS_EFILING_LOGIN_PACK,
  },
  {
    category: 'Identity & Statutory Documents (KYC / FICA)',
    items: [
      {
        id: 'doc_id_all_directors',
        label: 'Certified ID Copy / Passport (All Directors & Shareholders)',
        type: 'pdf',
        helpText: 'Certified within the last 3 months by a Commissioner of Oaths or Police Station. Clear color scan of Smart ID Card (both sides), Green Barcoded ID Book, or Passport.',
        isRequired: true,
        aiHint: 'Certified South African Smart ID Card (front and back), Green Barcoded ID Book, or Valid Foreign Passport for all active directors/shareholders. Check for visible Commissioner of Oaths or Police certification stamp dated within 3 months, legible ID number, and matching names.',
      },
      {
        id: 'doc_proof_address',
        label: 'Proof of Residential Address',
        type: 'pdf',
        helpText: 'Formal utility bill, municipal rates account, or signed lease agreement not older than 3 months, in the individual’s name.',
        isRequired: true,
        aiHint: 'Proof of residential address dated within 3 months (municipal utility bill, telephone account, signed lease agreement, or formal bank statement). Check name and address clarity.',
      },
      {
        id: 'doc_proof_business_address',
        label: 'Proof of Physical Business Operating Address',
        type: 'pdf',
        helpText: 'Municipal rates bill, commercial lease agreement, or formal utility account in the entity’s name, dated within 3 months.',
        isRequired: true,
        aiHint: 'Official proof of physical business operating address in the entity name dated within 3 months.',
      },
      {
        id: 'doc_signed_poa',
        label: 'Signed Power of Attorney / Client Mandate',
        type: 'pdf',
        helpText: 'Official client appointment mandate and Power of Attorney signed by an authorized director, empowering My Accountant to act on the entity’s behalf.',
        isRequired: true,
        aiHint: 'Signed Power of Attorney or appointment mandate authorizing My Accountant to perform statutory filings. Verify presence of director signature, entity name, and date.',
      },
    ],
  },
  {
    category: 'Company & CIPC Statutory Documents',
    items: [
      {
        id: 'doc_cipc_cor143',
        label: 'CIPC Registration Certificate (COR14.3 / MOI)',
        type: 'pdf',
        helpText: 'Official CIPC company registration certificate (COR14.3 / CK1 / CK2) and Memorandum of Incorporation (MOI) displaying current enterprise details and active directors.',
        isRequired: true,
        aiHint: 'Official CIPC COR14.3, CK1, CK2, or Standard MOI document showing enterprise registration number (YYYY/NNNNNN/07 or 23), registered enterprise name, and list of current active directors.',
      },
      {
        id: 'doc_cipc_npc',
        label: 'Non-Profit Company Registration Documents (COR14.3 / NPC MOI)',
        type: 'pdf',
        helpText: 'Official CIPC registration certificate and customized Non-Profit Memorandum of Incorporation (NPC MOI) showing registered objectives and board members.',
        isRequired: true,
        aiHint: 'Official CIPC Non-Profit Company (NPC) COR14.3 and Non-Profit MOI showing company registration number (ending in /08) and minimum 3 active directors.',
      },
      {
        id: 'doc_cipc_cor39',
        label: 'CIPC Director Change Documents (COR39 / Resignation / Resolution)',
        type: 'pdf',
        helpText: 'Director appointment or resignation documentation, signed board resolution, written resignation letter, or latest CIPC COR39 / Certificate of Confirmation.',
        isRequired: true,
        aiHint: 'CIPC COR39 disclosure certificate, written director resignation letter, or signed shareholder resolution detailing director amendments.',
      },
      {
        id: 'doc_cipc_beneficial_ownership',
        label: 'CIPC Beneficial Ownership Register & Securities Register',
        type: 'pdf',
        helpText: 'Full Beneficial Ownership register, securities register, or share certificates confirming natural persons holding 5% or more direct or indirect ownership.',
        isRequired: true,
        aiHint: 'CIPC Beneficial Ownership declaration register or shareholding structure confirming beneficial owners holding 5% or greater interest.',
      },
      {
        id: 'doc_share_certificates',
        label: 'Signed Share Certificates & Securities Register',
        type: 'pdf',
        helpText: 'Signed share certificates and official securities register detailing shareholder names, share numbers, share classes, and percentage holdings.',
        isRequired: false,
        aiHint: 'Signed share certificates or securities register showing company name, shareholder names, share classes, certificate numbers, and percentage ownership.',
      },
      {
        id: 'doc_cipc_annual_turnover',
        label: 'CIPC Annual Returns Turnover Confirmation',
        type: 'text',
        helpText: 'Confirmed total annual turnover (sales revenue) in South African Rand (ZAR) for each financial year to be filed with CIPC (enter R0 if non-trading).',
        isRequired: true,
        aiHint: 'Confirmed total annual turnover figure in ZAR for the CIPC annual return filing period.',
      },
      {
        id: 'doc_remove_director_count',
        label: 'Number of Directors Resigning or Being Removed',
        type: 'text',
        helpText: 'Select how many directors are resigning or being removed from the company (1 to 5+).',
        isRequired: true,
        aiHint: 'Number of resigning or removed directors to be filed on CIPC CoR39.',
      },
      {
        id: 'doc_company_reg_director_count',
        label: 'Number of Directors to Register',
        type: 'text',
        helpText: 'Select how many initial directors are to be appointed upon incorporation (1 to 5+).',
        isRequired: true,
        aiHint: 'Total count of directors to be registered with CIPC on the company incorporation.',
      },
      {
        id: 'doc_director_1_name',
        label: 'Director 1: Full Name',
        type: 'text',
        helpText: 'Full legal first name(s) and surname of the first director.',
        isRequired: true,
        aiHint: 'Full legal name of the first director.',
      },
      {
        id: 'doc_director_2_name',
        label: 'Director 2: Full Name',
        type: 'text',
        helpText: 'Full legal first name(s) and surname of the second director (conditional on 2+ directors).',
        isRequired: false,
        isConditional: true,
        conditionalQuestion: 'Is a second director resigning, being removed, or being appointed?',
        aiHint: 'Full legal name of the second director.',
      },
      {
        id: 'doc_director_3_name',
        label: 'Director 3: Full Name',
        type: 'text',
        helpText: 'Full legal first name(s) and surname of the third director (conditional on 3+ directors).',
        isRequired: false,
        isConditional: true,
        conditionalQuestion: 'Is a third director resigning, being removed, or being appointed?',
        aiHint: 'Full legal name of the third director.',
      },
      {
        id: 'doc_director_4_name',
        label: 'Director 4: Full Name',
        type: 'text',
        helpText: 'Full legal first name(s) and surname of the fourth director (conditional on 4+ directors).',
        isRequired: false,
        isConditional: true,
        conditionalQuestion: 'Is a fourth director resigning, being removed, or being appointed?',
        aiHint: 'Full legal name of the fourth director.',
      },
      {
        id: 'doc_director_5_name',
        label: 'Director 5: Full Name',
        type: 'text',
        helpText: 'Full legal first name(s) and surname of the fifth director (conditional on 5+ directors).',
        isRequired: false,
        isConditional: true,
        conditionalQuestion: 'Is a fifth director resigning, being removed, or being appointed?',
        aiHint: 'Full legal name of the fifth director.',
      },
    ],
  },
  {
    category: 'COIDA & Labour Compliance',
    items: [
      {
        id: 'doc_coida_industry_classification',
        label: 'COIDA Classification of Industries',
        type: 'coida_industry',
        helpText: 'Select one or more applicable industry classifications from the official 23 COIDA classes (W.Cl.150T) for Compensation Fund assessment rate calculation.',
        isRequired: true,
        aiHint: 'Official COIDA Classification of Industries selection matching business operating activities.',
      },
      {
        id: 'doc_coida_reference',
        label: 'Compensation Fund (COIDA) Reference Number',
        type: 'text',
        helpText: 'Department of Employment and Labour 99-series Compensation Fund registration reference number.',
        isRequired: false,
        aiHint: 'Department of Employment and Labour COIDA 99-series reference number.',
      },
      {
        id: 'doc_coida_cf1b',
        label: 'COIDA CF-1B Change of Nature of Business Application Form',
        type: 'pdf',
        helpText: 'Completed Department of Employment and Labour CF-1B application form with description of operations and director signature.',
        isRequired: true,
        aiHint: 'Completed COIDA CF-1B application form for Compensation Fund registration or nature of business classification change.',
      },
      {
        id: 'doc_coida_logs',
        label: 'COIDA Letter of Good Standing (LOGS)',
        type: 'pdf',
        helpText: 'Valid Certificate or Letter of Good Standing (LOGS) issued by the Compensation Commissioner.',
        isRequired: false,
        aiHint: 'Official Letter of Good Standing from the Compensation Commissioner confirming assessment fees are up to date.',
      },
      {
        id: 'doc_payroll_summary',
        label: 'Monthly Payroll Summary / Employee Register',
        type: 'excel',
        helpText: 'Electronic spreadsheet detailing employee full names, ID numbers, designations, employment dates, and gross earnings for COIDA / UIF / PAYE.',
        isRequired: true,
        aiHint: 'Monthly payroll summary or employee register spreadsheet detailing staff names, ID numbers, designations, and earnings.',
      },
    ],
  },
  {
    category: 'Banking & Financial Statements',
    items: [
      {
        id: 'doc_bank_confirmation',
        label: 'Bank Account Confirmation Letter (Stamped / Digital QR)',
        type: 'pdf',
        helpText: 'Official confirmation letter from a registered South African commercial bank with account details, bank stamp, or verifiable digital QR code, dated within 3 months.',
        isRequired: true,
        aiHint: 'Official Bank Account Confirmation Letter from a registered South African bank dated within 3 months. Accept letters with official bank stamp or verifiable digital reference / QR code.',
      },
      {
        id: 'doc_bank_statements_12m',
        label: '12-Month Consecutive Bank Statements (Electronic PDF)',
        type: 'pdf',
        helpText: 'Consecutive monthly bank statements downloaded directly from online banking in original electronic PDF format (scanned copies and cell phone photos are strictly rejected).',
        isRequired: true,
        aiHint: 'Operational source bank statements for accounting and tax compilation. Consecutive monthly bank statements in electronic PDF format showing running balances and transactions.',
      },
      {
        id: 'doc_bank_statements_csv',
        label: 'Bank Statement Transaction Export (CSV / Excel)',
        type: 'excel',
        helpText: 'Electronic CSV or Excel export containing transaction dates, payee/payer descriptions, amounts, and running balances for ledger import.',
        isRequired: false,
        aiHint: 'Electronic spreadsheet or CSV export of bank transactions for general ledger compilation.',
      },
      {
        id: 'doc_sales_invoices',
        label: 'Customer Sales Invoices for the Financial Year',
        type: 'pdf',
        helpText: 'Complete customer tax invoices and sales credit notes issued during the financial reporting period, compiled into a single PDF or ZIP archive.',
        isRequired: true,
        aiHint: 'Customer sales invoices or tax invoices issued by the entity during the financial period.',
      },
      {
        id: 'doc_purchase_receipts',
        label: 'Supplier Purchase Invoices & Expense Receipts',
        type: 'pdf',
        helpText: 'Valid vendor tax invoices, purchase slips, supplier statements, and operational expense receipts supporting all deductible expenses.',
        isRequired: true,
        aiHint: 'Supplier purchase invoices, expense receipts, or till slips incurred for business operations supporting input tax and deductions.',
      },
      {
        id: 'doc_prior_afs',
        label: 'Prior Year Annual Financial Statements & Trial Balance',
        type: 'pdf',
        helpText: 'Signed balance sheet, income statement, and notes from the preceding financial period, together with the year-end Trial Balance.',
        isRequired: false,
        aiHint: 'Signed prior year annual financial statements, trial balance, or management accounts for opening balances and comparatives.',
      },
      {
        id: 'doc_fixed_asset_register',
        label: 'Fixed Asset Register & Depreciation Schedule',
        type: 'excel',
        helpText: 'Electronic asset register listing asset descriptions, acquisition dates, purchase costs, depreciation rates, and current book values.',
        isRequired: false,
        aiHint: 'Fixed asset register or spreadsheet detailing equipment, vehicles, computer hardware, acquisition dates, cost prices, and depreciation.',
      },
    ],
  },
  {
    category: 'SARS & Tax Compliance',
    items: [
      {
        id: 'doc_sars_notice_reg',
        label: 'SARS Notice of Registration / Tax Number Confirmation',
        type: 'pdf',
        helpText: 'Official SARS Notice of Registration or verification letter confirming the entity’s Income Tax, VAT, or PAYE reference number.',
        isRequired: true,
        aiHint: 'Official SARS Notice of Registration or SARS letter showing registered taxpayer name and 10-digit tax reference number.',
      },
      {
        id: 'doc_sars_tcs_pin',
        label: 'SARS Tax Compliance Status (TCS) PIN Document',
        type: 'pdf',
        helpText: 'Official SARS Tax Compliance Status PIN letter confirming active tax compliance or Good Standing.',
        isRequired: false,
        aiHint: 'Official SARS Tax Compliance Status (TCS) PIN document containing the 10-character PIN code.',
      },
      {
        id: 'doc_vat_returns',
        label: 'VAT Returns & Statements of Account (VAT201)',
        type: 'pdf',
        helpText: 'Filed VAT201 declarations, SARS submission receipts, and latest VAT Statement of Account for reconciliation.',
        isRequired: false,
        aiHint: 'Submitted SARS VAT201 return declarations and payment receipts or official VAT Statement of Account.',
      },
      {
        id: 'doc_irp5_certificates',
        label: 'Annual IRP5 / IT3(a) Tax Certificates',
        type: 'pdf',
        helpText: 'Employee tax certificates provided by employers for the applicable individual assessment tax year.',
        isRequired: true,
        aiHint: 'Official SARS IRP5 or IT3(a) employee tax certificate issued by an employer for the relevant tax year.',
      },
      {
        id: 'doc_medical_aid_cert',
        label: 'Medical Aid Tax Certificate',
        type: 'pdf',
        helpText: 'Annual income tax certificate issued by the registered medical aid scheme showing total contributions and allowable claims.',
        isRequired: false,
        aiHint: 'Annual medical aid tax certificate showing principal member details, total contributions paid, and claims not covered by the scheme.',
      },
      {
        id: 'doc_ra_certificate',
        label: 'Retirement Annuity (RA) Contribution Certificate',
        type: 'pdf',
        helpText: 'Annual contributions tax certificate (Section 11F) issued by an approved retirement annuity fund administrator.',
        isRequired: false,
        aiHint: 'Annual retirement annuity fund contribution certificate showing member details, policy number, and total deductible contributions.',
      },
      {
        id: 'doc_travel_logbook',
        label: 'SARS Vehicle Travel Logbook',
        type: 'excel',
        helpText: 'Electronic travel logbook detailing business kilometers, private kilometers, opening/closing odometer readings, dates, and trip purposes.',
        isRequired: false,
        aiHint: 'Detailed electronic vehicle logbook meeting SARS criteria with opening/closing odometer readings, business destinations, and travel reasons.',
      },
    ],
  },
  {
    category: 'B-BBEE & Procurement Compliance',
    items: [
      {
        id: 'doc_bbee_affidavit',
        label: 'Sworn B-BBEE Affidavit / B-BBEE Certificate',
        type: 'pdf',
        helpText: 'Valid commissioner-signed DTI Sworn B-BBEE Affidavit (for EMEs and qualifying QSEs) or SANAS-accredited B-BBEE Verification Certificate.',
        isRequired: false,
        aiHint: 'Signed and commissioned Sworn B-BBEE Affidavit or SANAS B-BBEE Certificate confirming black ownership percentage and procurement level.',
      },
      {
        id: 'doc_csd_registration',
        label: 'Central Supplier Database (CSD) Registration Report',
        type: 'pdf',
        helpText: 'National Treasury Central Supplier Database (CSD) Registration Report displaying active MAAA supplier number.',
        isRequired: false,
        aiHint: 'Official National Treasury CSD Registration Report showing Supplier Number (MAAA number) and compliance status.',
      },
      {
        id: 'doc_cidb_registration',
        label: 'CIDB Contractor Registration Certificate / CRS Number',
        type: 'pdf',
        helpText: 'Construction Industry Development Board (CIDB) registration certificate displaying active CRS number and contractor grading designations.',
        isRequired: false,
        aiHint: 'Official CIDB Contractor Registration Certificate showing CRS number, contractor grading (e.g. 1GB, 2CE), and expiry date.',
      },
    ],
  },
];

/**
 * Determines whether a free-text document label from an existing product is already semantically
 * covered by our standard canonical library in STANDARD_DOCUMENT_REQUIREMENT_GROUPS.
 * Prevents historical typos, casing variations, and duplicates (such as 16 variations of COR14.3)
 * from polluting the dialog under "Previously Used in Store".
 */
export function isCoveredByStandardDocumentPreset(rawLabel: string): boolean {
  if (!rawLabel || typeof rawLabel !== 'string') return true;
  const text = rawLabel.trim();
  if (text.length < 3) return true;

  // 1. CIPC & Company Registration (COR14.3 / CK1 / CK2 / MOI / NPC / COR39 / Beneficial Ownership)
  if (/\bcor\s*14(\.3)?\b/i.test(text)) return true;
  if (/\bcor\s*(39|21(\.1)?|9(\.4)?)\b/i.test(text)) return true;
  if (/beneficial\s*owner(ship)?/i.test(text)) return true;
  if (/\b(ck1|ck2|close\s*corporation)\b/i.test(text)) return true;
  if (
    /\b(cipc|company|enterprise|incorporation)\b/i.test(text) &&
    /\b(reg|registration|certificate|cert|documents?|docs?|moi|disclosure)\b/i.test(text)
  ) {
    return true;
  }

  // 2. Identity Documents / Passports (KYC / FICA)
  if (
    /\b(ids?|identity|passports?|smart\s*cards?)\b/i.test(text) &&
    /\b(cop(y|ies)|cert(ified|ification)?|directors?|members?|shareholders?|all)\b/i.test(text)
  ) {
    return true;
  }

  // 3. Proof of Address
  if (
    /proof\s*of\s*(residential\s*|business\s*)?address/i.test(text) ||
    /proof\s*of\s*residence/i.test(text) ||
    /\bresidential\s*address\b/i.test(text) ||
    /\bbusiness\s*(operating\s*)?address\b/i.test(text) ||
    /\boperating\s*premises\b/i.test(text)
  ) {
    return true;
  }

  // 4. Power of Attorney / Mandate
  if (
    /power\s*of\s*attorney/i.test(text) ||
    /client\s*mandate/i.test(text) ||
    /authori[sz]ation\s*letter/i.test(text) ||
    /\bpoa\b/i.test(text)
  ) {
    return true;
  }

  // 5. Share Certificates & Securities Register
  if (
    /share\s*certificates?/i.test(text) ||
    /securities\s*register/i.test(text) ||
    /share\s*register/i.test(text) ||
    /shareholder\s*certificates?/i.test(text) ||
    /shareholding/i.test(text)
  ) {
    return true;
  }

  // 6. Banking Records (Bank Confirmation Letter, Bank Statements, CSV)
  if (/\bbank\b/i.test(text) && /\b(confirm(ation)?|stamped?|letter|account\s*details)\b/i.test(text)) {
    return true;
  }
  if (/\bbank\b/i.test(text) && /\b(statements?|csv|excel|export|reconciliat(ion|ed))\b/i.test(text)) {
    return true;
  }

  // 7. Invoices & Receipts
  if (/\bsales\b/i.test(text) && /\binvoices?\b/i.test(text)) return true;
  if (/\bpurchase\b/i.test(text) && /\b(invoices?|receipts?|slips?)\b/i.test(text)) return true;

  // 8. Financial Statements & Accounting Ledgers
  if (
    /(annual\s*)?financial\s*statements?/i.test(text) ||
    /\btrial\s*balance\b/i.test(text) ||
    /\bgeneral\s*ledger\b/i.test(text) ||
    /\basset\s*register\b/i.test(text) ||
    /\bmanagement\s*accounts?\b/i.test(text) ||
    /\bafs\b/i.test(text)
  ) {
    return true;
  }

  // 9. SARS eFiling Login & OTP Pack
  if (/e-?filing/i.test(text) || /sars\s*(login|password|username|otp)/i.test(text)) {
    return true;
  }

  // 10. SARS & Tax Certificates (Notice of Reg, TCS PIN, IRP5, Medical Aid, RA, Travel Logbook, VAT returns)
  if (
    /\b(irp5|it3\(?a?\)?)\b/i.test(text) ||
    /medical\s*aid/i.test(text) ||
    /retirement\s*annuity/i.test(text) ||
    /travel\s*logbook/i.test(text) ||
    /vat\s*(return|201)/i.test(text) ||
    /\btcs\s*pin\b/i.test(text) ||
    /tax\s*clearance/i.test(text) ||
    /notice\s*of\s*registration/i.test(text)
  ) {
    return true;
  }

  // 11. COIDA & Labour Compliance
  if (
    /\bcoida\b/i.test(text) ||
    /compensation\s*(fund|commissioner)/i.test(text) ||
    /letter\s*of\s*good\s*standing/i.test(text) ||
    /\blogs\b/i.test(text) ||
    /\bcf-?1b\b/i.test(text) ||
    (/\bpayroll\b/i.test(text) && /\b(summary|register|listing)\b/i.test(text))
  ) {
    return true;
  }

  // 12. B-BBEE, CSD, CIDB
  if (/\b(b-?bbee|bee)\b/i.test(text) && /\b(affidavit|certificate|cert)\b/i.test(text)) return true;
  if (/central\s*supplier\s*database/i.test(text) || /\bcsd\b/i.test(text)) return true;
  if (/\bcidb\b/i.test(text) || /\bcrs\s*number\b/i.test(text)) return true;

  // 13. Non-document placeholders or form questions saved historically in seeds
  const nonDocumentRegexes = [
    /^(none|n\/?a|null|undefined)$/i,
    /^company\s*name$/i,
    /turnover\s*amount/i,
    /annual\s*turnover/i,
    /individuals?\s*name/i,
    /percentage\s*of\s*shares/i,
    /black\s*owned/i,
    /white\s*owned/i,
    /tax\s*year\s*details/i,
    /no\s*taxable\s*income/i,
    /details\s*of\s*any\s*existing/i,
    /access\s*to\s*your\s*accounting/i,
    /details\s*of\s*all\s*assets/i,
    /relevant\s*contracts/i,
  ];
  if (nonDocumentRegexes.some(rx => rx.test(text))) {
    return true;
  }

  return false;
}

/**
 * Determines whether a free-text prerequisite title from an existing product is already semantically
 * covered by our standard canonical library in STANDARD_PREREQUISITE_GROUPS.
 */
export function isCoveredByStandardPrerequisitePreset(rawTitle: string): boolean {
  if (!rawTitle || typeof rawTitle !== 'string') return true;
  const text = rawTitle.trim();
  if (text.length < 3) return true;

  const blacklist = ['none', 'n/a', 'na', 'null', 'undefined'];
  if (blacklist.includes(text.toLowerCase())) return true;

  if (/\bcor\s*14(\.3)?\b/i.test(text) || /\b(ck1|ck2)\b/i.test(text)) return true;
  if (/\b(cipc|company)\b/i.test(text) && /\b(reg|registration|certificate|standing|moi)\b/i.test(text)) return true;
  if (/name\s*reservation/i.test(text) || /share\s*register/i.test(text) || /annual\s*turnover/i.test(text)) return true;
  if (/\b(ids?|passports?)\b/i.test(text) && /\b(directors?|shareholders?|certified)\b/i.test(text)) return true;
  if (/proof\s*of\s*(address|residence|premises)/i.test(text)) return true;
  if (/\b(mandate|power\s*of\s*attorney)\b/i.test(text)) return true;
  if (/\b(tax\s*number|efiling|tcs\s*pin|vat\s*number|paye\s*number)\b/i.test(text)) return true;
  if (/bank\s*(confirmation|statement)/i.test(text) || /financial\s*statement/i.test(text) || /asset\s*register/i.test(text) || /invoices?/i.test(text)) return true;
  if (/\b(coida|compensation\s*fund|uif\s*number|payroll\s*register|logs)\b/i.test(text)) return true;

  return false;
}

/**
 * Extracts and sanitizes unique prerequisites previously used across all existing services in the store.
 * Filters out items already covered in STANDARD_PREREQUISITE_GROUPS.
 */
export function extractUniquePrerequisitesFromServices(services: any[]): string[] {
  const set = new Set<string>();
  
  // Standard preset titles for deduplication
  const standardSet = new Set(
    STANDARD_PREREQUISITE_GROUPS.flatMap(g => g.items.map(i => i.title.toLowerCase().trim()))
  );

  services.forEach(service => {
    if (Array.isArray(service?.clientRequirements)) {
      service.clientRequirements.forEach((req: any) => {
        let text = '';
        if (typeof req === 'string') {
          text = req.trim();
        } else if (req && typeof req === 'object' && req.type === 'text' && req.value) {
          text = req.value.trim();
        } else if (req && typeof req === 'object' && req.text) {
          text = req.text.trim();
        }

        if (text && text.length > 3 && !standardSet.has(text.toLowerCase()) && !isCoveredByStandardPrerequisitePreset(text)) {
          // Normalize formatting (capitalize first letter)
          const sanitized = text.charAt(0).toUpperCase() + text.slice(1);
          set.add(sanitized);
        }
      });
    }
  });

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Extracts and sanitizes unique document intake requirements previously used across all existing services in the store.
 * Filters out items already covered in STANDARD_DOCUMENT_REQUIREMENT_GROUPS or semantically matched.
 */
export function extractUniqueDocumentsFromServices(services: any[]): DocumentRequirementPreset[] {
  const map = new Map<string, DocumentRequirementPreset>();

  // Standard preset labels for deduplication
  const standardSet = new Set(
    STANDARD_DOCUMENT_REQUIREMENT_GROUPS.flatMap(g => g.items.map(i => i.label.toLowerCase().trim()))
  );

  let counter = 0;
  services.forEach(service => {
    if (Array.isArray(service?.informationToProvide)) {
      service.informationToProvide.forEach((item: any) => {
        if (!item || !item.label) return;
        const rawLabel = String(item.label).trim();
        if (rawLabel.length < 3) return;

        const key = rawLabel.toLowerCase();
        if (standardSet.has(key)) return;
        if (isCoveredByStandardDocumentPreset(rawLabel)) return;

        if (!map.has(key)) {
          counter++;
          const cleanSlug = key.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          // Format in Title Case, preserving known acronyms
          const titleCased = rawLabel
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map(word => {
              if (word.length === 0) return '';
              const upper = word.toUpperCase();
              if (['(NCR)', 'NCR', 'PSIRA', 'EAAB', 'NRCS', 'SACPCMP', 'SARS', 'CIPC'].includes(upper)) {
                return upper;
              }
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');

          map.set(key, {
            id: `used_${counter}_${cleanSlug || 'doc'}`,
            label: titleCased,
            type: item.type || 'pdf',
            helpText: item.helpText ? String(item.helpText).trim() : '',
            isRequired: item.isRequired !== false,
          });
        }
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}
