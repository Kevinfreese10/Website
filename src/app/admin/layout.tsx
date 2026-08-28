'use client';

import { ReactNode, useEffect } from 'react';
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { AppTopBar } from '@/components/navigation/AppTopBar';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const isStaffRole = !!(user && [
    'admin',
    'staff',
    'consultant',
    'senior_accountant',
    'accountant',
    'support_agent',
    'ai_accountant',
    'cap_staff',
    'cap_supervisor'
  ].includes(user.role));

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.isActive === false || user?.disabled === true) {
        router.push('/login');
        return;
      }
      if (!isStaffRole) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, router, isStaffRole]);
  
  if (isAuthenticated === undefined || (isAuthenticated && (user?.isActive === false || user?.disabled === true || !isStaffRole))) {
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
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          {user && (
            <Sidebar collapsible="icon" className="border-r">
              <DashboardNav user={user} />
            </Sidebar>
          )}
          <SidebarInset>
              <div className="p-4 sm:p-6 lg:p-8 pt-0 sm:pt-0 lg:pt-0">
                <AppTopBar homeHref="/admin/dashboard" showQuickCreate />
                {children}
              </div>
          </SidebarInset>
          <CommandPalette />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
