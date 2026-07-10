export type DocumentUpload = {
  serviceId: string;
  requirementLabel: string;
  type: 'file' | 'text';
  fileUrl?: string;
  fileName?: string;
  textValue?: string;
  uploadedAt: any; // Firestore Timestamp
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
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
  clientRequirements: string[];
  informationToProvide: {
    label: string;
    type?: 'text' | 'pdf';
  }[];
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
  subject: string | null;
  attachments: { name: string; url: string }[] | null;
  attachmentUrl?: string | null; // For legacy single attachments
  attachmentName?: string | null; // For legacy single attachments
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
  resellerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  endCustomerName?: string; 
  endCustomerEmail?: string; 
  date: any;
  items: any[];
  total: number;
  discountCode: string | null;
  discountAmount: number | null;
  paymentMethod?: string;
  clientTotal?: number;
  status: 'Pending Payment' | 'Processing' | 'Completed' | 'Cancelled';
  isOutsourced?: boolean;
  assignedTo?: string[] | null;
  department?: 'Accounting and Tax' | 'Administration' | 'CAP' | null;
  originalOrderId?: string | null;
  notes?: OrderNote[];
  documentUploads?: DocumentUpload[];
  itnHistory?: ItnLog[];
  source?: 'Client' | 'Staff' | 'Partner' | 'AI Accountant Signup' | 'Partner Landing Page';
  renewalForClientId?: string;
  documentContact?: 'partner' | 'client';
  overflowStatus?: 'none' | 'available' | 'claimed' | 'review' | 'completed' | 'cancelled';
  overflowPartnerId?: string | null;
  overflowPayout?: number;
  overflowDeadline?: any;
  overflowClaimedAt?: any;
  overflowSubmittedAt?: any;
  overflowCompletedAt?: any;
  overflowPayoutStatus?: 'none' | 'pending' | 'can_request' | 'requested' | 'paid';
};

export type Invoice = {
  id: string;
  customerId: string;
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
  taxCategory?: 'regular' | 'bonus' | 'non-taxable';
  isStatutory?: boolean;
};

export type PayslipItem = {
  label: string;
  amount: number;
  isStatutory?: boolean;
  taxCategory?: 'regular' | 'bonus' | 'non-taxable';
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
  entityType?: 'Company' | 'Trust' | 'Individual';
  status?: 'Active' | 'Inactive' | 'Archived' | 'Pending Setup Payment';
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
  status: 'new' | 'ai_processing' | 'ai_review' | 'reviewed';
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

// ─── Email Inbox Types ────────────────────────────────────────────────────

export type EmailContact = {
  name: string;
  email: string;
};

export type EmailCategory =
  | 'client_query'
  | 'document_submission'
  | 'payment_related'
  | 'sars_correspondence'
  | 'new_client_inquiry'
  | 'complaint'
  | 'partner_communication'
  | 'spam_marketing'
  | 'internal'
  | 'urgent_deadline'
  | 'other';

export type EmailAttachment = {
  filename: string;
  contentType: string;
  size: number;
  storageUrl?: string;
};

export type Email = {
  id: string;
  messageId: string;
  threadId?: string;
  from: EmailContact;
  to: EmailContact[];
  cc?: EmailContact[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  date: any; // Firestore Timestamp
  receivedAt: any; // Firestore Timestamp
  attachments: EmailAttachment[];
  // AI-generated fields
  aiSummary?: string;
  aiCategory?: EmailCategory;
  aiPriority?: 'urgent' | 'high' | 'medium' | 'low';
  aiSentiment?: 'positive' | 'neutral' | 'negative' | 'angry';
  aiActionItems?: string[];
  aiDraftReply?: string;
  aiDraftReplySubject?: string;
  // Status fields
  status: 'unread' | 'read' | 'replied' | 'archived' | 'snoozed';
  isStarred: boolean;
  assignedTo?: string;
  linkedTaskId?: string;
  linkedOrderId?: string;
  linkedClientId?: string;
  tags?: string[];
  notes?: string;
  snoozeUntil?: any; // Firestore Timestamp
};

