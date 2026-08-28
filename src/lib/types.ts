export type AIDocumentVerification = {
  status: 'verified' | 'flagged' | 'inconclusive' | 'pending';
  confidence: number; // 0 to 100
  detectedType?: string;
  extractedData?: Record<string, any>;
  issues?: string[];
  summary?: string;
  reviewedAt?: string;
  recommendation: 'approve' | 'reject' | 'manual_review';
  reason?: string;
  modelName?: string;
  modelVersion?: string;
  adversarialCheckPassed?: boolean;
  /** Who applied the approve/reject: the verification cycle or a staff member. */
  decidedBy?: 'system' | 'staff';
  decidedAt?: string;
};

export type UploadedFileItem = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  uploadedAt: any;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  aiVerification?: AIDocumentVerification;
};

export type DocumentUpload = {
  id?: string;
  serviceId: string;
  requirementId?: string;
  requirementLabel: string;
  type: 'file' | 'text' | 'explanation';
  fileUrl?: string;
  fileName?: string;
  files?: UploadedFileItem[]; // Multiple files for the same requirement
  textValue?: string;
  notAvailableReason?: string; // Client reason for why document cannot be provided
  uploadedAt: any; // Firestore Timestamp
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  adminComment?: string;
  verifiedAt?: any;
  aiVerification?: AIDocumentVerification;
  /** Layer 1 mechanical check result (src/lib/verification/mechanical.ts). Internal; stripped for partners. */
  mechanicalCheck?: import('./verification/mechanical').MechanicalCheckResult;
  /** True when the stored textValue is encrypted at rest (isSecret requirements). */
  isEncrypted?: boolean;
};

export type PrerequisiteItem = 
  | { type: 'text'; text: string }
  | { type: 'product'; productId: string; text?: string };

// Fulfilment step types. The original six are kept for backward compatibility; the
// channel-specific types were added for the AI order agent (see AI-ORDER-AGENT-PLAN.md §5.1).
export type FulfillmentStepType =
  | 'doc_verification'   // legacy: verify uploaded documents
  | 'document_drafting'  // legacy alias of draft_document
  | 'external_filing'    // legacy alias of portal_filing
  | 'internal_calc'      // legacy alias of calculate
  | 'manual'
  | 'signoff'
  | 'collect'            // wait for client requirements; agent chases
  | 'verify'             // run mechanical/extraction/rules checks on a requirement
  | 'calculate'          // pull figures from AI Accountant / AI Payroll
  | 'draft_document'     // DOCUMENT adapter: template -> PDF draft
  | 'draft_client_message' // client communication draft for approval
  | 'email_submission'   // EMAIL adapter: send a pack to a regulator
  | 'portal_filing'      // PORTAL adapter: browser-driven filing
  | 'wait_external'      // waiting on a regulator; follow-up cadence
  | 'deliver';           // hand artefacts to the client

export const FULFILLMENT_STEP_TYPES: { value: FulfillmentStepType; label: string; channel: 'internal' | 'document' | 'email' | 'portal' | 'client' }[] = [
  { value: 'collect', label: 'Collect requirements from client', channel: 'client' },
  { value: 'verify', label: 'Verify documents', channel: 'internal' },
  { value: 'calculate', label: 'Calculation (AI Accountant / Payroll)', channel: 'internal' },
  { value: 'draft_document', label: 'Draft document from template', channel: 'document' },
  { value: 'draft_client_message', label: 'Draft client message', channel: 'client' },
  { value: 'email_submission', label: 'Email submission to regulator', channel: 'email' },
  { value: 'portal_filing', label: 'Portal filing (browser)', channel: 'portal' },
  { value: 'wait_external', label: 'Wait for regulator', channel: 'internal' },
  { value: 'deliver', label: 'Deliver to client', channel: 'client' },
  { value: 'manual', label: 'Manual step', channel: 'internal' },
  { value: 'signoff', label: 'Sign-off', channel: 'internal' },
];

/** Who a document must be in the name of, relative to the order's resolved entity. */
export type RequirementNameHolder = 'entity' | 'director' | 'either';

/** Fixed vocabulary of document kinds the extraction layer may return. Keep in sync with the rules engine. */
export type DocumentKind =
  | 'sa_id' | 'passport' | 'proof_of_address' | 'cor14_3' | 'cor39' | 'moi'
  | 'bank_confirmation' | 'bank_statement' | 'tcs_pin' | 'sars_notice_of_registration'
  | 'afs' | 'management_accounts' | 'trial_balance' | 'payslip' | 'irp5' | 'it3'
  | 'medical_aid_cert' | 'ra_cert' | 'logbook' | 'invoice' | 'receipt'
  | 'share_certificate' | 'resolution' | 'power_of_attorney' | 'letterhead'
  | 'criminal_clearance' | 'letter_of_good_standing' | 'coida_registration'
  | 'cidb_certificate' | 'completion_certificate' | 'letter_of_award' | 'photo' | 'other';

export type PortalId = 'cipc' | 'efiling' | 'cf_filing' | 'ufiling' | 'cidb' | 'csd' | 'ncr' | 'nhbrc' | 'dsd' | 'other';

export type PlaybookApproval = {
  approvedBy: string;       // user id
  approvedByName?: string;
  approvedAt: string;       // ISO
  version: number;
  notes?: string;
};

export type DocumentTemplateOption = {
  id: string;
  title: string;
  description: string;
  category: string;
};

export const AVAILABLE_DOCUMENT_TEMPLATES: DocumentTemplateOption[] = [
  {
    id: 'ncr_form_2',
    title: 'NCR Form 2 — Credit Provider Application',
    description: 'Statutory Form NCR 2 application for National Credit Regulator credit provider registration.',
    category: 'NCR & Credit',
  },
  {
    id: 'ncr_director_resolution',
    title: 'NCR Director Resolution & Signatory Mandate',
    description: 'Board Resolution authorizing NCR credit provider application, appointed signatory, and accounting officer mandate.',
    category: 'NCR & Credit',
  },
  {
    id: 'ncr_annexure_fees',
    title: 'NCR Annexure: Confirmation of Payment of Fees',
    description: 'Statutory fee calculation schedule (R550 App Fee + R1,000 Initial Reg + R250 Branch Fee = R1,800 Total).',
    category: 'NCR & Credit',
  },
  {
    id: 'accounting_officer_letter',
    title: 'Accounting Officer Consent & Appointment Letter (Reg 67/68)',
    description: 'Formal consent & confirmation of appointment as independent Accounting Officer under Regulations 67 & 68 of National Credit Act, CBA (SA) signed.',
    category: 'Accounting & Compliance',
  },
  {
    id: 'accountants_letter',
    title: "Accountant's Financial Confirmation & Compliance Letter",
    description: 'Official confirmation of financial position, capital adequacy, or bank records on My Accountant letterhead.',
    category: 'Accounting & Compliance',
  },
  {
    id: 'engagement_letter',
    title: 'Professional Engagement Letter & Service Agreement',
    description: 'Formal engagement contract with Kevin Freese CBA (SA) signature, scope of services, and statutory terms.',
    category: 'Agreements & Retainers',
  },
  {
    id: 'power_of_attorney',
    title: 'Special Power of Attorney & Authorizing Mandate',
    description: 'Strict 1-page executive mandate with dedicated "Sign Here" box authorizing representation before CIPC, NCR, SARS, and Labour.',
    category: 'Legal & Statutory',
  },
  {
    id: 'share_certificate',
    title: 'Official Company Share Certificate (100 Ordinary Shares)',
    description: 'Ornate corporate Share Certificate in terms of the Companies Act 71 of 2008.',
    category: 'CIPC & Secretarial',
  },
  {
    id: 'sars_public_officer_resolution',
    title: 'SARS Public Officer Appointment & Director Resolution',
    description: 'Statutory Board Resolution appointing Public Officer in terms of Section 246 of Tax Administration Act.',
    category: 'SARS & Tax',
  },
  {
    id: 'coida_cf1b_application',
    title: 'COIDA CF-1B Change of Nature of Business Application',
    description: 'Department of Employment & Labour compensation fund application pack with mandate & proof of operations.',
    category: 'Labour & COIDA',
  },
  {
    id: 'bee_affidavit',
    title: 'B-BBEE Sworn Affidavit — Exempted Micro Enterprise (EME)',
    description: 'Statutory DTI B-BBEE Sworn Affidavit for Exempted Micro Enterprises (<R10m annual turnover), formatted for commissioner of oaths.',
    category: 'B-BBEE & Compliance',
  },
];

export type FulfillmentStep = {
  id: string;
  title: string;
  description?: string;
  aiInstructions?: string; // Custom operational rules, prompts & validations for the AI Agent
  type: FulfillmentStepType;
  requiredRole?: string;
  automatedSkill?: string;
  estimatedDays?: number;
  templateIds?: string[];
  // --- AI order agent fields (plan §5.1) ---
  owner?: 'agent' | 'kevin' | 'staff';
  doneCriteria?: string;
  /** collect / verify: which requirement ids this step concerns */
  requirementIds?: string[];
  /** email_submission */
  emailTo?: string;
  emailSubjectTemplate?: string;
  expectedReply?: string;
  /** portal_filing */
  portalId?: PortalId;
  portalProcedure?: string;      // e.g. 'cipc.fileCoR39'
  submitMode?: 'stage' | 'auto' | 'manual';
  /** wait_external */
  followUpAfterDays?: number[];
  /** deliver */
  deliverArtefacts?: string[];   // templateIds or output keys
};

/** One item the client must supply. Superset of the legacy informationToProvide row. */
export type ServiceRequirement = {
  id?: string;
  label: string;
  type?: 'text' | 'pdf' | 'excel' | 'image' | 'any';
  helpText?: string;
  isConditional?: boolean;
  conditionalQuestion?: string;
  isRequired?: boolean;
  aiHint?: string;
  // --- AI order agent fields (plan §5.1) ---
  documentKind?: DocumentKind;
  inNameOf?: RequirementNameHolder;
  maxAgeDays?: number;
  mustBeCertified?: boolean;
  alternatives?: string[];       // free text, e.g. 'Passport', 'Signed lease agreement'
  isSecret?: boolean;            // credentials: stored encrypted, never shown in UI
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  isPriceTbc?: boolean;
  resellerPrice?: number;
  imageUrl: string;
  imageHint: string;
  seoImageUrl?: string;
  seoImageLabel?: string;
  category: string;
  department?: 'Accounting and Tax' | 'Administration' | 'CAP';
  whatsIncluded: string[];
  turnaroundTime: string;
  clientRequirements: (string | PrerequisiteItem)[];
  informationToProvide: ServiceRequirement[];
  fulfillmentChecklist?: FulfillmentStep[];
  // --- AI order agent playbook fields (plan §5.1) ---
  playbookEntity?: 'company' | 'individual' | 'either';
  playbookOutputs?: string[];
  playbookCommonFailures?: string[];
  playbookVersion?: number;
  /** Set only when Kevin approves the playbook. Absent/undefined = DRAFT, agent must not act on it. */
  playbookApproval?: PlaybookApproval | null;
  attachmentUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  // Google Merchant Center & SEO Fields
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  condition?: 'new' | 'refurbished' | 'used';
  brand?: string;
  product_type?: string;
  google_product_category?: string;
  returnPolicyCategory?: string;
  // Schema Overrides
  schemaType?: 'Product' | 'Service';
  enableAggregateRating?: boolean;
  aggregateRatingValue?: number;
  reviewCount?: number;
  priceValidUntilOverride?: string;
  faqs?: { q: string; a: string }[];
  isFeatured?: boolean;
  subcontractorFee?: number;
  requiredProductIds?: string[];
  coidaIndustries?: string[];
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  imageHint: string;
  author: string;
  date: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  relatedProducts?: string[];
  seoImageUrl?: string;
  seoImageLabel?: string;
};

export type FAQ = {
  id:string;
  question: string;
  answer: string;
};

export type KnowledgeBaseItem = {
  id: string;
  question: string;
  answer: string;
  sourceType?: 'qa' | 'text' | 'link';
  textValue?: string;
  linkUrl?: string;
}

export type CartItem = {
  service: Service;
  quantity: number;
};

export type OrderNote = {
  text: string;
  date: any;
  authorId: string;
  type?: 'note' | 'email';
  isInternal?: boolean;
  subject: string | null;
  attachments: { name: string; url: string }[] | null;
  attachmentUrl?: string | null; // For legacy single attachments
  attachmentName?: string | null; // For legacy single attachments
};

export type OrderItem = {
  id?: string;
  serviceId?: string;
  title: string;
  quantity?: number;
  unitPrice?: number;
  clientPrice?: number;
  basePrice?: number;
  price?: number;
  total?: number;
  description?: string;
  [key: string]: any;
};

export type AuditEntry = {
  id: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  timestamp: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
};

export type ItnLog = {
  receivedAt: any;
  status: 'Success' | 'Failed';
  message: string;
  payload: { [key: string]: any };
};

export type Order = {
  id: string;
  userId?: string | null;
  clientId?: string | null;
  partnerId?: string | null;
  resellerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  endCustomerName?: string; 
  endCustomerEmail?: string; 
  endCustomerPhone?: string;
  date: any;
  items: OrderItem[];
  total: number;
  discountCode: string | null;
  discountAmount: number | null;
  paymentMethod?: string;
  clientTotal?: number;
  status: 'Pending Payment' | 'Processing' | 'Waiting on Customer' | 'Waiting for Information' | 'Under Review' | 'Completed' | 'Cancelled' | string;
  isOutsourced?: boolean;
  assignedTo?: string[] | null;
  department?: 'Accounting and Tax' | 'Administration' | 'CAP' | null;
  originalOrderId?: string | null;
  parentOrderId?: string | null;
  isPrerequisiteOrder?: boolean;
  notes?: OrderNote[];
  documentUploads?: DocumentUpload[];
  itnHistory?: ItnLog[];
  auditLog?: AuditEntry[];
  source?: 'Client' | 'Staff' | 'Partner' | 'AI Accountant Signup' | 'Partner Landing Page';
  renewalForClientId?: string;
  documentContact?: 'partner' | 'client';
  overflowStatus?: 'none' | 'available' | 'claimed' | 'review' | 'completed' | 'cancelled';
  overflowPartnerId?: string | null;
  overflowPayout?: number;
  overflowDeadline?: any;
  dependsOnOrderIds?: string[];
  blockedOrderIds?: string[];
  fulfillmentStatus?: 'Awaiting Documents' | 'Under Review' | 'In Execution' | 'Ready for Signoff' | 'Completed' | 'Blocked';
  checklist?: OrderChecklistItem[];
  serviceSnapshots?: OrderServiceSnapshot[];
  generatedDrafts?: GeneratedDocumentDraft[];
  lastIntakeAlertSentAt?: string;
  aiFulfillmentAdvice?: AIOrderFulfillmentAdvice;
  /** AI order agent bookkeeping (plan §6.1). */
  lastAgentRunAt?: string;
  lastAgentRunId?: string;
  /** EMAIL adapter: submissions sent to regulators for this order (plan §6.5). */
  regulatorSubmissions?: import('./agent/types').RegulatorSubmission[];
  /** Document verification cycle state (src/lib/agent/verification-cycle.ts). */
  verification?: {
    lastRunAt?: string;
    lastTrigger?: string;
    state?: 'awaiting_client' | 'awaiting_consultant' | 'complete' | 'skipped';
    lastClientNoteKey?: string | null;
    lastClientNoteAt?: string | null;
    completeEmailKey?: string | null;
    undecidedEmailKey?: string | null;
    counts?: { approved: number; rejected: number; missing: number; pending: number };
    /** Drafted client update awaiting staff confirmation. */
    draftClientNote?: { text: string; key: string; state: string; createdAt: string; trigger: string } | null;
  };
};

export interface AIOrderFulfillmentAdvice {
  fulfillmentHealthScore: number; // 0 - 100
  overallState: 'ready_to_lodge' | 'awaiting_documents' | 'in_review' | 'blocked' | 'drafts_ready' | 'complete';
  summary: string;
  lodgementReadiness: boolean;
  communicationInsights?: string[];
  aiRecommendations: string[];
  sopDeliverables: {
    templateId: string;
    title: string;
    description: string;
    isGenerated: boolean;
    fileUrl?: string;
  }[];
  missingItems?: string[];
  nextActionLabel?: string;
  nextActionType?: 'generate_drafts' | 'request_documents' | 'client_followup' | 'finalize_order' | 'review_drafts';
  reviewedAt: string;
}

export interface GeneratedDocumentDraft {
  id: string;
  templateType: 'ncr_form_2' | 'director_resolution' | 'power_of_attorney' | 'share_certificate' | 'accountants_letter' | 'intake_summary' | 'bee_affidavit' | 'coida_cf1b_application' | string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  generatedAt: string;
  status: 'draft' | 'approved' | 'sent_to_client' | 'regenerated';
  feedbackHistory?: {
    timestamp: string;
    consultantName: string;
    feedback: string;
  }[];
  metadata?: Record<string, any>;
}

export type OrderChecklistItem = {
  id: string;
  serviceId: string;
  serviceTitle?: string;
  title: string;
  description?: string;
  aiInstructions?: string; // Custom operational rules for AI agent
  type?: FulfillmentStepType;
  /** Frozen copy of the agent-relevant step fields at checkout (plan §6.8). */
  stepConfig?: Pick<FulfillmentStep, 'owner' | 'doneCriteria' | 'requirementIds' | 'emailTo' | 'emailSubjectTemplate' | 'expectedReply' | 'portalId' | 'portalProcedure' | 'submitMode' | 'followUpAfterDays' | 'deliverArtefacts' | 'estimatedDays'>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  notes?: string;
  artifactUrl?: string;
  artifactName?: string;
  isAiRecommended?: boolean;
  aiNotes?: string;
  templateIds?: string[];
};

export type OrderServiceSnapshot = {
  serviceId: string;
  title: string;
  department?: 'Accounting and Tax' | 'Administration' | 'CAP' | null;
  requirements: (ServiceRequirement & { id: string })[];
  checklist: FulfillmentStep[];
  /** Playbook state frozen at checkout. The agent only acts when playbookApproved is true. */
  playbookApproved?: boolean;
  playbookVersion?: number;
  playbookEntity?: 'company' | 'individual' | 'either';
};

export type Invoice = {
  id: string;
  customerId: string;
  reference?: string;
  invoiceDate: any; // Firestore Timestamp
  dueDate: any; // Firestore Timestamp
  lineItems: { 
    accountId: string;
    description: string; 
    quantity: number; 
    rate: number;
    vatType: string;
  }[];
  notes?: string;
  subtotal: number;
  vat: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'final' | 'partial';
  createdAt: any;
  currency?: string;
};

export type Quote = {
  id: string;
  customerId: string;
  reference?: string;
  quoteDate: any;
  expiryDate: any;
  description: string;
  lineItems: { 
    accountId: string;
    description: string; 
    quantity: number; 
    rate: number;
    vatType: string;
  }[];
  notes?: string;
  subtotal: number;
  vat: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';
  createdAt: any;
  currency?: string;
};

export type CreditNote = {
  id: string;
  customerId: string;
  invoiceId?: string;
  creditNoteDate: any; // Firestore Timestamp
  lineItems: {
    accountId: string;
    description: string;
    quantity: number;
    rate: number;
    vatType: string;
  }[];
  notes?: string;
  subtotal: number;
  vat: number;
  total: number;
  status: 'final';
  createdAt: any;
};

export type SubscriptionData = {
    serviceLevel: 'free' | 'ai_addon' | 'monthly_non_vat' | 'monthly_vat';
    extraUsers: number;
    includeSubmissions: boolean;
    includePayslips: boolean;
    payslipCount: number;
    includeCatchUp: boolean;
    monthlyTotal: number;
    catchUpFee: number;
    subscriptionEndDate?: any; // Firestore Timestamp
    subscriptionStatus?: 'active' | 'lapsed';
    lastBillingDate?: any; // Firestore Timestamp for recurring deductions
};

export type SavedReport = {
  id: string;
  name: string;
  dateRange?: {
    from: string;
    to: string;
  } | null;
  comparativeDateRange?: {
    from: string;
    to: string;
  } | null;
};

export type PartnerLandingPageConfig = {
  enabled: boolean;
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutUs: string;
  themePreset?: 'custom' | 'my_accountant' | 'futuristic' | 'tech_blue' | 'facebook' | 'lovable' | 'monday' | 'monday_crm' | 'stripe' | 'airbnb' | 'linear' | 'spotify' | 'notion' | 'apple';
  primaryColor: string;
  hoverColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  cardBackgroundColor?: string;
  cardBg?: string;
  cardBorderColor?: string;
  cardBorder?: string;
  cardRadius?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonStyle?: 'solid' | 'outline';
  showLogo?: boolean;
  hideHeaderBranding?: boolean;
  logoUrl?: string;
  logoHeight?: number;
  heroImageUrl?: string;
  heroOverlayOpacity?: number;
  heroLayout?: 'centered' | 'split-left' | 'split-right' | 'background';
  heroTextPosition?: 'inside' | 'below';
  refundPolicy?: string;
  popiaPolicy?: string;
  termsAndConditions?: string;
  heroTitleColor?: string;
  heroSubtitleColor?: string;
  showServicesHero?: boolean;
  servicesHeroImageUrl?: string;
  servicesHeroOverlayOpacity?: number;
  servicesHeroLayout?: 'centered' | 'split-left' | 'split-right' | 'background';
  servicesHeroTitle?: string;
  servicesHeroSubtitle?: string;
  servicesHeroTextPosition?: 'inside' | 'below';
  metaTitle?: string;
  metaDescription?: string;
  testimonials?: Array<{
    name: string;
    role: string;
    company?: string;
    quote: string;
    rating: number;
    avatarUrl?: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  showLeadForm?: boolean;
  fontFamily?: 'sans' | 'serif' | 'mono' | 'inter' | 'outfit';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg';
  glassmorphism?: boolean;
  googleAnalyticsId?: string;
  metaPixelId?: string;
  showCalculator?: boolean;
  showStats?: boolean;
  customStats?: Array<{ value: string; label: string; icon?: any; color?: string }>;
  showPricingPackages?: boolean;
  pricingPackages?: Array<any>;
  customDomain?: string;
};

// --- Partner Subscription & Staff Types ---

export type PartnerTier = 'free' | 'growth';

export type StaffPermissions = {
  orders: 'none' | 'view' | 'full';
  clients: 'none' | 'view' | 'full';
  tasks: 'none' | 'view' | 'full';
  services: 'none' | 'view' | 'full';
  /** Financials: only 'none' or 'view' — staff can never top up the wallet */
  financials: 'none' | 'view';
};

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  orders: 'view',
  clients: 'view',
  tasks: 'view',
  services: 'none',
  financials: 'none',
};

export const ADMIN_STAFF_PERMISSIONS: StaffPermissions = {
  orders: 'full',
  clients: 'full',
  tasks: 'full',
  services: 'full',
  financials: 'view',
};

export type PartnerSubscription = {
  status: 'active' | 'lapsed' | 'cancelled' | 'pending' | 'trialing';
  /** PayFast subscription token — used to cancel via PayFast API */
  payfastToken?: string;
  currentPeriodStart?: any;   // Firestore Timestamp
  currentPeriodEnd?: any;     // Firestore Timestamp — primary access gate
  /** Limits derived from tier at subscription time */
  aiCompanyLimit: number;     // 5 for growth, 0 for free
  aiPayrollLimit: number;     // 5 for growth, 0 for free
  staffSeatLimit: number;     // 3 for growth, 0 for free
  /** Set when partner signs up during transition — 3 months free grandfather */
  grandfatheredUntil?: any;   // Firestore Timestamp
  cancelledAt?: any;          // Firestore Timestamp
  hasTaskManager?: boolean;
};

export type PartnerInvite = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCompanyName: string;
  invitedEmail: string;
  invitedByName: string;
  staffRole: 'partner_admin' | 'partner_staff';
  permissions: StaffPermissions;
  /** crypto.randomUUID() — used as the Firestore doc ID and in the invite URL */
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: any;   // Firestore Timestamp
  expiresAt: any;   // Firestore Timestamp — 72 hours from creation
};

export type Employee = {
  id: string;
  employeeCode: string;
  initials: string;
  name: string;
  surname: string;
  idNumber: string;
  address: {
    unit?: string;
    complex?: string;
    street: string;
    suburb?: string;
    city: string;
    province?: string;
    zip?: string;
  };
  cellNumber: string;
  email: string;
  joinDate: any;
  taxNumber?: string;
  payType: 'Salary' | 'Hourly';
  basicSalary: number;
  hourlyRate: number;
  isNetSalary: boolean;
  paymentFrequency: 'Monthly';
  bankingDetails: {
    bankName: string;
    accountHolder?: string;
    accountNumber: string;
    accountType: string;
    branchCode: string;
  };
  jobTitle?: string;
  department?: string;
  status: 'Active' | 'Terminated' | 'Inactive';
  terminationDate?: any;
  medicalAidMembers?: number;
  medicalAidDependents?: number;
  dateOfBirth?: any;
  recurringItems?: RecurringItem[];
};

export type RecurringItem = {
  id: string;
  label: string;
  amount: number;
  type: 'earning' | 'deduction' | 'contribution' | 'fringe';
  remainingMonths: number | 'indefinite';
  taxCategory?: 'regular' | 'bonus' | 'non-taxable' | '80-percent-taxable';
  isStatutory?: boolean;
};

export type PayslipItem = {
  label: string;
  amount: number;
  isStatutory?: boolean;
  taxCategory?: 'regular' | 'bonus' | 'non-taxable' | '80-percent-taxable';
  durationMonths?: number | 'indefinite';
};

export type Payslip = {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  date: any;
  earnings: PayslipItem[];
  deductions: PayslipItem[];
  contributions: PayslipItem[];
  fringeBenefits: PayslipItem[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  frequency: 'Monthly' | 'Weekly' | 'Fortnightly';
  status: 'draft' | 'finalized';
  hoursWorked?: number;
};

export type PayslipPdfOptions = {
  hideRatePerHour?: boolean;
  hidePayDate?: boolean;
};

export type User = {
  uid: string; // Firebase Authentication UID
  id: string; // Document ID
  name: string;
  surname?: string;
  email: string;
  photoUrl?: string;
  role: 'client' | 'admin' | 'staff' | 'partner' | 'ai_accountant' | 'cap_staff' | 'cap_supervisor' | 'partner_staff' | 'partner_admin';
  createdAt?: any;
  source?: 'AI Accountant' | 'Client Management' | 'Partner Management' | 'AI Payroll';
  clientSource?: 'admin' | 'partner' | 'ai_accountant' | 'ai_payroll';
  department?: 'Accounting and Tax' | 'Administration' | 'CAP' | string;
  departments?: string[]; 
  allowedModules?: string[];
  entityType?: 'Company' | 'Trust' | 'Individual';
  status?: 'Active' | 'Inactive' | 'Archived' | 'Pending Setup Payment' | 'Deactivated';
  disabled?: boolean;
  onboardingStep?: number;
  partnerId?: string; 
  companyName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactNumber?: string;
  creditBalance?: number;
  geminiApiKey?: string;
  address?: {
      unit?: string;
      complex?: string;
      street?: string;
      suburb?: string;
      city?: string;
      province?: string;
      zip?: string;
  },
  bankingDetails?: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    branchCode?: string;
  },
  smtpDetails?: {
    host?: string;
    port?: string;
    user?: string;
    pass?: string;
  },
  imapDetails?: {
    host?: string;
    port?: string;
    user?: string;
    pass?: string;
    secure?: boolean;
  },
  wantsOutsourcedWork?: boolean;
  overflowApproved?: boolean;
  overflowApprovedAt?: any;
  cvUrl?: string;
  certificateUrl?: string;
  capableServices?: string[];
  yearEnd?: any;
  cipcDueDate?: any;
  preparesFinancials?: boolean;
  requiresManagementAccounts?: boolean;
  managementAccountsFrequency?: 'Monthly' | 'Quarterly' | 'Bi-Annually' | 'Annually';
  preparesManagementAccounts?: boolean;
  managementAccountsDay?: number;
  isVatRegistered?: boolean;
  vatNumber?: string;
  vatCategory?: 'A' | 'B' | 'C' | null;
  preparesPayroll?: boolean;
  payrollDay?: number;
  payrollDueDate?: any;
  submitsEmp201?: boolean;
  submitsEmp501?: boolean;
  submitsProvisionalTax?: boolean;
  submitsIncomeTax?: boolean;
  submitsAnnualReturns?: boolean;
  submitsBeneficialOwnership?: boolean;
  complianceDueDate?: string;
  sharedWith?: string[];
  enableInvoicing?: boolean;
  logoUrl?: string;
  nextInvoiceNumber?: number;
  nextCreditNoteNumber?: number;
  nextQuoteNumber?: number;
  archivedNotifications?: string[];
  emailSignature?: string;
  savedReports?: SavedReport[];
  landingPage?: PartnerLandingPageConfig;
  archivedNotificationsClient?: string[];
  monthlyRetainerFee?: number;
  registrationNumber?: string;
  payeReference?: string;
  firstProcessingMonth?: string;
  excludeSdl?: boolean;
  hideRatePerHour?: boolean;
  hidePayDate?: boolean;
  payrollFrequency?: 'Monthly' | 'Weekly' | 'Fortnightly';
  firstRunStartDate?: any;
  allocationRules?: AllocationRule[];
  disableGlobalRules?: boolean;
  chartOfAccounts?: ChartOfAccount[];
  /** AI Accountant subscription (existing — do not repurpose) */
  subscription?: SubscriptionData;
  defaultInvoiceMessage?: string;
  facebookSettings?: {
    pageId?: string;
    pageAccessToken?: string;
    pageName?: string;
    pagePictureUrl?: string;
  };
  // --- Partner Portal Subscription ---
  /** Tier this partner is on. Undefined = legacy R4,950 one-time partner (treated as growth) */
  partnerTier?: PartnerTier;
  partnerSubscription?: PartnerSubscription;
  /** True when the partner has paid the R1,950 once-off platform access fee — unlocks the client-facing storefront */
  platformFeePaid?: boolean;
  /** True when the partner purchased the Done-For-You onboarding add-on (separate from platform fee) */
  setupAddon?: boolean;
  // --- Staff fields (present on partner_staff role users) ---
  /** false = deactivated by owner. Account preserved for audit trail. */
  isActive?: boolean;
  permissions?: StaffPermissions;
  // --- Gamification / Reputation Fields ---
  communityPoints?: number;
  questionsCount?: number;
  answersCount?: number;
  solutionsCount?: number;
  portalStatus?: string;
  payrollClientId?: string;
  talentProfile?: {
    isLookingForWork: boolean;
    preferences: string[];
    experience: string;
    skills?: string[];
    expectedRate?: string;
    availabilityHours?: string;
    professionalBody?: string;
    professionalBodies?: string[];
    yearsExperience?: string;
    registrationNumber?: string;
    cvUrl?: string;
    supportingDocsUrls?: string[];
    workType?: 'Full Time' | 'Part Time' | 'Contract' | 'Freelance';
    locationPreference?: 'Remote' | 'On-site' | 'Hybrid';
  };
};

export type Job = {
  id: string;
  title: string;
  description: string;
  type: 'Full Time' | 'Part Time' | 'Contract' | 'Freelance';
  locationPreference: 'Remote' | 'On-site' | 'Hybrid';
  companyName: string;
  postedByUserId: string;
  status: 'Open' | 'Closed';
  createdAt: any;
};

export type DiscountCode = {
  id: string; // The code itself
  percentage: number;
  status: 'active' | 'used';
  clientEmail: string;
  orderId?: string;
  createdAt: any;
  usedAt?: any;
};

export type TaskComment = {
  text: string;
  date: any;
  authorId: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  createdBy: string;
  createdAt: any;
  updatedAt?: any;
  dueDate: any;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To-Do' | 'In Progress' | 'Review' | 'Done';
  recurrence?: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Bi-Monthly' | 'Semi-Annually' | 'Annually';
  type?: string;
  orderId?: string;
  clientId?: string;
  clientSource?: 'admin' | 'partner' | 'ai_accountant' | 'system' | 'ai_payroll';
  partnerId?: string; 
  comments?: TaskComment[];
  tags?: string[];
  triggerField?: string;
  entityType?: 'Company' | 'Trust' | 'Individual';
  vatCategory?: 'A' | 'B' | 'C';
  dueMonthOffset?: number;
  dueDay?: number;
  department?: string;
  attachments?: { name: string, url: string, path: string }[];
};

export type DemoLead = {
  id: string;
  name: string;
  surname: string;
  email: string;
  cell: string;
  createdAt: any;
};

export type PartnerLead = {
  id: string;
  partnerId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: any;
};

import { z } from 'zod';

export const FindStoryNameInputSchema = z.object({
  commissionNumber: z.string().describe('The commission number to search for.'),
  knowledgeBase: z.string().describe('A block of text containing mappings of commission numbers to story names. Each entry is typically on a new line, e.g., "CM-123\tMy Story Name".'),
});
export type FindStoryNameInput = z.infer<typeof FindStoryNameInputSchema>;

export const FindStoryNameOutputSchema = z.object({
  storyName: z.string().optional().describe('The corresponding story name found in the knowledge base. Returns nothing if no match is found.'),
});
export type FindStoryNameOutput = z.infer<typeof FindStoryNameOutputSchema>;

// Missing Accounting, CRM, and AI Accountant type definitions
export type SmartAllocationResult = {
  accountId: string;
  accountType?: 'account' | 'supplier' | 'customer' | string;
  vatType: string;
  confidence: number;
  summary?: string;
  ruleId?: string;
  matchedKeyword?: string;
  suggestedKeyword?: string;
  reasoning?: string;
};

export type ImportedTransaction = {
  id: string;
  bankAccountId: string;
  date: any;
  description: string;
  amount: number;
  status: 'new' | 'ai_processing' | 'ai_review' | 'reviewed' | 'ready' | 'server_researching';
  isExpense: boolean;
  allocatedTo?: {
    value: string;
    type: 'account' | 'supplier' | 'customer';
  };
  vatType?: string;
  reference?: string;
  smartAllocationResult?: SmartAllocationResult;
  allocationSource?: 'rule' | 'ai' | 'manual' | 'chat' | 'none' | 'history' | 'global_db';
  merchantKey?: string;
  cleanDescription?: string;
  rawDescription?: string;
  clientComment?: string;
  clientExplanation?: string;
  allocatedAt?: any;
  matchedRuleId?: string;
  matchedRuleDescription?: string;
  matchedKeyword?: string;
  auditFiles?: { name: string; url: string }[];
  splitFrom?: string;
  isSplitChild?: boolean;
  parentTxData?: {
    amount: number;
    description: string;
    date: any;
    reference?: string;
    bankAccountId: string;
    isExpense: boolean;
    status: string;
    cleanDescription?: string;
    rawDescription?: string;
    merchantKey?: string;
  };
};

export type AllocationRule = {
  id: string;
  keywords: string[];
  accountId: string;
  accountType?: string;
  vatType: string;
  description?: string;
  priority?: number;
  type?: string;
  scope?: string;
};

export type ClientCustomer = {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  cellNumber?: string;
  vatNumber?: string;
  address?: string;
  street?: string;
  suburb?: string;
  city?: string;
  country?: string;
  zip?: string;
};

export type ChartOfAccount = {
  id: string;
  accountNumber: string;
  code?: string;
  name?: string;
  type?: 'Income' | 'Expense' | 'Asset' | 'Liability' | 'Equity' | string;
  description: string;
  section?: string;
  bankBalance?: number;
};

export type VatType = 
  | 'standard_rated_sales' 
  | 'zero_rated_sales' 
  | 'exempt_sales' 
  | 'standard_rated_purchases' 
  | 'capital_goods_purchases' 
  | 'zero_rated_purchases' 
  | 'exempt_purchases' 
  | 'no_vat';

export type AllocatedTransaction = ImportedTransaction & {
  allocatedTo: {
    value: string;
    type: 'account' | 'supplier' | 'customer';
  };
  allocatedAt: any;
};

export type Supplier = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  vatNumber?: string;
  address?: string;
};

export interface ExtractedInvoice {
  supplier: string;
  invoiceNumber: string;
  date: string;
  invoiceTotal: number;
}

export type CommunityQuestion = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  tags: string[];
  likesCount: number;
  likedBy: string[];
  answersCount: number;
  isSolved: boolean;
  solvedAnswerId?: string;
  status?: 'pending' | 'approved' | 'rejected';
};

export type CommunityAnswer = {
  id: string;
  questionId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: any; // Firestore Timestamp
  likesCount: number;
  likedBy: string[];
  isCorrect: boolean;
};

export type MasterTaskCategory = 
  | 'Supplier Invoices' 
  | 'Payroll & EMP201' 
  | 'SARS Compliance' 
  | 'NCR Applications' 
  | 'COIDA' 
  | 'Quotation Requests' 
  | 'Client Instructions' 
  | 'General';

export type MasterTaskPriority = 'high' | 'medium' | 'low';
export type MasterTaskStatus = 'Pending' | 'In Progress' | 'Replied' | 'Completed' | 'Spam';

export interface MasterTask {
  id: string;
  category: MasterTaskCategory;
  title: string;
  senderName: string;
  senderEmail: string;
  date: string;
  bodyText: string;
  attachments?: { filename: string; size?: number; url?: string; contentType?: string }[];
  status: MasterTaskStatus;
  priority: MasterTaskPriority;
  customInstructions?: string;
  aiDraftReply?: string;
  matchedOrderId?: string;
  matchedOrderSummary?: {
    id: string;
    orderNumber?: string | number;
    companyName?: string;
    customerName?: string;
    serviceTitle?: string;
    status?: string;
  };
  isReplied?: boolean;
  repliedAt?: string;
  createdAt?: any;
  updatedAt?: any;
}

