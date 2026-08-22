import { redirect } from 'next/navigation';

/**
 * Outsourced orders are viewed on the standard partner order page — there is no separate
 * detail view.
 *
 * This route previously carried ~250 lines of a fully-built order detail page behind a
 * client-side `router.replace()` that fired on mount, so none of it was ever rendered. That dead
 * code also contained a broken ownership check (`data.resellerId !== currentUser.id`, which
 * ignores partner staff) and an unguarded `data.date.toDate()` that would throw on any
 * string-dated order — both of which would have become live bugs the moment the redirect was
 * removed.
 *
 * Redirecting server-side also avoids shipping a page bundle and a wasted Firestore read just to
 * bounce the user.
 */
export default async function OutsourcedOrderRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/partner/orders/${id}`);
}
