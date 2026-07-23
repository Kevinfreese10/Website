---
name: update-bank-cleaner-rules
description: >-
  Automatically updates bank-cleaner.ts to add new banks, prefixes, or suffixes to the transaction cleaning engine.
---

# Update Bank Cleaner Rules

## Overview
This skill updates `c:\myacc\src\lib\bank-cleaner.ts` to add new noisy terms (like "FNB APP TRANSFER TO", "ABSA BANK") to the transaction cleaner. It automatically identifies the `prefixRegex` and `STOPWORDS` lists and injects the new terms so the Smart Match queue can properly identify the true merchant.

## Dependencies
None

## Quick Start
"Update the bank cleaner to remove the prefix 'CAPITEC PAY PAYMENT'"

## Workflow
### 1. Identify the Target Terms
- Identify the exact phrase the user wants to strip from transaction descriptions (e.g. "CAPITEC PAY").
- Determine if it is a prefix (appears at the beginning of the transaction string) or a generic word/suffix (appears anywhere or at the end).

### 2. Locate the Cleaning Logic
- Use `view_file` to read `c:\myacc\src\lib\bank-cleaner.ts`.
- Locate `const STOPWORDS = new Set([...])`.
- Locate `const SIMILARITY_STOPWORDS = new Set([...])`.
- Locate `const prefixRegex = /^(?:...)\s*(?:\d+(?:\.\d{2})?)?\s+/;` (usually around line 75).

### 3. Update the Logic
- If the phrase is a prefix or generic channel noise (like "FNB APP TRANSFER"), add it to the `prefixRegex` alternation list. **Important:** Add longer phrases before shorter overlapping ones (e.g. `FNB APP TRANSFER TO|FNB APP TRANSFER`).
- If the phrase contains generic words that shouldn't form part of the Merchant Key (like "BANK"), add those individual words to both `STOPWORDS` and `SIMILARITY_STOPWORDS`.
- Use `multi_replace_file_content` to apply your changes.

### 4. Edge Cases and Errors
- If the file structure has changed significantly or the regex is too complex to safely modify, **STOP** and ask the user for guidance. Do not force an incorrect code edit.
- Handle edge cases silently: automatically add terms to both STOPWORDS and the regex if it makes sense to fully scrub the term, without asking for explicit permission.

## Common Mistakes
- **Syntax Errors:** Breaking the regex by unbalancing the non-capturing group `(?:... )` or leaving dangling pipes `|`.
- **Order of Operations:** Putting a short string before a longer string in the regex (e.g. `FNB|FNB APP` instead of `FNB APP|FNB`). The regex evaluates left-to-right, so the longer one must come first.
- **Forgetting SIMILARITY_STOPWORDS:** Adding to `STOPWORDS` but forgetting `SIMILARITY_STOPWORDS` will break fuzzy matching.
