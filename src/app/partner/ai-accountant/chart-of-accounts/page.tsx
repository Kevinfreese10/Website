'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PartnerChartOfAccountsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Global Chart of Accounts</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The interface for managing your firm's global Chart of Accounts is currently under development. 
            In the meantime, new clients will continue to be provisioned with the system's default Chart of Accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">
             Once available, any Chart of Accounts you define here will act as the baseline for all new AI Accountant clients created by your practice.
           </p>
        </CardContent>
      </Card>
    </div>
  );
}
