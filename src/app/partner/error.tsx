'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/observability';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PartnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { operation: 'partner.route', detail: { digest: error.digest } });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/30 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred in the partner practice portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-auto text-left">
            {error.message || 'Unknown runtime error'}
          </p>
        </CardContent>
        <CardFooter className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" asChild>
            <Link href="/partner/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Practice Dashboard
            </Link>
          </Button>
          <Button size="sm" onClick={() => reset()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
