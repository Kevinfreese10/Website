'use client';

import { useParams } from 'next/navigation';
import AnnualFinancialStatementsView from '@/components/ai-accountant/reports/AnnualFinancialStatementsView';

export default function FinancialStatementsPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  if (!clientId) return null;

  return <AnnualFinancialStatementsView clientId={clientId} />;
}
