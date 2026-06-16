'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { User } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export function LapsedSubscriptionScreen({ user }: { user: User }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleReactivate = () => {
        setIsLoading(true);
        window.location.href = '/partner-signup?reactivate=true';
    };

    return (
        <Card className="max-w-lg w-full border-destructive/20 shadow-xl">
            <CardHeader className="bg-destructive/5 border-b border-destructive/10 rounded-t-lg text-center">
                <Badge variant="destructive" className="w-fit mx-auto mb-2 uppercase font-black text-[10px] tracking-widest">Lapsed</Badge>
                <CardTitle className="text-destructive font-black text-2xl">Subscription Lapsed</CardTitle>
            </CardHeader>
            <CardContent className="py-8 space-y-6">
                <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Access Suspended</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed font-medium">
                        Your Growth Subscription has lapsed due to a failed or cancelled payment.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your R950/month Growth subscription has expired or a payment failed. Reactivate to restore access to your landing page, AI tools, and staff management.
                    </p>
                    
                    <div className="space-y-4">
                        <Button onClick={handleReactivate} disabled={isLoading} className="w-full h-12 text-lg font-bold gap-2 shadow-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                            Reactivate for R950/month
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t justify-center py-4">
                <Button variant="link" className="text-xs text-muted-foreground" asChild>
                    <Link href="/">Back to Website</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
