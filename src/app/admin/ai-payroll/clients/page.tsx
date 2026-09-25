'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Search, Users, PlusCircle, MoreHorizontal, Edit, Trash2, Mail, UserPlus, Archive, RotateCcw } from 'lucide-react';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDocs, where, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { User } from '@/lib/types';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ClientForm from '@/components/admin/ClientForm';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { invitePayrollClient } from '@/app/actions/payroll-portal';
import { useAuth } from '@/contexts/AuthContext';

const db = getFirestore(firebaseApp);

export default function AIPayrollClientsPage() {
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

    // Invite Portal state
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [isSendingInvite, setIsSendingInvite] = useState(false);

    const handleOpenInviteDialog = (client: User) => {
        setSelectedClient(client);
        setInviteEmail(client.email || '');
        setInviteName(client.name || '');
        setIsInviteDialogOpen(true);
    };

    const handleSendInvite = async () => {
        if (!selectedClient) return;
        if (!inviteEmail || !inviteEmail.includes('@')) {
            toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
            return;
        }

        setIsSendingInvite(true);
        try {
            const res = await invitePayrollClient({
                idToken: await getAuth(firebaseApp).currentUser?.getIdToken(),
                clientId: selectedClient.id,
                email: inviteEmail,
                name: inviteName || selectedClient.name || 'Client',
                companyName: selectedClient.companyName || selectedClient.name || 'Company',
            });

            if (res.success) {
                toast({
                    title: 'Invitation Sent',
                    description: res.isNewUser 
                        ? `A new portal account has been created for ${inviteEmail}.`
                        : `Access has been granted to existing user ${inviteEmail}.`
                });
                setIsInviteDialogOpen(false);
            } else {
                toast({ title: 'Invite Failed', description: res.error || 'Could not send invite.', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Invite Failed', description: err.message || 'An error occurred.', variant: 'destructive' });
        } finally {
            setIsSendingInvite(false);
        }
    };

    useEffect(() => {
        if (!currentUser) return;

        let q = query(collection(db, 'aiPayrollClients'), orderBy('name'));

        if (currentUser.role === 'staff') {
            q = query(collection(db, 'aiPayrollClients'), where('sharedWith', 'array-contains', currentUser.uid), orderBy('name'));
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
    }, [currentUser, toast]);

    useEffect(() => {
        const usersRef = collection(db, 'users');
        getDocs(usersRef).then(snap => {
            const fetched = snap.docs.map(d => ({ ...d.data(), id: d.id, uid: d.id } as User));
            setAllUsers(fetched);
        }).catch(err => console.error("Error fetching users:", err));
    }, []);

    const handleToggleShare = async (client: User, userToShareWith: User) => {
        try {
            const clientRef = doc(db, 'aiPayrollClients', client.id);
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

    const handleToggleArchive = async (client: User, targetStatus: 'Active' | 'Archived') => {
        try {
            const clientRef = doc(db, 'aiPayrollClients', client.id);
            await updateDoc(clientRef, {
                status: targetStatus,
                updatedAt: serverTimestamp(),
            });
            toast({
                title: targetStatus === 'Archived' ? 'Client Archived' : 'Client Restored',
                description: `${client.companyName || client.name} has been ${targetStatus === 'Archived' ? 'moved to archive' : 'restored to active'}.`,
            });
        } catch (error) {
            console.error("Error updating client status:", error);
            toast({
                title: 'Update Failed',
                description: 'Could not update client status.',
                variant: 'destructive',
            });
        }
    };

    const filteredClients = clients.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeClients = filteredClients.filter(c => c.status !== 'Archived');
    const archivedClients = filteredClients.filter(c => c.status === 'Archived');

    const renderClientTable = (clientList: User[], emptyMessage: string, isArchived = false) => {
        if (clientList.length === 0) {
            return (
                <div className="text-center py-16 text-muted-foreground font-medium">
                    {isArchived ? (
                        <Archive className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    ) : (
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    )}
                    <p>{emptyMessage}</p>
                </div>
            );
        }

        return (
            <Table>
                <TableHeader className="bg-muted/10">
                    <TableRow>
                        <TableHead className="font-bold">Client / Company</TableHead>
                        <TableHead className="font-bold">Email Address</TableHead>
                        <TableHead className="font-bold">Processing Cycle</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold">Portal Access</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clientList.map(client => (
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
                                <Badge 
                                    variant={client.status === 'Archived' ? 'secondary' : (client.status === 'Active' || !client.status ? 'default' : 'outline')} 
                                    className="text-[10px] uppercase font-bold"
                                >
                                    {client.status || 'Active'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {client.portalStatus === 'Invited' ? (
                                    <Badge variant="outline" className="text-[10px] font-bold border-green-200 text-green-700 bg-green-50 uppercase">
                                        Invited
                                    </Badge>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">None</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button variant="outline" size="sm" asChild className="font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                                        <Link href={`/admin/ai-payroll/${client.id}/dashboard`}>
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
                                            <DropdownMenuItem onClick={() => { setSelectedClient(client); setIsFormOpen(true); }}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenInviteDialog(client)}>
                                                <Mail className="mr-2 h-4 w-4" /> Invite to Portal
                                            </DropdownMenuItem>
                                            {currentUser?.role !== 'staff' && (
                                                <DropdownMenuItem onClick={() => { setClientToShare(client); setIsShareDialogOpen(true); }}>
                                                    <UserPlus className="mr-2 h-4 w-4" /> Manage Access
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            {client.status === 'Archived' ? (
                                                <DropdownMenuItem 
                                                    onClick={() => handleToggleArchive(client, 'Active')}
                                                    className="text-emerald-700 focus:text-emerald-800"
                                                >
                                                    <RotateCcw className="mr-2 h-4 w-4 text-emerald-600" /> Restore to Active
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem 
                                                    onClick={() => handleToggleArchive(client, 'Archived')}
                                                    className="text-amber-700 focus:text-amber-800"
                                                >
                                                    <Archive className="mr-2 h-4 w-4 text-amber-600" /> Archive Client
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Payroll Clients</h1>
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
                    <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setSelectedClient(null); }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setSelectedClient(null)} className="h-10 font-bold gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Create Client
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[88vh] h-[88vh] flex flex-col p-0 sm:p-0 gap-0 overflow-hidden">
                            <DialogHeader className="px-6 py-5 border-b shrink-0 text-left bg-background">
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
                </div>
            </div>

            {isLoading ? (
                <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary h-8 w-8" aria-hidden="true" />
                    <span className="sr-only">Loading…</span>
                </div>
            ) : (
                <div className="space-y-6">
                    <Card className="border-2 shadow-sm">
                        <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        Active Payroll Clients
                                    </CardTitle>
                                    <CardDescription>Managed companies currently active in payroll processing.</CardDescription>
                                </div>
                                <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
                                    {activeClients.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {renderClientTable(activeClients, "No active AI Payroll clients found.")}
                        </CardContent>
                        <CardFooter className="bg-muted/10 border-t py-2.5 px-4 text-right justify-between text-xs text-muted-foreground">
                            <span>Active payroll cycles</span>
                            <span className="font-semibold">{activeClients.length} {activeClients.length === 1 ? 'client' : 'clients'}</span>
                        </CardFooter>
                    </Card>

                    <Card className="border-2 shadow-sm opacity-95">
                        <CardHeader className="bg-muted/40 pb-4 border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                                        <Archive className="h-5 w-5 text-slate-500" />
                                        Archived Payroll Clients
                                    </CardTitle>
                                    <CardDescription>Past or inactive payroll client profiles moved to archive.</CardDescription>
                                </div>
                                <Badge variant="secondary" className="font-bold">
                                    {archivedClients.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {renderClientTable(archivedClients, "No archived payroll clients found.", true)}
                        </CardContent>
                        <CardFooter className="bg-muted/10 border-t py-2.5 px-4 text-right justify-between text-xs text-muted-foreground">
                            <span>Archived client records preserved</span>
                            <span className="font-semibold">{archivedClients.length} {archivedClients.length === 1 ? 'client' : 'clients'}</span>
                        </CardFooter>
                    </Card>
                </div>
            )}

            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            Invite to Client Portal
                        </DialogTitle>
                        <DialogDescription>
                            Send an invitation to collaborate on the AI Payroll profile for <strong>{selectedClient?.companyName || selectedClient?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Client Name</label>
                            <Input 
                                placeholder="e.g. John Doe"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                disabled={isSendingInvite}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Email Address</label>
                            <Input 
                                type="email"
                                placeholder="e.g. john@company.co.za"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                disabled={isSendingInvite}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-end gap-2 border-t pt-4">
                        <Button variant="ghost" onClick={() => setIsInviteDialogOpen(false)} disabled={isSendingInvite}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendInvite} disabled={isSendingInvite || !inviteEmail} className="gap-2">
                            {isSendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            {isSendingInvite ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MANAGE ACCESS DIALOG */}
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage Access</DialogTitle>
                        <DialogDescription>
                            Assign which staff members can access the AI Payroll profile for <strong>{clientToShare?.companyName || clientToShare?.name}</strong>.
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
        </div>
    );
}
