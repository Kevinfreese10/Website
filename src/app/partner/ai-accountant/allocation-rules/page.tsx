'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PartnerAllocationRulesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Global Allocation Rules</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The interface for managing your firm's global allocation rules is currently under development. 
            In the meantime, new clients will continue to be provisioned with the system's default allocation rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">
             Once available, any rules you define here will act as the baseline for all new AI Accountant clients created by your practice.
           </p>
        </CardContent>
      </Card>
    </div>
  );
}
