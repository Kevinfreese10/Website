'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
    getFirestore, doc, getDoc, collection, getDocs, 
    query, where, writeBatch, onSnapshot, getCountFromServer, 
    getAggregateFromServer, sum 
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { User, AllocationRule, ClientCustomer, Supplier } from '@/lib/types';
import { formatPrice } from './types';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Pencil, CheckCircle2, AlertTriangle, RotateCcw, Settings } from 'lucide-react';
import { CreateGeneralAccountDialog } from './dialogs';
import { BankAccountManageDialogs } from './components';
import { NewTransactionsTab } from './NewTransactionsTab';
import { SmartMatchQueueTab } from './SmartMatchQueueTab';
import { ReviewedTab } from './ReviewedTab';

const db = getFirestore(firebaseApp);

export function BankTransactionsUI() {
    const params = useParams();
    const accountIdFromUrl = useSearchParams().get('accountId');
    const [client, setClient] = useState<User | null>(null);
    const [accountId, setAccountId] = useState<string | null>(accountIdFromUrl);
    const [unallocatedCount, setUnallocatedCount] = useState<number | null>(null);
    const [globalRules, setGlobalRules] = useState<AllocationRule[]>([]);
    const [activeTab, setActiveTab] = useState('new-transactions');
    const [customers, setCustomers] = useState<ClientCustomer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
    const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
    const [isClearAccountAlertOpen, setIsClearAccountAlertOpen] = useState(false);
    const [calculatedBalance, setCalculatedBalance] = useState<number>(0);
    const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
    const [isUpdateBankBalanceOpen, setIsUpdateBankBalanceOpen] = useState(false);
    const { toast } = useToast();

    const fetchClientData = useCallback(async () => {
        if (!params.clientId) return;
        const clientSnap = await getDoc(doc(db, 'aiAccountantClients', params.clientId as string));
        if (clientSnap.exists()) {
            const data = clientSnap.data() as User;
            if (data.chartOfAccounts) {
                data.chartOfAccounts = Array.from(new Map(data.chartOfAccounts.map(a => [a.accountNumber, a])).values());
            }
            setClient({ ...data, id: clientSnap.id, uid: clientSnap.id });
            const bankAccounts = data.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('8400-'));
            if (!accountId && bankAccounts?.[0]) setAccountId(bankAccounts[0].id);
        }
    }, [params.clientId, accountId]);

    const fetchGlobalRules = useCallback(async () => {
        const rulesSnap = await getDocs(collection(db, 'allocationRules'));
        setGlobalRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AllocationRule)));
    }, []);

    const fetchCustomers = useCallback(async () => {
        if (!params.clientId) return;
        const custSnap = await getDocs(collection(db, `aiAccountantClients/${params.clientId}/customers`));
        setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientCustomer)));
    }, [params.clientId]);

    const fetchSuppliers = useCallback(async () => {
        if (!params.clientId) return;
        const supSnap = await getDocs(collection(db, `aiAccountantClients/${params.clientId}/suppliers`));
        setSuppliers(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }, [params.clientId]);

    const fetchUnallocatedCount = useCallback(async () => {
        if (!params.clientId || !accountId) return;
        try {
            const transRef = collection(db, 'aiAccountantClients', params.clientId as string, 'transactions');
            const qUnallocated = query(transRef, where('bankAccountId', '==', accountId), where('status', 'in', ['new', 'ai_review', 'ai_processing']));
            const snap = await getCountFromServer(qUnallocated);
            setUnallocatedCount(snap.data().count);
        } catch (e) {
            console.error('Failed to fetch unallocated count:', e);
        }
    }, [params.clientId, accountId]);

    useEffect(() => { 
        fetchClientData(); fetchGlobalRules(); fetchCustomers(); fetchSuppliers(); 
    }, [fetchClientData, fetchGlobalRules, fetchCustomers, fetchSuppliers]);

    useEffect(() => {
        if (!params.clientId) return;
        return onSnapshot(doc(db, 'aiAccountantClients', params.clientId as string), (snap) => {
            if (snap.exists()) {
                const data = snap.data() as User;
                if (data.chartOfAccounts) {
                    data.chartOfAccounts = Array.from(new Map(data.chartOfAccounts.map(a => [a.accountNumber, a])).values());
                }
                setClient(prev => prev ? { ...prev, ...data, id: snap.id, uid: snap.id } : { ...data, id: snap.id, uid: snap.id });
            }
        });
    }, [params.clientId]);
    
    useEffect(() => {
        fetchUnallocatedCount();
    }, [fetchUnallocatedCount]);

    const fetchCalculatedBalance = useCallback(async () => {
        if (!params.clientId || !accountId) {
            setCalculatedBalance(0);
            return;
        }
        try {
            setIsBalanceLoading(true);
            const transRef = collection(db, 'aiAccountantClients', params.clientId as string, 'transactions');
            const q = query(transRef, where('bankAccountId', '==', accountId));
            const snapshot = await getAggregateFromServer(q, {
                totalAmount: sum('amount')
            });
            const raw = snapshot.data().totalAmount;
            const rounded = typeof raw === 'number' && !isNaN(raw) ? Math.round(raw * 100) / 100 : 0;
            setCalculatedBalance(rounded);
        } catch (err) {
            console.error("Error computing aggregate balance:", err);
        } finally {
            setIsBalanceLoading(false);
        }
    }, [params.clientId, accountId]);

    useEffect(() => {
        fetchCalculatedBalance();
    }, [fetchCalculatedBalance]);

    const handleClearAccount = async () => {
        if (!params.clientId || !accountId) return;
        toast({ title: "Cleaning account...", description: "Please wait." });
        try {
            const transRef = collection(db, 'aiAccountantClients', params.clientId as string, 'transactions');
            const q = query(transRef, where('bankAccountId', '==', accountId));
            const snap = await getDocs(q);
            if (snap.empty) {
                toast({ title: "Account is already empty" });
                setIsClearAccountAlertOpen(false);
                return;
            }
            for (let i = 0; i < snap.docs.length; i += 500) {
                const batch = writeBatch(db);
                snap.docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
            toast({ title: "Account Cleared", description: `Successfully deleted ${snap.size} transactions.` });
            setIsClearAccountAlertOpen(false);
            fetchCalculatedBalance();
            fetchUnallocatedCount();
        } catch (e: any) {
            console.error("Clear account error:", e);
            toast({ title: "Clear Failed", description: e.message || "An unexpected error occurred while deleting transactions.", variant: "destructive" });
        }
    };

    if (!client) return <div className="text-center mt-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    
    const bankAccounts = client.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('8400-')) || [];
    const selectedAccount = bankAccounts.find(a => a.id === accountId);
    
    return (
        <div className="space-y-4">
            <CreateGeneralAccountDialog client={client} onAccountCreated={fetchClientData} open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen} />
            <BankAccountManageDialogs
                client={client} accountId={accountId} selectedAccount={selectedAccount} fetchClientData={fetchClientData}
                isEditAccountOpen={isEditAccountOpen} setIsEditAccountOpen={setIsEditAccountOpen}
                isUpdateBankBalanceOpen={isUpdateBankBalanceOpen} setIsUpdateBankBalanceOpen={setIsUpdateBankBalanceOpen}
                isClearAccountAlertOpen={isClearAccountAlertOpen} setIsClearAccountAlertOpen={setIsClearAccountAlertOpen}
                onClearAccount={handleClearAccount}
            />

            <div className="md:flex items-start justify-between">
                <div className="flex flex-col gap-2">
                    <AccountSelector
                        client={client} showAccounts={true} showCustomers={false} showSuppliers={false}
                        value={accountId || ''} onChange={(s) => setAccountId(s.value === "all" ? "" : s.value)}
                        placeholder="Select a bank account" className="w-[280px]"
                        filterAccounts={(acc) => acc.accountNumber.startsWith('8400-')}
                    />
                    <div className="flex flex-wrap items-center gap-4 text-sm mt-1">
                        <div>
                            <span className="text-muted-foreground">Calculated Balance: </span>
                            {isBalanceLoading ? (
                                <span className="text-muted-foreground font-mono animate-pulse">Calculating...</span>
                            ) : (
                                <span className="font-bold text-foreground font-mono">{formatPrice(calculatedBalance)}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Actual Bank Balance: </span>
                            <span className="font-semibold font-mono text-muted-foreground">
                                {selectedAccount?.bankBalance !== undefined ? formatPrice(selectedAccount.bankBalance) : '-'}
                            </span>
                            {selectedAccount && (
                                <Button
                                    variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-primary hover:bg-primary/10 ml-0.5"
                                    onClick={() => setIsUpdateBankBalanceOpen(true)} title="Edit Actual Bank Statement Balance"
                                >
                                    <Pencil className="h-3 w-3 mr-1" /> Edit
                                </Button>
                            )}
                        </div>
                        {selectedAccount?.bankBalance !== undefined ? (
                            Math.abs(calculatedBalance - selectedAccount.bankBalance) < 0.01 ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold gap-1 py-0.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Reconciled
                                </Badge>
                            ) : (
                                <Badge className="bg-rose-50 text-rose-700 border-rose-300 font-semibold gap-1 py-0.5" title={`Difference: ${formatPrice(calculatedBalance - selectedAccount.bankBalance)}`}>
                                    <AlertTriangle className="h-3.5 w-3.5" /> Diff: {formatPrice(calculatedBalance - selectedAccount.bankBalance)}
                                </Badge>
                            )
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">No Statement Balance</Badge>
                        )}
                        <div>
                            <span className="text-muted-foreground">Unallocated: </span>
                            <span className="font-semibold">{unallocatedCount !== null ? unallocatedCount : '...'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" onClick={() => { fetchClientData(); fetchUnallocatedCount(); fetchCalculatedBalance(); }}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-none font-bold">
                                <Settings className="mr-2 h-4 w-4" /> Manage
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsCreateAccountOpen(true)}>Create New Bank Account</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsEditAccountOpen(true)}>Edit Selected Account</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsClearAccountAlertOpen(true)} className="text-destructive">Clear Bank Account</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="border rounded-lg mt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 rounded-t-lg rounded-b-none h-auto">
                        <TabsTrigger value="new-transactions">New Transactions</TabsTrigger>
                        <TabsTrigger value="ai-workflow">Smart Match Queue</TabsTrigger>
                        <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new-transactions" className="p-0">
                        <NewTransactionsTab client={client} bankAccountId={accountId || ''} currentBalance={calculatedBalance} globalRules={globalRules} setActiveTab={setActiveTab} customers={customers} suppliers={suppliers}
                            onAccountCreated={() => { fetchClientData(); fetchUnallocatedCount(); fetchCalculatedBalance(); }} 
                            onAllocationComplete={() => { fetchUnallocatedCount(); fetchCalculatedBalance(); }}
                            onRefreshBalance={fetchCalculatedBalance}
                        />
                    </TabsContent>
                    <TabsContent value="ai-workflow" className="p-0">
                        <SmartMatchQueueTab client={client} bankAccountId={accountId || ''} globalRules={globalRules} customers={customers} suppliers={suppliers}
                            onAccountCreated={() => { fetchClientData(); fetchCalculatedBalance(); fetchUnallocatedCount(); }} 
                            onAllocationComplete={() => { fetchCalculatedBalance(); fetchUnallocatedCount(); }}
                        />
                    </TabsContent>
                    <TabsContent value="reviewed" className="p-0">
                        <ReviewedTab client={client} bankAccountId={accountId || ''} customers={customers} suppliers={suppliers} globalRules={globalRules}
                            onAccountCreated={() => { fetchClientData(); fetchCalculatedBalance(); }} 
                            onUndoComplete={() => { fetchCalculatedBalance(); fetchUnallocatedCount(); }}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
