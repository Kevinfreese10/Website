'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { ReactNode, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/layout/Header'), { ssr: false });
const WebsiteAIWidget = dynamic(() => import('@/components/shared/WebsiteAIWidget'), { ssr: false });

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  const isPartnerPage = pathname ? (
    pathname.startsWith('/partner') ||
    pathname.startsWith('/p/')
  ) : false;

  const isDashboardPage = pathname ? (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/partner') ||
    pathname.startsWith('/p/')
  ) : false;

  const shouldShowHeader = mounted && (!isDashboardPage || isAuthPage);
  const shouldShowFooter = mounted && !isDashboardPage && !isAuthPage;

  const content = (
    <>
      {shouldShowHeader && <Header />}
      <main className="flex-grow bg-background relative">{children}</main>
      {shouldShowFooter && <Footer />}
      {mounted && !isDashboardPage && <WebsiteAIWidget />}
    </>
  );

  return (
    <div className={`flex min-h-screen flex-col ${isPartnerPage ? 'theme-light' : ''}`}>
      {content}
    </div>
  );
}
