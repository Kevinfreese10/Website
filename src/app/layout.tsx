import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AppShell from '@/components/layout/AppShell';
import ClientProviders from '@/contexts/ClientProviders';
import { bodyFont, headlineFont } from '@/app/fonts';
import { cn } from '@/lib/utils';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import ExternalScripts from '@/components/layout/ExternalScripts';
import Script from 'next/script';
import { generateRootEntityGraphSchema } from '@/lib/schema/productSchema';
import { SITE_URL, STATIC_OG_IMAGE } from '@/lib/constants';
import { ConnectivityBanner } from '@/components/shared/ConnectivityBanner';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'My Accountant | Professional Accounting & Tax Services',
    template: '%s | My Accountant',
  },
  description: 'Professional online tax, accounting, CIPC, SARS and compliance services for South African businesses.',
  openGraph: {
    title: 'My Accountant | Professional Accounting & Tax Services',
    description: 'Professional online tax, accounting, CIPC, SARS and compliance services for South African businesses.',
    siteName: 'My Accountant',
    images: [
      {
        url: STATIC_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'My Accountant - Professional Accounting & Tax',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Accountant | Professional Accounting & Tax Services',
    description: 'Simplify your finances with our expert accounting and tax solutions.',
    images: [STATIC_OG_IMAGE],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const,
  themeColor: '#1a73e8',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rootEntityGraph = generateRootEntityGraphSchema();

  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://cdn.trustindex.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.trustindex.io" />
      </head>
      <body className={cn("antialiased", bodyFont.variable, headlineFont.variable)} suppressHydrationWarning>
        <ExternalScripts />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootEntityGraph) }}
        />
        <AuthProvider>
            <ClientProviders>
                <FirebaseErrorListener />
                <AppShell>
                  <ConnectivityBanner />
                  {children}
                </AppShell>
            </ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
