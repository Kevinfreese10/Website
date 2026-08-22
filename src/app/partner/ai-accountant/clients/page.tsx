'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Loader2, ArrowRight, Edit, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Order, Task } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import ClientForm from '@/components/admin/ClientForm';
import { chartOfAccounts as initialChartOfAccounts } from '@/lib/chart-of-accounts';
import { allocationRules as initialAllocationRules } from '@/lib/allocation-rules';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { getNextOrderId } from '@/lib/sequence';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';


const db = getFirestore(firebaseApp);

function ShareClientDialog({ client, onShare, allUsers }: { client: User | null, onShare: (email: string, action: 'add' | 'remove') => void, allUsers: User[] }) {
    const [email, setEmail] = useState('');
    if (!client) return null;

    const sharedWithDetails = client.sharedWith?.map(uid => allUsers.find(u => u.uid === uid)).filter(Boolean) as User[] || [];

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Share "{client.name}"</DialogTitle>
                <DialogDescription>
                    Grant other users access to manage this client profile.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Enter user's email to add"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button onClick={() => { onShare(email, 'add'); setEmail(''); }}>Add User</Button>
                </div>
                <Separator />
                 <div>
                    <h4 className="font-medium text-sm mb-2">Users with Access</h4>
                    <div className="space-y-2">
                        {sharedWithDetails && sharedWithDetails.length > 0 ? sharedWithDetails.map(user => (
                            <div key={user.uid} className="flex justify-between items-center bg-muted p-2 rounded-md">
                                <div>
                                    <p className="font-semibold text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <Button variant="destructive" size="sm" onClick={() => onShare(user.email, 'remove')}>Remove</Button>
                            </div>
                        )) : (
                            <p className="text-xs text-muted-foreground text-center py-2">Not shared with anyone yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </DialogContent>
    )
}

export default function AIAccountantClientsPage() {
  const [myClients, setMyClients] = useState<User[]>([]);
  const [sharedClients, setSharedClients] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isPartnerLimitModalOpen, setIsPartnerLimitModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const partner = usePartner();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const router = useRouter();
  
  const fetchClientsAndTasks = async () => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id, id: doc.id } as User));
        setAllUsers(allUsersData);
        
        const clientsRef = collection(db, "aiAccountantClients");
        
        const partnerId = partner.partnerProfile?.uid || currentUser.uid;
        const createdQuery = query(clientsRef, where("createdBy", "==", partnerId), orderBy("name"));
        const sharedQuery = query(clientsRef, where("sharedWith", "array-contains", currentUser.uid), orderBy("name"));
        
        const [createdSnapshot, sharedSnapshot] = await Promise.all([
             getDocs(createdQuery),
             getDocs(sharedQuery)
        ]);
        
        const fetchedMyClients = createdSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        const fetchedSharedClients = sharedSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));

        setMyClients(fetchedMyClients);
        setSharedClients(fetchedSharedClients);

        const tasksQuery = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
        const tasksSnapshot = await getDocs(tasksQuery);
        const fetchedTasks = tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
        setTasks(fetchedTasks);

    } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: 'Error', description: 'Could not fetch AI Accountant clients or tasks.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if(currentUser) {
        fetchClientsAndTasks();
    }
  }, [currentUser]);

  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(task => 
        Array.isArray(task.assignedTo) && 
        task.assignedTo.includes(currentUser.id) &&
        task.status !== 'Done'
    );
  }, [tasks, currentUser]);

  const handleAddClick = () => {
      if (myClients.length >= partner.limits.aiCompanies) {
        setIsPartnerLimitModalOpen(true);
      } else {
        setSelectedClient(null);
        setIsFormOpen(true);
      }
  };

   const handleCreateSubscriptionOrder = async () => {
    if (!currentUser) return;
    setIsProcessingPayment(true);
    toast({ title: "Creating renewal order...", description: "Please wait." });

    const subscriptionPrice = 140;

    try {
        const orderId = await getNextOrderId();
        const renewalOrderData: Order = {
            id: orderId,
            userId: currentUser.uid,
            customerName: currentUser.name,
            customerEmail: currentUser.email,
            items: [{
                id: 'additional_company_profile',
                title: `AI Accountant - Additional Company Profile`,
                price: subscriptionPrice,
                quantity: 1,
            }],
            total: subscriptionPrice,
            discountCode: null,
            discountAmount: null,
            status: 'Pending Payment',
            date: Timestamp.now(),
            source: 'AI Accountant Signup',
            renewalForClientId: currentUser.uid,
            originalOrderId: null,
        };
        
        await setDoc(doc(db, 'orders', orderId), renewalOrderData);
        // Redirect to order confirmation page
        router.push(`/order-confirmation/${orderId}`);
        
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', description: 'Could not create renewal order.', variant: 'destructive'});
        setIsProcessingPayment(false);
    }
  };

  
  const handleEdit = (client: User) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };
  
  const handleShareClick = (client: User) => {
    setSelectedClient(client);
    setIsShareOpen(true);
  }

  const handleShareAction = async (email: string, action: 'add' | 'remove') => {
    if (!selectedClient) return;

    const userToShareWith = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!userToShareWith) {
        toast({ title: 'User Not Found', description: `No user with the email "${email}" exists.`, variant: 'destructive'});
        return;
    }

    const clientRef = doc(db, 'aiAccountantClients', selectedClient.id);

    try {
        if (action === 'add') {
            await updateDoc(clientRef, { sharedWith: arrayUnion(userToShareWith.uid) });
            toast({ title: 'Client Shared', description: `${selectedClient.name} has been shared with ${userToShareWith.name}.` });
        } else {
            await updateDoc(clientRef, { sharedWith: arrayRemove(userToShareWith.uid) });
            toast({ title: 'Access Removed', description: `Access for ${userToShareWith.name} has been removed from ${selectedClient.name}.` });
        }
        fetchClientsAndTasks(); // Refetch to update the list
    } catch(e) {
        console.error("Error sharing client:", e);
        toast({ title: 'Error', description: 'Could not update sharing settings.', variant: 'destructive'});
    }
  }
  
  const handleDelete = async (clientId: string) => {
    try {
        await deleteDoc(doc(db, "aiAccountantClients", clientId));
        fetchClientsAndTasks();
        toast({
            title: 'Client Deleted',
            description: `The AI Accountant profile has been removed.`,
            variant: 'destructive',
        });
    } catch (error) {
        console.error("Error deleting client:", error);
        toast({ title: 'Error', description: 'Could not delete client profile.', variant: 'destructive' });
    }
  };

 const handleFormSubmit = async (data: any) => {
    if (!currentUser) return;

    try {
        if (selectedClient?.id) {
            // This is an update, only merge the fields from the form
            const { createAIProfile, ...clientFormData } = data;
            const updateData: Partial<User> = {
                ...clientFormData,
                yearEnd: data.yearEnd || null,
                clientSource: 'ai_accountant',
            };
             if (!data.isVatRegistered) {
                updateData.vatNumber = null as any;
                updateData.vatCategory = null as any;
            }
            await setDoc(doc(db, "aiAccountantClients", selectedClient.id), updateData, { merge: true });
            toast({ title: 'Client Updated'});
        } else {
            // This is a new client creation
            const { createAIProfile, ...clientFormData } = data;
            // Fetch partner's global settings
            const partnerId = partner.partnerProfile?.uid || currentUser.uid;
            let partnerChartOfAccounts = initialChartOfAccounts;
            let partnerAllocationRules = initialAllocationRules;
            
            try {
                const settingsDoc = await getDocs(collection(db, `users/${partnerId}/settings`));
                const aiSettings = settingsDoc.docs.find(d => d.id === 'aiAccountant')?.data();
                if (aiSettings) {
                    if (aiSettings.chartOfAccounts) partnerChartOfAccounts = aiSettings.chartOfAccounts;
                    if (aiSettings.allocationRules) partnerAllocationRules = aiSettings.allocationRules;
                }
            } catch (e) {
                console.error("Failed to load partner custom AI settings", e);
            }

            const newClientData: Partial<User> = {
                ...clientFormData,
                yearEnd: data.yearEnd || null,
                role: 'client',
                source: 'AI Accountant',
                clientSource: 'ai_accountant',
                hasNumeraProfile: true,
                chartOfAccounts: partnerChartOfAccounts,
                allocationRules: partnerAllocationRules,
            };

            if (!data.isVatRegistered) {
                newClientData.vatNumber = null as any;
                newClientData.vatCategory = null as any;
            }

            const newDocRef = doc(collection(db, 'aiAccountantClients'));
            await setDoc(newDocRef, {
              ...newClientData,
              id: newDocRef.id,
              uid: newDocRef.id,
              createdAt: Timestamp.now(),
              createdBy: partnerId,
              sharedWith: [],
            });
            toast({ title: 'Client Created' });
        }

        fetchClientsAndTasks();
        setIsFormOpen(false);
        setSelectedClient(null);
    } catch (error) {
        console.error("Error saving client:", error);
        toast({ title: 'Error', description: 'Could not save the client.', variant: 'destructive'});
    }
  };

  const renderClientTable = (clients: User[], title: string) => (
     <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>VAT Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(client => {
                const basePath = '/dashboard';
                return (
                    <TableRow key={client.id}>
                    <TableCell className="font-medium">
                        <div>
                            <span>{client.name}</span>
                            {client.contactPerson && <p className="text-xs text-muted-foreground">{client.contactPerson}</p>}
                        </div>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                        {client.isVatRegistered ? (
                            <Badge variant="success">Yes</Badge>
                        ) : (
                            <Badge variant="secondary">No</Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem asChild>
                                    <Link href={`${basePath}/ai-accountant/${client.id}/dashboard`}>
                                        Manage Client <ArrowRight className="ml-auto h-4 w-4" />
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(client)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShareClick(client)}>
                                    <Share2 className="mr-2 h-4 w-4" /> Share Access
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the AI Accountant profile for {client.name}. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(client.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                )
            })}
            </TableBody>
          </Table>
          {clients.length === 0 && <p className="text-center text-muted-foreground py-4">No clients found in this section.</p>}
        </CardContent>
      </Card>
  )


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">AI Accountant Clients</h1>
          <Badge variant="secondary" className="font-bold">
            {myClients.length} / {partner.limits.aiCompanies} Companies Used
          </Badge>
        </div>
        {currentUser && (
            <>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                     <DialogTrigger asChild>
                        <Button onClick={handleAddClick}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{selectedClient ? 'Edit Client' : 'Create New Client'}</DialogTitle>
                                <DialogDescription>
                                    {selectedClient ? 'Update the details for this client.' : 'Fill out the form to add a new client to the AI Accountant module.'}
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
                <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Another Company</DialogTitle>
                            <DialogDescription>
                                Your first company profile is free. Each additional company requires a subscription of <strong>R140 per month</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <p>To activate a new company profile, please proceed with the payment below.</p>
                             <Button onClick={handleCreateSubscriptionOrder} disabled={isProcessingPayment} className="w-full">
                                {isProcessingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Proceed to Payment (R140.00)
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog open={isPartnerLimitModalOpen} onOpenChange={setIsPartnerLimitModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {partner.limits.aiCompanies === 0 ? 'Activate AI Accountant' : 'Company Limit Reached'}
                            </DialogTitle>
                            <DialogDescription>
                                {partner.limits.aiCompanies === 0 
                                    ? 'The AI Accountant add-on is not active. Please activate the AI Accountant module (R950/month) in your settings to start managing client companies.' 
                                    : `You have reached your limit of ${partner.limits.aiCompanies} AI Accountant companies. Please purchase additional company slots or manage your subscription.`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 flex flex-col gap-3">
                            <Button asChild className="w-full font-bold">
                                <Link href="/partner/profile">Go to Settings & Add-ons</Link>
                            </Button>
                            <Button variant="ghost" onClick={() => setIsPartnerLimitModalOpen(false)}>Cancel</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        )}
      </div>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <ShareClientDialog client={selectedClient} onShare={handleShareAction} allUsers={allUsers} />
       </Dialog>
      
      {isLoading ? (
        <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
      ) : (
        <div className="space-y-8">
            {myClients.length > 0 && renderClientTable(myClients, "My Clients")}
            
            {sharedClients.length > 0 && renderClientTable(sharedClients, "Shared With Me")}

            {myClients.length === 0 && sharedClients.length === 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>No Clients Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-center text-muted-foreground py-4">You have not created or been given access to any AI Accountant clients yet.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      )}

      {myTasks.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>A list of tasks assigned to you across all clients.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {myTasks.map(task => {
                            const client = [...myClients, ...sharedClients].find(c => c.id === task.clientId);
                            return (
                                <TableRow key={task.id}>
                                    <TableCell>
                                        <p className="font-semibold">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">{task.description}</p>
                                    </TableCell>
                                    <TableCell>{client?.name || 'N/A'}</TableCell>
                                    <TableCell>{task.dueDate?.toDate ? format(task.dueDate.toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                    <TableCell><Badge>{task.status}</Badge></TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
