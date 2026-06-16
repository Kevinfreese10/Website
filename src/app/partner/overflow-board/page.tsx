'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFirestore, collection, getDoc, doc, updateDoc, arrayUnion, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Order, User, Service } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Briefcase, Clock, FileText, CheckCircle, AlertTriangle, ShieldAlert, Coins, ArrowRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

export default function PartnerOverflowBoardPage() {
  const [partnerProfile, setPartnerProfile] = useState<User | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Order[]>([]);
  const [activeClaims, setActiveClaims] = useState<Order[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Order[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Order | null>(null);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const partnerId = user?.role === 'partner' ? user.uid : user?.partnerId;

  // Fetch partner profile & services
  useEffect(() => {
    if (!partnerId) return;

    const fetchProfileAndServices = async () => {
      try {
        const docRef = doc(db, 'users', partnerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPartnerProfile(docSnap.data() as User);
        }

        const servicesRef = collection(db, 'services');
        const servicesSnap = await query(servicesRef);
        onSnapshot(servicesSnap, (snapshot) => {
          const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
          setAllServices(servicesList);
        });
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    fetchProfileAndServices();
  }, [partnerId]);

  // Real-time listener for jobs
  useEffect(() => {
    if (!partnerId || !partnerProfile?.overflowApproved) {
      setIsLoading(false);
      return;
    }

    const ordersRef = collection(db, 'orders');
    
    // Subscribe to all orders that have overflow configured
    const q = query(ordersRef, where('overflowStatus', '!=', 'none'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allJobs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
          overflowDeadline: data.overflowDeadline?.toDate ? data.overflowDeadline.toDate().toISOString() : null,
          overflowClaimedAt: data.overflowClaimedAt?.toDate ? data.overflowClaimedAt.toDate().toISOString() : null,
          overflowSubmittedAt: data.overflowSubmittedAt?.toDate ? data.overflowSubmittedAt.toDate().toISOString() : null,
          overflowCompletedAt: data.overflowCompletedAt?.toDate ? data.overflowCompletedAt.toDate().toISOString() : null,
        } as Order;
      });

      // Filter available jobs matching capabilities
      const available = allJobs.filter(job => {
        if (job.overflowStatus !== 'available') return false;
        
        // Match at least one item in the order with the partner's capableServices
        const hasCapability = job.items.some(item => 
          partnerProfile.capableServices?.includes(item.id)
        );
        return hasCapability;
      });

      // Claims belonging to this partner
      const claims = allJobs.filter(job => 
        job.overflowPartnerId === partnerId && 
        (job.overflowStatus === 'claimed' || job.overflowStatus === 'review')
      );

      // Completed jobs belonging to this partner
      const completed = allJobs.filter(job => 
        job.overflowPartnerId === partnerId && 
        job.overflowStatus === 'completed'
      );

      setAvailableJobs(available);
      setActiveClaims(claims);
      setCompletedJobs(completed);
      setIsLoading(false);
    }, (error) => {
      console.error("Error subscribing to overflow jobs:", error);
      toast({
        title: "Sync Error",
        description: "Could not sync overflow job board data.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId, partnerProfile, toast]);

  const handleClaimJob = async () => {
    if (!selectedJob || !partnerId) return;
    setIsActionLoading(true);
    try {
      const orderRef = doc(db, 'orders', selectedJob.id);
      
      const updateData = {
        overflowStatus: 'claimed',
        overflowPartnerId: partnerId,
        overflowClaimedAt: Timestamp.now(),
        overflowPayoutStatus: 'pending',
      };

      await updateDoc(orderRef, updateData);

      // Add audit log note
      const newNote = {
        text: `Job claimed from board by subcontractor partner: ${partnerProfile?.companyName || partnerProfile?.name || partnerId}.`,
        authorId: user?.uid || 'system',
        date: Timestamp.now(),
        type: 'note',
      };
      await updateDoc(orderRef, { notes: arrayUnion(newNote) });

      toast({
        title: "Job Claimed!",
        description: "This job has been added to your active subcontracts list.",
      });
      setIsClaimDialogOpen(false);
      setSelectedJob(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Claim Failed",
        description: "An error occurred while claiming the job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestPayout = async (job: Order) => {
    if (!partnerId) return;
    setIsActionLoading(true);
    try {
      const orderRef = doc(db, 'orders', job.id);
      await updateDoc(orderRef, {
        overflowPayoutStatus: 'requested'
      });

      const newNote = {
        text: `Subcontractor requested payout of ${formatPrice(job.overflowPayout || 0)} for completed work.`,
        authorId: user?.uid || 'system',
        date: Timestamp.now(),
        type: 'note',
      };
      await updateDoc(orderRef, { notes: arrayUnion(newNote) });

      toast({
        title: "Payout Requested",
        description: "Your payment request has been sent to My Accountant admin team."
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Request Failed",
        description: "Failed to request payout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Compliance Block
  if (!partnerProfile?.wantsOutsourcedWork || !partnerProfile?.overflowApproved) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <Card className="border-amber-200 bg-amber-50/50 shadow-md">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-amber-900">Program Enrollment Required</CardTitle>
              <CardDescription className="text-amber-700 mt-1">
                To participate in the Overflow Program and receive outsourced client jobs, your practice must apply and be approved.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p><strong>Steps to enable:</strong></p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Navigate to your <strong>Practice Settings</strong> page.</li>
              <li>Toggle the **Overflow Program** setting to apply.</li>
              <li>Upload your compliance documents (CV, certificates) for admin review.</li>
              <li>Configure your practice's **Capable Services** list.</li>
            </ol>
            <div className="bg-amber-100/50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mt-4 leading-relaxed">
              <strong>Application Status:</strong> {partnerProfile?.wantsOutsourcedWork ? 'Pending admin approval' : 'Not applied yet'}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full font-semibold bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/partner/settings">Go to Practice Settings</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Practice Overflow Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fulfill subcontractor jobs outsourced from the My Accountant network.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl p-3 text-sm">
          <Coins className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Practice Wallet Balance</p>
            <p className="font-bold text-slate-800 mt-0.5">{formatPrice(partnerProfile.creditBalance || 0)}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-fit">
          <TabsTrigger value="available" className="rounded-lg px-4 py-2 font-semibold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Available Jobs ({availableJobs.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg px-4 py-2 font-semibold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Active Subcontracts ({activeClaims.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg px-4 py-2 font-semibold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Fulfillment History ({completedJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Available Jobs */}
        <TabsContent value="available">
          <Card className="border border-slate-200/80 shadow-md">
            <CardHeader>
              <CardTitle>Job Board</CardTitle>
              <CardDescription>
                Open jobs available to your practice. Claiming a job commits you to completing it by the specified deadline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableJobs.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">No new overflow jobs match your practice capabilities right now.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID (Masked)</TableHead>
                      <TableHead>Services Needed</TableHead>
                      <TableHead>Fulfillment Deadline</TableHead>
                      <TableHead className="text-right">Payout Value</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-bold text-slate-800">
                          Client #{job.id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {job.items.map((item, i) => (
                              <Badge key={i} variant="secondary" className="font-medium text-[10px]">
                                {item.title}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {job.overflowDeadline ? format(new Date(job.overflowDeadline), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatPrice(job.overflowPayout || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            className="font-semibold text-xs"
                            onClick={() => {
                              setSelectedJob(job);
                              setIsClaimDialogOpen(true);
                            }}
                          >
                            Claim Job
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Active Claims */}
        <TabsContent value="active">
          <Card className="border border-slate-200/80 shadow-md">
            <CardHeader>
              <CardTitle>My Subcontracted Assignments</CardTitle>
              <CardDescription>
                Overflow jobs claimed by your practice currently in-progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeClaims.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <Clock className="h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">No active subcontracts found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Claimed Date</TableHead>
                      <TableHead>Fulfillment Deadline</TableHead>
                      <TableHead>Fulfillment Status</TableHead>
                      <TableHead className="text-right">Payout Value</TableHead>
                      <TableHead className="text-right">Fulfillment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeClaims.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-bold text-slate-800">
                          Client #{job.id.substring(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.overflowClaimedAt ? format(new Date(job.overflowClaimedAt), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {job.overflowDeadline ? format(new Date(job.overflowDeadline), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.overflowStatus === 'review' ? 'warning' : 'info'} className="font-bold uppercase text-[9px]">
                            {job.overflowStatus === 'review' ? 'Pending Review' : 'In Progress'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-800">
                          {formatPrice(job.overflowPayout || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild className="font-semibold text-xs border-primary/20 text-primary">
                            <Link href={`/partner/overflow-board/${job.id}`}>
                              Fulfill Console <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Completed Jobs & Payouts */}
        <TabsContent value="completed">
          <Card className="border border-slate-200/80 shadow-md">
            <CardHeader>
              <CardTitle>Fulfillment History & Payouts</CardTitle>
              <CardDescription>
                Completed subcontracts. Request payment once the admin has approved the deliverables.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedJobs.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">No completed subcontracts found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Completion Approved</TableHead>
                      <TableHead>Payout Value</TableHead>
                      <TableHead>Payout Status</TableHead>
                      <TableHead className="text-right">Settlement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-bold text-slate-800">
                          Client #{job.id.substring(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.overflowCompletedAt ? format(new Date(job.overflowCompletedAt), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="font-bold text-slate-800">
                          {formatPrice(job.overflowPayout || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.overflowPayoutStatus === 'paid' ? 'success' : job.overflowPayoutStatus === 'requested' ? 'destructive' : 'secondary'} className="font-bold uppercase text-[9px]">
                            {job.overflowPayoutStatus || 'pending review'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {job.overflowPayoutStatus === 'can_request' && (
                            <Button 
                              size="sm" 
                              className="font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={() => handleRequestPayout(job)}
                              disabled={isActionLoading}
                            >
                              Request Payout
                            </Button>
                          )}
                          {job.overflowPayoutStatus === 'requested' && (
                            <span className="text-xs text-amber-600 font-semibold italic">Processing payout request</span>
                          )}
                          {job.overflowPayoutStatus === 'paid' && (
                            <span className="text-xs text-green-600 font-bold flex items-center justify-end gap-1.5">
                              <CheckCircle className="h-4 w-4" /> Paid
                            </span>
                          )}
                          {(!job.overflowPayoutStatus || job.overflowPayoutStatus === 'pending') && (
                            <span className="text-xs text-muted-foreground">Awaiting payout confirmation</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Claim Dialog */}
      <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Subcontract Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to claim this job? This will assign the job to your practice and set your status as the subcontractor.
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 my-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client Code:</span>
                <span className="font-bold">Client #{selectedJob.id.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payout:</span>
                <span className="font-bold text-primary">{formatPrice(selectedJob.overflowPayout || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline:</span>
                <span className="font-medium">{selectedJob.overflowDeadline ? format(new Date(selectedJob.overflowDeadline), 'dd MMMM yyyy') : 'N/A'}</span>
              </div>
              <div className="pt-2 border-t text-xs text-muted-foreground leading-relaxed">
                By claiming this job, you agree to fulfill the required documents and client specifications before the deadline.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsClaimDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleClaimJob} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Claim & Accept Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
