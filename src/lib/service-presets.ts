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
        title: 'Certified copy of South African ID or Valid Passport for all active Directors / Shareholders (Certified within 3 months)',
      },
      {
        id: 'kyc_proof_address',
        title: 'Proof of Residential Address not older than 3 months (Utility bill, Municipal account, or Signed lease agreement)',
      },
      {
        id: 'kyc_business_address',
        title: 'Proof of Physical Business Address / Operating Premises (Municipal account or Lease agreement)',
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
        title: 'Active CIPC Company Registration Certificate (COR14.3 / CK1 / CK2 / Standard MOI)',
      },
      {
        id: 'cipc_entity_standing',
        title: 'Active and compliant South African registered legal entity in good standing with the CIPC',
      },
      {
        id: 'cipc_name_reservation',
        title: 'Four (4) unique proposed company names listed in order of preference for CIPC Name Reservation',
      },
      {
        id: 'cipc_share_register',
        title: 'Signed Share Certificates, Securities Register, and Resolution of Directors',
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
        title: 'Valid SARS Value-Added Tax (VAT) Registration Number (VAT vendor status)',
      },
      {
        id: 'sars_paye_number',
        title: 'Valid SARS Pay-As-You-Earn (PAYE / UIF / SDL) Employer Registration Number',
      },
    ],
  },
  {
    category: 'Financial, Accounting & Banking Records',
    items: [
      {
        id: 'bank_confirmation_letter',
        title: 'Official Bank Confirmation Letter with account details and bank stamp (Not older than 3 months)',
      },
      {
        id: 'bank_statements_pdf',
        title: 'Consecutive 6 to 12 months official Bank Statements in original electronic PDF format (No scans or photos)',
      },
      {
        id: 'bank_statements_csv',
        title: 'Electronic Bank Statement transaction export in CSV / Excel format for ledger processing',
      },
      {
        id: 'invoices_sales_purchases',
        title: 'Complete Customer Sales Invoices and Supplier Purchase Invoices/Slips for the reporting period',
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
    category: 'Payroll & Department of Labour (COIDA / UIF)',
    items: [
      {
        id: 'labour_coida_number',
        title: 'Department of Labour Compensation Fund (COIDA) 99-series Reference Number',
      },
      {
        id: 'labour_uif_number',
        title: 'Department of Labour Unemployment Insurance Fund (UIF) Commercial Reference Number',
      },
      {
        id: 'labour_payroll_register',
        title: 'Full Employee Payroll Register detailing employee names, ID numbers, designations, and gross earnings',
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
        title: 'Agreed scope of accounting services, billing terms, and letter of engagement',
      },
      {
        id: 'mandate_contact_parties',
        title: 'Verified contact information (email, phone, physical address) for all authorized signees',
      },
    ],
  },
];

/**
 * Curated standard client document uploads & intake data requirements.
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
    helpText: 'Specify Yes or No (does your eFiling login trigger an SMS OTP or SARS Mobile App push notification?).',
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

export const STANDARD_DOCUMENT_REQUIREMENT_GROUPS: PresetCategory<DocumentRequirementPreset>[] = [
  {
    category: 'SARS eFiling Login & OTP Pack',
    items: SARS_EFILING_LOGIN_PACK,
  },
  {
    category: 'Identity & Statutory Documents',
    items: [
      {
        id: 'doc_id_all_directors',
        label: 'Certified ID Copy / Passport (All Directors / Shareholders)',
        type: 'pdf',
        helpText: 'Certified within the last 3 months by a Commissioner of Oaths / Police Station. Clear color scan.',
        isRequired: true,
        aiHint: 'Certified SA Smart ID Card, Green Barcoded ID Book, or Passport. Check for visible Commissioner of Oaths or Police certification stamp dated within 3 months, legible ID number and name.',
      },
      {
        id: 'doc_proof_address',
        label: 'Proof of Residential Address',
        type: 'pdf',
        helpText: 'Utility bill, municipal statement, or formal lease agreement not older than 3 months.',
        isRequired: true,
        aiHint: 'Proof of residential address dated within 3 months (utility bill, rates/taxes, lease, or bank statement).',
      },
      {
        id: 'doc_cipc_cor143',
        label: 'CIPC Registration Certificate (COR 14.3 / MOI)',
        type: 'pdf',
        helpText: 'Official CIPC company registration certificate showing all active directors.',
        isRequired: true,
        aiHint: 'Official CIPC COR 14.3, CK1, CK2, or MOI document showing company registration number, registered enterprise name, and active directors.',
      },
      {
        id: 'doc_share_certificates',
        label: 'Signed Share Certificates & Securities Register',
        type: 'pdf',
        helpText: 'Share certificates detailing shareholder percentages and issued share capital.',
        isRequired: false,
        aiHint: 'Share certificates or securities register showing company name, shareholder names, and share allocation.',
      },
      {
        id: 'doc_signed_poa',
        label: 'Signed Power of Attorney / Client Mandate',
        type: 'pdf',
        helpText: 'Mandate document signed by authorized director authorizing My Accountant to act on behalf.',
        isRequired: true,
        aiHint: 'Signed Power of Attorney or appointment mandate authorizing My Accountant to perform statutory filings. Verify presence of director signature and date.',
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
        helpText: 'Select one or more applicable industry classifications from the official 23 COIDA classes (W.Cl.150T) for Compensation Fund assessment rate.',
        isRequired: true,
        aiHint: 'Official COIDA Classification of Industries selection matching business activities.',
      },
      {
        id: 'doc_coida_reference',
        label: 'Compensation Fund (COIDA) Reference Number',
        type: 'text',
        helpText: 'Department of Employment & Labour 99-series compensation registration number.',
        isRequired: false,
      },
      {
        id: 'doc_coida_cf1b',
        label: 'COIDA CF-1B Change of Nature of Business Application',
        type: 'pdf',
        helpText: 'Completed Department of Labour CF-1B form with proof of operations and director signature.',
        isRequired: true,
        aiHint: 'COIDA CF-1B application form for Compensation Fund registration or nature of business classification change.',
      },
      {
        id: 'doc_coida_logs',
        label: 'COIDA Letter of Good Standing (LOGS)',
        type: 'pdf',
        helpText: 'Valid Certificate or Letter of Good Standing issued by the Compensation Commissioner.',
        isRequired: false,
      },
      {
        id: 'doc_payroll_summary',
        label: 'Monthly Payroll Summary / Employee Register',
        type: 'excel',
        helpText: 'Spreadsheet detailing employee full names, ID numbers, designations, and earnings for COIDA assessment.',
        isRequired: true,
      },
    ],
  },
  {
    category: 'Banking & Financial Statements',
    items: [
      {
        id: 'doc_bank_confirmation',
        label: 'Bank Confirmation Letter (Stamped)',
        type: 'pdf',
        helpText: 'Official stamped letter from your bank confirming account name and number, dated within 3 months.',
        isRequired: true,
        aiHint: 'Official Bank Account Confirmation Letter from a registered South African bank dated within 3 months. Accept letters with official bank stamp OR digital verification reference/QR code.',
      },
      {
        id: 'doc_bank_statements_12m',
        label: '12-Month Bank Statements (PDF)',
        type: 'pdf',
        helpText: 'Consecutive monthly bank statements downloaded directly from online banking in original PDF.',
        isRequired: true,
        aiHint: 'Operational source bank statements for accounting/tax compilation. Accept consecutive bank statements showing transaction records. Do NOT treat as a KYC confirmation letter.',
      },
      {
        id: 'doc_bank_statements_csv',
        label: 'Bank Statement Transaction Export (CSV / Excel)',
        type: 'excel',
        helpText: 'Electronic CSV/Excel export containing transaction dates, descriptions, and amounts.',
        isRequired: false,
        aiHint: 'Electronic spreadsheet or CSV export of bank transactions.',
      },
      {
        id: 'doc_sales_invoices',
        label: 'Customer Sales Invoices for the Financial Year',
        type: 'pdf',
        helpText: 'All client invoices issued during the period, compiled into a PDF or ZIP archive.',
        isRequired: true,
        aiHint: 'Customer sales invoices or tax invoices issued by the entity.',
      },
      {
        id: 'doc_purchase_receipts',
        label: 'Supplier Purchase Invoices & Expense Receipts',
        type: 'pdf',
        helpText: 'All valid vendor tax invoices, purchase slips, and operational expenses.',
        isRequired: true,
        aiHint: 'Supplier purchase invoices, expense receipts, or till slips incurred for business operations.',
      },
      {
        id: 'doc_prior_afs',
        label: 'Prior Year Annual Financial Statements & Trial Balance',
        type: 'pdf',
        helpText: 'Signed balance sheet and income statement from the preceding financial period.',
        isRequired: false,
        aiHint: 'Signed prior year annual financial statements, trial balance, or management accounts.',
      },
    ],
  },
  {
    category: 'SARS & Tax Certificates',
    items: [
      {
        id: 'doc_sars_notice_reg',
        label: 'SARS Notice of Registration / Tax Number Document',
        type: 'pdf',
        helpText: 'Official SARS document displaying your Income Tax, VAT, or PAYE reference number.',
        isRequired: true,
      },
      {
        id: 'doc_sars_efiling_username',
        label: 'SARS eFiling Username',
        type: 'text',
        helpText: 'Primary eFiling username for your individual or organization profile.',
        isRequired: true,
        aiHint: 'SARS eFiling login username.',
      },
      {
        id: 'doc_sars_efiling_password',
        label: 'SARS eFiling Password',
        type: 'text',
        helpText: 'SARS eFiling password (stored encrypted at rest, used exclusively for filing/verification).',
        isRequired: true,
        aiHint: 'SARS eFiling login password.',
      },
      {
        id: 'doc_sars_efiling_otp_required',
        label: 'SARS eFiling OTP Required? (Yes / No)',
        type: 'text',
        helpText: 'Please specify Yes or No (whether your login triggers an SMS OTP or SARS Mobile App push notification).',
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
      {
        id: 'doc_irp5_certificates',
        label: 'Annual IRP5 / IT3(a) Tax Certificates',
        type: 'pdf',
        helpText: 'Employee tax certificates provided by employer(s) for the assessment tax year.',
        isRequired: true,
      },
      {
        id: 'doc_medical_aid_cert',
        label: 'Medical Aid Tax Certificate',
        type: 'pdf',
        helpText: 'Annual tax certificate issued by medical scheme showing total contributions and claims.',
        isRequired: false,
      },
      {
        id: 'doc_ra_certificate',
        label: 'Retirement Annuity (RA) Contribution Certificate',
        type: 'pdf',
        helpText: 'Annual contributions tax certificate issued by retirement fund administrator.',
        isRequired: false,
      },
      {
        id: 'doc_travel_logbook',
        label: 'SARS Vehicle Travel Logbook',
        type: 'excel',
        helpText: 'Detailed electronic logbook with business kilometers, private kilometers, and vehicle details.',
        isRequired: false,
      },
    ],
  },
];

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
  
  // Exclude known default fallback or empty strings
  const blacklist = new Set(['', 'n/a', 'none', 'null', 'undefined']);

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

        if (text && text.length > 3 && !blacklist.has(text.toLowerCase()) && !standardSet.has(text.toLowerCase())) {
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
 * Filters out items already covered in STANDARD_DOCUMENT_REQUIREMENT_GROUPS.
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
        const label = item.label.trim();
        if (label.length < 2) return;

        const key = label.toLowerCase();
        if (!map.has(key) && !standardSet.has(key)) {
          counter++;
          const cleanSlug = key.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          map.set(key, {
            id: `used_${counter}_${cleanSlug || 'doc'}`,
            label: label.charAt(0).toUpperCase() + label.slice(1),
            type: item.type || 'pdf',
            helpText: item.helpText || '',
            isRequired: item.isRequired !== false,
          });
        }
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}
