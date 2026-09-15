'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Search, Building, Archive, PlusCircle, MoreHorizontal, Edit, Trash2, Copy, Sliders, BookOpen, Calculator, Settings, ArrowRightLeft, Percent, Plus, UserPlus, Pin, PinOff } from 'lucide-react';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, Timestamp, limit, getDoc, getDocs, where, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User, AllocationRule } from '@/lib/types';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ClientForm from '@/components/admin/ClientForm';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { chartOfAccounts as initialChartOfAccounts } from '@/lib/chart-of-accounts';
import { allocationRules as initialAllocationRules } from '@/lib/allocation-rules';
import { format, formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allVatTypes } from '@/lib/vat-types';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';


const db = getFirestore(firebaseApp);

/**
 * A small component to fetch and display the last transaction date for a client.
 */
function LastImportDate({ clientId }: { clientId: string }) {
    const [lastDate, setLastDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Prevent future dates (like typos parsing to 2027) from showing as the "Last Import"
        const nowIso = new Date().toISOString();
        const q = query(
            collection(db, 'aiAccountantClients', clientId, 'transactions'),
            where('date', '<=', nowIso),
            orderBy('date', 'desc'),
            limit(1)
        );
        const unsubscribe = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const data = snap.docs[0].data();
                const d = data.date?.toDate ? data.date.toDate() : new Date(data.date);
                if (!isNaN(d.getTime())) {
                    setLastDate(d);
                }
            } else {
                setLastDate(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Failed to fetch last import date:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [clientId]);

    if (loading) return <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse"><Loader2 className="h-3 w-3 animate-spin"/> Loading...</div>;
    if (!lastDate) return <span className="text-[10px] text-muted-foreground italic uppercase tracking-tighter opacity-50">No transactions</span>;

    return (
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">{format(lastDate, 'dd MMM yyyy')}</span>
            <span className="text-[9px] text-muted-foreground font-medium uppercase">{formatDistanceToNow(lastDate, { addSuffix: true })}</span>
        </div>
    );
}

export default function AIAccountantClientsPage() {
    const { user: currentUser } = useAuth();
    const [clients, setClients] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<User | null>(null);
    const { toast } = useToast();

    // Access Management states
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [clientToShare, setClientToShare] = useState<User | null>(null);

    // Global Rules & Chart of Accounts states
    const [globalRules, setGlobalRules] = useState<AllocationRule[]>([]);
    const [isLoadingRules, setIsLoadingRules] = useState(true);
    const [ruleSearchTerm, setRuleSearchTerm] = useState('');
    const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<AllocationRule | null>(null);

    // Rule Form states
    const [ruleDescription, setRuleDescription] = useState('');
    const [ruleKeywords, setRuleKeywords] = useState('');
    const [ruleAccountId, setRuleAccountId] = useState('');
    const [ruleVatType, setRuleVatType] = useState('no_vat');
    const [isSavingRule, setIsSavingRule] = useState(false);

    // Rule Delete state
    const [ruleToDelete, setRuleToDelete] = useState<AllocationRule | null>(null);
    const [isRuleDeleteDialogOpen, setIsRuleDeleteDialogOpen] = useState(false);

    // Standard Accounts states
    const [accountSearchTerm, setAccountSearchTerm] = useState('');
    const [accountSectionFilter, setAccountSectionFilter] = useState<'all' | 'Income Statement' | 'Balance Sheet'>('all');

    // Copy Client states
    const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
    const [clientToCopy, setClientToCopy] = useState<User | null>(null);
    const [copyCompanyName, setCopyCompanyName] = useState('');
    const [copyClientName, setCopyClientName] = useState('');
    const [copyClientEmail, setCopyClientEmail] = useState('');
    const [isCopying, setIsCopying] = useState(false);
    const [copyProgress, setCopyProgress] = useState('');

    const handleStartCopy = (client: User) => {
        setClientToCopy(client);
        setCopyCompanyName(`Copy of ${client.companyName || client.name}`);
        setCopyClientName(client.name || '');
        setCopyClientEmail(client.email ? `copy_${client.email}` : '');
        setCopyProgress('');
        setIsCopyDialogOpen(true);
    };

    const handleCopyConfirm = async () => {
        if (!clientToCopy) return;
        setIsCopying(true);
        setCopyProgress('Connecting to database...');
        try {
            const newDocRef = doc(collection(db, 'aiAccountantClients'));
            
            // 1. Fetch parent document
            setCopyProgress('Reading source company profile...');
            const sourceDoc = await getDoc(doc(db, 'aiAccountantClients', clientToCopy.id));
            if (!sourceDoc.exists()) {
                throw new Error("Source client profile not found.");
            }
            
            const sourceData = sourceDoc.data();
            const newClientData = {
                ...sourceData,
                id: newDocRef.id,
                uid: newDocRef.id,
                name: copyClientName,
                companyName: copyCompanyName,
                email: copyClientEmail,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // 2. Save new parent doc
            setCopyProgress('Creating new company profile...');
            await setDoc(newDocRef, newClientData);

            const chunkArray = <T,>(arr: T[], size: number): T[][] => {
                const chunks: T[][] = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            };

            // 3. Clone Customers sub-collection
            setCopyProgress('Checking custom customer records...');
            const customersSnap = await getDocs(collection(db, 'aiAccountantClients', clientToCopy.id, 'customers'));
            if (!customersSnap.empty) {
                setCopyProgress(`Cloning ${customersSnap.size} customer profiles...`);
                const customerChunks = chunkArray(customersSnap.docs, 100);
                for (let i = 0; i < customerChunks.length; i++) {
                    setCopyProgress(`Cloning customers (batch ${i + 1}/${customerChunks.length})...`);
                    await Promise.all(customerChunks[i].map(customerDoc => 
                        setDoc(doc(db, 'aiAccountantClients', newDocRef.id, 'customers', customerDoc.id), customerDoc.data())
                    ));
                }
            }

            // 4. Clone Suppliers sub-collection
            setCopyProgress('Checking custom supplier records...');
            const suppliersSnap = await getDocs(collection(db, 'aiAccountantClients', clientToCopy.id, 'suppliers'));
            if (!suppliersSnap.empty) {
                setCopyProgress(`Cloning ${suppliersSnap.size} supplier profiles...`);
                const supplierChunks = chunkArray(suppliersSnap.docs, 100);
                for (let i = 0; i < supplierChunks.length; i++) {
                    setCopyProgress(`Cloning suppliers (batch ${i + 1}/${supplierChunks.length})...`);
                    await Promise.all(supplierChunks[i].map(supplierDoc => 
                        setDoc(doc(db, 'aiAccountantClients', newDocRef.id, 'suppliers', supplierDoc.id), supplierDoc.data())
                    ));
                }
            }

            // 5. Clone Transactions sub-collection
            setCopyProgress('Checking transaction histories...');
            const transactionsSnap = await getDocs(collection(db, 'aiAccountantClients', clientToCopy.id, 'transactions'));
            if (!transactionsSnap.empty) {
                setCopyProgress(`Cloning ${transactionsSnap.size} journal & ledger entries...`);
                const txnChunks = chunkArray(transactionsSnap.docs, 100);
                for (let i = 0; i < txnChunks.length; i++) {
                    setCopyProgress(`Cloning transactions (batch ${i + 1}/${txnChunks.length})...`);
                    await Promise.all(txnChunks[i].map(transactionDoc => 
                        setDoc(doc(db, 'aiAccountantClients', newDocRef.id, 'transactions', transactionDoc.id), transactionDoc.data())
                    ));
                }
            }

            toast({
                title: 'Client Cloned!',
                description: `Successfully duplicated all profiles, settings, and transactions into ${copyCompanyName}.`
            });
            
            setIsCopyDialogOpen(false);
            setClientToCopy(null);
        } catch (e: any) {
            console.error("Cloning failed:", e);
            toast({
                title: 'Cloning Failed',
                description: e.message || "An unexpected error occurred during company duplication.",
                variant: 'destructive'
            });
        } finally {
            setIsCopying(false);
            setCopyProgress('');
        }
    };

    useEffect(() => {
        if (!currentUser) return;

        let q = query(collection(db, 'aiAccountantClients'), orderBy('name'));
        
        if (currentUser.role === 'staff') {
            q = query(collection(db, 'aiAccountantClients'), where('sharedWith', 'array-contains', currentUser.uid), orderBy('name'));
        }

        const unsubscribe = onSnapshot(q, (snap) => {
            const fetchedClients = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
            setClients(fetchedClients);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching AI Accountant clients:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        const usersRef = collection(db, 'users');
        getDocs(usersRef).then(snap => {
            const fetched = snap.docs.map(d => ({ ...d.data(), id: d.id, uid: d.id } as User));
            setAllUsers(fetched);
        }).catch(err => console.error("Error fetching users:", err));
    }, []);

    const handleToggleShare = async (client: User, userToShareWith: User) => {
        try {
            const clientRef = doc(db, 'aiAccountantClients', client.id);
            const isShared = client.sharedWith?.includes(userToShareWith.uid);
            
            if (isShared) {
                await updateDoc(clientRef, { sharedWith: arrayRemove(userToShareWith.uid) });
                toast({ title: 'Access Removed', description: `${userToShareWith.name} can no longer access ${client.companyName || client.name}.` });
            } else {
                await updateDoc(clientRef, { sharedWith: arrayUnion(userToShareWith.uid) });
                toast({ title: 'Access Granted', description: `${userToShareWith.name} can now access ${client.companyName || client.name}.` });
            }
        } catch (error) {
            console.error("Error updating access:", error);
            toast({ title: 'Update Failed', description: 'Could not update access permissions.', variant: 'destructive' });
        }
    };

    useEffect(() => {
        const rulesRef = collection(db, 'allocationRules');
        const q = query(rulesRef, orderBy('description'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const rules = snap.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as AllocationRule));
            setGlobalRules(rules);
            setIsLoadingRules(false);
        }, (error) => {
            console.error("Error fetching global rules:", error);
            setIsLoadingRules(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenRuleForm = (rule: AllocationRule | null = null) => {
        setSelectedRule(rule);
        if (rule) {
            setRuleDescription(rule.description || '');
            setRuleKeywords(rule.keywords ? rule.keywords.join(', ') : '');
            setRuleAccountId(rule.accountId || '');
            setRuleVatType(rule.vatType || 'no_vat');
        } else {
            setRuleDescription('');
            setRuleKeywords('');
            setRuleAccountId(initialChartOfAccounts[0]?.id || '');
            setRuleVatType('no_vat');
        }
        setIsRuleFormOpen(true);
    };

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleDescription.trim()) {
            toast({ title: 'Validation Error', description: 'Rule description is required.', variant: 'destructive' });
            return;
        }
        if (!ruleKeywords.trim()) {
            toast({ title: 'Validation Error', description: 'At least one keyword is required.', variant: 'destructive' });
            return;
        }
        if (!ruleAccountId) {
            toast({ title: 'Validation Error', description: 'Mapped General Ledger account is required.', variant: 'destructive' });
            return;
        }

        setIsSavingRule(true);
        try {
            const keywordsArray = ruleKeywords
                .split(',')
                .map(k => k.trim().toUpperCase())
                .filter(Boolean);

            const ruleData = {
                description: ruleDescription.trim(),
                keywords: keywordsArray,
                accountId: ruleAccountId,
                vatType: ruleVatType,
            };

            if (selectedRule?.id) {
                await setDoc(doc(db, 'allocationRules', selectedRule.id), ruleData, { merge: true });
                toast({ title: 'Rule Updated', description: 'The global allocation rule has been updated successfully.' });
            } else {
                const newDocRef = doc(collection(db, 'allocationRules'));
                await setDoc(newDocRef, ruleData);
                toast({ title: 'Rule Created', description: 'The new global allocation rule is now active.' });
            }
            setIsRuleFormOpen(false);
            setSelectedRule(null);
        } catch (error) {
            console.error("Error saving rule:", error);
            toast({ title: 'Error', description: 'Could not save the allocation rule.', variant: 'destructive' });
        } finally {
            setIsSavingRule(false);
        }
    };

    const handleConfirmDeleteRule = async () => {
        if (!ruleToDelete) return;
        try {
            await deleteDoc(doc(db, 'allocationRules', ruleToDelete.id));
            toast({ title: 'Rule Deleted', description: 'The global allocation rule was removed.' });
            setIsRuleDeleteDialogOpen(false);
            setRuleToDelete(null);
        } catch (error) {
            console.error("Error deleting rule:", error);
            toast({ title: 'Error', description: 'Could not delete the allocation rule.', variant: 'destructive' });
        }
    };

    const getAccountLabel = (accountId: string) => {
        const acc = initialChartOfAccounts.find(a => a.id === accountId);
        return acc ? `${acc.accountNumber} - ${acc.description}` : accountId;
    };

    const getVatLabel = (vatName: string) => {
        const vt = allVatTypes.find(v => v.name === vatName);
        return vt ? vt.label : vatName;
    };

    const getAccountType = (accountNumber: string) => {
        if (accountNumber.startsWith('1000-')) return 'Income';
        if (accountNumber.startsWith('2000-')) return 'Cost of Sales';
        if (accountNumber.startsWith('3000-')) return 'Expense';
        if (accountNumber.startsWith('4000-')) return 'Exceptional';
        if (accountNumber.startsWith('5000-')) return 'Fixed Asset';
        if (accountNumber.startsWith('7000-')) return 'Current Liability';
        if (accountNumber.startsWith('7500-')) return 'Long-Term Liability';
        if (accountNumber.startsWith('8000-')) return 'Current Asset';
        if (accountNumber.startsWith('9000-')) return 'Equity';
        if (accountNumber.startsWith('9500-')) return 'Suspense';
        return 'Other';
    };

    const getAccountTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'Income': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Cost of Sales': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Expense': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'Fixed Asset': return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'Current Asset': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Current Liability': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Long-Term Liability': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Equity': return 'bg-slate-50 text-slate-700 border-slate-200';
            case 'Suspense': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const filteredGlobalRules = globalRules.filter(rule => 
        rule.description?.toLowerCase().includes(ruleSearchTerm.toLowerCase()) || 
        rule.keywords?.some(k => k.toLowerCase().includes(ruleSearchTerm.toLowerCase())) ||
        getAccountLabel(rule.accountId).toLowerCase().includes(ruleSearchTerm.toLowerCase())
    );

    const filteredAccounts = initialChartOfAccounts.filter(acc => {
        const matchesSearch = acc.accountNumber.toLowerCase().includes(accountSearchTerm.toLowerCase()) || 
                             acc.description.toLowerCase().includes(accountSearchTerm.toLowerCase());
        const matchesSection = accountSectionFilter === 'all' || acc.section === accountSectionFilter;
        return matchesSearch && matchesSection;
    });


    const handleFormSubmit = async (data: any) => {
        try {
            if (selectedClient?.id) {
                // Update
                const clientRef = doc(db, "aiAccountantClients", selectedClient.id);
                await setDoc(clientRef, {
                    ...data,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
                toast({ title: 'Client Updated', description: 'Changes have been saved successfully.' });
            } else {
                // Create
                const newDocRef = doc(collection(db, 'aiAccountantClients'));
                const newClientData = {
                    ...data,
                    id: newDocRef.id,
                    uid: newDocRef.id,
                    role: 'client',
                    source: 'AI Accountant' as const,
                    clientSource: 'admin',
                    hasNumeraProfile: true,
                    chartOfAccounts: initialChartOfAccounts,
                    allocationRules: initialAllocationRules,
                    createdAt: serverTimestamp(),
                };
                await setDoc(newDocRef, newClientData);
                toast({ title: 'Client Created', description: 'New AI Accountant profile is ready.' });
            }
            setIsFormOpen(false);
            setSelectedClient(null);
        } catch (error) {
            console.error("Error saving client:", error);
            toast({ title: 'Error', description: 'Could not save client profile.', variant: 'destructive' });
        }
    };

    const handleDelete = async (clientId: string) => {
        try {
            await deleteDoc(doc(db, "aiAccountantClients", clientId));
            toast({ title: 'Client Deleted', description: 'The profile has been removed permanently.' });
        } catch (error) {
            console.error("Error deleting client:", error);
            toast({ title: 'Error', description: 'Could not delete client profile.', variant: 'destructive' });
        }
    };

    const handleTogglePin = async (client: User, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        try {
            const clientRef = doc(db, 'aiAccountantClients', client.id);
            const nextPinned = !client.isPinned;
            await updateDoc(clientRef, {
                isPinned: nextPinned,
                pinnedAt: nextPinned ? serverTimestamp() : null,
            });
            toast({
                title: nextPinned ? '📌 Company Pinned' : 'Company Unpinned',
                description: `${client.companyName || client.name} has been ${nextPinned ? 'pinned to the top for easy access' : 'unpinned'}.`,
            });
        } catch (error) {
            console.error("Error toggling pin:", error);
            toast({ title: 'Update Failed', description: 'Could not update pin status.', variant: 'destructive' });
        }
    };

    const filteredClients = clients.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedClients = [...filteredClients].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const nameA = (a.companyName || a.name || '').toLowerCase();
        const nameB = (b.companyName || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });

    const activeClients = sortedClients.filter(c => c.status !== 'Archived');
    const archivedClients = sortedClients.filter(c => c.status === 'Archived');
    const pinnedClients = activeClients.filter(c => c.isPinned);

    const renderClientTable = (clientList: User[], emptyMessage: string) => {
        if (clientList.length === 0) {
            return (
                <div className="text-center py-20 text-muted-foreground font-medium">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>{emptyMessage}</p>
                </div>
            );
        }

        return (
            <Table>
                <TableHeader className="bg-muted/10">
                    <TableRow>
                        <TableHead className="w-10 text-center"></TableHead>
                        <TableHead className="font-bold">Client / Company</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clientList.map(client => (
                        <TableRow 
                            key={client.id} 
                            className={cn(
                                "transition-colors",
                                client.isPinned 
                                    ? "bg-blue-50/30 hover:bg-blue-50/60 border-l-4 border-l-blue-600" 
                                    : "hover:bg-muted/5"
                            )}
                        >
                            <TableCell className="text-center py-2 px-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleTogglePin(client, e)}
                                    title={client.isPinned ? "Unpin company" : "Pin to top for easy access"}
                                    className={cn(
                                        "h-8 w-8 transition-colors",
                                        client.isPinned 
                                            ? "text-blue-600 hover:text-blue-800 hover:bg-blue-100/60" 
                                            : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                    )}
                                >
                                    <Pin className={cn("h-4 w-4", client.isPinned && "fill-blue-600")} />
                                    <span className="sr-only">{client.isPinned ? "Unpin" : "Pin"}</span>
                                </Button>
                            </TableCell>
                            <TableCell className="font-bold text-slate-900">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span>{client.companyName || client.name}</span>
                                        {client.isPinned && (
                                            <Badge variant="outline" className="bg-blue-100/80 text-blue-700 border-blue-300 text-[9px] font-bold px-1.5 py-0 flex items-center gap-1">
                                                <Pin className="h-2.5 w-2.5 fill-current" /> PINNED
                                            </Badge>
                                        )}
                                    </div>
                                    {client.companyName && client.name !== client.companyName && (
                                        <span className="text-[10px] text-muted-foreground font-medium">{client.name}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button variant="outline" size="sm" asChild className="font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                                        <Link href={`/admin/ai-accountant/${client.id}/dashboard`}>
                                            Open <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-label="More actions" variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Manage</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleTogglePin(client)}>
                                                {client.isPinned ? (
                                                    <>
                                                        <PinOff className="mr-2 h-4 w-4 text-slate-500" /> Unpin from Top
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pin className="mr-2 h-4 w-4 text-blue-600" /> Pin to Top
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => { setSelectedClient(client); setIsFormOpen(true); }}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStartCopy(client)}>
                                                <Copy className="mr-2 h-4 w-4" /> Copy Client
                                            </DropdownMenuItem>
                                            {currentUser?.role !== 'staff' && (
                                                <DropdownMenuItem onClick={() => { setClientToShare(client); setIsShareDialogOpen(true); }}>
                                                    <UserPlus className="mr-2 h-4 w-4" /> Manage Access
                                                </DropdownMenuItem>
                                            )}
                                            {currentUser?.role !== 'staff' && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Client
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete the AI Accountant profile for <strong>{client.companyName || client.name}</strong>. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(client.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                    Permanently Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <Tabs defaultValue="companies" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Accountant Admin</h1>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Administrative Hub</p>
                </div>
                <TabsList className="bg-slate-100 p-1 border">
                    <TabsTrigger value="companies" className="font-bold gap-2">
                        <Building className="h-4 w-4" /> Clients & Companies
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="font-bold gap-2">
                        <Settings className="h-4 w-4" /> Practice Settings
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* TAB CONTENT: COMPANIES */}
            <TabsContent value="companies" className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="relative flex-grow md:w-64 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search clients..." 
                            className="pl-8 h-10 shadow-sm bg-white" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setSelectedClient(null); }}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setSelectedClient(null)} className="h-10 font-bold gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Create Client
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>{selectedClient ? 'Edit Client Profile' : 'Setup New Client Profile'}</DialogTitle>
                                    <DialogDescription>
                                        Configure the base profile, tax settings, and banking details for this AI Accountant client.
                                    </DialogDescription>
                                </DialogHeader>
                                <ClientForm 
                                    client={selectedClient} 
                                    onSubmit={handleFormSubmit}
                                    onCancel={() => setIsFormOpen(false)}
                                    isAIClient={true}
                                />
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Copy className="h-5 w-5 text-primary" />
                                        Copy Client Profile
                                    </DialogTitle>
                                    <DialogDescription>
                                        Duplicate the general ledger settings, chart of accounts, allocation rules, custom customers, suppliers, and all transaction histories from <strong>{clientToCopy?.companyName || clientToCopy?.name}</strong> to a new company.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">New Company Name</label>
                                        <Input 
                                            placeholder="e.g. Acme Corp (Pty) Ltd"
                                            value={copyCompanyName}
                                            onChange={(e) => setCopyCompanyName(e.target.value)}
                                            disabled={isCopying}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Owner Name</label>
                                        <Input 
                                            placeholder="e.g. John Doe"
                                            value={copyClientName}
                                            onChange={(e) => setCopyClientName(e.target.value)}
                                            disabled={isCopying}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Owner Email</label>
                                        <Input 
                                            type="email"
                                            placeholder="e.g. john@acme.com"
                                            value={copyClientEmail}
                                            onChange={(e) => setCopyClientEmail(e.target.value)}
                                        />
                                    </div>
                                    {isCopying && copyProgress && (
                                        <div className="flex items-center gap-2 justify-center py-2.5 px-3 bg-primary/5 border border-primary/10 rounded-lg text-xs font-semibold text-primary animate-pulse">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                            <span>{copyProgress}</span>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="flex justify-end gap-2 border-t pt-4">
                                    <Button variant="ghost" onClick={() => setIsCopyDialogOpen(false)} disabled={isCopying}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCopyConfirm} disabled={isCopying || !copyCompanyName || !copyClientName || !copyClientEmail} className="gap-2">
                                        {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                                        {isCopying ? 'Processing...' : 'Confirm Copy'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {isLoading ? (
                    <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
                ) : (
                    <div className="space-y-6">
                        {pinnedClients.length > 0 && !searchTerm && (
                            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-xl p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                            <Pin className="h-4 w-4 fill-current" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">Pinned Companies</h3>
                                            <p className="text-[11px] text-blue-700/80">Quick access to your prioritized client accounts</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-white/90 text-blue-800 border-blue-300 font-bold text-[10px] px-2 py-0.5 shadow-2xs">
                                        {pinnedClients.length} {pinnedClients.length === 1 ? 'Company' : 'Companies'} Pinned
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {pinnedClients.map(client => (
                                        <div
                                            key={`pinned-chip-${client.id}`}
                                            className="group flex items-center gap-2 bg-white hover:bg-blue-50/80 border border-blue-200/80 hover:border-blue-400 rounded-lg py-1.5 px-3 shadow-2xs transition-all"
                                        >
                                            <Link
                                                href={`/admin/ai-accountant/${client.id}/dashboard`}
                                                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-700"
                                            >
                                                <Building className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                                                <span className="truncate max-w-[200px] sm:max-w-[280px]">{client.companyName || client.name}</span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={(e) => handleTogglePin(client, e)}
                                                title="Unpin company"
                                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-colors ml-1"
                                            >
                                                <PinOff className="h-3.5 w-3.5" />
                                                <span className="sr-only">Unpin</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Card className="border-2 shadow-sm">
                            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Building className="h-5 w-5 text-primary" />
                                            Active Companies
                                        </CardTitle>
                                        <CardDescription>Managed companies currently in processing.</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="font-bold">{activeClients.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {renderClientTable(activeClients, "No active AI Accountant clients found.")}
                            </CardContent>
                        </Card>

                        <Card className="border-2 shadow-sm opacity-90">
                            <CardHeader className="bg-muted/30 pb-4 border-b">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                                            <Archive className="h-5 w-5" />
                                            Archived Companies
                                        </CardTitle>
                                        <CardDescription>Historical client profiles moved to archive.</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="font-bold">{archivedClients.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {renderClientTable(archivedClients, "No archived clients found.")}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </TabsContent>

            {/* TAB CONTENT: PRACTICE SETTINGS */}
            <TabsContent value="settings" className="space-y-6">
                <Tabs defaultValue="rules" className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <TabsList className="bg-slate-50 border-0 p-0 h-auto gap-4">
                            <TabsTrigger value="rules" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 py-2 font-semibold bg-transparent data-[state=active]:bg-transparent shadow-none text-muted-foreground data-[state=active]:text-foreground gap-2">
                                <Sliders className="h-4 w-4" /> Practice Allocation Rules
                            </TabsTrigger>
                            <TabsTrigger value="accounts" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 py-2 font-semibold bg-transparent data-[state=active]:bg-transparent shadow-none text-muted-foreground data-[state=active]:text-foreground gap-2">
                                <BookOpen className="h-4 w-4" /> Standard Chart of Accounts
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* SUB-TAB: ALLOCATION RULES */}
                    <TabsContent value="rules" className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Practice Allocation Rules</h3>
                                <p className="text-xs text-muted-foreground">Manage global rules used to auto-allocate bank statements across all clients.</p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-grow md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search rules..." 
                                        className="pl-8 h-10 shadow-sm bg-white"
                                        value={ruleSearchTerm}
                                        onChange={(e) => setRuleSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button onClick={() => handleOpenRuleForm(null)} className="h-10 font-bold gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Rule
                                </Button>
                            </div>
                        </div>

                        <Card className="border-2 shadow-sm">
                            <CardContent className="p-0">
                                {isLoadingRules ? (
                                    <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
                                ) : filteredGlobalRules.length === 0 ? (
                                    <div className="text-center py-20 text-muted-foreground font-medium">
                                        <Sliders className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>No practice allocation rules found.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-muted/10">
                                            <TableRow>
                                                <TableHead className="font-bold">Rule Name / Description</TableHead>
                                                <TableHead className="font-bold">Keywords</TableHead>
                                                <TableHead className="font-bold">Allocate To</TableHead>
                                                <TableHead className="font-bold">VAT Treatment</TableHead>
                                                <TableHead className="text-right font-bold">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredGlobalRules.map((rule) => (
                                                <TableRow key={rule.id} className="hover:bg-muted/5 transition-colors">
                                                    <TableCell className="font-semibold text-slate-900">{rule.description}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1 max-w-md">
                                                            {rule.keywords?.map((keyword, index) => (
                                                                <Badge key={index} variant="outline" className="bg-slate-50 text-[10px] uppercase font-mono px-1.5 py-0.5 border-slate-200">
                                                                    {keyword}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-slate-600">
                                                        {getAccountLabel(rule.accountId)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="text-[10px] font-medium bg-primary/5 text-primary border border-primary/10">
                                                            {getVatLabel(rule.vatType)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button aria-label="Edit" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenRuleForm(rule)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button aria-label="Delete" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/5" onClick={() => { setRuleToDelete(rule); setIsRuleDeleteDialogOpen(true); }}>
                                                                 <Trash2 className="h-4 w-4" />
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
                    </TabsContent>

                    {/* SUB-TAB: STANDARD CHART OF ACCOUNTS */}
                    <TabsContent value="accounts" className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Standard Chart of Accounts</h3>
                                <p className="text-xs text-muted-foreground">The master list of general ledger accounts used to set up all new clients.</p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-grow md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search accounts..." 
                                        className="pl-8 h-10 shadow-sm bg-white"
                                        value={accountSearchTerm}
                                        onChange={(e) => setAccountSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={accountSectionFilter} onValueChange={(value: any) => setAccountSectionFilter(value)}>
                                    <SelectTrigger className="w-[180px] h-10 shadow-sm bg-white">
                                        <SelectValue placeholder="All Sections" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        <SelectItem value="Income Statement">Income Statement</SelectItem>
                                        <SelectItem value="Balance Sheet">Balance Sheet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Card className="border-2 shadow-sm">
                            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted/10 sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                                        <TableRow>
                                            <TableHead className="font-bold">Account Number</TableHead>
                                            <TableHead className="font-bold">Account Name</TableHead>
                                            <TableHead className="font-bold">Section</TableHead>
                                            <TableHead className="font-bold">Category</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAccounts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                                                    No accounts match your search.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAccounts.map((account) => {
                                                const type = getAccountType(account.accountNumber);
                                                return (
                                                    <TableRow key={account.id} className="hover:bg-muted/5 transition-colors">
                                                        <TableCell className="font-mono font-bold text-slate-800">{account.accountNumber}</TableCell>
                                                        <TableCell className="font-semibold text-slate-900">{account.description}</TableCell>
                                                        <TableCell className="text-xs text-slate-500 font-medium">{account.section}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={cn("text-[10px] font-semibold", getAccountTypeBadgeColor(type))}>
                                                                {type}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>

            {/* RULE FORM DIALOG */}
            <Dialog open={isRuleFormOpen} onOpenChange={setIsRuleFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedRule ? 'Edit Global Allocation Rule' : 'Add Practice Allocation Rule'}</DialogTitle>
                        <DialogDescription>
                            Define rules that match statement descriptions to automatically allocate matching transactions.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveRule} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Rule Description / Name</label>
                            <Input 
                                placeholder="e.g. Bank Charges"
                                value={ruleDescription}
                                onChange={(e) => setRuleDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Keywords (Comma-separated)</label>
                            <Textarea 
                                placeholder="e.g. BANK FEES, monthly fee, service fee"
                                value={ruleKeywords}
                                onChange={(e) => setRuleKeywords(e.target.value)}
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Separate multiple match terms with commas. Not case-sensitive.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Allocate To Account</label>
                                <Select value={ruleAccountId} onValueChange={setRuleAccountId}>
                                    <SelectTrigger className="w-full bg-white">
                                        <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 overflow-y-auto">
                                        {initialChartOfAccounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.accountNumber} - {acc.description}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Default VAT Treatment</label>
                                <Select value={ruleVatType} onValueChange={setRuleVatType}>
                                    <SelectTrigger className="w-full bg-white">
                                        <SelectValue placeholder="Select VAT type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allVatTypes.map(vt => (
                                            <SelectItem key={vt.name} value={vt.name}>
                                                {vt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsRuleFormOpen(false)} disabled={isSavingRule}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSavingRule}>
                                {isSavingRule ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {selectedRule ? 'Save Changes' : 'Create Rule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE RULE CONFIRMATION */}
            <AlertDialog open={isRuleDeleteDialogOpen} onOpenChange={setIsRuleDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Practice Allocation Rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the rule <strong>{ruleToDelete?.description}</strong>? Transactions matching its keywords will no longer be auto-allocated using this rule.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setRuleToDelete(null); setIsRuleDeleteDialogOpen(false); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteRule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Rule
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* MANAGE ACCESS DIALOG */}
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage Access</DialogTitle>
                        <DialogDescription>
                            Assign which staff members can access the AI Accountant profile for <strong>{clientToShare?.companyName || clientToShare?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        {allUsers.filter(u => u.role === 'staff' || u.role === 'partner_staff').map(staffUser => {
                            const hasAccess = clientToShare?.sharedWith?.includes(staffUser.uid) || false;
                            return (
                                <div key={staffUser.id} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">{staffUser.name}</span>
                                        <span className="text-xs text-slate-500">{staffUser.email}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={hasAccess ? "default" : "outline"}
                                        onClick={async () => {
                                            if (clientToShare) {
                                                await handleToggleShare(clientToShare, staffUser);
                                                // Optimistically update the local state for immediate UI feedback
                                                setClientToShare(prev => {
                                                    if (!prev) return prev;
                                                    const newSharedWith = hasAccess 
                                                        ? (prev.sharedWith || []).filter(uid => uid !== staffUser.uid)
                                                        : [...(prev.sharedWith || []), staffUser.uid];
                                                    return { ...prev, sharedWith: newSharedWith };
                                                });
                                            }
                                        }}
                                        className={hasAccess ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                                    >
                                        {hasAccess ? "Access Granted" : "Grant Access"}
                                    </Button>
                                </div>
                            );
                        })}
                        {allUsers.filter(u => u.role === 'staff' || u.role === 'partner_staff').length === 0 && (
                            <div className="text-center py-6 text-slate-500 text-sm">
                                No staff members found.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}

