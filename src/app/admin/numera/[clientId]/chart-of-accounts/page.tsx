import { redirect } from 'next/navigation';

export default async function NumeraChartOfAccountsRedirect({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  redirect(`/admin/numera/${clientId}/dashboard`);
  return null;
}