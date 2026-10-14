'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { User, ClientCustomer } from '@/lib/types';
import { getFirestore, doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { CustomerStatementView } from '@/components/admin/CustomerStatementDialog';
import { Users, FileText, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';

const db = getFirestore(firebaseApp);

function CustomerStatementsReportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const initialCustomerId = searchParams.get('customerId');

  const [client, setClient] = useState<User | null>(null);
  const [customers, setCustomers] = useState<ClientCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client & customer list
  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Client Document
        const clientRef = doc(db, 'aiAccountantClients', clientId);
        const clientSnap = await getDoc(clientRef);
        if (clientSnap.exists()) {
          setClient({ id: clientSnap.id, ...clientSnap.data() } as User);
        }

        // 2. Fetch Customers
        const custQuery = query(
          collection(db, `aiAccountantClients/${clientId}/customers`),
          orderBy('name')
        );
        const custSnap = await getDocs(custQuery);
        const fetchedCusts = custSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as ClientCustomer)
        );
        setCustomers(fetchedCusts);

        // Auto-select first customer if none specified
        if (!initialCustomerId && fetchedCusts.length > 0) {
          setSelectedCustomerId(fetchedCusts[0].id);
        }
      } catch (err) {
        console.error('Failed to load customer statements data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId, initialCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const handleCustomerChange = (newCustId: string) => {
    setSelectedCustomerId(newCustId);
    router.replace(`/admin/ai-accountant/${clientId}/reports/customer-statements?customerId=${newCustId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Selector Card */}
      <Card className="no-print shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Customer Statements Report
              </CardTitle>
              <CardDescription className="text-xs">
                Select a debtor/customer to generate their statement of account, aging schedule, and payment remittance.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-2 text-xs">
              <Link href={`/admin/ai-accountant/${clientId}/customers`}>
                <Users className="h-4 w-4" />
                Manage Customers
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-80">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Select Customer:
              </label>
              <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-medium">{c.name}</span>
                      {c.contactPerson ? ` (${c.contactPerson})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomer && (
              <div className="text-xs text-slate-500 sm:border-l sm:pl-4 sm:pt-4 flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Email:</span>{' '}
                  {selectedCustomer.email || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Phone:</span>{' '}
                  {selectedCustomer.cellNumber || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">VAT:</span>{' '}
                  {selectedCustomer.vatNumber || 'N/A'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Statement View */}
      {selectedCustomer ? (
        <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
          <CustomerStatementView
            client={client}
            customer={selectedCustomer}
            clientId={clientId}
            showCloseButton={false}
          />
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-slate-800">No Customer Selected</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {customers.length === 0
              ? 'No customers have been registered for this entity yet. Add customers to generate statement reports.'
              : 'Please choose a customer from the dropdown above to view their statement of account.'}
          </p>
          {customers.length === 0 && (
            <Button size="sm" asChild>
              <Link href={`/admin/ai-accountant/${clientId}/customers`}>
                Add Your First Customer
              </Link>
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

export default function CustomerStatementsReportPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <CustomerStatementsReportContent />
    </React.Suspense>
  );
}
