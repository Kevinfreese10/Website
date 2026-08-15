import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, LifeBuoy } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Error 404</p>
      <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight sm:text-5xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        The page you&apos;re looking for may have moved or no longer exists. Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-1" />
            Back to Home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/products">
            <Search className="mr-1" />
            Browse Services
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/contact">
            <LifeBuoy className="mr-1" />
            Contact Support
          </Link>
        </Button>
      </div>
    </div>
  );
}
