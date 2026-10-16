'use client';

import { ReactNode, useEffect } from 'react';
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { AppTopBar } from '@/components/navigation/AppTopBar';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, usePathname } from 'next/navigation';
import { PartnerProvider } from '@/contexts/PartnerContext';

export default function DashboardClientLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isPartner = !!(user && ['partner', 'partner_staff', 'partner_admin', 'reseller', 'franchisee'].includes(user.role));
  const isStaff = !!(user && [
    'admin',
    'staff',
    'consultant',
    'senior_accountant',
    'accountant',
    'support_agent',
    'cap_staff',
    'cap_supervisor'
  ].includes(user.role));

  const isAllowedPartnerRoute = isPartner && (
    pathname.startsWith('/dashboard/ai-accountant') ||
    pathname.startsWith('/dashboard/ai-payroll')
  );

  const isAllowedStaffRoute = isStaff && pathname.startsWith('/dashboard/orders');

  const shouldRedirect = isAuthenticated && 
    user?.role !== 'client' && 
    user?.role !== 'ai_accountant' && 
    !isAllowedPartnerRoute &&
    !isAllowedStaffRoute;

  useEffect(() => {
    if (shouldRedirect) {
      if (isStaff) {
        router.push('/admin/dashboard');
      } else if (isPartner) {
        router.push('/partner/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [shouldRedirect, user, router, isPartner, isStaff]);

  if (isAuthenticated === undefined || shouldRedirect) {
     return (
        <div className="flex min-h-screen">
            <Skeleton className="hidden md:block w-16 lg:w-64" />
            <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-[60vh] w-full" />
            </div>
      </div>
     );
  }

  return (
    <ProtectedRoute>
      <PartnerProvider>
        <SidebarProvider>
          <div className="flex min-h-screen bg-background w-full max-w-full overflow-x-hidden">
            {user && (
              <Sidebar collapsible="icon" className="border-r">
                <DashboardNav user={user} />
              </Sidebar>
            )}
            <SidebarInset>
                <div className="p-4 pb-24 sm:p-6 lg:p-8 pt-0 sm:pt-0 lg:pt-0 md:pb-8 min-w-0 w-full max-w-full">
                    <AppTopBar homeHref="/dashboard" />
                    {children}
                </div>
            </SidebarInset>
            <CommandPalette />
            <MobileBottomNav variant="client" />
          </div>
        </SidebarProvider>
      </PartnerProvider>
    </ProtectedRoute>
  );
}
