'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { getFirestore, doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User, ChartOfAccount, ImportedTransaction, AllocatedTransaction } from '@/lib/types';
import { useParams } from 'next/navigation';
import { Loader2, ArrowRight, Banknote, AlertCircle, PlusCircle, Sparkles, FileText, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AIStatementImportDialog from '@/components/admin/AIStatementImportDialog';
import AIBulkStatementImportDialog from '@/components/admin/AIBulkStatementImportDialog';

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
};

const createAccountSchema = z.object({
  name: z.string().min(3, "Bank account name is required."),
});

function CreateAccountDialog({ client, onAccountCreated }: { client: User, onAccountCreated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const form = useForm<z.infer<typeof createAccountSchema>>({
        resolver: zodResolver(createAccountSchema),
        defaultValues: { name: '' },
    });

    const handleCreateAccount = async (values: z.infer<typeof createAccountSchema>) => {
        setIsSaving(true);
        try {
            const existingBankAccounts = client.chartOfAccounts?.filter(
                acc => acc.accountNumber.startsWith('8400-')
            ) || [];

            const existingNumbers = existingBankAccounts.map(acc => {
                const parts = acc.accountNumber.split('-');
                return parts.length > 1 ? parseInt(parts[1], 10) : 0;
            });

            const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
            const newAccountNumber = `8400-${String(nextNumber).padStart(3, '0')}`;

            const newAccount: ChartOfAccount = {
                id: newAccountNumber,
                accountNumber: newAccountNumber,
                description: values.name,
                section: 'Balance Sheet',
            };

            const clientRef = doc(db, 'aiAccountantClients', client.id);
            await updateDoc(clientRef, {
                chartOfAccounts: arrayUnion(newAccount)
            });

            toast({ title: 'Bank Account Created', description: `Account ${newAccount.description} (${newAccount.accountNumber}) has been added.` });
            onAccountCreated();
            form.reset();
            setIsOpen(false);
        } catch (error) {
            console.error("Error creating bank account:", error);
            toast({ title: 'Error', description: 'Could not create the bank account.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Create New Account</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Bank Account</DialogTitle>
                    <DialogDescription>
                        This will add a new cashbook account to this client's chart of accounts.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateAccount)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Bank Account Name</FormLabel><FormControl><Input placeholder="e.g., FNB Cheque Account" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


const updateBankBalanceSchema = z.object({
  bankBalance: z.number({ required_error: "Bank balance is required.", invalid_type_error: "Must be a number." }),
});

function UpdateBankBalanceDialog({ client, account, onUpdated }: { client: User, account: ChartOfAccount, onUpdated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const form = useForm<z.infer<typeof updateBankBalanceSchema>>({
        resolver: zodResolver(updateBankBalanceSchema),
        defaultValues: { bankBalance: account.bankBalance || 0 },
    });

    const handleUpdate = async (values: z.infer<typeof updateBankBalanceSchema>) => {
        setIsSaving(true);
        try {
            const updatedAccounts = client.chartOfAccounts?.map(acc => 
                acc.id === account.id ? { ...acc, bankBalance: values.bankBalance } : acc
            ) || [];

            const clientRef = doc(db, 'aiAccountantClients', client.id);
            await updateDoc(clientRef, {
                chartOfAccounts: updatedAccounts
            });

            toast({ title: 'Success', description: 'Bank balance updated.' });
            onUpdated();
            setIsOpen(false);
        } catch (error) {
            console.error("Error updating bank balance:", error);
            toast({ title: 'Error', description: 'Could not update bank balance.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs ml-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Bank Balance</DialogTitle>
                    <DialogDescription>
                        Set the actual bank balance for {account.description} to reconcile.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                        <FormField control={form.control} name="bankBalance" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>Actual Bank Balance</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        {...field} 
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function AIAccountantClientDashboardPage() {
    const [client, setClient] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<(ImportedTransaction | AllocatedTransaction)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | undefined>();
    const params = useParams();
    const clientId = params.clientId as string;

    const fetchDashboardData = useCallback(async () => {
        if (!clientId) return;
        setIsLoading(true);
        try {
            // Fetch client data
            const clientRef = doc(db, 'aiAccountantClients', clientId);
            const clientSnap = await getDoc(clientRef);
            
            if (clientSnap.exists()) {
                setClient({ id: clientSnap.id, ...clientSnap.data() } as User);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [clientId]);
    
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (!clientId) return;
        const q = query(collection(db, "aiAccountantClients", clientId, "transactions"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const transactionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (ImportedTransaction | AllocatedTransaction)));
            setTransactions(transactionsData);
        });
        return () => unsubscribe();
    }, [clientId]);

    const bankAccounts = useMemo(() => {
        if (!client?.chartOfAccounts) return [];
        return client.chartOfAccounts.filter(acc => acc.accountNumber.startsWith('8400-'))
            .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
    }, [client]);

    const accountSummaries = useMemo(() => {
        if (!client) return [];
        
        return bankAccounts.map(account => {
            const accountTransactions = transactions.filter(tx => tx.bankAccountId === account.id);
            const unallocatedTransactions = accountTransactions.filter(tx => tx.status === 'new');
            const balance = accountTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            
            const txMaxDate = accountTransactions.length > 0
                ? new Date(Math.max(...accountTransactions.map(tx => new Date(tx.date).getTime())))
                : null;
            const coaDate = account.lastImportDate ? new Date(account.lastImportDate) : null;
            const latestDate = (txMaxDate && coaDate)
                ? (coaDate.getTime() > txMaxDate.getTime() ? coaDate : txMaxDate)
                : (coaDate || txMaxDate);
            const lastImportDate = latestDate ? latestDate.toISOString() : undefined;

            return {
                ...account,
                balance,
                unallocatedCount: unallocatedTransactions.length,
                lastImportDate
            };
        });
    }, [bankAccounts, transactions, client]);


    if (isLoading) {
        return (
            <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
        );
    }

    if (!client) {
        return <p>Client not found.</p>;
    }

    return (
        <div className="space-y-6">
            {client && (
                <AIStatementImportDialog 
                    open={isImportDialogOpen}
                    onOpenChange={setIsImportDialogOpen}
                    client={client}
                    bankAccountId={selectedBankAccountId}
                    onImportComplete={() => {}}
                />
            )}
            {client && (
                <AIBulkStatementImportDialog
                    open={isBulkImportDialogOpen}
                    onOpenChange={setIsBulkImportDialogOpen}
                    client={client}
                    onImportComplete={fetchDashboardData}
                />
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Bank Accounts Overview</CardTitle>
                        <CardDescription>
                            A summary of all linked bank accounts for {client.companyName || client.name}.
                        </CardDescription>
                    </div>
                    {client && (
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => setIsBulkImportDialogOpen(true)}
                            >
                                <Sparkles className="mr-2 h-4 w-4" /> Bulk Upload Statements (AI)
                            </Button>
                            <CreateAccountDialog client={client} onAccountCreated={fetchDashboardData} />
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {accountSummaries.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Banknote className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No Bank Accounts Found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Use the 'Create New Account' button to add a bank account.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bank Account</TableHead>
                                    <TableHead className="text-right">Current Balance</TableHead>
                                    <TableHead className="text-right">Bank Balance</TableHead>
                                    <TableHead className="text-center">Reconciled</TableHead>
                                    <TableHead className="text-center">Unallocated</TableHead>
                                    <TableHead>Last Import</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accountSummaries.map(acc => (
                                    <TableRow key={acc.id}>
                                        <TableCell>
                                            <p className="font-semibold">{acc.description}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{acc.accountNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{formatPrice(acc.balance)}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            <div className="flex items-center justify-end">
                                                {acc.bankBalance !== undefined ? formatPrice(acc.bankBalance) : '-'}
                                                <UpdateBankBalanceDialog client={client} account={acc as ChartOfAccount} onUpdated={fetchDashboardData} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {acc.bankBalance !== undefined && Math.abs(acc.balance - acc.bankBalance) < 0.01 ? (
                                                <div className="flex items-center justify-center text-green-600 font-semibold gap-1">
                                                    <CheckCircle2 className="h-4 w-4" /> Yes
                                                </div>
                                            ) : acc.bankBalance !== undefined ? (
                                                <div className="flex items-center justify-center text-red-500 font-semibold gap-1 text-xs" title={`Diff: ${formatPrice(acc.balance - acc.bankBalance)}`}>
                                                    <XCircle className="h-4 w-4" /> {formatPrice(acc.balance - acc.bankBalance)}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">No bank bal</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                 {acc.unallocatedCount > 0 && <AlertCircle className="h-4 w-4 text-destructive" />}
                                                {acc.unallocatedCount}
                                            </div>
                                        </TableCell>
                                        <TableCell>{acc.lastImportDate ? format(new Date(acc.lastImportDate), 'dd MMMM yyyy') : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="font-bold border-primary/20 text-primary hover:bg-primary/5"
                                                    onClick={() => {
                                                        setSelectedBankAccountId(acc.id);
                                                        setIsImportDialogOpen(true);
                                                    }}
                                                >
                                                    <Sparkles className="mr-2 h-4 w-4" /> Import Statement (AI)
                                                </Button>
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/admin/ai-accountant/${clientId}/bank/transactions?accountId=${acc.id}`}>
                                                        View Account <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
