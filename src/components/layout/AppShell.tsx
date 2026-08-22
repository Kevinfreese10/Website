'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { ReactNode, useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';

const WebsiteAIWidget = dynamic(() => import('@/components/shared/WebsiteAIWidget'), { ssr: false });

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const isDashboardPage = pathname ? (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/partner') ||
    pathname.startsWith('/p/')
  ) : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isDashboardPage) {
      document.body.classList.add('home-light-theme');
    } else {
      document.body.classList.remove('home-light-theme');
    }
    document.body.classList.remove('dark');
    return () => {
      document.body.classList.remove('home-light-theme');
      document.body.classList.remove('dark');
    };
  }, [isDashboardPage]);

  const shouldShowHeader = !isDashboardPage || isAuthPage;
  const shouldShowFooter = !isDashboardPage && !isAuthPage;

  const content = (
    <>
      {/*
        * Skip link. A keyboard user previously had to tab through up to 10 nav triggers — and,
        * once opened, up to 27 dropdown items — on every single page load before reaching content.
        */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      {shouldShowHeader && <Header />}
      <main id="main-content" tabIndex={-1} className="flex-grow bg-background relative">{children}</main>
      {shouldShowFooter && <Footer />}
      {mounted && !isDashboardPage && <WebsiteAIWidget />}
    </>
  );

  return (
    <div className={`flex min-h-screen flex-col ${!isDashboardPage ? 'home-light-theme' : ''}`}>
      {content}
    </div>
  );
}
