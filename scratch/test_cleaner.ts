import { BankCleaner } from '../src/lib/bank-cleaner';

const tests = [
  "FNB APP PAYMENT TO K. LEEPILE JUNE SKJ PHYSIOTHERAPY",
  "FNB APP PAYMENT TO S. NAGAR OCT SKJ PHYSIOTHERAPY"
];

for (const t of tests) {
  console.log(BankCleaner.process(t));
}
