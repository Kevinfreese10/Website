'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from '@/lib/firebase';
import { Order, Service, User, OrderNote, DocumentUpload } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, User as UserIcon, Mail, Phone, Send, FileText, CheckCircle, AlertTriangle, XCircle, Download, Paperclip, ClipboardCheck, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

type OrderItemWithService = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  service: Service;
};

export default function PartnerOverflowFulfillmentPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItemsWithServices, setOrderItemsWithServices] = useState<OrderItemWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const [textInputs, setTextInputs] = useState<{ [key: string]: string }>({});
  const [newNoteText, setNewNoteText] = useState('');
  
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const partnerId = currentUser?.role === 'partner' ? currentUser.uid : currentUser?.partnerId;

  const fetchOrderDetails = async () => {
    if (!id || !partnerId) return;
    setIsLoading(true);
    try {
      // 1. Fetch all services
      const servicesQuery = query(collection(db, 'services'));
      const servicesSnapshot = await getDocs(servicesQuery);
      const fetchedServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

      // 2. Fetch the order
      const docRef = doc(db, 'orders', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Security check: ensure this subcontractor partner actually claimed the order
        if (data.overflowPartnerId !== partnerId) {
          toast({ title: 'Access Denied', description: 'You are not assigned to this subcontract.', variant: 'destructive' });
          router.replace('/partner/overflow-board');
          return;
        }

        const fetchedOrder = {
          ...data,
          id: docSnap.id,
          date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
          overflowDeadline: data.overflowDeadline?.toDate ? data.overflowDeadline.toDate().toISOString() : null,
          overflowClaimedAt: data.overflowClaimedAt?.toDate ? data.overflowClaimedAt.toDate().toISOString() : null,
          overflowSubmittedAt: data.overflowSubmittedAt?.toDate ? data.overflowSubmittedAt.toDate().toISOString() : null,
          overflowCompletedAt: data.overflowCompletedAt?.toDate ? data.overflowCompletedAt.toDate().toISOString() : null,
          notes: (data.notes || []).map((note: any) => ({
            ...note,
            date: note.date?.toDate ? note.date.toDate().toISOString() : new Date(note.date).toISOString()
          })),
          documentUploads: (data.documentUploads || []).map((doc: any) => ({
            ...doc,
            uploadedAt: doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toISOString() : new Date().toISOString()
          })),
        } as Order;

        setOrder(fetchedOrder);

        // Map order items to services
        const itemsWithServices = fetchedOrder.items.map(item => {
          const serviceDetails = fetchedServices.find(s => 
            s.id === item.id || 
            s.title.toLowerCase() === item.id.toLowerCase() || 
            s.title.toLowerCase() === item.title.toLowerCase() ||
            s.slug === item.id
          );
          if (!serviceDetails) return null;
          return { ...item, service: serviceDetails } as OrderItemWithService;
        }).filter(item => item !== null) as OrderItemWithService[];

        setOrderItemsWithServices(itemsWithServices);
      } else {
        notFound();
      }
    } catch (error) {
      console.error("Error fetching order: ", error);
      notFound();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchOrderDetails();
    }
  }, [id, currentUser]);

  const handleFileUpload = (file: File, serviceId: string, requirementLabel: string) => {
    if (!currentUser || !order) return;

    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `orders/${order.id}/${uniqueFileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const uploadKey = `${serviceId}-${requirementLabel}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: 0 }));

    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadingFiles(prev => ({ ...prev, [uploadKey]: progress }));
        },
        (error) => {
            console.error("Upload failed:", error);
            toast({ title: 'Upload Failed', description: 'Could not upload file.', variant: 'destructive'});
            setUploadingFiles(prev => {
                const newUploading = { ...prev };
                delete newUploading[uploadKey];
                return newUploading;
            });
        },
        async () => {
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const newUpload: DocumentUpload = {
                    serviceId,
                    requirementLabel,
                    type: 'file',
                    fileUrl: downloadURL,
                    fileName: file.name,
                    uploadedAt: Timestamp.now(),
                    status: 'pending', // Subcontractor uploads default to pending review by My Accountant
                };

                const currentUploads = order.documentUploads || [];
                const filteredUploads = currentUploads.filter(
                    d => !(d.serviceId === serviceId && d.requirementLabel === requirementLabel)
                );
                const updatedUploads = [...filteredUploads, newUpload];

                const orderRef = doc(db, 'orders', order.id);
                await updateDoc(orderRef, {
                    documentUploads: updatedUploads
                });

                toast({ title: 'File Uploaded', description: `${file.name} submitted for review.`});
                await fetchOrderDetails();
            } catch (error) {
                console.error("Error saving document:", error);
                toast({ title: 'Error', description: 'Failed to record document upload.', variant: 'destructive' });
            } finally {
                setUploadingFiles(prev => {
                    const newUploading = { ...prev };
                    delete newUploading[uploadKey];
                    return newUploading;
                });
            }
        }
    );
  };

  const handleTextSubmit = async (serviceId: string, requirementLabel: string) => {
    const text = textInputs[requirementLabel];
    if (!currentUser || !order || !text?.trim()) {
         toast({ title: "Cannot Submit", description: "The field cannot be empty.", variant: "destructive" });
         return;
    }

    const newUpload: DocumentUpload = {
        serviceId,
        requirementLabel,
        type: 'text',
        textValue: text,
        uploadedAt: Timestamp.now(),
        status: 'pending',
    };

    try {
        const currentUploads = order.documentUploads || [];
        const filteredUploads = currentUploads.filter(
            d => !(d.serviceId === serviceId && d.requirementLabel === requirementLabel)
        );
        const updatedUploads = [...filteredUploads, newUpload];

        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
            documentUploads: updatedUploads
        });

        toast({ title: 'Information Submitted', description: 'Text response submitted for review.' });
        setTextInputs(prev => ({...prev, [requirementLabel]: ''}));
        await fetchOrderDetails();
    } catch (error) {
        console.error("Error submitting text:", error);
        toast({ title: "Submission Failed", description: "Could not save response.", variant: "destructive" });
    }
  };

  const handlePostNote = async () => {
    if (!newNoteText.trim() || !order || !currentUser) return;
    setIsActionLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const newNote: OrderNote = {
        text: `Subcontractor Note: "${newNoteText}"`,
        authorId: currentUser.uid,
        date: Timestamp.now(),
        type: 'note',
        subject: null,
        attachments: null,
      };

      await updateDoc(orderRef, {
        notes: arrayUnion(newNote),
      });

      toast({ title: "Note Posted", description: "Note added to internal history." });
      setNewNoteText('');
      await fetchOrderDetails();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to post note", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitFulfillment = async () => {
    if (!order) return;
    setIsActionLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        overflowStatus: 'review',
        overflowSubmittedAt: Timestamp.now(),
      });

      // Add audit log note
      const newNote = {
        text: "Subcontractor marked job as ready and submitted deliverables for admin review.",
        authorId: currentUser?.uid || 'system',
        date: Timestamp.now(),
        type: 'note',
      };
      await updateDoc(orderRef, { notes: arrayUnion(newNote) });

      toast({
        title: "Submitted for Review",
        description: "My Accountant admins have been notified of your completion.",
      });
      await fetchOrderDetails();
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to Submit",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusVariant = (status: Order['status'] | 'Outsourced') => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Processing': return 'info';
      case 'Outsourced': return 'info';
      case 'Pending Payment': return 'warning';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return notFound();

  // Mask client identity
  const maskedClientName = `Client #${order.id.substring(0, 8)}`;

  return (
    <div className="space-y-8">
        <div>
            <Button variant="outline" asChild>
                <Link href="/partner/overflow-board">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Job Board
                </Link>
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                {/* Order Details Header */}
                <Card className="border border-slate-200/80 shadow-md">
                    <CardHeader>
                        <CardTitle>Overflow Subcontract Fulfillment</CardTitle>
                        <CardDescription>
                          Date claimed: {order.overflowClaimedAt ? format(new Date(order.overflowClaimedAt), 'dd MMMM yyyy') : 'N/A'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-xs uppercase tracking-wider">Job Items</h3>
                                <div className="space-y-4">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                                    </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-xs uppercase tracking-wider">Client (Masked)</h3>
                                <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-lg p-3">
                                    <p className="font-bold text-slate-800">{maskedClientName}</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                      Client contact details and name have been masked for subcontractor privacy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Fulfillment Requirements */}
                <Card className="border border-slate-200/80 shadow-md">
                    <CardHeader>
                        <CardTitle>Required Deliverables</CardTitle>
                        <CardDescription>Upload files or responses to fulfill the client order requirements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-6">
                            {orderItemsWithServices.map(item => (
                                <div key={item.id} className="space-y-3">
                                    <h4 className="font-bold text-sm text-slate-900 border-b pb-1.5">{item.title}</h4>
                                    {item.service.informationToProvide.length > 0 ? (
                                        <ul className="space-y-4 pl-2">
                                            {item.service.informationToProvide.map((req, index) => {
                                                const upload = order.documentUploads?.find(d => (d.serviceId === item.id || d.serviceId === item.service?.id) && d.requirementLabel === req.label);
                                                const uploadKey = `${item.id}-${req.label}`;
                                                
                                                return (
                                                    <li key={index} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-xs text-slate-700">{req.label}</p>
                                                            {upload ? (
                                                                 <Badge variant={upload.status === 'approved' ? 'success' : upload.status === 'rejected' ? 'destructive' : 'warning'} className="font-bold uppercase text-[9px]">
                                                                    {upload.status}
                                                                </Badge>
                                                            ) : <Badge variant="secondary" className="font-bold uppercase text-[9px]">Pending</Badge>}
                                                        </div>

                                                        {upload ? (
                                                            <div className="space-y-2">
                                                                {upload.type === 'file' ? (
                                                                    <a href={upload.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                                        <Download className="h-4 w-4" /> {upload.fileName}
                                                                    </a>
                                                                ) : (
                                                                    <p className="text-xs p-2.5 bg-muted rounded-md border text-slate-600">"{upload.textValue}"</p>
                                                                )}
                                                                 
                                                                {upload.status === 'rejected' && upload.rejectionReason && (
                                                                    <div className="text-xs text-destructive bg-red-50 border border-red-100 rounded-md p-2 flex items-start gap-1.5">
                                                                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                                                                        <span><strong>Feedback:</strong> {upload.rejectionReason}</span>
                                                                    </div>
                                                                )}

                                                                {/* Resubmission widget for rejected / pending items */}
                                                                {(upload.status === 'rejected' || upload.status === 'pending') && (
                                                                    <div className="pt-2 border-t border-slate-100 space-y-2">
                                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Upload Replacement / Update:</p>
                                                                        {req.type === 'pdf' ? (
                                                                            uploadingFiles[uploadKey] !== undefined ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                                                    <p className="text-xs text-muted-foreground">Uploading... {Math.round(uploadingFiles[uploadKey])}%</p>
                                                                                </div>
                                                                            ) : (
                                                                                <Input 
                                                                                    type="file" 
                                                                                    accept="application/pdf,image/*" 
                                                                                    className="h-9 cursor-pointer text-xs" 
                                                                                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], item.id, req.label)} 
                                                                                />
                                                                            )
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <Input 
                                                                                    type="text" 
                                                                                    className="h-9 text-xs" 
                                                                                    placeholder="Enter information here..." 
                                                                                    value={textInputs[req.label] || ''} 
                                                                                    onChange={(e) => setTextInputs(prev => ({...prev, [req.label]: e.target.value}))} 
                                                                                />
                                                                                <Button size="sm" className="h-9" onClick={() => handleTextSubmit(item.id, req.label)}>Resubmit</Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                {req.type === 'pdf' ? (
                                                                    uploadingFiles[uploadKey] !== undefined ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                                            <p className="text-xs text-muted-foreground">Uploading... {Math.round(uploadingFiles[uploadKey])}%</p>
                                                                        </div>
                                                                    ) : (
                                                                        <Input 
                                                                            type="file" 
                                                                            accept="application/pdf,image/*" 
                                                                            className="h-9 cursor-pointer text-xs" 
                                                                            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], item.id, req.label)} 
                                                                        />
                                                                    )
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <Input 
                                                                            type="text" 
                                                                            className="h-9 text-xs" 
                                                                            placeholder="Enter response here..." 
                                                                            value={textInputs[req.label] || ''} 
                                                                            onChange={(e) => setTextInputs(prev => ({...prev, [req.label]: e.target.value}))} 
                                                                        />
                                                                        <Button size="sm" className="h-9" onClick={() => handleTextSubmit(item.id, req.label)}>Submit</Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : <p className="text-xs text-muted-foreground pl-2 italic">No specific deliverables required.</p>}
                                </div>
                            ))}
                         </div>
                    </CardContent>
                </Card>

                {/* Internal Communication Card */}
                <Card className="border border-slate-200/80 shadow-md">
                    <CardHeader>
                        <CardTitle>Communication Logs</CardTitle>
                        <CardDescription>Post progress updates and view internal notes regarding this job.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Textarea 
                              placeholder="Write a message or update to the admin team..."
                              value={newNoteText}
                              onChange={(e) => setNewNoteText(e.target.value)}
                              rows={3}
                            />
                            <Button size="sm" onClick={handlePostNote} disabled={isActionLoading || !newNoteText.trim()}>
                              {isActionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}
                              Post Update Note
                            </Button>
                        </div>
                        
                        <Separator />

                        <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                            {order.notes && order.notes.length > 0 ? (
                                order.notes.slice().reverse().map((note, index) => {
                                    // Skip system emails to direct clients to preserve data isolation
                                    if (note.type === 'email') return null;
                                    
                                    const isSubcontractorNote = note.text.startsWith('Subcontractor Note:');
                                    
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className={`p-3 rounded-lg w-full ${isSubcontractorNote ? 'bg-primary/5 border border-primary/10' : 'bg-slate-50 border'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                      {isSubcontractorNote ? 'Your Practice' : 'My Accountant Support'}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">{format(new Date(note.date), 'dd/MM/yyyy, HH:mm')}</p>
                                                </div>
                                                <p className="text-xs text-slate-700 leading-relaxed">{note.text}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">No communication history logged yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Sidebar Column */}
            <div className="lg:col-span-1 space-y-6 sticky top-24">
                 <Card className="border border-slate-200/80 shadow-md">
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
                       <ClipboardCheck className="h-5 w-5 text-primary"/>
                       <CardTitle className="text-lg font-bold">Fulfillment Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                       <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Workflow:</span>
                           <Badge variant={order.overflowStatus === 'review' ? 'warning' : 'info'} className="font-bold uppercase text-[9px]">
                               {order.overflowStatus === 'review' ? 'Under Review' : 'Active'}
                           </Badge>
                       </div>
                       
                       <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Payout value:</span>
                           <span className="font-bold text-primary">{formatPrice(order.overflowPayout || 0)}</span>
                       </div>

                       {order.overflowDeadline && (
                           <div className="flex justify-between items-center">
                               <span className="text-muted-foreground">Deadline:</span>
                               <span className="font-semibold text-slate-800">{format(new Date(order.overflowDeadline), 'dd/MM/yyyy')}</span>
                           </div>
                       )}

                       <Separator />

                       {order.overflowStatus !== 'review' ? (
                           <div className="space-y-2">
                               <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] text-slate-600 leading-relaxed flex gap-1.5 items-start">
                                   <Info className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                                   <span>Once all required documents are uploaded and completed, click below to submit for administrator verification.</span>
                               </div>
                               <Button 
                                 className="w-full font-bold text-xs" 
                                 onClick={handleSubmitFulfillment}
                                 disabled={isActionLoading}
                               >
                                   {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <CheckCircle className="h-4 w-4 mr-2"/>}
                                   Submit Fulfillment Review
                               </Button>
                           </div>
                       ) : (
                           <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 space-y-2 leading-relaxed">
                               <div className="flex items-center gap-1.5 font-bold">
                                   <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                   <span>Under Admin Review</span>
                               </div>
                               <p className="text-[10px] text-amber-700">
                                 Deliverables have been submitted. Admins will verify the documents and approve/reject them.
                               </p>
                           </div>
                       )}
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
