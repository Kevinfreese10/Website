import { NextResponse } from 'next/server';
import { getServices } from '@/lib/services';
import { LANDING_PAGE_ENTRIES, toFinderItem, type ServiceFinderItem } from '@/lib/service-finder';

/**
 * Lightweight, cached service index for the "Which service are you looking for today?" modal.
 * Only the fields the modal needs are returned (~15 KB vs. the full service documents), and the
 * response is statically generated and revalidated hourly so it never hits Firestore per visitor.
 */
export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  const services = await getServices();
  const items: ServiceFinderItem[] = [
    ...services.filter(s => s.slug && s.title).map(toFinderItem),
    ...LANDING_PAGE_ENTRIES,
  ];
  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
