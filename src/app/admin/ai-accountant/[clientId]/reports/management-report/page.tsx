'use client';

import { useParams } from 'next/navigation';
import ManagementReportView from '@/components/ai-accountant/reports/ManagementReportView';

export default function ManagementReportPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  if (!clientId) return null;

  return <ManagementReportView clientId={clientId} />;
}
