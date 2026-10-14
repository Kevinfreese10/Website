'use client';

import { ReactNode, useEffect } from 'react';
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { LapsedSubscriptionScreen } from '@/components/partner/LapsedSubscriptionScreen';
import { PartnerProvider } from '@/contexts/PartnerContext';
import { WorkingAsBanner } from '@/components/partner/staff/WorkingAsBanner';
import { AppTopBar } from '@/components/navigation/AppTopBar';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { NotificationCenter } from '@/components/navigation/NotificationCenter';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      isAuthenticated &&
      user?.role !== 'partner' &&
      user?.role !== 'partner_staff' &&
      user?.role !== 'partner_admin'
    ) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (
    isAuthenticated === undefined ||
    (isAuthenticated &&
      user?.role !== 'partner' &&
      user?.role !== 'partner_staff' &&
      user?.role !== 'partner_admin')
  ) {
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

  const isLapsed =
    (user?.partnerTier === 'practice' ||
      user?.partnerTier === 'enterprise' ||
      user?.partnerTier === 'growth') &&
    user?.partnerSubscription?.status === 'lapsed';

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
                <AppTopBar homeHref="/partner/dashboard" extra={<NotificationCenter />} />

                {user?.role === 'partner_staff' && <WorkingAsBanner />}

                {isLapsed ? (
                  <div className="flex items-center justify-center min-h-[70vh]">
                    <LapsedSubscriptionScreen user={user} />
                  </div>
                ) : (
                  children
                )}
              </div>
            </SidebarInset>
            <CommandPalette />
            <MobileBottomNav variant="partner" />
          </div>
        </SidebarProvider>
      </PartnerProvider>
    </ProtectedRoute>
  );
}
