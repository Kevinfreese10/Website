'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Search, Users, PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User } from '@/lib/types';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ClientForm from '@/components/admin/ClientForm';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';

const db = getFirestore(firebaseApp);

export default function AIPayrollClientsPage() {
    const [clients, setClients] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<User | null>(null);
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const partner = usePartner();
    const partnerId = partner?.partnerProfile?.uid || currentUser?.uid;

    useEffect(() => {
        if (!partnerId) return;

        let q = query(collection(db, 'aiPayrollClients'), orderBy('name'));
        if (currentUser?.role !== 'admin') {
            q = query(collection(db, 'aiPayrollClients'), where('createdBy', '==', partnerId), orderBy('name'));
        }

        const unsubscribe = onSnapshot(q, (snap) => {
            const fetchedClients = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
            setClients(fetchedClients);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching AI Payroll clients:", error);
            setIsLoading(false);
            toast({
                title: "Error",
                description: "Could not load payroll clients. Please check your database permissions.",
                variant: "destructive"
            });
        });
        return () => unsubscribe();
    }, [partnerId, currentUser?.role]);

    const handleFormSubmit = async (data: any) => {
        try {
            if (selectedClient?.id) {
                // Update — strip locked payroll fields that cannot be changed once set
                const updateData = { ...data };
                if (selectedClient.payrollFrequency) delete updateData.payrollFrequency;
                if (selectedClient.firstProcessingMonth) delete updateData.firstProcessingMonth;
                if (selectedClient.firstRunStartDate) delete updateData.firstRunStartDate;

                const clientRef = doc(db, "aiPayrollClients", selectedClient.id);
                await setDoc(clientRef, {
                    ...updateData,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
                toast({ title: 'Client Updated', description: 'Changes have been saved successfully.' });
            } else {
                // Create
                const newDocRef = doc(collection(db, 'aiPayrollClients'));
                const newClientData = {
                    ...data,
                    id: newDocRef.id,
                    uid: newDocRef.id,
                    role: 'client',
                    source: 'AI Payroll' as const,
                    clientSource: 'ai_payroll',
                    status: 'Active',
                    createdAt: serverTimestamp(),
                    createdBy: partnerId,
                    partnerId: partnerId,
                };
                await setDoc(newDocRef, newClientData);
                toast({ title: 'Client Created', description: 'New AI Payroll profile is ready.' });
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
            await deleteDoc(doc(db, "aiPayrollClients", clientId));
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Payroll Clients</h1>
                        {currentUser?.role !== 'admin' && (
                            <Badge variant="secondary" className="font-bold">
                                {clients.length} / {partner.limits.aiPayroll} Companies Used
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Administrative Overview</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search clients..." 
                            className="pl-8 h-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => {
                        if (currentUser?.role !== 'admin' && clients.length >= partner.limits.aiPayroll) {
                            setIsLimitModalOpen(true);
                        } else {
                            setSelectedClient(null);
                            setIsFormOpen(true);
                        }
                    }} className="h-10 font-bold gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Create Client
                    </Button>
                    
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{selectedClient ? 'Edit Client Profile' : 'Setup New Payroll Client'}</DialogTitle>
                                <DialogDescription>
                                    Configure the company details, registration numbers, and payroll processing cycle.
                                </DialogDescription>
                            </DialogHeader>
                            <ClientForm 
                                client={selectedClient} 
                                onSubmit={handleFormSubmit}
                                onCancel={() => setIsFormOpen(false)}
                                isAIClient={true}
                                isPayrollClient={true}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isLimitModalOpen} onOpenChange={setIsLimitModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {partner.tier === 'free' ? 'Upgrade to Growth Tier' : 'Company Limit Reached'}
                                </DialogTitle>
                                <DialogDescription>
                                    {partner.tier === 'free' 
                                        ? 'Your current Free partner tier does not include AI Payroll companies. Please upgrade to the Growth tier (R950/month) to manage up to 5 companies.' 
                                        : 'Your Growth subscription supports a maximum of 5 AI Payroll companies. Please contact support or upgrade your plan to add more.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 flex flex-col gap-3">
                                {partner.tier === 'free' ? (
                                    <Button asChild className="w-full font-bold">
                                        <Link href="/partner/profile">Upgrade to Growth Tier</Link>
                                    </Button>
                                ) : (
                                    <Button asChild className="w-full font-bold" variant="outline">
                                        <a href="mailto:support@myacc.co.za?subject=Request Additional AI Payroll Companies">Contact Support</a>
                                    </Button>
                                )}
                                <Button variant="ghost" onClick={() => setIsLimitModalOpen(false)}>Cancel</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-2 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                    <CardTitle className="text-lg">Practice Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground font-medium">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No AI Payroll clients found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="font-bold">Client / Company</TableHead>
                                    <TableHead className="font-bold">Email Address</TableHead>
                                    <TableHead className="font-bold">Processing Cycle</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="text-right font-bold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map(client => (
                                    <TableRow key={client.id} className="hover:bg-muted/5 transition-colors">
                                        <TableCell className="font-bold text-slate-900">
                                            <div className="flex flex-col">
                                                <span>{client.companyName || client.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">{client.registrationNumber || 'No Registration Number'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">{client.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary uppercase bg-primary/5">
                                                {client.firstProcessingMonth || 'Not Set'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={client.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold">
                                                {client.status || 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild className="font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                                                    <Link href={`/dashboard/ai-payroll/${client.id}/dashboard`}>
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
                                                                        This will permanently delete the AI Payroll profile for <strong>{client.companyName || client.name}</strong>. This action cannot be undone.
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
                    )}
                </CardContent>
                <CardFooter className="bg-muted/30 border-t py-3 text-right justify-end">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        Total {filteredClients.length} payroll clients detected
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
