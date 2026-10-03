import { Building, HardHat, Camera, User, Utensils, ShoppingCart, HeartPulse, Briefcase, LucideIcon } from 'lucide-react';

export type IndustryStatutoryItem = {
    title: string;
    act: string;
    description: string;
};

export type IndustryDeliverable = {
    title: string;
    description: string;
};

export type IndustryFaq = {
    q: string;
    a: string;
};

export type IndustryData = {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    description: string;
    icon: LucideIcon;
    heroTitle: string;
    heroSubtitle: string;
    overviewContent: string;
    statutoryFramework: IndustryStatutoryItem[];
    challengesContent: string;
    deliverables: IndustryDeliverable[];
    benefits: string[];
    specialServices: string[];
    faqs: IndustryFaq[];
    content: string; // for backwards compatibility
};

export const industries: Record<string, IndustryData> = {
    sme: {
        slug: 'sme',
        title: 'Accounting for Small & Medium Enterprises (SMEs)',
        metaTitle: 'SME Accounting & Tax Services South Africa | My Accountant',
        metaDescription: 'Specialised accounting, tax compliance, and payroll for South African SMEs. Section 12E SBC tax structuring, CIPC governance, and cash flow forecasting.',
        description: 'Scalable financial management, tax optimization, and statutory governance for small and medium enterprises.',
        icon: Building,
        heroTitle: 'Expert Accounting for South African SMEs',
        heroSubtitle: 'Growth-focused financial management, Section 12E SBC tax optimization, and statutory governance for small and medium businesses across South Africa.',
        overviewContent: `Small and Medium Enterprises (SMEs) represent the vital engine of the South African economy, generating over half of national employment and driving grassroots innovation. However, South African SMEs operate within one of the most rigorous and complex statutory environments in the developing world. From navigating corporate income tax brackets and Value-Added Tax (VAT) reconciliations to managing employee payroll withholdings (PAYE, UIF, SDL) and Companies and Intellectual Property Commission (CIPC) compliance, growing enterprises require sophisticated financial oversight to thrive.

At My Accountant, we provide an integrated, cloud-driven financial ecosystem tailored specifically to the operational realities of South African SMEs. We act as your outsourced finance department, transforming raw transactional data into actionable commercial insights while ensuring flawless adherence to the Companies Act 71 of 2008 and the Income Tax Act 58 of 1962. By pairing modern accounting automation with seasoned Chartered Accountants, we protect your gross margins, optimize your corporate tax exposure under preferential regimes like Section 12E Small Business Corporations (SBC), and free executive leadership to focus on commercial expansion, customer acquisition, and operational excellence.`,
        statutoryFramework: [
            {
                title: 'Section 12E Small Business Corporation (SBC) Status',
                act: 'Income Tax Act 58 of 1962, Section 12E',
                description: 'Qualifying SMEs with annual turnover under R20 million and all individual natural-person shareholders benefit from graduated corporate income tax rates. Rather than paying the standard flat 27% corporate rate, qualifying SBCs pay 0% on the first R95,750 of taxable income, with progressive rates scaling up to 27%. In addition, Section 12E(1) allows an immediate 100% tax write-off on new manufacturing machinery, or an accelerated 50/30/20 depreciation schedule on other operational capital assets.'
            },
            {
                title: 'Public Interest Score (PIS) & Financial Reporting',
                act: 'Companies Act 71 of 2008 & Companies Regulations 2011',
                description: 'Every South African registered company must compute its Public Interest Score (PIS) at the end of each financial year. The PIS determines whether a company’s Annual Financial Statements (AFS) must be compiled by an independent accounting officer, independently reviewed, or subject to a full statutory audit under Section 29 reporting standards.'
            },
            {
                title: 'Mandatory Beneficial Ownership Filing',
                act: 'General Laws (Anti-Money Laundering) Amendment Act 2022',
                description: 'All registered South African companies are legally mandated to submit and maintain an updated Beneficial Ownership register with CIPC. Failure to lodge beneficial ownership declarations leaves the company non-compliant, leading to administrative compliance notices, frozen corporate banking facilities, and potential deregistration.'
            },
            {
                title: 'Value-Added Tax (VAT) Compliance',
                act: 'Value-Added Tax Act 89 of 1991',
                description: 'Mandatory VAT registration is triggered upon exceeding R1 million in taxable supplies within any consecutive 12-month period, or where there is a contractual certainty of doing so. Businesses may register voluntarily once taxable turnover surpasses R50,000, allowing early-stage companies to claim back substantial input VAT on setup capital expenditures.'
            }
        ],
        challengesContent: `Operating an SME in South Africa presents distinct financial hurdles. Severe cash flow volatility caused by extended debtor payment cycles, stringent commercial bank lending criteria, and relentless statutory compliance demands can quickly drain operational working capital. Many business owners rely on backward-looking year-end financial statements compiled months after year-end, discovering profit erosion, margin compression, or unexpected tax liabilities far too late to make corrective adjustments.

Furthermore, without dedicated management accounts and proactive tax planning, SMEs routinely forfeit substantial Section 12E tax allowances, overpay on provisional tax, or encounter debilitating SARS administrative penalties under Chapter 15 of the Tax Administration Act. Our structured monthly retainers eliminate these vulnerabilities by delivering continuous financial oversight, disciplined monthly ledger closes, and forward-looking 13-week cash runway modeling.`,
        deliverables: [
            {
                title: 'Automated Monthly Cloud Bookkeeping',
                description: 'Daily transaction processing, automated bank feed reconciliations via Xero or Sage Business Cloud, electronic supplier invoice capture, and digitized audit-ready receipts storage.'
            },
            {
                title: 'Bi-Monthly VAT201 Preparation & Lodgement',
                description: 'Rigorous output vs input VAT reconciliations, valid tax invoice verification, electronic SARS eFiling submissions, and prompt handling of SARS VAT audit verifications.'
            },
            {
                title: 'Quarterly Management Packs & Cash Forecasting',
                description: 'Interim Profit & Loss statements, balance sheet health reviews, 13-week rolling cash flow forecasts, working capital metrics (DSO, DPO), and budget variance analysis.'
            },
            {
                title: 'Annual IFRS for SMEs Financial Statements',
                description: 'Compilation of statutory Annual Financial Statements in compliance with IFRS for SMEs, accompanied by annual corporate income tax returns (ITR14) and tax calculations.'
            },
            {
                title: 'Annual CIPC Governance & Beneficial Ownership',
                description: 'Annual Return filing with CIPC to keep the entity in good standing, maintenance of the statutory Beneficial Ownership confirmation register, and director disclosures.'
            }
        ],
        benefits: [
            'Fixed-fee monthly packages for predictable budgeting with zero surprise billing',
            'Full statutory tax compliance spanning VAT, PAYE, SDL, UIF, and Corporate Income Tax',
            'Regular management reports delivering real-time visibility into operational gross margins',
            'Direct access to accredited Chartered Accountants and registered SARS tax practitioners',
            'Proactive provisional tax planning eliminating unexpected year-end SARS liabilities'
        ],
        specialServices: [
            'Section 12E Small Business Corporation tax health checks and entity restructuring',
            '13-week forward-looking cash runway modeling and working capital optimization',
            'Audit-ready financial statement compilation and independent review support',
            'CIPC maintenance, director amendments, share register updates, and beneficial ownership compliance'
        ],
        faqs: [
            {
                q: 'How does Section 12E Small Business Corporation (SBC) tax status benefit my SME?',
                a: 'Under Section 12E of the Income Tax Act, qualifying companies pay graduated tax rates starting at 0% on the first R95,750 of taxable income, compared to the flat 27% standard corporate rate. This can yield tens of thousands of Rands in annual tax savings. Additionally, SBCs can claim an immediate 100% tax write-off on new manufacturing machinery under Section 12E(1), or an accelerated 50/30/20 depreciation schedule on other operational capital assets.'
            },
            {
                q: 'What is a Public Interest Score (PIS) and do I need an audit for my small business?',
                a: 'The Public Interest Score (PIS) is a statutory metric calculated under the Companies Act 71 of 2008 based on average employee headcount, annual turnover, third-party liabilities, and shareholder count. Most private SMEs with a PIS below 100 whose financial statements are independently compiled require only an Independent Compilation or Review rather than an expensive statutory audit.'
            },
            {
                q: 'What are the penalties if an SME fails to file its CIPC Beneficial Ownership register?',
                a: 'Under the General Laws Amendment Act, failing to submit and update your Beneficial Ownership register with CIPC can lead to administrative compliance notices, director delinquency proceedings, and ultimately final deregistration of the company, resulting in frozen corporate bank accounts.'
            },
            {
                q: 'When is an SME required to register for VAT with SARS?',
                a: 'VAT registration is legally mandatory as soon as the total value of taxable supplies exceeds R1 million in any consecutive 12-month period, or where there is a contractual obligation to exceed that threshold. A business may register voluntarily once taxable turnover exceeds R50,000 in the past 12 months.'
            }
        ],
        content: 'Small and Medium Enterprises (SMEs) are the backbone of the South African economy. At My Accountant, we provide the financial structure you need to scale from a startup to an established market player. We handle the heavy lifting of compliance and bookkeeping so you can focus on leadership and innovation.'
    },

    construction: {
        slug: 'construction',
        title: 'Accounting for Construction, Contractors & Builders',
        metaTitle: 'Construction Accounting & Contractor Tax | My Accountant',
        metaDescription: 'Specialised construction accounting, CIDB financial statements, COIDA Letter of Good Standing, retention billing, and job costing in South Africa.',
        description: 'Specialised project-based accounting, retention tracking, CIDB grading, and COIDA compliance for builders, civil contractors, and trade specialists.',
        icon: HardHat,
        heroTitle: 'Specialised Construction Industry Accounting',
        heroSubtitle: 'Project-based financial tracking, CIDB contractor grading, COIDA Letters of Good Standing, and Section 24C tax allowances for South African builders and contractors.',
        overviewContent: `The South African construction and civil engineering sector operates under an exceptionally demanding and volatile financial framework. Between project milestone progress draws, retention withholding, subcontractor tax classification under the Fourth Schedule, and volatile material input pricing, construction firms require specialised job costing systems rather than generic commercial bookkeeping.

At My Accountant, we understand the contractual realities of JBCC, GCC, NEC, and FIDIC construction contracts. We structure project accounting systems that accurately track Work-in-Progress (WIP), allocate direct and indirect site overheads, reconcile subcontractor payment certificates, and manage cash flow across multi-month commercial and civil developments. Our team coordinates directly with the Construction Industry Development Board (CIDB) and the Compensation Fund (COIDA) to ensure your business remains fully compliant, financially sound, and tender-ready at all times.`,
        statutoryFramework: [
            {
                title: 'CIDB Contractor Grading & Financial Compliance',
                act: 'Construction Industry Development Board Act 38 of 2000',
                description: 'Contractor grading levels (1 through 9) across General Building (GB), Civil Engineering (CE), Electrical (EB), and Mechanical (ME) classes depend on audited or compiled financial track records, requiring certified annual turnover and largest completed contract values under strict CIDB financial scoring criteria.'
            },
            {
                title: 'COIDA Annual Return of Earnings (W.As.8)',
                act: 'Compensation for Occupational Injuries and Diseases Act 130 of 1993',
                description: 'Mandatory annual declaration of actual and estimated employee earnings to the Compensation Fund. Maintaining an active, verified Letter of Good Standing is an indispensable statutory requirement for site access, municipal tenders, and main-contractor site safety sign-offs.'
            },
            {
                title: 'VAT on Retention Monies & Progress Claims',
                act: 'Value-Added Tax Act 89 of 1991, Section 9(3)',
                description: 'Special time-of-supply rules defer the VAT liability on retention monies withheld by employers or main contractors until the retention payment is due or a specific tax invoice is issued, preventing severe cash flow drains on construction retentions.'
            },
            {
                title: 'Section 24C Future Contract Expenditure Allowance',
                act: 'Income Tax Act 58 of 1962, Section 24C',
                description: 'Permits contractors who receive advance contract payments or mobilisation fees to claim a statutory tax allowance for future expenditure incurred in carrying out the contract in subsequent tax years, shielding upfront cash from unfair immediate corporate income tax.'
            }
        ],
        challengesContent: `Cash flow management is the single greatest cause of contractor insolvency in South Africa. Retention monies (typically 5% to 10% of contract value) are routinely withheld for 12 months past practical completion during the defects liability period, locking away the contractor’s entire net profit margin. Delayed progress draws, disputed variation orders, and unbudgeted material cost spikes can plunge even highly profitable projects into technical cash insolvency.

Furthermore, SARS scrutinises the construction sector intensely regarding the tax classification of labour-only subcontractors. Treating subcontractors as independent without adhering to strict SARS Fourth Schedule independent contractor criteria can trigger retroactive 10% PAYE penalties and personal director liabilities. Our dedicated construction accountants establish robust job costing controls to safeguard your balance sheet.`,
        deliverables: [
            {
                title: 'Project-Based Job Costing & WIP Accounting',
                description: 'Tracking direct labour, materials, equipment hire, and subcontractor costs against contract estimates to calculate accurate Work-in-Progress (WIP) and gross margin percentages per site.'
            },
            {
                title: 'Subcontractor Tax Vetting & 4th Schedule Audits',
                description: 'Vetting independent subcontractor agreements, verifying tax clearance PINs, auditing invoices, and ensuring strict compliance with SARS Fourth Schedule rules.'
            },
            {
                title: 'CIDB Financial Statements & Upgrade Packs',
                description: 'Compiling specialized financial statements and track-record packs to support CIDB contractor grading renewals and upward grade applications across GB, CE, and ME classes.'
            },
            {
                title: 'COIDA Return of Earnings & Letter of Good Standing',
                description: 'Annual submission of Form W.As.8, tariff assessment verification, and expedited renewal of your verified Compensation Fund Letter of Good Standing.'
            },
            {
                title: 'Retention Ledger & Progress Billing Administration',
                description: 'Accurate tracking of practical and final completion retention releases, defect liability periods, and Section 9(3) deferred VAT reconciliations.'
            }
        ],
        benefits: [
            'Site-by-site profitability tracking to eliminate loss-making contracts early in the build cycle',
            'Subcontractor verification to insulate your business from retroactive PAYE liabilities and penalties',
            'Seamless CIDB and COIDA compliance ensuring continuous municipal and corporate tender eligibility',
            'Expert application of Section 24C future expenditure allowances for cash flow protection',
            'Accurate Work-in-Progress (WIP) valuation reflecting true contract gross profit margins'
        ],
        specialServices: [
            'JBCC, GCC, and NEC contract progress claim certificate billing support',
            'Plant and heavy machinery wear-and-tear depreciation optimization under Section 11(e)',
            'Tender financial feasibility reviews and working capital bonding advisory',
            'Joint venture (JV) project accounting and consortium profit distribution modeling'
        ],
        faqs: [
            {
                q: 'How is VAT accounted for on construction retention monies in South Africa?',
                a: 'Under Section 9(3) of the VAT Act, the time of supply for construction retentions is deferred until the retention money becomes legally payable (such as upon issuance of the Certificate of Final Completion) or when an invoice is issued. This ensures contractors do not have to pay 15% VAT out-of-pocket on money they will not receive for up to a year.'
            },
            {
                q: 'What financial statements are required by the CIDB to upgrade a contractor grading?',
                a: 'To upgrade a CIDB contractor grading (e.g., from Grade 4 to Grade 6), the CIDB requires Annual Financial Statements covering up to 3 financial years. The financials must demonstrate that your company meets the required Best Annual Turnover threshold and Largest Contract value, certified by an accredited accounting officer or registered auditor.'
            },
            {
                q: 'How do I ensure subcontractors are not classified as employees by SARS under the 4th Schedule?',
                a: 'SARS applies strict statutory and common law tests to determine whether a worker is an independent contractor or deemed employee. Contractors must deploy their own tools, employ their own staff, carry commercial risk, and not be subject to direct control and supervision. We draft compliant subcontractor agreements and ensure tax invoices meet SARS standards to prevent 4th Schedule PAYE liabilities.'
            },
            {
                q: 'What is a Section 24C allowance and how does it assist construction cash flow?',
                a: 'Section 24C of the Income Tax Act allows a taxpayer who receives contract income in advance (such as a mobilization advance or deposit) to claim a tax allowance for future expenditure that will be incurred to execute the contract in the following tax year, preventing unfair corporate tax bills on unearned contract advances.'
            }
        ],
        content: 'The construction industry has unique financial demands, from progress billing and retention tracking to complex labor costs. Our specialised construction accounting services ensure your project margins are protected and your compliance with CIDB and COIDA is always current.'
    },

    hospitality: {
        slug: 'hospitality',
        title: 'Accounting for Hospitality, Restaurants & Bars',
        metaTitle: 'Hospitality Accounting & Restaurant Tax | My Accountant',
        metaDescription: 'Specialised accounting for South African restaurants, cafes, and bars. Point-of-sale reconciliations, Sectoral Determination 14 payroll, and liquor compliance.',
        description: 'Comprehensive financial oversight, POS integration, food cost variance tracking, liquor licensing compliance, and Sectoral Determination 14 payroll for restaurants and hospitality venues.',
        icon: Utensils,
        heroTitle: 'Full-Service Hospitality & Restaurant Accounting',
        heroSubtitle: 'Inventory controls, daily POS integration, Sectoral Determination 14 payroll, and delivery platform reconciliations for South African restaurants, cafes, and hotels.',
        overviewContent: `The South African hospitality and food service industry is characterised by high transaction volumes, perishable inventory, tight operational gross margins, and complex labour shift arrangements. A fractional variance in food cost percentages, unmonitored bar shrinkage, or inaccurate accounting for third-party delivery platforms like UberEats and Mr D Food can quickly turn a bustling restaurant into a loss-making enterprise.

At My Accountant, we provide specialised accounting built specifically for restaurant owners, franchise operators, and boutique hospitality venues. We connect directly with leading Point-of-Sale (POS) systems (Pilot, GAAP, Lightspeed, Yoco) to automate daily sales reconciliations, audit cash-ups, track Cost of Goods Sold (COGS), and enforce strict compliance with BCEA Sectoral Determination 14 for restaurant staff. We ensure your food and beverage business maintains healthy cash flows and spotless statutory standing with SARS and municipal liquor boards.`,
        statutoryFramework: [
            {
                title: 'BCEA Sectoral Determination 14 (Hospitality Sector)',
                act: 'Basic Conditions of Employment Act 75 of 1997',
                description: 'Mandates minimum wages, night shift allowances (10% premium between 18:00 and 06:00), uniform allowances, maximum ordinary working hours, and statutory remuneration rules for work performed on Sundays and public holidays across all restaurant and hotel personnel.'
            },
            {
                title: 'Bargaining Council for the Restaurant & Catering Trades',
                act: 'Labour Relations Act 66 of 1995',
                description: 'Mandatory employer registration in designated provincial jurisdictions, enforcing compliance with collective bargaining agreements, employee provident fund contributions, funeral benefit schemes, and dispute resolution levies.'
            },
            {
                title: 'Liquor Licensing & Municipal Health Compliance',
                act: 'National Liquor Act 59 of 2003 & Provincial Liquor Acts',
                description: 'Annual liquor license renewal fees, Section 19/23 licence transfers, and compliance with municipal Certificate of Acceptability (CoA) standards under Department of Health Regulation R638 governing food hygiene.'
            },
            {
                title: 'VAT on Delivery Platforms & Gratuities',
                act: 'Value-Added Tax Act 89 of 1991',
                description: 'Accounting for delivery platform commissions (UberEats, Mr D Food), promotional discount splits, and ensuring that staff gratuities and tips are handled in full alignment with SARS PAYE and VAT regulations.'
            }
        ],
        challengesContent: `Hospitality operators face relentless margin pressures. Food and beverage cost percentages must typically be kept between 28% and 34% of gross revenue, while labour costs must remain under 30%. Failing to capture daily inventory waste, supplier price changes, portion creep, or staff meal deductions causes invisible cash leakage that devastates profitability.

Furthermore, delivery platform statements are notoriously convoluted. Platforms deduct commission fees, marketing charges, customer refunds, and driver delivery fees before disbursing net sales, creating massive accounting reconciliation traps for generic bookkeepers. We automate these platform reconciliations to ensure your gross sales and input VAT deductions are 100% accurate.`,
        deliverables: [
            {
                title: 'Daily POS Sales & Merchant Settlement Reconciliations',
                description: 'Direct ingestion of sales data from Pilot, GAAP, Yoco, or Lightspeed, reconciling daily till cash-ups, credit card card-machine settlements, and merchant clearing accounts.'
            },
            {
                title: 'Food & Beverage Cost of Sales (COGS) Audits',
                description: 'Weekly and monthly gross margin tracking, recipe costing, inventory wastage analysis, and bar shrinkage reports to maintain optimal food cost percentages.'
            },
            {
                title: 'Sectoral Determination 14 Payroll & Shift Management',
                description: 'Automated payroll calculating variable shift hours, night shift premiums, Sunday work overtime, and Bargaining Council levy deductions.'
            },
            {
                title: 'Delivery Platform Statement Reconciliations',
                description: 'Deconstructing monthly UberEats and Mr D Food statements, correctly separating gross sales, delivery platform commission fees, and VAT201 input claims.'
            },
            {
                title: 'Turnover-Based Rental Statements for Landlords',
                description: 'Compiling certified monthly turnover statements required by shopping centre landlords for turnover-linked rental lease agreements.'
            }
        ],
        benefits: [
            'Daily sales and merchant card reconciliation eliminating till discrepancies and cash theft',
            'Granular food and beverage cost tracking to protect restaurant gross profit margins',
            'Full compliance with Sectoral Determination 14 protecting against CCMA labor disputes',
            'Accurate VAT accounting on delivery platform commissions and staff service charges',
            'Automated inventory control highlighting supplier price increases and shrinkage'
        ],
        specialServices: [
            'Recipe costing and menu engineering to maximize gross margin contributions',
            'Periodic physical inventory count auditing and stock variance investigations',
            'Turnover rental certificate compilation for commercial lease agreements',
            'Liquor license renewal financial packs and municipal Certificate of Acceptability support'
        ],
        faqs: [
            {
                q: 'Are staff tips and service charges subject to VAT and PAYE in South Africa?',
                a: 'Voluntary tips paid directly to staff or through credit card machines and distributed in full to employees are generally exempt from VAT, but constitute taxable remuneration subject to PAYE withholding if administered through the employer’s payroll. Mandatory service charges added to the customer bill, however, constitute gross income of the restaurant and are subject to standard 15% VAT.'
            },
            {
                q: 'How should UberEats and Mr D delivery commissions be treated on our VAT201 return?',
                a: 'Gross customer orders processed through delivery platforms must be recorded as standard-rated taxable sales. The platform commission fees (typically 20% to 30%) deducted by UberEats or Mr D represent a deductible business expense containing claimable 15% input VAT, provided valid tax invoices are issued by the platform.'
            },
            {
                q: 'What are the payroll compliance rules under Hospitality Sectoral Determination 14?',
                a: 'Sectoral Determination 14 governs restaurant and hotel workers. It establishes prescribed minimum wages, mandates a 10% night shift allowance for work between 18:00 and 06:00, requires 1.5x normal wage for Sunday work (unless Sunday is an ordinary working day), and dictates paid annual, sick, and family leave.'
            },
            {
                q: 'How does turnover-based rental reporting work for restaurant leases?',
                a: 'Most retail and mall restaurant leases require a base rent plus a percentage of monthly turnover (e.g. 7% to 10% of gross sales). Landlords mandate certified monthly turnover certificates signed by an independent accounting officer to verify accurate rent calculations.'
            }
        ],
        content: 'Restaurants operate on thin margins and high transaction volumes. We provide the financial oversight needed to track food costs, manage staff payroll, and integrate your POS data directly into your accounting software for real-time visibility.'
    },

    'healthcare-medical-practices': {
        slug: 'healthcare-medical-practices',
        title: 'Accounting for Healthcare & Medical Practices',
        metaTitle: 'Medical Practice Accounting & Doctor Tax | My Accountant',
        metaDescription: 'Specialised accounting for doctors, dentists, and medical practices in South Africa. HPCSA compliance, Section 12(h) VAT exemption, and medical billing reconciliation.',
        description: 'Specialised financial management, HPCSA ethical structuring, medical billing reconciliation, Section 12(h) VAT apportionment, and locum doctor tax compliance for healthcare practices.',
        icon: HeartPulse,
        heroTitle: 'Specialised Medical Practice Accounting',
        heroSubtitle: 'Dedicated financial management, HPCSA ethical structuring, medical billing reconciliations, and Section 12(h) VAT apportionment for South African healthcare professionals.',
        overviewContent: `Healthcare professionals, medical specialists, dentists, and allied health practitioners operate in an intensely regulated professional and tax environment. Practicing medicine requires stringent adherence to the Health Professions Council of South Africa (HPCSA) ethical rules, Board of Healthcare Funders (BHF) protocols, Council for Medical Schemes regulations, and unique South African tax provisions.

At My Accountant, we provide specialised accounting solutions designed specifically for private medical practices, multidisciplinary clinics, and medical incorporated entities (Inc.). We integrate directly with medical billing and electronic claims systems (GoodX, Healthbridge, Vericlaim, Mededi) to reconcile Medical Aid Electronic Remittance Advices (ERAs), track outstanding patient co-payments, and structure complex dual-stream VAT apportionment schedules separating exempt medical consultations from taxable retail and dispensary supplies.`,
        statutoryFramework: [
            {
                title: 'HPCSA Ethical Rules & Entity Structuring',
                act: 'Health Professions Act 56 of 1974 & HPCSA Ethical Rules',
                description: 'Rule 18 strictly prohibits fee-sharing, commissions, and perverse incentives between practitioners. Medical practices may only operate as sole proprietorships, partnerships, or Personal Liability Companies (Inc.) where all shareholders and directors are registered healthcare professionals under HPCSA regulations.'
            },
            {
                title: 'Section 12(h) VAT Exemption & Input Apportionment',
                act: 'Value-Added Tax Act 89 of 1991, Section 12(h)',
                description: 'Services rendered by registered medical practitioners are exempt from VAT. Practices selling taxable retail goods (skincare, medical devices, health supplements) must apply strict SARS turnover-based input tax apportionment methods to avoid audit clawbacks.'
            },
            {
                title: 'Board of Healthcare Funders (BHF) PCNS Compliance',
                act: 'Medical Schemes Act 131 of 1998',
                description: 'Maintaining active Practice Code Numbering System (PCNS) registration with BHF to ensure continuous electronic claims clearance across all private medical schemes and administrator clearing houses.'
            },
            {
                title: 'Accelerated Wear-and-Tear on Medical Equipment',
                act: 'Income Tax Act 58 of 1962, Section 11(e) & Section 12C',
                description: 'Accelerated tax depreciation and capital allowances on high-technology diagnostic equipment, dental chairs, ultrasound machines, and surgical instrumentation.'
            }
        ],
        challengesContent: `The greatest financial challenge facing medical practices is the complexity of revenue cycle management and medical scheme debt recovery. Electronic data interchange (EDI) claim rejections, partial scheme payments, short-payments, and uncollected patient co-payments routinely create massive, aging debtors ledgers. Without daily remittance reconciliation, medical practices lose significant revenue to stale claims.

Furthermore, medical practice owners frequently struggle with tax compliance regarding locum doctors and sessional nurses. SARS considers locums who work set hours under practice direction to be subject to standard PAYE withholding unless strict independent contractor criteria are satisfied. Our team delivers clear, compliant locum contracts and payroll structures to keep your practice audit-safe.`,
        deliverables: [
            {
                title: 'Medical Billing Software & Cloud Ledger Sync',
                description: 'Integrating electronic claims data from GoodX, Healthbridge, Vericlaim, and Mededi into Xero or Sage ledgers for real-time financial tracking.'
            },
            {
                title: 'Medical Aid Remittance (ERA) & Debtors Aging Audits',
                description: 'Reconciling bulk scheme payments, managing EDI claim rejections, and tracking aged patient co-payments to accelerate cash collections.'
            },
            {
                title: 'Dual-Stream Section 12(h) VAT Apportionment',
                description: 'Developing verified VAT apportionment schedules to claim legitimate input VAT on shared practice overheads while honoring the medical consultation exemption.'
            },
            {
                title: 'Locum Tenens Payroll & Independent Contractor Vetting',
                description: 'Structuring compliant locum agreements, calculating correct PAYE tax withholding, and managing nursing and reception practice payroll.'
            },
            {
                title: 'Medical Equipment Asset Register & Write-Off Optimization',
                description: 'Structuring financing, lease vs purchase analyses, and claiming maximum Section 11(e) accelerated wear-and-tear deductions on high-value medical hardware.'
            }
        ],
        benefits: [
            'Direct integration with medical billing platforms eliminating manual double-entry bookkeeping',
            'Full compliance with HPCSA Rule 18 fee-sharing rules and personal liability corporate structures',
            'Accurate Section 12(h) VAT apportionment preventing aggressive SARS assessments',
            'Optimized locum and practice staff payroll management with automated EMP201 submissions',
            'Comprehensive doctor tax planning balancing salary drawings against Section 64E dividends'
        ],
        specialServices: [
            'Medical practice valuation and partnership admission/buy-out financial modeling',
            'Diagnostic medical equipment financing advisory and Section 12C capital allowance claims',
            'Personal liability company (Inc.) incorporation and CIPC memorandum of incorporation review',
            'Practice overhead benchmarking against established private healthcare benchmarks'
        ],
        faqs: [
            {
                q: 'Are medical practice consultations exempt from VAT in South Africa?',
                a: 'Yes. Under Section 12(h) of the VAT Act, services rendered by registered medical practitioners (general practitioners, specialists, dentists, physiotherapists) are exempt from VAT. However, if your practice also sells taxable retail goods (such as aesthetic skincare, retail supplements, or specialized health products), you have mixed supplies and must calculate an annual turnover-based VAT input apportionment schedule.'
            },
            {
                q: 'Can medical specialists and doctors operate through an Incorporated company (Inc.)?',
                a: 'Yes. Medical practitioners can operate through a Personal Liability Company (Inc.) under the Companies Act 71 of 2008 and HPCSA regulations, provided all shareholders and directors are actively registered healthcare professionals. This structure provides corporate tax planning advantages under standard corporate tax or Section 12E SBC rules while maintaining statutory professional liability.'
            },
            {
                q: 'How should locum doctors be taxed to avoid SARS personal income tax non-compliance?',
                a: 'Under the Fourth Schedule, locum doctors who work set rosters at a practice under the direction of the practice owner are generally deemed employees subject to standard PAYE withholding. They can only be paid gross as independent contractors if they operate genuinely independent businesses, invoice multiple practices, and meet strict SARS independent contractor criteria.'
            },
            {
                q: 'What tax deductions can a medical practice claim on high-tech diagnostic equipment?',
                a: 'Medical machinery (such as ultrasound scanners, X-ray equipment, laser systems, and dental units) qualifies for wear-and-tear depreciation under Section 11(e) over 3 to 5 years. Qualifying manufacturing-linked medical plant may also be eligible for accelerated capital allowances under Section 12C or Section 12E for Small Business Corporations.'
            }
        ],
        content: 'Dedicated financial management for doctors, dentists, specialists, and allied healthcare practitioners in South Africa. We manage billing reconciliations, HPCSA compliance, and medical tax structuring.'
    },

    'ecommerce-online-sellers': {
        slug: 'ecommerce-online-sellers',
        title: 'Accounting for E-commerce & Online Sellers',
        metaTitle: 'E-commerce Accounting & Online Seller Tax | My Accountant',
        metaDescription: 'Specialised e-commerce accounting for Shopify, Takealot, and WooCommerce sellers in South Africa. Automated VAT, inventory valuation, and customs clearance.',
        description: 'Automated multi-platform bookkeeping, Takealot Seller Portal statement reconciliation, Shopify/WooCommerce syncing, landed cost inventory, and cross-border VAT compliance.',
        icon: ShoppingCart,
        heroTitle: 'Smart Accounting for E-commerce & Online Sellers',
        heroSubtitle: 'Automated storefront syncing, Takealot statement reconciliations, landed cost inventory valuation, and cross-border VAT compliance for South African online stores.',
        overviewContent: `E-commerce moves at breakneck speed. South African online retailers selling across Shopify, WooCommerce, Takealot, and Amazon face an intricate financial landscape shaped by high-volume transactions, multi-channel payment gateway settlements, platform commission fees, customer returns, and complex cross-border VAT regulations.

At My Accountant, we provide specialised e-commerce financial engineering. We bridge the disconnect between your online storefronts, marketplace seller portals, payment processors (PayFast, Yoco, Ozow, Payflex, Peach Payments, PayPal), and your cloud general ledger. Using tools like A2X and custom cloud APIs, we eliminate tedious manual data entry, automate multi-warehouse Cost of Goods Sold (COGS) tracking, and ensure your business stays 100% compliant with SARS Customs, VAT, and corporate income tax laws.`,
        statutoryFramework: [
            {
                title: 'Local vs Export VAT Regulations',
                act: 'Value-Added Tax Act 89 of 1991, Sections 7(1)(a) & 11(1)(a)',
                description: 'Domestic online orders are subject to standard 15% VAT. Cross-border exports can only be zero-rated under Section 11(1)(a) if strict documentary evidence of export (SAD500 customs documents, bill of entry, commercial courier air waybills) is archived in accordance with SARS Interpretation Note 30.'
            },
            {
                title: 'Customs Duties, Import Valuation & Added Tax Value (ATV)',
                act: 'Customs and Excise Act 91 of 1964',
                description: 'Imported commercial goods require a registered Importer Customs Code. Customs VAT is calculated at 15% on the statutory Added Tax Value (ATV = Customs Value + 10% statutory upliftment + non-rebated Import Customs Duties).'
            },
            {
                title: 'Consumer Protection Act (CPA) Customer Returns & Refunds',
                act: 'Consumer Protection Act 68 of 2008',
                description: 'Accounting for statutory 10-day cooling-off periods, customer return allowances, credit note generation, and damaged inventory write-offs under Section 20 of the CPA.'
            },
            {
                title: 'Electronic Services Regulations & Marketplace Disclosures',
                act: 'Electronic Communications and Transactions Act 25 of 2002',
                description: 'Statutory electronic tax invoice compliance, payment gateway reconciliation, and customer disclosure mandates for digital storefronts.'
            }
        ],
        challengesContent: `The greatest vulnerability for online merchants is inaccurate inventory valuation and gross margin distortion. Many e-commerce entrepreneurs treat inventory purchases as immediate operational expenses or fail to factor in landed costs—such as ocean freight, customs clearance fees, import duties, and port logistics—leading to wildly inaccurate profit reporting and unexpected tax bills.

Furthermore, marketplace portals like Takealot present significant reconciliation headaches. Takealot payouts arrive as lump-sum net deposits with Takealot success fees, fulfillment fees, auto-storage penalties, customer returns, and lost inventory adjustments already deducted. Generic accountants frequently record only the net payout, under-reporting gross revenue and failing to claim thousands of Rands in legitimate input VAT. We deconstruct every Takealot statement line by line.`,
        deliverables: [
            {
                title: 'Automated Storefront & Cloud Ledger Integration',
                description: 'Seamless integration between Shopify, WooCommerce, Takealot, and Xero/Sage ledgers using A2X or direct APIs, creating summarized journal entries matching bank deposits.'
            },
            {
                title: 'Payment Gateway Clearing Account Reconciliations',
                description: 'Reconciling PayFast, Yoco, Ozow, Payflex, Peach Payments, and PayPal settlements against merchant fees and general ledger bank feeds.'
            },
            {
                title: 'Takealot Seller Portal Statement Automation',
                description: 'Deconstructing monthly Takealot statements to capture gross product sales, commission fees, Takealot logistics charges, customer returns, and claimable input VAT.'
            },
            {
                title: 'Landed Cost Inventory Valuation & COGS Tracking',
                description: 'Calculating true landed costs (product cost + freight + customs duties + clearing) to ensure accurate FIFO or Weighted Average inventory valuation on balance sheets.'
            },
            {
                title: 'Cross-Border Export VAT & Customs Documentation Audits',
                description: 'Verifying SAD500 clearance certificates, courier airway bills, and zero-rated export schedules to protect against SARS VAT audit clawbacks.'
            }
        ],
        benefits: [
            'Automated transactional data flows eliminating thousands of hours of manual bookkeeping',
            'Accurate landed cost calculations ensuring you never sell inventory at a hidden loss',
            'Full deconstruction of Takealot statements capturing every cent of claimable input VAT',
            'Watertight cross-border export documentation compliant with SARS Interpretation Note 30',
            'Real-time cash flow visibility across multi-currency and merchant clearing accounts'
        ],
        specialServices: [
            'Multi-currency transaction tracking and realized/unrealized foreign exchange (forex) reporting',
            'Importer/Exporter Customs Code registration with the South African Revenue Service',
            'Cash flow forecasting for holiday inventory purchasing and container shipments',
            'Subscription billing, SaaS revenue recognition, and digital product tax advisory'
        ],
        faqs: [
            {
                q: 'How is Customs VAT calculated on commercial goods imported into South Africa?',
                a: 'Customs VAT is not calculated simply on the purchase price. SARS calculates VAT at 15% on the Added Tax Value (ATV). The ATV equals the Customs Value of the goods plus an automatic 10% statutory upliftment markup, plus any applicable Customs Duties. The resulting VAT paid to SARS Customs can generally be claimed back as input VAT on your VAT201 return, provided you retain the official SAD500 customs release document.'
            },
            {
                q: 'How do I reconcile Takealot Seller Portal statements with my accounting software?',
                a: 'Takealot pays out net funds after deducting success fees, fulfillment charges, storage penalties, and customer returns. To maintain compliant accounting, you must not simply record the bank deposit. You must record the gross sales, record Takealot’s service fees as operating expenses, claim the 15% input VAT on Takealot’s fee invoice, and adjust for customer returns.'
            },
            {
                q: 'Do I need to charge 15% VAT on orders shipped to international customers?',
                a: 'Under Section 11(1)(a) of the VAT Act, sales of goods exported from South Africa can be zero-rated (0% VAT), provided they are direct exports shipped by the seller via a reputable international courier or freight forwarder. The seller must strictly retain the commercial invoice, SAD500 export customs entry, and proof of overseas delivery under SARS Interpretation Note 30.'
            },
            {
                q: 'How should payment gateway transaction fees (PayFast, Yoco, Ozow) be recorded?',
                a: 'Payment gateways deduct their processing fee (typically 1.5% to 3.5% + fixed fee) prior to settlement. Sales should be recorded at full gross invoice value to accounts receivable or merchant clearing accounts, and gateway processing fees recorded separately as finance/merchant charges, allowing full input VAT recovery on the processing fees.'
            }
        ],
        content: 'E-commerce moves fast. Whether you use Shopify, WooCommerce, or Takealot, we help you automate the flow of sales data, manage inventory values across platforms, and ensure your VAT submissions correctly handle both local and international shipments.'
    },

    'professional-services': {
        slug: 'professional-services',
        title: 'Accounting for Professional Services & Legal Practices',
        metaTitle: 'Professional Services Accounting & Tax | My Accountant',
        metaDescription: 'Specialised accounting for law firms, marketing agencies, consultancies, and engineers in South Africa. LPA Section 86 trust accounts and PSP tax rules.',
        description: 'Comprehensive accounting, Legal Practice Act Section 86 trust account management, billable hour WIP tracking, retainer billing, and director tax optimization for professional firms.',
        icon: Briefcase,
        heroTitle: 'Accounting for Professional Services & Legal Practices',
        heroSubtitle: 'Streamline billable hours, Legal Practice Act Section 86 trust accounts, retainer billing, and director tax structures for South African consultants, law firms, and agencies.',
        overviewContent: `Professional services firms—including legal practices, management consultancies, engineering consultancies, architectural firms, and digital marketing agencies—sell intellectual capital and specialized time rather than physical inventory. Managing a professional practice requires sophisticated project accounting, billable hour tracking, unbilled Work-in-Progress (WIP) recognition, and strict adherence to fiduciary standards.

At My Accountant, we provide senior-level accounting and CFO advisory specifically crafted for service-firm partners, agency founders, and legal practitioners. For legal firms, we deliver rigorous Legal Practice Act (LPA) Section 86 trust account accounting and annual Legal Practice Council (LPC) audit pack preparations. For agencies and consultancies, we optimize cash flow across project retainers, benchmark staff realization rates, and structure director remuneration to maximize wealth creation while preventing SARS Personal Service Provider (PSP) tax penalties.`,
        statutoryFramework: [
            {
                title: 'Legal Practice Act Section 86 Trust Accounts',
                act: 'Legal Practice Act 28 of 2014 & LPC Rule 54',
                description: 'Mandatory statutory accounting for trust monies held on behalf of clients. Requires separate Section 86(2) and Section 86(4) interest-bearing trust accounts, monthly trust-to-business bank transfers, Legal Practitioners’ Fidelity Fund interest distributions, and mandatory annual external audit reporting under LPC Rule 54.'
            },
            {
                title: 'Personal Service Provider (PSP) Tax Classification',
                act: 'Income Tax Act 58 of 1962, Fourth Schedule',
                description: 'SARS rules determining whether an incorporated consultancy or agency is deemed a Personal Service Provider. PSPs are taxed at a punitive flat rate of 27% and are strictly prohibited from claiming standard operational tax deductions under Section 23(k).'
            },
            {
                title: 'Companies Act Solvency, Liquidity & Director Loans',
                act: 'Companies Act 71 of 2008, Sections 4, 45 & 46',
                description: 'Strict governance governing partner drawings, loans to directors (Section 45), and dividend distributions (Section 46), requiring formal board resolutions and verified solvency and liquidity certifications.'
            },
            {
                title: 'Section 64E Dividends Withholding Tax',
                act: 'Income Tax Act 58 of 1962, Part VIII',
                description: 'Managing 20% Dividends Withholding Tax declarations and payments to SARS when distributing after-tax profits to practice shareholders and directors.'
            }
        ],
        challengesContent: `The most pervasive vulnerability in professional service practices is the mismatch between billable hours logged and cash collected. Unbilled Work-in-Progress (WIP), scope creep on fixed-fee projects, and delayed retainer billing severely degrade profitability. Many agencies also struggle with managing client disbursements, failing to track recoverable expenses incurred on behalf of clients.

For law firms, trust account non-compliance is an existential threat. Commingling client trust funds with operational business accounts, failing to reconcile trust ledgers on a monthly basis, or delaying statutory interest transfers to the Fidelity Fund results in immediate LPC disciplinary hearings, suspension of practice certificates, and professional ruin. Our team enforces flawless trust-to-business discipline.`,
        deliverables: [
            {
                title: 'Work-in-Progress (WIP) & Billable Hours Tracking',
                description: 'Tracking billable time, consultant realization rates, project utilization, and unbilled work-in-progress across retainer and milestone engagements.'
            },
            {
                title: 'LPA Section 86 Trust Account Accounting & LPC Packs',
                description: 'Managing Section 86(2) general trust ledgers and Section 86(4) separate investment accounts, monthly trust reconciliations, and compilation of LPC Rule 54 audit files.'
            },
            {
                title: 'Client Disbursement & Expense Recovery Reconciliations',
                description: 'Tracking recoverable project disbursements (counsel fees, court filing fees, travel, third-party software) to ensure full cost recovery from clients.'
            },
            {
                title: 'Director Remuneration & Tax Optimization',
                description: 'Balancing monthly PAYE salaries against Section 64E dividend distributions under Section 12E SBC thresholds to legally minimize overall tax exposure.'
            },
            {
                title: 'Recurring Retainer Invoicing & Debtor Aging Controls',
                description: 'Automating monthly retainer billing cycles, enforcing upfront deposit terms, and managing aging debtors to maintain positive working capital.'
            }
        ],
        benefits: [
            'Flawless Section 86 trust account administration guaranteeing LPC audit pass rates',
            'Real-time realization and utilization rate tracking to boost consultant profitability',
            'Full insulation against punitive SARS Personal Service Provider (PSP) tax classifications',
            'Strategic director remuneration balancing PAYE salaries with dividend distributions',
            'Systematic client disbursement recovery preventing leakage of billable overheads'
        ],
        specialServices: [
            'Legal Practitioners’ Fidelity Fund interest payment schedule compilation',
            'Partnership agreement financial structuring and partner equity buy-in modeling',
            'Practice overhead benchmarking against top-tier South African professional firms',
            'Professional indemnity insurance coverage reviews and claims documentation support'
        ],
        faqs: [
            {
                q: 'What criteria make an agency or consultancy a Personal Service Provider (PSP) under SARS rules?',
                a: 'Under the Fourth Schedule, a company or trust is classified as a Personal Service Provider if the client would consider the individual rendering the service to be an employee had they worked directly, or if the service is rendered mainly at the client\'s premises under their control. Crucially, if the company employs three or more full-time, independent staff (unrelated to the shareholders) throughout the year, it is exempt from PSP classification.'
            },
            {
                q: 'How does Section 86 Trust Account accounting work for South African law firms?',
                a: 'Under the Legal Practice Act 28 of 2014, all client funds (such as litigation deposits, conveyancing funds, or commercial escrow amounts) must be deposited into a Section 86(2) trust bank account. Interest earned on Section 86(2) accounts must be automatically remitted monthly to the Legal Practitioners’ Fidelity Fund (LPFF). Trust money cannot be transferred to the business account until fees are properly earned and billed.'
            },
            {
                q: 'What is the most tax-efficient structure for professional agency directors (Salary vs Dividends)?',
                a: 'For qualifying Small Business Corporations (SBCs), the optimal structure typically combines a market-related PAYE salary (utilizing personal tax brackets and primary rebates) with dividend distributions from after-tax company profits (subject to 20% Dividends Tax). Our chartered accountants model your exact turnover and profit numbers to determine the optimal tax split.'
            },
            {
                q: 'How should unbilled WIP and retainer prepayments be recognized for income tax and VAT?',
                a: 'Under IFRS for SMEs and South African tax law, unbilled Work-in-Progress (WIP) represents uncompleted work that must be evaluated at cost or estimated recovery value at year-end. Retainer deposits received in advance of services being performed must generally be accounted for as deferred income on the balance sheet, but trigger VAT output liability upon receipt or invoice under Section 9(1).'
            }
        ],
        content: 'Accounting, tax, and trust account management for consultants, marketing agencies, lawyers, and professional services firms in South Africa. We manage billing, LPA trust accounts, and tax structures.'
    },

    influencers: {
        slug: 'influencers',
        title: 'Accounting & Tax for Influencers & Digital Creators',
        metaTitle: 'Influencer Tax & Creator Accounting | My Accountant',
        metaDescription: 'Specialised tax and accounting for South African content creators and influencers. YouTube AdSense, brand sponsorships, PR gifting barter tax, and W-8BEN treaty relief.',
        description: 'Comprehensive tax optimization, multi-platform income tracking, PR gifting barter valuations, Section 11(a) equipment deductions, and US IRS W-8BEN treaty compliance for digital creators.',
        icon: Camera,
        heroTitle: 'Tax & Accounting for Digital Creators & Influencers',
        heroSubtitle: 'Maximise your creative earnings, declare multi-platform income, claim studio wear-and-tear deductions, and navigate SARS barter tax rules with accredited South African tax specialists.',
        overviewContent: `In South Africa, digital content creation is no longer just a hobby—it is a fast-growing, highly lucrative commercial industry. Creators earning revenue across YouTube, TikTok, Instagram, Twitch, Patreon, OnlyFans, and brand sponsorship deals operate as independent businesses under South African tax law. However, creator finances are uniquely complex, characterized by volatile earnings, foreign currency payouts (USD, EUR, GBP), multi-tier platform commissions, and pervasive brand gifting.

At My Accountant, we provide specialised creator accounting and tax structuring. We understand how digital platforms monetize, how the South African Revenue Service (SARS) audits content creators, and how to structure your business legally to minimize income tax. We handle your bi-annual Provisional Tax (IRP6) filings, set up legitimate Section 11(a) business expense deductions for production gear and home studios, and provide US IRS Form W-8BEN documentation to protect your digital royalties from unnecessary foreign tax withholdings.`,
        statutoryFramework: [
            {
                title: 'Section 1 Gross Income: Worldwide Taxation',
                act: 'Income Tax Act 58 of 1962, Section 1',
                description: 'South African tax residents are taxed on their worldwide gross income. Foreign earnings from Google AdSense, YouTube Partner Program, TikTok Creator Rewards, and offshore brand sponsorships must be declared and converted to ZAR at statutory spot or average exchange rates.'
            },
            {
                title: 'Taxation of Barter, PR Gifting & Non-Monetary Benefits',
                act: 'Income Tax Act 58 of 1962, Gross Income Definition',
                description: 'SARS explicitly requires creators to declare the fair market cash value of gifted products, sponsored hotel stays, free luxury clothing, electronics, and complimentary services received in exchange for content creation, reviews, or social media exposure.'
            },
            {
                title: 'Fourth Schedule Provisional Tax (IRP6)',
                act: 'Income Tax Act 58 of 1962, Fourth Schedule',
                description: 'Any individual who earns untaxed income exceeding R30,000 annually is legally classified as a provisional taxpayer, requiring mandatory semi-annual return filings and tax payments in August and February to avoid severe Section 211 penalties.'
            },
            {
                title: 'Section 11(a) General Deductions & Section 23(b) Home Studios',
                act: 'Income Tax Act 58 of 1962, Sections 11(a) & 23(b)',
                description: 'Deductibility of operational expenditure incurred in the production of taxable income (software, props, travel, mobile data), alongside strict criteria for home studio space claims requiring regular and exclusive business usage.'
            }
        ],
        challengesContent: `The biggest trap for South African content creators is ignoring provisional tax. Because platforms like YouTube and brand agencies pay creators gross without deducting PAYE, young creators frequently spend their entire income, only to be hit with massive, unexpected tax bills and Section 211 non-compliance penalties from SARS at tax year-end.

Another critical audit risk is PR gifting. Many influencers assume that because no cash was deposited into their bank account, gifted designer goods or complimentary trips are tax-free. Under South African law, receiving goods or services in exchange for promotional consideration is a taxable barter transaction. Our tax specialists maintain clear gifting ledgers and structure your business deductions to offset these amounts legally.`,
        deliverables: [
            {
                title: 'Multi-Platform Income Aggregation & Forex Translation',
                description: 'Consolidating earnings across YouTube, TikTok, Brand Deals, and Patreon, converting foreign currency payouts (USD/EUR) to ZAR at official SARS spot rates.'
            },
            {
                title: 'PR Gifting, Barter & Sponsorship Valuation Ledgers',
                description: 'Compiling structured gifting registers establishing fair market values and business expense offsets for PR packages, sponsored travel, and gifted gear.'
            },
            {
                title: 'Creator Asset Depreciation & Equipment Schedules',
                description: 'Structuring Section 11(e) wear-and-tear write-offs over 3 years for cameras, lenses, studio lighting, audio interfaces, and high-performance editing PCs.'
            },
            {
                title: 'Bi-Annual IRP6 Provisional Tax Computations & Submissions',
                description: 'Accurate estimation and filing of August and February Provisional Tax returns to eliminate SARS late payment and underestimation penalties.'
            },
            {
                title: 'US IRS Form W-8BEN Treaty Relief Filing',
                description: 'Submitting valid Form W-8BEN certificates to YouTube and US platforms to claim treaty benefits under the South Africa - US Double Tax Agreement, reducing US tax withholding from 30% to 0%.'
            }
        ],
        benefits: [
            'Proactive provisional tax planning ensuring you are never surprised by unexpected SARS tax bills',
            'Maximizing legal deductions for cameras, production gear, software, and home studio spaces',
            'Full compliance with SARS barter tax rules regarding gifted PR products and sponsored trips',
            'US Double Tax Agreement optimization eliminating 30% US withholding taxes on AdSense',
            'Personal brand company structuring unlocking Section 12E Small Business Corporation tax rates'
        ],
        specialServices: [
            'Personal brand company incorporation (Pty Ltd) for high-earning creators to unlock Section 12E SBC rates',
            'Home studio space deduction assessment under strict Section 23(b) exclusive use criteria',
            'VAT registration and compliance advisory for creators exceeding R1 million in annual brand deals',
            'Brand agency invoicing templates and payment tracking to reduce debtor collection delays'
        ],
        faqs: [
            {
                q: 'Do influencers and creators have to pay SARS income tax on gifted products and free PR trips?',
                a: 'Yes. Under the gross income definition of Section 1 of the Income Tax Act, taxable income includes the value of any benefit or thing received in cash or otherwise. If a brand gives you a luxury watch, hotel stay, or smartphone in exchange for social media coverage, unboxing videos, or posts, you are legally required to declare the fair market cash equivalent as taxable income.'
            },
            {
                q: 'How is YouTube AdSense and overseas digital income taxed in South Africa?',
                a: 'Because South Africa operates on a worldwide tax system, foreign platform earnings from Google AdSense, TikTok, Patreon, and offshore brands are fully taxable in South Africa. Foreign currency payouts must be translated into ZAR using SARS official spot exchange rates on the date of receipt, or the average exchange rate for the tax year.'
            },
            {
                q: 'What business expenses can a digital creator legally claim as tax deductions?',
                a: 'Under Section 11(a) of the Income Tax Act, you can deduct expenses incurred in the production of your creator income, including: production equipment (cameras, lighting, microphones, computers depreciated under Section 11(e)), software subscriptions (Adobe Creative Cloud, Epidemic Sound, CapCut), mobile data, props, website hosting, and travel directly undertaken for sponsored content.'
            },
            {
                q: 'When is an influencer required to register for Provisional Tax and VAT?',
                a: 'You must register for Provisional Tax as soon as you earn untaxed business or freelance income exceeding R30,000 in a tax year, requiring bi-annual IRP6 returns in August and February. VAT registration becomes legally mandatory once your total taxable income exceeds R1 million within any consecutive 12-month period.'
            }
        ],
        content: 'Being a digital creator in South Africa is a business, and SARS treats it as such. We help influencers and content creators navigate brand deal income, multi-platform ad revenue, and deductible business expenses (like equipment and production costs) to keep more of what they earn.'
    },

    // Legacy backward-compatibility aliases:
    freelancers: {
        slug: 'freelancers',
        title: 'Accounting for Freelancers & Contractors',
        metaTitle: 'Freelancer Tax & Contractor Accounting | My Accountant',
        metaDescription: 'Simple, effective bookkeeping, expense tracking, and provisional tax for South African freelancers and independent contractors.',
        description: 'Simple, effective bookkeeping, expense tracking, and provisional tax for South African freelancers and independent professionals.',
        icon: User,
        heroTitle: 'Stress-Free Tax & Bookkeeping for Freelancers',
        heroSubtitle: 'Reliable financial management, Section 11(a) expense optimization, and provisional tax filings for South African independent pros.',
        overviewContent: `Freelancing and independent contracting offer professional freedom, but navigating South African tax obligations can be challenging. We provide flat-fee monthly solutions to manage provisional tax (IRP6), maximize legitimate business deductions, and ensure total compliance with SARS.`,
        statutoryFramework: [
            {
                title: 'Provisional Tax (Fourth Schedule)',
                act: 'Income Tax Act 58 of 1962',
                description: 'Mandatory bi-annual return submissions in August and February for all freelancers earning untaxed professional income.'
            },
            {
                title: 'Section 11(a) Deductions',
                act: 'Income Tax Act 58 of 1962',
                description: 'Legitimate business expense deductions incurred in the production of professional income.'
            }
        ],
        challengesContent: `Independent contractors must manage fluctuating income, seasonal demand, and delayed client payments while ensuring adequate cash is reserved for bi-annual provisional tax payments.`,
        deliverables: [
            {
                title: 'Expense Tracking & Categorization',
                description: 'Automated receipt tracking and general ledger reconciliations.'
            },
            {
                title: 'Provisional Tax Submissions (IRP6)',
                description: 'Calculation and submission of August and February SARS provisional returns.'
            }
        ],
        benefits: [
            'Flat-fee packages for predictable financial budgeting',
            'Accurate provisional tax calculations avoiding Section 211 penalties',
            'Full personal income tax return (ITR12) submissions',
            'Expert advice on tax-efficient sole proprietorship vs company structures'
        ],
        specialServices: [
            'Tax compliance PIN (TCS) retrieval for corporate tenders',
            'Invoicing templates and debtor management systems',
            'Home office deduction review under Section 23(b)',
            'Medical aid and retirement annuity tax optimization'
        ],
        faqs: [
            {
                q: 'When do freelancers need to register for Provisional Tax?',
                a: 'As soon as your untaxed freelance earnings exceed R30,000 per year, you must register as a provisional taxpayer with SARS.'
            }
        ],
        content: 'Freelancing offers freedom, but tax season can be stressful. We provide simple, flat-fee solutions to help South African freelancers manage their provisional tax, claim legitimate business expenses, and maintain a clear record of their professional income.'
    },

    restaurants: {
        slug: 'restaurants',
        title: 'Accounting for Hospitality, Restaurants & Bars',
        metaTitle: 'Hospitality Accounting & Restaurant Tax | My Accountant',
        metaDescription: 'Specialised accounting for South African restaurants, cafes, and bars. Point-of-sale reconciliations, Sectoral Determination 14 payroll, and liquor compliance.',
        description: 'Comprehensive financial oversight, POS integration, food cost variance tracking, liquor licensing compliance, and Sectoral Determination 14 payroll for restaurants and hospitality venues.',
        icon: Utensils,
        heroTitle: 'Full-Service Hospitality & Restaurant Accounting',
        heroSubtitle: 'Inventory controls, daily POS integration, Sectoral Determination 14 payroll, and delivery platform reconciliations for South African restaurants, cafes, and hotels.',
        overviewContent: `The South African hospitality and food service industry is characterised by high transaction volumes, perishable inventory, tight operational margins, and complex labour shift arrangements. We provide specialized accounting built specifically for restaurant owners, franchise operators, and boutique hospitality venues.`,
        statutoryFramework: [
            {
                title: 'BCEA Sectoral Determination 14 (Hospitality Sector)',
                act: 'Basic Conditions of Employment Act 75 of 1997',
                description: 'Mandates minimum wages, night shift allowances, uniform allowances, maximum ordinary hours, and statutory remuneration for work performed on Sundays and public holidays.'
            }
        ],
        challengesContent: `Hospitality operators face relentless margin pressures. Food and beverage cost percentages must typically be kept between 28% and 34% of revenue, while labor costs must remain under 30%.`,
        deliverables: [
            {
                title: 'Daily POS Sales & Merchant Settlement Reconciliations',
                description: 'Direct ingestion of sales data from Pilot, GAAP, Yoco, or Lightspeed, reconciling daily till cash-ups, credit card card-machine settlements, and merchant clearing accounts.'
            }
        ],
        benefits: [
            'Daily sales and merchant card reconciliation eliminating till discrepancies and theft',
            'Granular food and beverage cost tracking to protect restaurant gross profit margins'
        ],
        specialServices: [
            'Recipe costing and menu engineering to maximize gross margin contributions',
            'Periodic physical inventory count auditing and stock variance investigations'
        ],
        faqs: [
            {
                q: 'Are staff tips subject to VAT in South Africa?',
                a: 'Voluntary tips distributed directly to staff are exempt from VAT, but constitute taxable remuneration subject to PAYE withholding.'
            }
        ],
        content: 'Restaurants operate on thin margins and high transaction volumes. We provide the financial oversight needed to track food costs, manage staff payroll, and integrate your POS data directly into your accounting software for real-time visibility.'
    },

    ecommerce: {
        slug: 'ecommerce',
        title: 'Accounting for E-commerce & Online Sellers',
        metaTitle: 'E-commerce Accounting & Online Seller Tax | My Accountant',
        metaDescription: 'Specialised e-commerce accounting for Shopify, Takealot, and WooCommerce sellers in South Africa. Automated VAT, inventory valuation, and customs clearance.',
        description: 'Automated multi-platform bookkeeping, Takealot Seller Portal statement reconciliation, Shopify/WooCommerce syncing, landed cost inventory, and cross-border VAT compliance.',
        icon: ShoppingCart,
        heroTitle: 'Smart Accounting for E-commerce & Online Sellers',
        heroSubtitle: 'Automated storefront syncing, Takealot statement reconciliations, landed cost inventory valuation, and cross-border VAT compliance for South African online stores.',
        overviewContent: `E-commerce moves fast. South African online retailers selling across Shopify, WooCommerce, Takealot, and Amazon face an intricate financial landscape shaped by high-volume transactions, multi-channel payment gateway settlements, platform commission fees, customer returns, and complex cross-border VAT regulations.`,
        statutoryFramework: [
            {
                title: 'Local vs Export VAT Regulations',
                act: 'Value-Added Tax Act 89 of 1991, Sections 7(1)(a) & 11(1)(a)',
                description: 'Domestic online orders are subject to standard 15% VAT. Cross-border exports can only be zero-rated under Section 11(1)(a) if strict documentary evidence of export is archived.'
            }
        ],
        challengesContent: `The greatest vulnerability for online merchants is inaccurate inventory valuation and gross margin distortion.`,
        deliverables: [
            {
                title: 'Automated Storefront & Cloud Ledger Integration',
                description: 'Seamless integration between Shopify, WooCommerce, Takealot, and Xero/Sage ledgers.'
            }
        ],
        benefits: [
            'Automated transactional data flows eliminating thousands of hours of manual bookkeeping',
            'Accurate landed cost calculations ensuring you never sell inventory at a hidden loss'
        ],
        specialServices: [
            'Takealot Seller Portal statement automation and fee reconciliation',
            'Cross-border export VAT and customs documentation auditing'
        ],
        faqs: [
            {
                q: 'How is Customs VAT calculated on commercial imports?',
                a: 'Customs VAT is calculated at 15% on the Added Tax Value (ATV), which equals Customs Value + 10% upliftment + Customs Duties.'
            }
        ],
        content: 'E-commerce moves fast. Whether you use Shopify, WooCommerce, or Takealot, we help you automate the flow of sales data, manage inventory values across platforms, and ensure your VAT submissions correctly handle both local and international shipments.'
    }
};
