import { redirect } from 'next/navigation';

export default function OutsourcedOrdersRedirectPage() {
  redirect('/partner/orders');
}
