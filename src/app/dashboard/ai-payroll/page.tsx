'use client';

import { redirect } from 'next/navigation';

export default function AIPayrollRedirectPage() {
    redirect('/dashboard/ai-payroll/clients');
}
