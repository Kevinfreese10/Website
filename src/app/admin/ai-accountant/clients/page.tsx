'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Search, Building, Archive, PlusCircle, MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, Timestamp, limit, getDoc, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User } from '@/lib/types';
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

const db = getFirestore(firebaseApp);

/**
 * A small component to fetch and display the last transaction date for a client.
 */
function LastImportDate({ clientId }: { clientId: string }) {
    const [lastDate, setLastDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'aiAccountantClients', clientId, 'transactions'),
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
    const [clients, setClients] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<User | null>(null);
    const { toast } = useToast();

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
        const q = query(collection(db, 'aiAccountantClients'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const fetchedClients = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
            setClients(fetchedClients);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching AI Accountant clients:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

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

    const filteredClients = clients.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeClients = filteredClients.filter(c => c.status !== 'Archived');
    const archivedClients = filteredClients.filter(c => c.status === 'Archived');

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
                        <TableHead className="font-bold">Client / Company</TableHead>
                        <TableHead className="font-bold">Last Bank Import</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clientList.map(client => (
                        <TableRow key={client.id} className="hover:bg-muted/5 transition-colors">
                            <TableCell className="font-bold text-slate-900">
                                <div className="flex flex-col">
                                    <span>{client.companyName || client.name}</span>
                                    {client.companyName && client.name !== client.companyName && (
                                        <span className="text-[10px] text-muted-foreground font-medium">{client.name}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <LastImportDate clientId={client.id} />
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Manage</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => { setSelectedClient(client); setIsFormOpen(true); }}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStartCopy(client)}>
                                                <Copy className="mr-2 h-4 w-4" /> Copy Client
                                            </DropdownMenuItem>
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Accountant Clients</h1>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Administrative Overview</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search clients..." 
                            className="pl-8 h-10 shadow-sm" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
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
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
            ) : (
                <div className="space-y-8">
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
        </div>
    );
}
