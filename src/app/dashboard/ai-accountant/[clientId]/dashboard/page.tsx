
'use client';

import { redirect, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AIAccountantClientDashboardPage() {
    const params = useParams();
    const { user } = useAuth();
    const clientId = params.clientId as string;

    if (!user) {
        return (
            <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
        );
    }
    
    // Redirect all authorized users to the full admin dashboard for the client.
    redirect(`/admin/ai-accountant/${clientId}/dashboard`);
    
    return null;
}
