/**
 * @fileOverview Keyword Sanitizer for AI Accountant Allocation Rules.
 * Strips POS/card noise, terminal codes, branch numbers, dates, masked PANs,
 * and punctuation, producing clean, canonical uppercase keywords for rules.
 */

import { NATIONAL_ROOT_BRANDS } from './bank-cleaner';

/**
 * Common bank transaction prefixes to strip from raw keywords
 */
const TRANSACTION_PREFIXES = [
    /^(POS\s+PURCHASE|CARD\s+PURCHASE|DEBIT\s+CARD\s+PURCHASE|PURCHASE)\s+/i,
    /^(EFT\s+PAYMENT|EFT\s+PMT|EFT\s+TO|EFT\s+FROM|EFT|IMMEDIATE\s+PAYMENT)\s+/i,
    /^(DEBIT\s+ORDER|MAGTAPE\s+DEBIT|NAEDO\s+DEBIT|DIRECT\s+DEBIT)\s+/i,
    /^(BANK\s+CHARGE|SERVICE\s+FEE|MONTHLY\s+FEE|ADMIN\s+FEE)\s+/i,
    /^(ATM\s+WITHDRAWAL|CASH\s+WITHDRAWAL|AUTOBANK\s+WITHDRAWAL)\s+/i,
    /^(FAST\s+PAYMENT|RTC\s+PAYMENT|REAL\s+TIME\s+PAYMENT)\s+/i,
    /^(PAYMENT\s+TO|PAYMENT\s+FROM|TRANSF\s+TO|TRANSF\s+FROM|TRANSFER)\s+/i,
];

/**
 * Common noisy suffixes like store numbers, location codes, card masks
 */
const NOISY_PATTERNS = [
    // Masked cards (e.g. *1234, **1234, XXXXXX1234, CARD 1234)
    /(\*+|\bX{4,}\b|\bCARD\s*)\d{4,}\b/gi,
    // Date patterns like 2026/09/23, 23-09-2026, 23SEP, 23092026
    /\b\d{1,2}[-\/](JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[-\/]\d{2,4}\b/gi,
    /\b\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{0,4}\b/gi,
    /\b\d{4}[-\/]\d{2}[-\/]\d{2}\b/g,
    /\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/g,
    // Terminal / POS identifiers (e.g. TERM 123, POS 01, T001, CASHIER 5)
    /\b(TERM|TERMINAL|POS|TILL|REG|REGISTER|CASHIER|STORE|BRANCH|BR)\s*#?\s*\d+\b/gi,
    // Reference numbers and hashes at end (e.g. #12345, REF 12345)
    /#\s*\d+\b/g,
    /\b(REF|INV|DOC|TXN|TRACE)\s*[:#]?\s*[A-Z0-9-]+\b/gi,
    // Bank charges and fee noise
    /\b(CHARGES|SERVICE\s*FEE|ADMIN\s*FEE|MONTHLY\s*FEE|BANK\s*FEE|FEE)\b/gi,
];

const MAJOR_BANKS: Record<string, string> = {
    'NEDBANK': 'NEDBANK',
    'STANDARD BANK': 'STANDARD BANK',
    'STD BANK': 'STANDARD BANK',
    'FNB': 'FNB',
    'FIRST NATIONAL BANK': 'FNB',
    'ABSA': 'ABSA',
    'CAPITEC': 'CAPITEC',
    'TYMEBANK': 'TYMEBANK',
    'TYME BANK': 'TYMEBANK',
    'INVESTEC': 'INVESTEC',
};

/**
 * Sanitizes a merchant name or keyword before rule creation / appending.
 * 
 * @param input Raw keyword, merchant key, or transaction description
 * @returns Clean, uppercase, deduplicated canonical keyword
 */
export function sanitizeKeyword(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let cleaned = input.trim();

    // 1. Check for recognized national root brands and major banks
    const upperInput = cleaned.toUpperCase();
    const allBrands = { ...MAJOR_BANKS, ...NATIONAL_ROOT_BRANDS };
    for (const [brandKey, canonicalBrand] of Object.entries(allBrands)) {
        const regex = new RegExp(`(^|\\s)${brandKey}(\\s|$)`, 'i');
        if (regex.test(upperInput)) {
            return canonicalBrand.toUpperCase();
        }
    }

    // 2. Strip transaction prefixes
    for (const prefix of TRANSACTION_PREFIXES) {
        cleaned = cleaned.replace(prefix, '');
    }

    // 3. Strip noisy suffixes / patterns
    for (const pattern of NOISY_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    // 4. Remove special symbols and non-alphanumeric noise (keep letters, numbers, spaces, ampersands, hyphens)
    cleaned = cleaned.replace(/[^a-zA-Z0-9\s&-]/g, ' ');

    // 5. Remove trailing standalone digits or branch identifiers (e.g. "BASS LAKE 1234" -> "BASS LAKE")
    cleaned = cleaned.replace(/\s+\d{2,}$/g, '');

    // 6. Collapse multiple whitespaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim().toUpperCase();

    // 7. Fallback to original cleaned string if empty
    if (!cleaned) {
        cleaned = input.replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase();
    }

    return cleaned;
}
