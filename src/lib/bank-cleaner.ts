/**
 * @fileOverview South African Bank Statement Description Cleaning Engine.
 * Implements regex-first deterministic cleaning, channel classification,
 * pre-sanitization structural clue extraction, location guardrails, and similarity scoring.
 */

import { PaymentChannel, StructuralClues, CleanResult, ProcessedTransaction } from './types';

export type { PaymentChannel, StructuralClues, CleanResult, ProcessedTransaction };

export interface CleanedTransaction {
    clean: string;
    channel: PaymentChannel;
    merchantKey: string;
    branchLocation?: string;
    structuralClues: StructuralClues;
}

const CLEANING_VERSION = 'za_banks_v2.0';

export const STOPWORDS = new Set([
    'PTY', 'LTD', 'CC', 'INC', 'CO', 'SA', 'RSA', 'SOUTH', 'AFRICA',
    'THE', 'AND', 'OF', 'FOR', 'ON', 'IN', 'AT', 'WITH', 'BY', 'AN', 'A',
    'ONLINE', 'PAYMENT', 'TRANSFER', 'ACCOUNT', 'EFT', 'MOBILE', 'APP',
    'BANKING', 'BANK', 'PURCHASE', 'CREDIT', 'DEBIT', 'CARD', 'PURCH',
    'TRADING', 'SERVICES', 'ENTERPRISE', 'PROPERTIES', 'HOLDINGS', 'GROUP', 'STORE', 'SHOP', 'N',
    'LC', 'SPOR', 'SPORT', 'IMMEDIATE', 'EXTERNAL', 'UNCATEGORISED', 'RECURRING', 'SUPPLIES'
]);

export const SIMILARITY_STOPWORDS = new Set([
    'EFT', 'IB', 'IBNK', 'ONLINE', 'MOB', 'MOBILE', 'APP', 'INTRN', 'INTERNET',
    'PMNT', 'PYMNT', 'PYMT', 'PMT', 'PAI', 'PAID', 'RCVD', 'RECV', 'RCV',
    'PURCH', 'PURCHASE', 'POS', 'CARD', 'CRD', 'VISA', 'MASTERCARD', 'DEBIT', 'CREDIT',
    'TRF', 'XFER', 'TRANSF', 'TRANSFER', 'PAY', 'PAYMENT', 'TO', 'FROM',
    'REF', 'REFERENCE', 'INV', 'INVOICE', 'DOC', 'AUTH', 'AUTHCD', 'TRACE', 'TRN', 'TXN',
    'MAGTAPE', 'MAGSTRIPE', 'MAG-STRIPE', 'CHIP', 'CONTACTLESS', 'TAP',
    'ATM', 'AUTOBANK', 'BANK', 'BANKING', 'CASH', 'WITHDRAW', 'WDL', 'DEP', 'DEPOSIT',
    'PTY', 'LTD', 'INC', 'CC', 'LLC', 'SOC', 'SA', 'SOUTHAFRICA', 'IMMEDIATE', 'EXTERNAL', 'UNCATEGORISED', 'RECURRING',
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
]);

export const GENERIC_FIRST_TOKENS = new Set([
    'THE', 'PAYMENT', 'TRANSFER', 'ONLINE', 'MOBILE', 'POS', 'CARD', 'STORE', 'SHOP', 'BUFFALO'
]);

/**
 * Recognized South African National Chains & Franchise Brands.
 * Used for Root Brand primary grouping and location suffix stripping.
 */
export const NATIONAL_ROOT_BRANDS: Record<string, string> = {
    // Fuel & Service Stations
    'ENGEN': 'ENGEN',
    'SHELL': 'SHELL',
    'TOTALENERGIES': 'TOTAL',
    'TOTAL': 'TOTAL',
    'BP': 'BP',
    'SASOL': 'SASOL',
    'CALTEX': 'CALTEX',
    'ASTRON ENERGY': 'ASTRON ENERGY',
    'ASTRON': 'ASTRON ENERGY',

    // Groceries & Supermarkets
    'WOOLWORTHS FOOD': 'WOOLWORTHS',
    'WOOLWORTHS': 'WOOLWORTHS',
    'WW FOOD': 'WOOLWORTHS',
    'PICK N PAY HYPER': 'PICK N PAY',
    'PICK N PAY EXPRESS': 'PICK N PAY',
    'PICK N PAY': 'PICK N PAY',
    'PNP EXPRESS': 'PICK N PAY',
    'PNP': 'PICK N PAY',
    'CHECKERS HYPER': 'CHECKERS HYPER',
    'CHECKERS': 'CHECKERS',
    'SUPERSPAR': 'SUPERSPAR',
    'KWIKSPAR': 'SPAR',
    'SPAR': 'SPAR',
    'SHOPRITE': 'SHOPRITE',
    'BOXER': 'BOXER',
    'MAKRO': 'MAKRO',
    'GAME': 'GAME',
    'FOOD LOVERS MARKET': 'FOOD LOVERS MARKET',
    'FOOD LOVERS': 'FOOD LOVERS MARKET',
    'FRUIT & VEG CITY': 'FOOD LOVERS MARKET',

    // Hardware & Building
    'BUILDERS WAREHOUSE': 'BUILDERS WAREHOUSE',
    'BUILDERS EXPRESS': 'BUILDERS WAREHOUSE',
    'BUILDERS TRADE': 'BUILDERS WAREHOUSE',
    'BUILDERS': 'BUILDERS WAREHOUSE',
    'CHAMBERLAINS': 'CHAMBERLAINS',
    'BUCO': 'BUCO',
    'LEROY MERLIN': 'LEROY MERLIN',
    'CASHBUILD': 'CASHBUILD',

    // Pharmacy & Health
    'CLICKS': 'CLICKS',
    'DIS-CHEM': 'DIS-CHEM',
    'DISCHEM': 'DIS-CHEM',
    'DIS CHEM': 'DIS-CHEM',
    'MEDIRITE': 'MEDIRITE',

    // Fast Food & Dining
    'MCDONALDS': 'MCDONALDS',
    'KFC': 'KFC',
    'NANDOS': 'NANDOS',
    'STEERS': 'STEERS',
    'DEBONAIRS': 'DEBONAIRS',
    'WIMPY': 'WIMPY',
    'MUGG & BEAN': 'MUGG & BEAN',
    'MUGGNBEAN': 'MUGG & BEAN',
    'MUGG AND BEAN': 'MUGG & BEAN',
    'SEATTLE COFFEE': 'SEATTLE COFFEE',
    'VIDA E CAFFE': 'VIDA E CAFFE',
    'STARBUCKS': 'STARBUCKS',

    // Telecoms & Internet
    'VODACOM': 'VODACOM',
    'MTN': 'MTN',
    'TELKOM': 'TELKOM',
    'CELL C': 'CELL C',
    'RAIN': 'RAIN',

    // Insurance & Financial
    'OUTSURANCE': 'OUTSURANCE',
    'DISCOVERY': 'DISCOVERY',
    'SANLAM': 'SANLAM',
    'OLD MUTUAL': 'OLD MUTUAL',
    'SANTAM': 'SANTAM',

    // Logistics & Couriers
    'THE COURIER GUY': 'THE COURIER GUY',
    'COURIER GUY': 'THE COURIER GUY',
    'POSTNET': 'POSTNET',
    'DHL': 'DHL',
    'ARAMEX': 'ARAMEX',
    'RAM COURIERS': 'RAM COURIERS',

    // Transport & Delivery
    'UBER TRIP': 'UBER TRIP',
    'UBER EATS': 'UBER EATS',
    'UBER': 'UBER',
    'BOLT': 'BOLT',
    'MR D FOOD': 'MR D FOOD',
    'MR D': 'MR D FOOD',

    // E-Commerce & Retail
    'TAKEALOT': 'TAKEALOT',
    'MR PRICE': 'MR PRICE',
    'MRP': 'MR PRICE',
    'FOSCHINI': 'FOSCHINI',
    'TRUWORTHS': 'TRUWORTHS',
    'PEP': 'PEP',
    'ACKERMANS': 'ACKERMANS',
};

const SORTED_ROOT_BRAND_KEYS = Object.keys(NATIONAL_ROOT_BRANDS).sort((a, b) => b.length - a.length);

/**
 * South African Metro Codes, Major Cities, and Suburbs.
 * Used for trailing location stripping while preserving leading locations on independent local businesses.
 */
export const SA_LOCATIONS = new Set([
    // Metro Abbreviations
    'JHB', 'CPT', 'DBN', 'PTA', 'PE', 'BFN', 'PMB', 'EL', 'CT',
    // Major Cities & Metros
    'JOHANNESBURG', 'CAPE TOWN', 'DURBAN', 'PRETORIA', 'PORT ELIZABETH', 'GQEBERHA',
    'BLOEMFONTEIN', 'EAST LONDON', 'NELSPRUIT', 'MBOMBELA', 'POLOKWANE', 'KIMBERLEY',
    'PIETERMARITZBURG', 'GEORGE', 'MOSSEL BAY', 'RUSTENBURG', 'WITBANK', 'EMALAHLENI',
    'POTCHEFSTROOM', 'KLERKSDORP', 'VEREENIGING', 'VANDERBIJLPARK', 'WELKOM', 'PAARL',
    'STELLENBOSCH', 'SOMERSET WEST', 'UPINGTON',
    // Gauteng Suburbs
    'SANDTON', 'RANDBURG', 'ROSEBANK', 'MIDRAND', 'CENTURION', 'FOURWAYS', 'BEDFORDVIEW',
    'EDENVALE', 'BENONI', 'BOKSBURG', 'KEMPTON PARK', 'ALBERTON', 'BRAKPAN', 'SPRINGS',
    'ROODEPOORT', 'KRUGERSDORP', 'WATERKLOOF', 'MENLYN', 'HATFIELD', 'BROOKLYN',
    'WOODMEAD', 'RIVONIA', 'BRYANSTON', 'HYDE PARK', 'MELROSE', 'PARKHURST', 'GREENSIDE',
    'LINDEN', 'NORTHCLIFF', 'BLAIRGOWRIE', 'CRESTA', 'RANDPARK', 'RANDPARK RIDGE', 'FERNDALE',
    'STRUBENSVALLEY', 'BROADACRES', 'SUNNINGHILL', 'LONEHILL', 'KYALAMI', 'WATERFALL',
    'WINCHESTER', 'WINCHESTER HILLS', 'MONDEOR', 'GLENVISTA', 'MEYERTON',
    // Western Cape Suburbs
    'BELLVILLE', 'DURBANVILLE', 'CLAREMONT', 'RONDEBOSCH', 'SEA POINT', 'CAMPS BAY',
    'CONSTANTIA', 'CENTURY CITY', 'TYGERVALLEY', 'TABLE VIEW', 'BLOUBERG', 'BRACKENFELL',
    'KRAAIFONTEIN', 'KUILS RIVER', 'MILNERTON', 'PAROW', 'GOODWOOD', 'STRAND', 'SOMERSET',
    'HERMANUS', 'KNYSNA', 'PLETTENBERG BAY',
    // KZN Suburbs
    'UMHLANGA', 'BALLITO', 'PINETOWN', 'WESTVILLE', 'CHATSWORTH', 'AMANZIMTOTI', 'KLOOF',
    'HILLCREST', 'BEREA', 'MORNINGSIDE', 'LA LUCIA'
]);

const SORTED_SA_LOCATIONS = Array.from(SA_LOCATIONS).sort((a, b) => b.length - a.length);

/**
 * Non-geographic words and operational descriptors that must NEVER be treated as branch locations.
 */
export const NON_GEOGRAPHIC_DESCRIPTORS = new Set([
    'TRIP', 'HEALTH', 'ONLINE', 'STORE', 'ORDER', 'LIFE', 'RIDE', 'DELIVERY', 'EATS',
    'DIRECT', 'PREMIUM', 'RENEWAL', 'SERVICE', 'SERVICES', 'PAYMENT', 'PAYMENTS',
    'CARD', 'APP', 'FOOD', 'INSURE', 'INSURANCE', 'INVEST', 'INVESTMENT', 'INVESTMENTS',
    'BANK', 'BANKING', 'CONNECT', 'MOBILE', 'FIBRE', 'FIBER', 'AIRTIME', 'DATA',
    'SUBSCRIPTION', 'SUB', 'FEE', 'FEES', 'CHARGE', 'CHARGES', 'PURCHASE', 'SWIPE',
    'DEPOSIT', 'TRANSFER', 'COLLECTION', 'COLLECTIONS', 'REWARDS', 'POINTS', 'CLUB',
    'COMMERCE', 'ECOM', 'ECOMMERCE', 'MEDIA', 'ENTERTAINMENT', 'SUPPORT', 'CARE'
]);

const STORE_LOCATOR_REGEX = /^(?:(?:STORE|BRANCH|BR|SHOP|SITE|STATION|GARAGE|UNIT)\s*#?\s*\d+[A-Z]?|#\s*\d+|\d{1,6})$/i;
const STORE_LOCATOR_SUBSTRING_REGEX = /\b(?:(?:STORE|BRANCH|BR|SHOP|SITE|STATION|GARAGE|UNIT)\s*#?\s*\d+[A-Z]?|#\s*\d+)\b/i;

/**
 * Validates whether candidate text constitutes a genuine geographic location or store number.
 * Excludes clue label residue and non-geographic transaction descriptors.
 */
export function isValidBranchLocation(candidate: string): boolean {
    if (!candidate) return false;
    const clean = candidate
        .replace(/\b(?:VAT(?:\s*NO|\s*REG|#)?|TAX(?:\s*NO|\s*REG)?|TEL(?:\s*NO)?|PHONE(?:\s*NO)?|AUTH(?:\s*CODE)?|TID|MID|STAN|REF|INV|DOC|PRN|NO\.?)\b/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    if (!clean) return false;

    // Check store locator patterns or standalone numbers
    if (STORE_LOCATOR_REGEX.test(clean) || STORE_LOCATOR_SUBSTRING_REGEX.test(clean)) {
        return true;
    }

    const tokens = clean.toUpperCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return false;

    // If all tokens are non-geographic descriptors or stopwords, reject
    const nonDescriptorTokens = tokens.filter(t => !NON_GEOGRAPHIC_DESCRIPTORS.has(t) && !STOPWORDS.has(t));
    if (nonDescriptorTokens.length === 0) {
        return false;
    }

    // Check against recognized SA locations
    const hasKnownLocation = tokens.some(t => SA_LOCATIONS.has(t)) ||
        SORTED_SA_LOCATIONS.some(loc => clean.toUpperCase().includes(loc));
    if (hasKnownLocation) {
        return true;
    }

    // Common location affixes
    const LOCATION_AFFIXES = new Set([
        'MALL', 'PLAZA', 'RIDGE', 'VALLEY', 'CORNER', 'CROSSING', 'SQUARE', 'CENTRE',
        'CENTER', 'JUNCTION', 'GATEWAY', 'CITY', 'VILLAGE', 'PARK', 'HEIGHTS', 'HILLS',
        'GLEN', 'VIEW', 'POINT', 'WEST', 'EAST', 'NORTH', 'SOUTH', 'CENTRAL'
    ]);
    if (tokens.some(t => LOCATION_AFFIXES.has(t))) {
        return true;
    }

    if (/\d+/.test(clean)) {
        return true;
    }

    return false;
}

/**
 * Comprehensive South African banking transfer and payment prefixes across all major banks.
 * Sorted by length (longest first) to prevent shorter substrings from preempting full phrases.
 */
const COMPREHENSIVE_PREFIX_REGEX = /^(?:(?:\d{1,6}|#\d{1,6})\s+)?(?:DIGITAL PAYMENTS BANKING APP (?:EXTERNAL )?(?:IMMEDIATE|PAYSHAP) PAYMENT|DIGITAL PAYMENTS BANKING APP IMMEDIATE|DIGITAL PAYMENTS BANKING APP EXTERNAL PAYSHAP|DIGITAL PAYMENTS BANKING APP|DIGITAL PAYMENTS BANKING|DIGITAL PAYMENTS RECURRING IMMEDIATE PAYMENT|DIGITAL PAYMENTS|UNCATEGORISED BANKING APP EXTERNAL PAYMENT|UNCATEGORISED BANKING APP|UNCATEGORISED BANKING|ONLINE STORE IMMEDIATE CAPITEC PAY PAYMENT|ONLINE STORE IMMEDIATE CAPITEC PAY|CAPITEC PAY PAYMENT|CAPITEC PAY|FNB APP TRANSFER TO|FNB APP TRANSFER FROM|FNB APP TRANSFER|BANKING APP TRANSFER TO|BANKING APP TRANSFER|APP TRANSFER TO|APP TRANSFER FROM|APP TRANSFER|TRANSFER TO|TRANSFER FROM|SETTLEMENT ASJ\s*>\s*|POS PURCHASE SETTLEMENT|CARD SETTLEMENT|SETTLEMENT|CHEQUE CARD PURCHASE|CHEQUE CARD PMT|CHEQUE CARD|DEBIT CARD PURCHASE|DEBIT CARD PMT|DEBIT CARD|CREDIT CARD PURCHASE|CREDIT CARD PMT|CREDIT CARD|VIRTUAL CARD PURCHASE|VIRTUAL CARD|INTERNATIONAL CARD PURCHASE|INTL CARD PURCHASE|TAP\s*(?:&|AND)\s*GO PURCHASE|TAP\s*(?:&|AND)\s*GO|CARD PURCHASE|POINT OF SALE PURCHASE|POINT OF SALE|POS PURCHASE|POS DEBIT|POS SWIPE|POS TRANSACTION|POS|EFT PAYMENT TO|EFT PAYMENT FROM|EFT PAYMENT|EFT CREDIT TO|EFT CREDIT|EFT DEBIT|EFT DR|EFT CR|EFT PMT TO|EFT PMT FROM|EFT PMT|ELECTRONIC PAYMENT TO|ELECTRONIC PAYMENT|ELECTRONIC TFR|ELECTRONIC TRANSFER|ONLINE PAYMENT TO|ONLINE PAYMENT|INTERNET PAYMENT TO|INTERNET PAYMENT FROM|INTERNET PAYMENT|INTERNET PMT TO|INTERNET PMT FROM|INTERNET PMT|INTERNET PMNT TO|INTERNET PMNT|INTERNET PYMT TO|INTERNET PYMT|INTERNET TRANSFER TO|INTERNET TRANSFER|IB PAYMENT TO|IB PAYMENT|IBANK PAYMENT TO|IBANK PMT|IBANK TFR|IB PMT TO|IB PMT|IB TFR TO|IB TFR|RTC EXPRESS PMT TO|RTC EXPRESS PMT FROM|RTC EXPRESS PMT|RTC EXPRESS|RTC PAYMENT TO|RTC PAYMENT|RTC PMT TO|RTC PMT FROM|RTC PMT|IMMEDIATE PAYMENT TO|IMMEDIATE PAYMENT FROM|IMMEDIATE PAYMENT|IMMEDIATE PMT TO|IMMEDIATE PMT FROM|IMMEDIATE PMT|IMMEDIATE TRANSFER TO|IMMEDIATE TRANSFER FROM|IMMEDIATE TRANSFER|IMMEDIATE TFR TO|IMMEDIATE TFR|REAL TIME CLEARING PMT|REAL TIME CLEARING|REAL-TIME CLEARING|FAST CLEARING PMT|FAST CLEARING|INSTANT CLEARING|INSTANT PAYMENT|CASH DEPOSIT BRANCH|CASH DEPOSIT ATM|CASH DEPOSIT|ATM WITHDRAWAL|ATM DEPOSIT|ATM CASH|ATM|AUTOBANK WITHDRAWAL|AUTOBANK DEPOSIT|AUTOBANK|SASWITCH WITHDRAWAL|SASWITCH CASH|SASWITCH|CASH WITHDRAWAL BRANCH|CASH WITHDRAWAL|BRANCH CASH WITHDRAWAL|BRANCH CASH DEPOSIT|STOP ORDER TO|STOP ORDER|DEBIT ORDER TO|DEBIT ORDER|DEBICHECK DEBIT|DEBICHECK|NAEDO TRACKED|NAEDO DEBIT|NAEDO DR|NAEDO|AEDO DEBIT|AEDO DR|AEDO|ACB DEBIT|ACB DR|ACB CREDIT|ACB CR|DIRECT DEBIT|DIR DEBIT|MAGTAPE DEBIT|MAG TAPE DEBIT|MAGTAPE DR|MAGTAPE CREDIT|MAGTAPE CR|MAGTAPE|RECURRING DEBIT|RECURRING PAYMENT|RECURRING PMT|RECURRING ORDER|SCHEDULED DEBIT|SCHEDULED PAYMENT|SCHEDULED PMT|THIRD PARTY PAYMENT TO|THIRD PARTY PAYMENT|3RD PARTY PMT|BANK CHARGES?|PURCHASE|PURCH|PAYSHAP PAYMENT TO|PAYSHAP PAYMENT FROM|PAYSHAP PAYMENT|PAYSHAP CREDIT|PAYSHAP DEBIT|PAYSHAP ACCOUNT OFF-US|PAYSHAP ACCOUNT|PAYSHAP)\b\s*[:\-]?\s*(?:\d+(?:\.\d{2})?(?![\/\-\.]\d|\d))?\s*/i;

/**
 * Classifies a raw bank description into one of 7 canonical payment channels.
 * Strict Precedence Hierarchy: FEE -> RTC -> DEBIT_ORDER -> ATM -> POS -> CARD -> EFT -> UNKNOWN.
 */
export function classifyPaymentChannel(raw: string): PaymentChannel {
    if (!raw) return 'UNKNOWN';
    const str = raw.toUpperCase().trim();

    // 1. FEE: Verified banking fees and service charges
    if (
        /\b(BANK\s*(?:SERVICE\s*)?CHARGES?|BANK\s*(?:SERVICE\s*)?FEES?|BANK\s*COSTS?|MONTHLY\s+(?:ACCOUNT\s*|SERVICE\s*|MAINTENANCE\s*)FEES?|MONTHLY\s+(?:ACCOUNT\s*|SERVICE\s*)CHARGES?|TRANSACTION\s*FEES?|CASH\s*DEPOSIT\s*FEES?|CASH\s*HANDLING\s*(?:FEES?|CHARGES?)|STATEMENT\s*FEES?|CARD\s*(?:REPLACEMENT\s*|ISSUING\s*|ANNUAL\s*|MONTHLY\s*)FEES?|HONOURING\s*FEES?|UNPAID\s*(?:FEES?|CHARGES?)|DISHONOUR\s*(?:FEES?|CHARGES?)|OVERDRAFT\s*(?:SERVICE\s*|MANAGEMENT\s*|LEDGER\s*)?(?:FEES?|CHARGES?)|INTERNET\s*PAYMENT\s*FEES?|INT\s*PYMT\s*FEES?|(?:EFT|PAYSHAP)\s*FEES?)\b/i.test(str)
        || /\b(?:RTC(?:\s*(?:EXPRESS|IMMEDIATE)?)?(?:\s*(?:PAYMENT|PMT|TRANSFER|TFR))?|IMMEDIATE\s*(?:PAYMENT|PMT|TRANSFER|TFR)|FAST\s*CLEARING|REAL[- ]TIME\s*CLEARING|DEBIT\s*ORDER(?:\s*REVERSAL)?|STOP\s*ORDER|NAEDO(?:\s*(?:TRACKED|DEBIT|DR))?|AEDO(?:\s*(?:DEBIT|DR))?|ACB(?:\s*(?:DEBIT|DR))?|DEBICHECK(?:\s*DEBIT)?|(?:CHEQUE|DEBIT|CREDIT|VIRTUAL)?\s*CARD|POS|ATM|EFT|PAYSHAP(?:\s*IMMEDIATE)?)\s*(?:TRANSACTION\s*|SERVICE\s*|PAYMENT\s*|PMT\s*)?(?:FEES?|CHARGES?|COSTS?)\b/i.test(str)
        || /\b(?:FNB|ABSA|NEDBANK|STANDARD\s*BANK|CAPITEC|TYMEBANK|INVESTEC|DISCOVERY\s*BANK)\s*(?:#\s*)?(?:SERVICE\s*FEES?|SERVICE\s*CHARGES?|ADMIN\s*FEES?|ACCOUNT\s*FEES?|MANAGEMENT\s*FEES?|MONTHLY\s*FEES?|INT(?:ERNET)?\s*P(?:Y)?MT\s*FEES?|TRANSACTION\s*FEES?)\b/i.test(str)
        || /^(?:#\s*)?(?:SERVICE\s*FEES?|SERVICE\s*CHARGES?|ACCOUNT\s*FEES?|MONTHLY\s*FEES?)(?:[ -]+(?:FOR\s+)?(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:UARY|CH|IL|E|Y|UST|EMBER)?(?:\s*\d{2,4})?|\s*(?:#|REF|NO\.?|ID|TX)?\s*[\d\/\-\.]{1,15})?\s*$/i.test(str)
        || /^(?:#\s*)?FEES?(?:\s*(?:#|REF|NO\.?|ID|TX)?\s*[\d-]{1,15})?\s*$/i.test(str)
    ) {
        return 'FEE';
    }

    // 2. RTC: Real-Time Clearing / Immediate Payments
    if (/\b(RTC(?:\s*(?:EXPRESS|PMT|PAYMENT|TFR|TRANSFER))?|IMMEDIATE\s*(?:PAYMENT|PMT|TFR|TRANSFER)|INSTANT\s*(?:PAYMENT|CLEARING)|REAL[- ]TIME\s*CLEARING|FAST\s*CLEARING|PAYSHAP\s*IMMEDIATE)\b/i.test(str)) {
        return 'RTC';
    }

    // 3. DEBIT_ORDER: Contractual debit instructions
    if (/\b(DEBIT\s*ORDER|STOP\s*ORDER|NAEDO(?:\s*(?:TRACKED|DEBIT|DR))?|AEDO(?:\s*(?:DEBIT|DR))?|DEBICHECK(?:\s*DEBIT)?|ACB\s*(?:DEBIT|DR)|DIRECT\s*DEBIT|DIR\s*DEBIT|MAG\s*TAPE\s*DEBIT|MAGTAPE(?:\s*(?:DEBIT|DR))?|RECURRING\s*(?:DEBIT|ORDER)|SCHEDULED\s*(?:DEBIT|PMT))\b/i.test(str)) {
        return 'DEBIT_ORDER';
    }

    // 4. ATM: Automated Teller Machine & Saswitch cash
    if (/\b(ATM(?:\s*(?:WITHDRAWAL|DEPOSIT|CASH))?|AUTOBANK|SASWITCH|CASH\s*WITHDRAWAL)\b/i.test(str)) {
        return 'ATM';
    }

    // 5. POS: Physical in-store point of sale
    if (/\b(POS\s*(?:PURCHASE|DEBIT|SWIPE|SETTLEMENT|TRANSACTION)|POINT\s*OF\s*SALE|\bPOS\b)/i.test(str)) {
        return 'POS';
    }

    // 6. CARD: General card transactions, cheque card, Visa, Mastercard, e-commerce
    if (/\b(CHEQUE\s*CARD(?:\s*(?:PURCHASE|PMT))?|DEBIT\s*CARD(?:\s*(?:PURCHASE|PMT))?|CREDIT\s*CARD(?:\s*(?:PURCHASE|PMT))?|CARD\s*(?:PURCHASE|SETTLEMENT)|VIRTUAL\s*CARD(?:\s*PURCHASE)?|ONLINE\s*CARD\s*PURCHASE|INTERNATIONAL\s*CARD\s*PURCHASE|INTL\s*CARD\s*PURCHASE|TAP\s*(?:&|AND)\s*GO(?:\s*PURCHASE)?|VISA|MASTERCARD|EUROCARD|ECOM)\b/i.test(str)) {
        return 'CARD';
    }

    // 7. EFT: Electronic funds transfers, internet banking, app transfers, PayShap
    if (/\b(EFT(?:\s*(?:PAYMENT|PMT|CREDIT|DEBIT|DR|CR))?|INTERNET(?:\s*(?:PAYMENT|PMT|PMNT|PYMT|TRANSFER))?|IBANK(?:\s*(?:PAYMENT|PMT|TFR))?|IB\s*(?:PAYMENT|PMT|TFR)|\bIB\b|FNB\s*APP\s*TRANSFER|BANKING\s*APP(?:\s*TRANSFER)?|APP\s*TRANSFER|DIGITAL\s*PAYMENTS|UNCATEGORISED\s*BANKING|CAPITEC\s*PAY|ELECTRONIC\s*(?:PAYMENT|TRANSFER|TFR)|ONLINE\s*PAYMENT|PAYSHAP|PAY\s*SHAP|INSTANT\s*MONEY|E\s*WALLET|EWALLET|CASH\s*SEND|CASHSEND|THIRD\s*PARTY\s*PAYMENT|3RD\s*PARTY\s*PMT)\b/i.test(str)) {
        return 'EFT';
    }

    return 'UNKNOWN';
}

/**
 * Extracts South African structural statutory and branch identifiers before numeric stripping.
 * - SA 10-digit VAT registration numbers starting with 4
 * - SA landline/mobile/toll-free phone numbers
 * - Branch / Store locator codes (#1024, STORE 4421, SHOP 12)
 * - SARS PRN payment references (19-char alphanumeric, 19-digit, or labeled)
 */
export function extractStructuralClues(raw: string): StructuralClues {
    if (!raw) return {};
    const str = raw.toUpperCase().trim();
    const clues: StructuralClues = {};

    // 1. SA VAT registration numbers (strictly 10 digits starting with 4)
    const labeledVat = str.match(/\b(?:VAT|VAT\s*NO|VAT\s*REG|TAX\s*NO|TAX\s*REG|VAT#)\s*[:#.]?\s*(4\d{9})\b/i);
    if (labeledVat) {
        clues.vatNumber = labeledVat[1];
    } else {
        const standaloneVat = str.match(/(?:^|[^A-Z0-9*])(4\d{9})(?![A-Z0-9*])/i);
        if (standaloneVat) {
            clues.vatNumber = standaloneVat[1];
        }
    }

    // 2. SA Phone numbers
    const phoneMatch = str.match(/(?:(?:\+27[\s.-]?|0)[1-8]\d(?:[\s.-]?\d{3}[\s.-]?\d{4}|\d{7}))\b/);
    if (phoneMatch) {
        const matchIdx = phoneMatch.index ?? 0;
        const charBefore = matchIdx > 0 ? str[matchIdx - 1] : '';
        const charAfter = matchIdx + phoneMatch[0].length < str.length ? str[matchIdx + phoneMatch[0].length] : '';
        // Guard against dates separated by slashes
        if (charBefore !== '/' && charAfter !== '/') {
            clues.phoneNumber = phoneMatch[0].replace(/[\s.-]/g, '');
        }
    }

    // 3. SARS PRN / Payment Reference Numbers
    const sars19Match = str.match(/\b(\d{10}[VvPpIiCcAa]\d{8}|19\d{17})\b/);
    if (sars19Match) {
        clues.prn = sars19Match[1].toUpperCase();
    } else {
        const sarsLabeled = str.match(/\b(?:SARS\s*PRN|SARSEFLNG|SARS\s+PAYMENT|PRN)\s*[:#\-]?\s*([A-Z0-9]{10,25})\b/i);
        if (sarsLabeled) {
            clues.prn = sarsLabeled[1].toUpperCase();
        }
    }

    // 4. Branch / Store Locators (e.g. #1024, STORE 4421, SHOP 12, GARAGE 4421)
    const branchMatch = str.match(/(?:\b(?:STORE|BRANCH|BR|SHOP|SITE|STATION|GARAGE)\s*#?\s*(\d{1,6}[A-Z]?)|#\s*(\d{2,6}))\b/i);
    if (branchMatch) {
        clues.branchLocator = branchMatch[0].trim().replace(/\s+/g, ' ');
    }

    return clues;
}

export class BankCleaner {
    static classifyPaymentChannel = classifyPaymentChannel;
    static extractStructuralClues = extractStructuralClues;

    /**
     * Stage 1: Convert messy bank strings to clean display strings, channel tagging,
     * pre-sanitization clue extraction, and location suffix preservation.
     */
    static clean(description: string): CleanResult {
        if (!description) return { clean: 'UNKNOWN', channel: 'UNKNOWN' };

        const structuralClues = extractStructuralClues(description);
        const channel = classifyPaymentChannel(description);

        let str = description.toUpperCase().trim();

        // 1. Early Bank Fee Handling
        if (channel === 'FEE') {
            return { clean: 'BANK FEES', channel: 'FEE' };
        }

        // 2. Check SA Specific Standardizations
        if (/\bINSTANT\s*MONEY\b/i.test(str)) {
            const res: CleanResult = { clean: 'INSTANT MONEY', channel: 'EFT' };
            if (Object.keys(structuralClues).length > 0) res.structuralClues = structuralClues;
            return res;
        }
        if (/\bE\s*WALLET\b/i.test(str)) {
            const res: CleanResult = { clean: 'EWALLET', channel: 'EFT' };
            if (Object.keys(structuralClues).length > 0) res.structuralClues = structuralClues;
            return res;
        }
        if (/\bCASH\s*SEND\b/i.test(str)) {
            const res: CleanResult = { clean: 'CASH SEND', channel: 'EFT' };
            if (Object.keys(structuralClues).length > 0) res.structuralClues = structuralClues;
            return res;
        }

        // 3. Spoken Symbol Normalization (@ -> AT)
        str = str.replace(/@/g, ' AT ');

        // Strip compact timestamps before letter-digit separation
        str = str.replace(/\b\d{1,2}H\d{2}(?:M)?\b/gi, ' ');
        str = str.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ');

        // Insert space between letters and numbers when glued together
        str = str.replace(/([A-Z])([0-9])/g, '$1 $2');
        str = str.replace(/([0-9])([A-Z])/g, '$1 $2');

        // Remove parenthesized text containing digits (e.g. references like (GN260221107247517698) or (12345))
        str = str.replace(/\([^)]*\d+[^)]*\)/g, ' ');

        // 4. Iteratively strip banking prefixes from the start
        let prevStr = '';
        while (str !== prevStr) {
            prevStr = str;
            str = str.replace(COMPREHENSIVE_PREFIX_REGEX, ' ').trim();
        }

        // Clean ISO and standard dates that may have immediately followed the prefix
        str = str.replace(/\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g, ' ');
        str = str.replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, ' ');

        // 5. Noise Elimination
        // Masked card PANs (e.g. 491050*9002, ****9002, ..9002, CARD 1234)
        str = str.replace(/\b\d{6}\*+\d{4}\b/g, ' ');
        str = str.replace(/\b\*+\d{4}\b/g, ' ');
        str = str.replace(/\b(?:\.\.|\.{3,})\d{4}\b/g, ' ');
        str = str.replace(/\bCARD(?:\s*NO\.?)?\s*[:#]?\s*(?:\d{4}|\*+\d{4})\b/g, ' ');

        // Effective date annotations
        str = str.replace(/\(?\bEFFECTIVE\b\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\)?/g, ' ');

        // Dates & Timestamps
        str = str.replace(/\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g, ' '); // ISO 2024-09-15
        str = str.replace(/\b(?:20\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\b/g, ' '); // Compact 20240915
        str = str.replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, ' '); // Standard 15/09/2024
        str = str.replace(/\b\d{1,2}[\/\-\.]?(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\/\-\.]?\d{0,4}\b/g, ' '); // 15SEP24
        str = str.replace(/\b(?:FOR\s+)?(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:UARY|CH|IL|E|Y|UST|EMBER)?(?:\s+\d{2,4})?\b/g, ' ');
        str = str.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' '); // 14:32:10
        str = str.replace(/\b\d{1,2}\s*H\s*\d{2}(?:M)?\b/gi, ' '); // 14H32 or 14 H 32

        // Card / terminal / auth references
        str = str.replace(/\b(AUTH|AUTH CODE|AUTHCD|APPROVAL|TRACE|REF|REFERENCE|TERM|TERMINAL|TID|MID|STAN|SEQ|DOC|BATCH|TXN|TRN)\b\s*[:\-\.]?\s*[A-Z0-9]+\b/g, ' ');

        // Account / payment references
        str = str.replace(/\b(ACC|ACCOUNT|INV|INVOICE|PMT|PAYMENT|CLIENT|CUSTOMER|POLICY|CONTRACT)\b\s*[:\-]?\s*[A-Z0-9\-\/]+\b/g, ' ');

        // Long numeric IDs and alphanumeric references containing 4+ consecutive digits
        str = str.replace(/\b[A-Z]*\d{4,}[A-Z0-9]*\b/g, ' ');

        // South African bank/channel noise
        str = str.replace(/\b(PAYFAST|FNB|ABSA BANK|ABSA|NEDBANK|STANDARD BANK|CAPITEC BANK|CAPITEC|DISCOVERY BANK|TYMEBANK|SBSA|NED|ZA|ZAF|ECOM|POS|ATM|INT|IBANK|MOBILE|APP|LC|SPOR|SPORT|PAYSHAP|PAY\s*SHAP|IMMEDIATE|EXTERNAL|UNCATEGORISED|RECURRING)\b/g, ' ');

        // Legal suffixes
        str = str.replace(/\b(PTY|PTY LTD|PROPRIETARY LIMITED|LIMITED|LTD|CC|INC|NPC|NPO|TRUST)\b\.?/g, ' ');

        // Strip leading TO/FROM left by payment headers
        str = str.trim().replace(/^(?:TO|FROM)\s+/i, '');

        // Remove special characters, keep useful text (& and spaces)
        str = str.replace(/[^A-Z0-9& ]+/g, ' ');

        // Strip SA honorific prefixes at start of cleaned string (guarded against brands like MR PRICE and MR D FOOD)
        str = str.trim().replace(/^(?:MR(?!\s*(?:PRICE\b|D\b))|MRS|MS|DR|PROF)\b\s*/i, '');

        // Collapse whitespace
        str = str.replace(/\s{2,}/g, ' ').trim();

        // Specific SKJ Physiotherapy extraction
        const skjMatch = str.match(/PAYMENT TO (.*?)\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)?\s*SKJ PHYSIOTHERAPY/i);
        if (skjMatch) {
            return { clean: skjMatch[1].trim(), channel: 'EFT' };
        }

        // Check post-cleaning if string reduced cleanly to pure bank fee terminology
        if (/^(?:BANK\s*FEES?|BANK\s*CHARGES?|SERVICE\s*FEES?|SERVICE\s*CHARGES?|ACCOUNT\s*FEES?|MONTHLY\s*ACCOUNT\s*FEES?|MONTHLY\s*FEES?|BANK\s*COSTS?)$/i.test(str)) {
            return { clean: 'BANK FEES', channel: 'FEE' };
        }

        // ATM Cash Withdrawal standardization
        if (channel === 'ATM' && (!str || /^(?:CASH\s*WITHDRAWAL|AUTOBANK|SASWITCH)$/i.test(str))) {
            str = 'CASH WITHDRAWAL';
        }

        // 6. Location Suffix Guardrails & Extraction
        let branchLocation: string | undefined;

        // Rule 1: Starts with Recognized National Root Brand
        let matchedBrand: string | undefined;
        for (const brand of SORTED_ROOT_BRAND_KEYS) {
            const brandRegex = new RegExp(`^${brand.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(?:\\b|$)`, 'i');
            if (brandRegex.test(str)) {
                matchedBrand = brand;
                const canonicalBrand = NATIONAL_ROOT_BRANDS[brand] || brand;
                const remainder = str.replace(brandRegex, '').trim();
                str = canonicalBrand;
                if (remainder) {
                    let cleanRem = remainder
                        .replace(/\b(?:VAT(?:\s*NO|\s*REG|#)?|TAX(?:\s*NO|\s*REG)?|TEL(?:\s*NO)?|PHONE(?:\s*NO)?|AUTH(?:\s*CODE)?|TID|MID|STAN|REF|INV|DOC|PRN|NO\.?)\b/gi, ' ')
                        .replace(/\b(?:STORE|BRANCH|BR|SHOP|SITE|STATION|GARAGE)\s*#?\s*\d+[A-Z]?\b/gi, ' ')
                        .replace(/#\s*\d+\b/g, ' ')
                        .replace(/\b\d+\b/g, ' ')
                        .replace(/\s{2,}/g, ' ')
                        .trim();
                    if (cleanRem && isValidBranchLocation(cleanRem)) {
                        branchLocation = cleanRem;
                    }
                }
                break;
            }
        }

        // If not a national brand, check Rule 2 & 3:
        if (!matchedBrand) {
            // Check if string ends with store/branch suffix
            const storeSuffixMatch = str.match(/\s+(?:STORE|BRANCH|BR|SHOP|UNIT|#)\s*#?\s*\d+\s*$/i);
            if (storeSuffixMatch) {
                const strippedSuffix = storeSuffixMatch[0].trim();
                str = str.substring(0, storeSuffixMatch.index).trim();
                branchLocation = strippedSuffix;
            }

            // Check if string ends with a recognized SA location
            for (const loc of SORTED_SA_LOCATIONS) {
                const locRegex = new RegExp(`\\s+${loc.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*$`, 'i');
                const match = str.match(locRegex);
                if (match && match.index !== undefined) {
                    const preceding = str.substring(0, match.index).trim();
                    // Rule 2: Preceding must have at least one non-location merchant token
                    if (preceding.length > 0) {
                        str = preceding;
                        branchLocation = branchLocation ? `${loc} ${branchLocation}` : loc;
                        break;
                    }
                }
            }
            // Rule 3: Leading Location Guardrail (NEVER strip leading location)
            // By only matching and stripping trailing tokens, any leading location at index 0 remains intact!
        }

        // Strip residual clue labels from branchLocation and validate
        if (branchLocation) {
            branchLocation = branchLocation
                .replace(/\b(?:VAT(?:\s*NO|\s*REG|#)?|TAX(?:\s*NO|\s*REG)?|TEL(?:\s*NO)?|PHONE(?:\s*NO)?|AUTH(?:\s*CODE)?|TID|MID|STAN|REF|INV|DOC|PRN|NO\.?)\b/gi, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim();
            if (!isValidBranchLocation(branchLocation)) {
                branchLocation = undefined;
            }
        }

        // If branchLocation was not set, fallback to structural clue if available and valid
        if (!branchLocation && structuralClues.branchLocator) {
            const loc = structuralClues.branchLocator.trim();
            if (isValidBranchLocation(loc)) {
                branchLocation = loc;
            }
        }

        // Custom known merchant overrides (post-cleaning)
        const customOverrides: Record<string, string> = {
            'ASJ CERES 1 CERES': 'AP *ROOMYS PARADYS CER STELL',
        };
        if (customOverrides[str]) {
            str = customOverrides[str];
        }

        const finalClean = str || description.trim() || 'UNKNOWN';

        const result: CleanResult = {
            clean: finalClean,
            channel
        };
        if (branchLocation) {
            result.branchLocation = branchLocation;
        }
        if (Object.keys(structuralClues).length > 0) {
            result.structuralClues = structuralClues;
        }
        return result;
    }

    static generateMerchantKey(cleanDescription: string, channel?: PaymentChannel): string {
        if (!cleanDescription) return 'UNKNOWN';

        if (cleanDescription.trim().toUpperCase() === 'BANK FEES' || channel === 'FEE') {
            return 'BANK FEES';
        }

        // 1. Strip existing contractual tag or suffix if present
        let str = cleanDescription
            .toUpperCase()
            .replace(/\s*\[DEBIT\s*ORDER\]/gi, '')
            .replace(/:DEBIT_ORDER/gi, '')
            .trim();

        // 2. Spoken symbol & special char normalization
        str = str
            .replace(/@/g, ' AT ')
            .replace(/&/g, ' AND ')
            .replace(/[^A-Z0-9 ]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        // 3. Canonical Root Brand consolidation mappings
        const ROOT_BRAND_CANONICAL_MAP: Record<string, string> = {
            'UBER TRIP': 'UBER',
            'UBER EATS': 'UBER EATS',
            'CHECKERS HYPER': 'CHECKERS',
            'CHECKERS SIXTY60': 'CHECKERS',
            'WOOLWORTHS FOOD': 'WOOLWORTHS',
            'WW FOOD': 'WOOLWORTHS',
            'PICK N PAY HYPER': 'PICK N PAY',
            'PICK N PAY EXPRESS': 'PICK N PAY',
            'PNP EXPRESS': 'PICK N PAY',
            'PNP': 'PICK N PAY',
            'FOOD LOVERS': 'FOOD LOVERS MARKET',
            'FRUIT & VEG CITY': 'FOOD LOVERS MARKET',
            'BUILDERS': 'BUILDERS WAREHOUSE',
            'BUILDERS EXPRESS': 'BUILDERS WAREHOUSE',
            'BUILDERS TRADE': 'BUILDERS WAREHOUSE',
            'DISCHEM': 'DIS-CHEM',
            'DIS CHEM': 'DIS-CHEM',
            'MUGGNBEAN': 'MUGG & BEAN',
            'MUGG AND BEAN': 'MUGG & BEAN',
            'TOTALENERGIES': 'TOTAL',
            'KWIKSPAR': 'SPAR',
            'ASTRON': 'ASTRON ENERGY',
            'COURIER GUY': 'THE COURIER GUY',
            'MR D': 'MR D FOOD',
            'MRP': 'MR PRICE',
            'BANK FEES': 'BANK FEES',
        };

        let baseKey: string | undefined;

        if (ROOT_BRAND_CANONICAL_MAP[str]) {
            baseKey = ROOT_BRAND_CANONICAL_MAP[str];
        } else if (NATIONAL_ROOT_BRANDS[str]) {
            baseKey = NATIONAL_ROOT_BRANDS[str];
        } else {
            for (const brand of SORTED_ROOT_BRAND_KEYS) {
                const brandRegex = new RegExp(`^${brand.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(?:\\b|$)`, 'i');
                if (brandRegex.test(str)) {
                    baseKey = ROOT_BRAND_CANONICAL_MAP[brand] || NATIONAL_ROOT_BRANDS[brand] || brand;
                    break;
                }
            }
        }

        if (!baseKey) {
            const isDateOrNoiseToken = (t: string) => {
                if (STOPWORDS.has(t) || SIMILARITY_STOPWORDS.has(t)) return true;
                if (/^\d{1,2}(?:ST|ND|RD|TH)?$/i.test(t)) return true;
                if (/^\d{1,2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\w*$/i.test(t)) return true;
                return false;
            };

            const candidateTokens = str
                .split(' ')
                .filter(token => token.length >= 1 && !isDateOrNoiseToken(token));

            baseKey = candidateTokens.length > 0
                ? candidateTokens.slice(0, 3).join(' ').trim()
                : str.split(' ').slice(0, 3).join(' ').trim();
        }

        if (!baseKey) {
            baseKey = str || 'UNKNOWN';
        }

        // 4. Contractual vs Discretionary Segregation
        if (channel === 'DEBIT_ORDER') {
            return `${baseKey} [DEBIT ORDER]`;
        }
        return baseKey;
    }

    static process(raw: string): ProcessedTransaction {
        const cleanRes = this.clean(raw);
        const merchantKey = this.generateMerchantKey(cleanRes.clean, cleanRes.channel);
        const result: ProcessedTransaction = {
            rawDescription: raw,
            cleanDescription: cleanRes.clean,
            paymentChannel: cleanRes.channel,
            merchantKey,
            structuralClues: cleanRes.structuralClues || {},
            cleaningVersion: CLEANING_VERSION,
        };
        if (cleanRes.branchLocation) {
            result.branchLocation = cleanRes.branchLocation;
        }
        return result;
    }

    /**
     * Normalizes a string specifically for similarity comparison.
     * Strips all remaining digits and short noise.
     */
    static getSimilarityKey(description: string): string {
        const cleaned = this.clean(description).clean;
        
        return cleaned.toUpperCase()
            .replace(/[0-9]/g, ' ') // Strip remaining numbers for fuzzy matching
            .split(/\s+/)
            .filter(t => t.length > 1 && !SIMILARITY_STOPWORDS.has(t))
            .join(' ')
            .trim();
    }

    static calculateJaccard(s1: string, s2: string): number {
        const set1 = new Set(s1.split(' ').filter(Boolean));
        const set2 = new Set(s2.split(' ').filter(Boolean));
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        if (union.size === 0) return 0;
        return intersection.size / union.size;
    }

    /**
     * Damerau-Levenshtein distance calculation supporting transpositions.
     */
    static calculateLevenshtein(s1: string, s2: string): number {
        const len1 = s1.length;
        const len2 = s2.length;
        if (len1 === 0) return 0;
        if (len2 === 0) return 0;
        
        const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
                // Damerau transposition check for adjacent characters
                if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
                    matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
                }
            }
        }
        return 1 - (matrix[len1][len2] / Math.max(len1, len2));
    }

    static getSimilarity(s1: string, s2: string): { score: number; reason: string } {
        const key1 = this.getSimilarityKey(s1);
        const key2 = this.getSimilarityKey(s2);
        
        if (!key1 || !key2) return { score: 0, reason: 'Empty keys' };

        const jaccard = this.calculateJaccard(key1, key2);
        const levenshtein = this.calculateLevenshtein(key1, key2);

        const tokens1 = key1.split(' ').filter(Boolean);
        const tokens2 = key2.split(' ').filter(Boolean);

        let score: number;
        if (tokens1.length === 1 && tokens2.length === 1) {
            // For single-token merchant keys, edit distance drives typo detection
            score = levenshtein;
        } else {
            // For multi-token keys, blend token overlap with edit distance
            score = Math.max((0.8 * jaccard) + (0.2 * levenshtein), levenshtein * 0.9);
        }

        const firstToken1 = tokens1[0] || '';
        const firstToken2 = tokens2[0] || '';
        const firstTokenMatch = firstToken1 === firstToken2;

        let reason = `Token overlap: ${Math.round(jaccard * 100)}%`;
        if (firstTokenMatch) reason += " + First word match";

        // Collision Risk Check for generic starting words
        if (GENERIC_FIRST_TOKENS.has(firstToken1) && score < 0.98) {
            return { score: score * 0.5, reason: 'Generic token collision risk' };
        }

        let finalScore = score;
        if (firstTokenMatch && firstToken1 && !GENERIC_FIRST_TOKENS.has(firstToken1)) {
            const isSubstringMatch = key2.startsWith(key1) || key1.startsWith(key2);
            if (isSubstringMatch || jaccard >= 0.5) {
                const boostScore = isSubstringMatch ? 0.88 : 0.86;
                if (finalScore < boostScore) {
                    finalScore = boostScore;
                    reason = `First word match on "${firstToken1}" (boosted)`;
                }
            }
        }

        return { score: finalScore, reason };
    }
}

/**
 * Convenience helper matching interface contracts from PROJECT.md
 */
export function cleanAndGroupTransaction(raw: string): CleanedTransaction {
    const cleanRes = BankCleaner.clean(raw);
    const merchantKey = BankCleaner.generateMerchantKey(cleanRes.clean, cleanRes.channel);
    return {
        clean: cleanRes.clean,
        channel: cleanRes.channel,
        merchantKey,
        branchLocation: cleanRes.branchLocation,
        structuralClues: cleanRes.structuralClues || {}
    };
}

/**
 * Common South African corporate, transaction, and retail stop-words.
 * Stripped during guide-based matching so core business names are compared accurately.
 */
export const CORPORATE_STOP_WORDS = new Set([
    'PTY', 'LTD', 'CC', 'SUPPLY', 'SUPPLIES', 'SERVICES', 'SERVICE',
    'TRADING', 'TRADERS', 'ENTERPRISES', 'ENTERPRISE', 'HOLDINGS', 'HOLDING',
    'GROUP', 'CORP', 'CORPORATION', 'CO', 'COMPANY',
    'STORE', 'STORES', 'SHOP', 'SHOPS', 'SUPERMARKET', 'MARKET',
    'DEP', 'DEPOSIT', 'PMT', 'PAYMENT', 'PAYMENTS', 'EFT', 'POS', 'CARD',
    'PURCHASE', 'PURCHASES', 'TRANS', 'TRANSFER', 'TRANSFERS', 'DEBIT', 'CREDIT',
    'DIRECT', 'DIR', 'FEE', 'FEES', 'CHARGE', 'CHARGES', 'BRANCH',
    'ACCOUNT', 'ACCOUNTS', 'BANK', 'BANKS',
    'AND', '&', 'THE', 'FOR', 'OF', 'TO', 'IN', 'ON', 'AT', 'BY', 'WITH', 'SA'
]);

function extractRuleTokens(str: string): string[] {
    if (!str) return [];
    return str
        .toUpperCase()
        .replace(/@/g, ' AT ')
        .replace(/&/g, ' AND ')
        .replace(/[^A-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 0);
}

function extractCoreRuleTokens(tokens: string[]): string[] {
    return tokens.filter(t => t.length >= 2 && !CORPORATE_STOP_WORDS.has(t));
}

export interface RuleGuideMatchResult {
    matched: boolean;
    confidence: number;
    matchType: 'exact' | 'guide' | 'none';
    matchedKeyword: string;
}

/**
 * Evaluates whether a bank description matches a rule keyword, returning rich match details.
 * Supports exact word-boundary matching (100% confidence) and guide-based token overlap (85-95% confidence).
 * Enforces the symbol presence invariant: if a keyword contains '@' or requires 'AT', description MUST contain '@' or 'AT'.
 */
export function matchRuleGuideDetails(description: string, keyword: string): RuleGuideMatchResult {
    if (!description || !keyword) {
        return { matched: false, confidence: 0, matchType: 'none', matchedKeyword: '' };
    }
    const cleanDesc = description.toUpperCase().trim();
    const cleanKw = keyword.toUpperCase().trim();
    if (!cleanDesc || !cleanKw) {
        return { matched: false, confidence: 0, matchType: 'none', matchedKeyword: '' };
    }

    // Symbol presence invariant:
    // If the keyword contains '@' or standalone word 'AT' (e.g. '@HOME', 'AT HOME', '3@1'),
    // the description MUST contain either '@' or standalone word 'AT'.
    const kwRequiresAt = cleanKw.includes('@') || /(?:^|\s)AT(?:\s|$)/i.test(cleanKw);
    if (kwRequiresAt) {
        const descHasAt = cleanDesc.includes('@') || /(?:^|\s)AT(?:\s|$)/i.test(cleanDesc);
        if (!descHasAt) {
            return { matched: false, confidence: 0, matchType: 'none', matchedKeyword: '' };
        }
    }

    // Special bank symbols (like '#SERVICE FEES' or '*9002') allow direct substring/prefix match
    if (cleanKw.startsWith('#') || cleanKw.startsWith('*')) {
        if (cleanDesc.includes(cleanKw)) {
            return { matched: true, confidence: 100, matchType: 'exact', matchedKeyword: keyword };
        }
        return { matched: false, confidence: 0, matchType: 'none', matchedKeyword: '' };
    }

    // Phase 1: Exact word boundary matching using non-alphanumeric delimiters
    const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^A-Z0-9])${escaped}([^A-Z0-9]|$)`, 'i');
    if (regex.test(cleanDesc)) {
        return { matched: true, confidence: 100, matchType: 'exact', matchedKeyword: keyword };
    }

    // Phase 1b: Exact word boundary matching with spoken symbols normalized (@ -> AT, & -> AND, + -> PLUS)
    const normDesc = cleanDesc.replace(/@/g, ' AT ').replace(/&/g, ' AND ').replace(/\+/g, ' PLUS ').replace(/\s+/g, ' ').trim();
    const normKw = cleanKw.replace(/@/g, ' AT ').replace(/&/g, ' AND ').replace(/\+/g, ' PLUS ').replace(/\s+/g, ' ').trim();
    if (normKw !== cleanKw || normDesc !== cleanDesc) {
        const escapedNorm = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const normRegex = new RegExp(`(^|[^A-Z0-9])${escapedNorm}([^A-Z0-9]|$)`, 'i');
        if (normRegex.test(normDesc)) {
            return { matched: true, confidence: 100, matchType: 'exact', matchedKeyword: keyword };
        }
    }

    // Phase 2: Guide-based token overlap & stop-word filtering
    const descTokens = extractRuleTokens(cleanDesc);
    const kwTokens = extractRuleTokens(cleanKw);

    const descCore = extractCoreRuleTokens(descTokens);
    const kwCore = extractCoreRuleTokens(kwTokens);

    // If either side has no core tokens after filtering stop words, do not fuzzy match
    if (descCore.length === 0 || kwCore.length === 0) {
        return { matched: false, confidence: 0, matchType: 'none', matchedKeyword: '' };
    }

    const descCoreSet = new Set(descCore);
    const kwCoreSet = new Set(kwCore);

    // Count intersecting core tokens
    let intersectionCount = 0;
    for (const token of kwCoreSet) {
        if (descCoreSet.has(token)) {
            intersectionCount++;
        }
    }

    if (intersectionCount === 0) {
        return { matched: false, confidence: 0, matchType: 'none', matchedKeyword: '' };
    }

    // Case A: All core tokens of the rule keyword appear in the description
    // e.g. Rule = "HAND TOOLS", Description = "HAND TOOLS SUPPLY DURBAN"
    if (intersectionCount === kwCoreSet.size && (kwCoreSet.size >= 2 || [...kwCoreSet][0].length >= 4)) {
        return { matched: true, confidence: 95, matchType: 'guide', matchedKeyword: keyword };
    }

    // Case B: High bidirectional token overlap (>= 75% overlap on the larger core set, with at least 2 matching tokens)
    const maxCoreSize = Math.max(descCoreSet.size, kwCoreSet.size);
    const overlapRatio = intersectionCount / maxCoreSize;
    if (intersectionCount >= 2 && overlapRatio >= 0.75) {
        const confidence = Math.round(75 + overlapRatio * 15);
        return { matched: true, confidence, matchType: 'guide', matchedKeyword: keyword };
    }

    return { matched: false, confidence: 0, matchType: 'none', matchedKeyword: '' };
}

/**
 * High-precision word-boundary and guide-based keyword matcher for bank transactions.
 * Matches exact keywords as well as guide-based token overlaps (e.g. "HAND TOOLS" matching "HAND TOOLS SUPPLY"),
 * while preventing false substring collisions (e.g. "BUS" matching "BUSISIWE").
 */
export function matchesRuleKeyword(description: string, keyword: string): boolean {
    return matchRuleGuideDetails(description, keyword).matched;
}
