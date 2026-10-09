'use client';

import { Suspense } from 'react';
import { BankTransactionsUI } from '@/components/ai-accountant/BankTransactionsUI';
import { Loader2 } from 'lucide-react';

export default function DashboardBankTransactionsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <BankTransactionsUI />
        </Suspense>
    );
}
