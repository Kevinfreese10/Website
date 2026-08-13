'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, getDocs, where, query, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from '@/lib/firebase';
import { Order, Service, User, OrderNote, DocumentUpload } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, User as UserIcon, Users, Mail, Phone, Send, FileText, Star, MessageSquare, Percent, CheckCircle, AlertTriangle, XCircle, Download, Info, Paperclip, Sparkles, BellRing, Briefcase, Clock, Lock, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import PartnerAssignmentEmail from '@/components/emails/PartnerAssignmentEmail';
import { notifyOfNewNote, sendDocumentReviewFeedback, sendOutstandingDocumentsReminder } from '@/app/actions';
import { proofreadNote } from '@/ai/flows/proofread-note';
import { customAlphabet } from 'nanoid';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

type OrderItemWithService = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  service: Service;
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

const noteFormSchema = z.object({
  noteText: z.string().optional(),
  attachments: z.any().optional(),
  isInternal: z.boolean().optional(),
}).refine(data => (data.noteText && data.noteText.trim().length >= 3) || (data.attachments && data.attachments.length > 0), {
  message: "Note must be at least 3 characters or include an attachment.",
  path: ["noteText"],
});

const rejectionFormSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason for rejection.'),
});

export default function AdminOrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItemsWithServices, setOrderItemsWithServices] = useState<OrderItemWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const id = params.id as string;
  const [assignee, setAssignee] = useState<User | null>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isProofreading, setIsProofreading] = useState(false);
  const [isGeneratingDiscount, setIsGeneratingDiscount] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [noteTab, setNoteTab] = useState<'all' | 'public' | 'internal'>('all');

  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<DocumentUpload | null>(null);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const [isCustomDocOpen, setIsCustomDocOpen] = useState(false);
  const [customDocLabel, setCustomDocLabel] = useState('');
  const [customDocType, setCustomDocType] = useState<'pdf' | 'text'>('pdf');
  const [isSubmittingCustomDoc, setIsSubmittingCustomDoc] = useState(false);

  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { noteText: "" },
  });

  const rejectionForm = useForm<z.infer<typeof rejectionFormSchema>>({
    resolver: zodResolver(rejectionFormSchema),
    defaultValues: { reason: '' },
  });

  const fetchOrderAndStaff = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const staffQuery = query(collection(db, "users"), where('role', 'in', ['staff', 'admin', 'partner', 'partner_staff', 'ai_accountant']));
        const staffSnapshot = await getDocs(staffQuery);
        const fetchedStaff = staffSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id, id: doc.id } as User));
        setAllStaff(fetchedStaff);

        const servicesQuery = query(collection(db, "services"));
        const servicesSnapshot = await getDocs(servicesQuery);
        const fetchedServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setAllServices(fetchedServices);

        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          let fetchedOrder: Order = {
            ...data,
            id: docSnap.id,
            date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
            notes: (data.notes || []).map((note: any) => ({...note, date: note.date?.toDate ? note.date.toDate() : new Date(note.date), subject: note.subject || null, attachments: note.attachments || null})),
            documentUploads: (data.documentUploads || []).map((doc: any) => ({...doc, uploadedAt: doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toISOString() : (doc.uploadedAt ? (typeof doc.uploadedAt === 'string' ? doc.uploadedAt : new Date(doc.uploadedAt).toISOString()) : new Date().toISOString())})),
          } as Order;
          
          if (fetchedOrder.originalOrderId) {
                const originalOrderRef = doc(db, 'orders', fetchedOrder.originalOrderId);
                const originalOrderSnap = await getDoc(originalOrderRef);
                if (originalOrderSnap.exists()) {
                    const originalOrderData = originalOrderSnap.data();
                    if (fetchedOrder.resellerId && !fetchedOrder.endCustomerEmail) {
                        fetchedOrder.endCustomerName = originalOrderData.customerName;
                        fetchedOrder.endCustomerEmail = originalOrderData.customerEmail;
                    }
                    fetchedOrder.documentUploads = (originalOrderData.documentUploads || []).map((doc: any) => ({
                        ...doc,
                        uploadedAt: doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toISOString() : (doc.uploadedAt ? (typeof doc.uploadedAt === 'string' ? doc.uploadedAt : new Date(doc.uploadedAt).toISOString()) : new Date().toISOString())
                    }));
                }
          }

          setOrder(fetchedOrder);
          
          if (fetchedOrder.assignedTo && fetchedOrder.assignedTo.length > 0) {
            const assignedUser = fetchedStaff.find(u => u.uid === fetchedOrder.assignedTo![0]);
            setAssignee(assignedUser || null);
          }

          const itemsWithServices = fetchedOrder.items.map(item => {
            const serviceDetails = fetchedServices.find(s => 
              s.id === item.id || 
              s.title.toLowerCase() === item.id.toLowerCase() || 
              s.title.toLowerCase() === item.title.toLowerCase() ||
              s.slug === item.id
            );
            if (!serviceDetails) return { ...item, service: null };
            return { ...item, service: serviceDetails };
          }).filter(item => item.service !== null) as OrderItemWithService[];

          setOrderItemsWithServices(itemsWithServices);

        } else {
          notFound();
        }
      } catch (error) {
        console.error("Error fetching order details: ", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchOrderAndStaff();
  }, [id]);

  const onNoteSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    if (!currentUser || !order) return;
    
    let isLoadingToast = toast({ title: 'Adding note...', description: 'Please wait.' });
    let attachments: { name: string; url: string }[] = [];
    const files = values.attachments || [];

    if (files.length > 0) {
        isLoadingToast.update({ id: isLoadingToast.id, title: `Uploading ${files.length} file(s)...` });
      try {
        const uploadPromises = Array.from(files).map(async (file: any) => {
            const uniqueFileName = `${Date.now()}-${file.name}`;
            const storageRef = ref(storage, `orders/${order.id}/notes/${uniqueFileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            const snapshot = await uploadTask;
            const downloadURL = await getDownloadURL(snapshot.ref);
            return { name: file.name, url: downloadURL };
        });

        attachments = await Promise.all(uploadPromises);
        isLoadingToast.update({ id: isLoadingToast.id, title: 'Attachments Uploaded' });
      } catch (error) {
        console.error('Attachment upload failed:', error);
        toast({ title: 'Attachment Upload Failed', variant: 'destructive' });
        isLoadingToast.dismiss();
        return;
      }
    }

    const isInternalNote = !!values.isInternal;
    const newNote: OrderNote = {
      text: values.noteText || "",
      authorId: currentUser.uid,
      date: Timestamp.now(),
      type: 'note',
      isInternal: isInternalNote,
      subject: null,
      attachments: attachments.length > 0 ? attachments : null,
    };

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        notes: arrayUnion(newNote),
      });

      if (!isInternalNote) {
        const isOutsourced = !!order.resellerId;
        const isToClient = !(isOutsourced && order.documentContact === 'partner');
        const emailTo = (isOutsourced && order.documentContact === 'client' ? order.endCustomerEmail : order.customerEmail) || order.customerEmail;
        const recipientName = (isOutsourced && order.documentContact === 'client' ? order.endCustomerName : order.customerName) || order.customerName || 'Client';

        if (emailTo) {
            notifyOfNewNote({
                recipientEmail: emailTo,
                recipientName: recipientName,
                senderName: currentUser.name || 'Admin',
                orderId: order.originalOrderId || order.id,
                notePreview: (values.noteText || "").substring(0, 150) + ((values.noteText || "").length > 150 ? '...' : ''),
                actionUrl: isToClient 
                    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`
                    : `${process.env.NEXT_PUBLIC_APP_URL}/partner/orders/${order.id}`,
                isToClient: isToClient,
                resellerId: isToClient ? order.resellerId : undefined
            }).catch(err => console.error("Failed to send note notification:", err));
        }
      }

      toast({ 
        title: isInternalNote ? "Internal Note Added 🔒" : "Note Added", 
        description: isInternalNote ? "Saved internally. Client cannot see this note." : "Your note has been saved and client notified." 
      });
      noteForm.reset();
      await fetchOrderAndStaff(); 
    } catch (error) {
      console.error("Error adding note:", error);
      toast({ title: "Error", description: "Failed to add note.", variant: "destructive" });
    } finally {
        isLoadingToast.dismiss();
    }
  };

  const handleProofread = async () => {
    const currentNote = noteForm.getValues('noteText');
    if (!currentNote || currentNote.trim().length < 10) {
      toast({ title: "Not enough text", description: "Please write a longer note to proofread.", variant: "destructive" });
      return;
    }
    setIsProofreading(true);
    try {
      const result = await proofreadNote({ text: currentNote });
      if (result && result.success && result.proofreadText) {
        noteForm.setValue('noteText', result.proofreadText);
        toast({ title: "Note Proofread", description: "Your note has been improved by AI." });
      } else {
        throw new Error(result?.error || "Failed to proofread note.");
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Proofreading Failed", description: e.message || "Failed to proofread note.", variant: "destructive" });
    } finally {
      setIsProofreading(false);
    }
  };

   const handleDocumentStatusUpdate = async (identifier: string, status: 'approved' | 'rejected', reason?: string) => {
    if (!order) return;
    const updatedUploads = (order.documentUploads || []).map(doc => {
      const docId = doc.type === 'file' ? doc.fileUrl : doc.textValue;
      if (docId === identifier) {
        return { ...doc, status, rejectionReason: reason || null };
      }
      return doc;
    });

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { documentUploads: updatedUploads });
      
      if (order.originalOrderId) {
        const originalOrderRef = doc(db, 'orders', order.originalOrderId);
        await updateDoc(originalOrderRef, { documentUploads: updatedUploads });
      }
      
      toast({ title: 'Document Status Updated', description: `The document has been ${status}.`});
      fetchOrderAndStaff();
    } catch (error) {
      console.error("Error updating document status:", error);
      toast({ title: 'Error', description: 'Failed to update document status.', variant: "destructive" });
    }
  };

  const handleBatchApprove = async () => {
    if (!order || !order.documentUploads) return;
    const updatedUploads = (order.documentUploads || []).map(doc => {
      if (doc.status === 'pending') {
        return { ...doc, status: 'approved' as const, rejectionReason: null };
      }
      return doc;
    });

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { documentUploads: updatedUploads });
      
      if (order.originalOrderId) {
        const originalOrderRef = doc(db, 'orders', order.originalOrderId);
        await updateDoc(originalOrderRef, { documentUploads: updatedUploads });
      }
      
      toast({ title: 'Documents Approved', description: 'All pending documents have been approved.'});
      fetchOrderAndStaff();
    } catch (error) {
      console.error("Error batch approving documents:", error);
      toast({ title: 'Error', description: 'Failed to batch approve documents.', variant: "destructive" });
    }
  };

  const handleRequestCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !customDocLabel.trim()) return;

    setIsSubmittingCustomDoc(true);
    
    const newRequest: DocumentUpload = {
      serviceId: order.items[0]?.id || 'custom',
      requirementLabel: customDocLabel.trim(),
      type: customDocType === 'pdf' ? 'file' : 'text',
      uploadedAt: Timestamp.now(),
      status: 'pending',
    };

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        documentUploads: arrayUnion(newRequest)
      });

      if (order.originalOrderId) {
        const originalOrderRef = doc(db, 'orders', order.originalOrderId);
        await updateDoc(originalOrderRef, {
          documentUploads: arrayUnion(newRequest)
        });
      }

      toast({ title: 'Request Sent', description: `Requested: "${customDocLabel}"` });
      setIsCustomDocOpen(false);
      setCustomDocLabel('');
      setCustomDocType('pdf');
      fetchOrderAndStaff();
    } catch (error) {
      console.error("Error requesting custom document:", error);
      toast({ title: 'Error', description: 'Failed to request document.', variant: "destructive" });
    } finally {
      setIsSubmittingCustomDoc(false);
    }
  };

  const handleOpenRejectionDialog = (doc: DocumentUpload) => {
    setDocumentToReject(doc);
    rejectionForm.reset();
    setIsRejectionDialogOpen(true);
  };
  
  const handleRejectionSubmit = async (values: z.infer<typeof rejectionFormSchema>) => {
    if (documentToReject) {
        const identifier = documentToReject.type === 'file' ? documentToReject.fileUrl! : documentToReject.textValue!;
        await handleDocumentStatusUpdate(identifier, 'rejected', values.reason);
        setIsRejectionDialogOpen(false);
        setDocumentToReject(null);
    }
  };

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Processing':
        return 'info';
      case 'Pending Payment': return 'warning';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };
  
  const getAuthor = (authorId: string): { name: string } | undefined => {
    if (authorId === 'system') return { name: 'My Accountant (System)' };
    if (order && authorId === order.userId) return { name: order.endCustomerName || order.customerName };
    if (order?.resellerId && authorId === order.resellerId) {
        const reseller = allStaff.find(u => u.uid === order.resellerId);
        return { name: reseller?.companyName || reseller?.name || 'Practice Owner' };
    }
    const staff = allStaff.find(u => u.uid === authorId || u.id === authorId);
    if (staff) return staff;
    return undefined;
  }
  
    const allDocumentsReviewed = order?.documentUploads && order.documentUploads.length > 0 && order.documentUploads.every(d => d.status !== 'pending');

    const handleSendFeedback = async () => {
        if (!order || !order.documentUploads) return;
        
        const isOutsourced = !!order.resellerId;
        const emailTo = (isOutsourced && order.documentContact === 'client' ? order.endCustomerEmail : order.customerEmail) || order.customerEmail;
        const clientName = (isOutsourced && order.documentContact === 'client' ? order.endCustomerName : order.customerName) || order.customerName;

        if (!emailTo || !clientName) {
            toast({ title: "Cannot send feedback", description: "Missing client contact details.", variant: "destructive" });
            return;
        }

        setIsSendingFeedback(true);
        toast({ title: "Sending Feedback...", description: "Notifying the client of the document review status." });

        try {
            await sendDocumentReviewFeedback({
                orderId: order.originalOrderId || order.id,
                clientName: clientName,
                clientEmail: emailTo,
                documentUploads: order.documentUploads,
                resellerId: order.resellerId
            });

             const emailNote: OrderNote = {
                text: `Sent 'Document Review Feedback' email to ${emailTo}.`,
                subject: `Feedback on Your Submitted Documents for Order #${order.originalOrderId || order.id}`,
                authorId: currentUser?.uid || 'system',
                date: Timestamp.now(),
                type: 'email',
                attachments: null,
            };

            const orderRef = doc(db, 'orders', order.id);
            await updateDoc(orderRef, {
                notes: arrayUnion(emailNote),
            });
            await fetchOrderAndStaff();

            toast({ title: "Feedback Sent!", description: "The client has been notified of the review outcome." });
        } catch(e) {
            console.error(e);
            toast({ title: "Failed to Send Feedback", variant: "destructive" });
        } finally {
            setIsSendingFeedback(false);
        }
    }

    const handleSendFollowUp = async () => {
        if (!order) return;
        
        const isOutsourced = !!order.resellerId;
        const emailTo = (isOutsourced && order.documentContact === 'client' ? order.endCustomerEmail : order.customerEmail) || order.customerEmail;
        const clientName = (isOutsourced && order.documentContact === 'client' ? order.endCustomerName : order.customerName) || order.customerName;

        if (!emailTo || !clientName) {
            toast({ title: "Cannot send reminder", description: "Missing client contact details.", variant: "destructive" });
            return;
        }

        setIsSendingReminder(true);
        toast({ title: "Sending Reminder...", description: "Notifying the client of outstanding documents." });

        try {
            await sendOutstandingDocumentsReminder({
                orderId: order.originalOrderId || order.id,
                clientName: clientName,
                clientEmail: emailTo,
                resellerId: order.resellerId
            });

             const emailNote: OrderNote = {
                text: `Sent 'Outstanding Documents Reminder' email to ${emailTo}.`,
                subject: `Action Required: Outstanding Documents for Order #${order.originalOrderId || order.id}`,
                authorId: currentUser?.uid || 'system',
                date: Timestamp.now(),
                type: 'email',
                attachments: null,
            };

            const orderRef = doc(db, 'orders', order.id);
            await updateDoc(orderRef, {
                notes: arrayUnion(emailNote),
            });
            await fetchOrderAndStaff();

            toast({ title: "Reminder Sent!", description: "The client has been notified to log in and upload missing items." });
        } catch(e) {
            console.error(e);
            toast({ title: "Failed to Send Reminder", variant: "destructive" });
        } finally {
            setIsSendingReminder(false);
        }
    }
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!order) return notFound();
  
  const isOutsourced = !!order.resellerId;
  const resellerDetails = isOutsourced ? allStaff.find(u => u.uid === order.resellerId) : null;
  const contactIsClient = isOutsourced && order.documentContact === 'client';
  const contactName = contactIsClient ? order.endCustomerName : (isOutsourced ? resellerDetails?.companyName || resellerDetails?.name : order.customerName);

  const generateNoteTemplate = (type: 'docs' | 'payment' | 'review' | 'outstanding_docs') => {
      let text = `Hi ${contactName?.split(' ')[0]},\n\n`;
      const orderId = order.originalOrderId || order.id;

      if (type === 'payment') {
          text += `This is a friendly reminder that your invoice for order #${orderId} is still outstanding. Please make payment at your earliest convenience to proceed.\n\n`;
      } else if (type === 'docs') {
          text += `This is a reminder to please upload the required documents for your order #${orderId} so that we can begin processing it.\n\n`;
      } else if (type === 'outstanding_docs') {
          const outstandingRequirements: string[] = [];
          orderItemsWithServices.forEach(item => {
              item.service?.informationToProvide?.forEach(req => {
                  const upload = order.documentUploads?.find(d => (d.serviceId === item.id || d.serviceId === item.service?.id) && d.requirementLabel === req.label);
                  if (!upload || upload.status === 'pending' || upload.status === 'rejected') {
                      const statusLabel = upload ? `(${upload.status})` : '(missing)';
                      outstandingRequirements.push(`- ${req.label} ${statusLabel}`);
                  }
              });
          });
          text += `This is a reminder that we still require the following outstanding information / documents for order #${orderId} before we can proceed:\n\n`;
          if (outstandingRequirements.length > 0) {
              text += outstandingRequirements.join('\n') + '\n\n';
          } else {
              text += `Please check the portal for outstanding items.\n\n`;
          }
          text += `Please log in to the portal and upload these items at your earliest convenience.\n\n`;
      } else if (type === 'review') {
          text += `We hope you were happy with our service for order #${orderId}. If you have a moment, we would greatly appreciate it if you could leave us a review on Google at the link below:\n\n<a href="https://g.page/r/CVIOzn2bYoiaEAE/review" target="_blank" style="color: blue;">https://g.page/r/CVIOzn2bYoiaEAE/review</a>\n\n`;
      }
      
      text += 'Kind regards,\nThe My Accountant Team';
      noteForm.setValue('noteText', text);
  }
  
  const handleGenerateDiscount = async () => {
    if (!order) return;
    if (order.discountCode) {
      toast({ title: 'Discount Already Generated', description: `Code: ${order.discountCode}`, variant: 'destructive' });
      return;
    }

    setIsGeneratingDiscount(true);
    const newDiscountCode = `WELCOME-${nanoid()}`;
    try {
      await setDoc(doc(db, "discounts", newDiscountCode), { percentage: 10, status: 'active', clientEmail: order.customerEmail, createdAt: Timestamp.now(), orderId: order.id });
      await updateDoc(doc(db, 'orders', order.id), { discountCode: newDiscountCode });
      setOrder(prev => prev ? { ...prev, discountCode: newDiscountCode } : null);
      toast({ title: 'Discount Generated!', description: `Code ${newDiscountCode} has been created.` });
    } catch (e) {
      toast({ title: 'Failed to generate discount', variant: 'destructive' });
    } finally {
      setIsGeneratingDiscount(false);
    }
  }


  return (
    <Dialog>
        <div className="space-y-8">
            <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reject Document</DialogTitle><DialogDescription>Provide a reason for rejection.</DialogDescription></DialogHeader>
                    <Form {...rejectionForm}>
                        <form onSubmit={rejectionForm.handleSubmit(handleRejectionSubmit)} className="space-y-4">
                            <FormField control={rejectionForm.control} name="reason" render={({ field }) => ( <FormItem><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
                            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setIsRejectionDialogOpen(false)}>Cancel</Button><Button type="submit" variant="destructive">Reject</Button></div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isCustomDocOpen} onOpenChange={setIsCustomDocOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Request Custom Document</DialogTitle>
                        <DialogDescription>
                            Ask the client to upload an additional document or provide specific information.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRequestCustomDoc} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Document / Info Name</label>
                            <Input 
                                placeholder="e.g. Proof of Business Address" 
                                value={customDocLabel} 
                                onChange={(e) => setCustomDocLabel(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Response Type</label>
                            <Select 
                                value={customDocType} 
                                onValueChange={(value: 'pdf' | 'text') => setCustomDocType(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">File Upload (PDF)</SelectItem>
                                    <SelectItem value="text">Text / Information Input</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsCustomDocOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmittingCustomDoc}>
                                {isSubmittingCustomDoc ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                                Send Request
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            <Button variant="outline" asChild><Link href="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link></Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order {order.originalOrderId || order.id}</CardTitle>
                            <div className="text-sm text-muted-foreground">Date: {format(new Date(order.date), 'dd/MM/yyyy')} | Status: <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge></div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><h3 className="font-semibold text-muted-foreground mb-2">Order Items</h3>
                                    <div className="space-y-4">{order.items.map((item: any) => ( <div key={item.id} className="flex justify-between items-center"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">Qty: {item.quantity}</p></div><p>{formatPrice(item.price)}</p></div> ))}</div>
                                    <Separator className="my-4" /><div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                                </div>
                                <div><h3 className="font-semibold text-muted-foreground mb-2">Contact Details</h3>
                                    <div className="space-y-3"><p className="font-semibold text-lg">{order.customerName}</p>{order.customerEmail && ( <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${order.customerEmail}`} className="text-primary hover:underline">{order.customerEmail}</a></div> )}{order.customerPhone && ( <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{order.customerPhone}</span></div> )}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div><CardTitle>Required Information</CardTitle><CardDescription>Information needed from the client.</CardDescription></div>
                                <div className="flex items-center gap-2">
                                    {order.documentUploads && order.documentUploads.some(d => d.status === 'pending') && (
                                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50" onClick={handleBatchApprove}>
                                            <CheckCircle className="h-4 w-4 mr-2"/>Approve All Pending
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => setIsCustomDocOpen(true)}>
                                        <FileText className="h-4 w-4 mr-2"/>Request Custom Doc
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleSendFollowUp} disabled={isSendingReminder}>{isSendingReminder ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageSquare className="h-4 w-4 mr-2"/>}Follow Up</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {orderItemsWithServices.map(item => (
                                <div key={item.id}><h4 className="font-semibold">{item.title}</h4>
                                    {item.service.informationToProvide.length > 0 ? (
                                        <ul className="mt-2 space-y-3 pl-4 border-l">
                                            {item.service.informationToProvide.map((req, index) => {
                                                const upload = order.documentUploads?.find(d => (d.serviceId === item.id || d.serviceId === item.service?.id) && d.requirementLabel === req.label);
                                                const identifier = upload ? (upload.type === 'file' ? upload.fileUrl! : upload.textValue!) : '';
                                                return (
                                                    <li key={index} className="pt-3"><div className="flex items-center justify-between"><p className="font-medium text-sm">{req.label}</p>{upload ? ( <Badge variant={upload.status === 'approved' ? 'success' : upload.status === 'rejected' ? 'destructive' : 'warning'}>{upload.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}{upload.status === 'rejected' && <AlertTriangle className="mr-1 h-3 w-3" />}{upload.status}</Badge> ) : <Badge variant="secondary">Pending</Badge>}</div>
                                                        {upload && ( <div className="mt-2 space-y-2">{upload.type === 'file' ? ( <a href={upload.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><Download className="h-4 w-4" /> {upload.fileName}</a> ) : ( <p className="text-sm p-2 bg-muted rounded-md mt-1">"{upload.textValue}"</p> )}{upload.status === 'pending' && ( <div className="flex items-center gap-2"><Button size="xs" variant="outline" onClick={() => handleDocumentStatusUpdate(identifier, 'approved')}>Approve</Button><Button size="xs" variant="destructive" onClick={() => handleOpenRejectionDialog(upload)}>Reject</Button></div> )}{upload.status === 'rejected' && upload.rejectionReason && ( <p className="text-xs text-destructive italic">Reason: {upload.rejectionReason}</p> )}</div> )}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : <p className="text-sm text-muted-foreground mt-2 pl-4">No specific information required.</p>}
                                </div>
                            ))}
                        </CardContent>
                        {order.documentUploads && order.documentUploads.length > 0 && allDocumentsReviewed && (
                            <CardFooter><Button onClick={handleSendFeedback} disabled={isSendingFeedback}>{isSendingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Notify Client of Review</Button></CardFooter>
                        )}
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Communication History</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => generateNoteTemplate('payment')}><Phone className="h-4 w-4 mr-2"/>Payment Follow-up</Button>
                                <Button size="sm" variant="outline" onClick={() => generateNoteTemplate('docs')}><FileText className="h-4 w-4 mr-2"/>Request Documents</Button>
                                <Button size="sm" variant="outline" onClick={() => generateNoteTemplate('outstanding_docs')}><AlertTriangle className="h-4 w-4 mr-2"/>Outstanding Info</Button>
                                <Button size="sm" variant="outline" onClick={() => generateNoteTemplate('review')}><Star className="h-4 w-4 mr-2"/>Request Review</Button>
                                <Button size="sm" variant="outline" onClick={handleGenerateDiscount} disabled={isGeneratingDiscount || !!order.discountCode}>{isGeneratingDiscount ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <Percent className="h-4 w-4 mr-2"/>}{order.discountCode ? 'Discount Generated' : 'Generate 10% Discount'}</Button>
                            </div>
                            <Separator className="my-4" />
                            <Form {...noteForm}>
                            <form onSubmit={noteForm.handleSubmit(onNoteSubmit)} className="space-y-4">
                                <FormField control={noteForm.control} name="noteText" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Add a new note..." {...field} rows={4} onPaste={(e) => {
                                    const items = e.clipboardData?.items;
                                    if (!items) return;
                                    for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                            const file = items[i].getAsFile();
                                            if (file) {
                                                const renamedFile = new File([file], `screenshot-${Date.now()}.png`, { type: file.type });
                                                const dataTransfer = new DataTransfer();
                                                const existing = noteForm.getValues('attachments');
                                                if (existing) {
                                                    Array.from(existing as FileList).forEach(f => dataTransfer.items.add(f));
                                                }
                                                dataTransfer.items.add(renamedFile);
                                                noteForm.setValue('attachments', dataTransfer.files);
                                            }
                                            break;
                                        }
                                    }
                                }} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={noteForm.control} name="attachments" render={({ field: { onChange, value, ...rest }}) => ( <FormItem><FormLabel>Attachments (optional)</FormLabel><FormControl><Input type="file" multiple onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl><FormMessage /></FormItem> )} />
                                
                                <FormField 
                                  control={noteForm.control} 
                                  name="isInternal" 
                                  render={({ field }) => (
                                    <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-amber-500/30 bg-amber-50/50 p-3">
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={!!field.value}
                                          onChange={(e) => field.onChange(e.target.checked)}
                                          className="h-4 w-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                                        />
                                      </FormControl>
                                      <div className="space-y-0.5">
                                        <FormLabel className="text-xs font-bold text-amber-800 flex items-center gap-1 cursor-pointer">
                                          <Lock className="h-3.5 w-3.5 text-amber-600" /> Internal Staff &amp; Partner Note
                                        </FormLabel>
                                        <p className="text-[11px] text-amber-700/80">
                                          Client will NOT see this note or receive an email notification.
                                        </p>
                                      </div>
                                    </FormItem>
                                  )} 
                                />

                                <div className="flex justify-between items-center"><div className="flex gap-2"><Button type="submit" size="sm" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Post Note</Button><Button type="button" variant="outline" size="sm" onClick={handleProofread} disabled={isProofreading}>{isProofreading ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <Sparkles className="mr-2" />}Proofread</Button></div></div>
                            </form>
                            </Form>
                             <Separator className="my-4" />
                            
                            {/* Notes Filter Tabs */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
                                <button
                                  type="button"
                                  onClick={() => setNoteTab('all')}
                                  className={`px-3 py-1 rounded-md transition-colors ${noteTab === 'all' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                  All ({order.notes?.length || 0})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNoteTab('public')}
                                  className={`px-3 py-1 rounded-md transition-colors ${noteTab === 'public' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                  Client Visible ({order.notes?.filter(n => !n.isInternal).length || 0})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNoteTab('internal')}
                                  className={`px-3 py-1 rounded-md transition-colors ${noteTab === 'internal' ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                  🔒 Internal ({order.notes?.filter(n => n.isInternal).length || 0})
                                </button>
                              </div>
                            </div>

                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {order.notes && order.notes.length > 0 ? (
                                    order.notes
                                      .slice()
                                      .reverse()
                                      .filter(n => {
                                        if (noteTab === 'public') return !n.isInternal;
                                        if (noteTab === 'internal') return n.isInternal;
                                        return true;
                                      })
                                      .map((note, index) => {
                                        const author = getAuthor(note.authorId);
                                        const isEmail = note.type === 'email';
                                        const isInternal = !!note.isInternal;
                                        return (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className={`p-3 rounded-lg w-full ${isInternal ? 'bg-amber-50/80 border border-amber-200/80' : 'bg-muted'}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-2">
                                                          <p className="text-xs font-semibold">{author?.name || 'System'}</p>
                                                          {isInternal && (
                                                            <Badge className="bg-amber-500/20 text-amber-800 hover:bg-amber-500/20 border-amber-300 text-[10px] py-0 h-4 flex items-center gap-1 font-bold">
                                                              <Lock className="h-2.5 w-2.5" /> Internal Note
                                                            </Badge>
                                                          )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{format(new Date(note.date), 'dd/MM/yyyy, HH:mm')}</p>
                                                    </div>
                                                    {isEmail ? ( <div><div className="flex items-center gap-2 mb-1"><Mail className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold">{note.subject}</p></div><p className="text-sm italic text-muted-foreground">"{note.text}"</p></div> ) : ( <p className="text-sm" dangerouslySetInnerHTML={{ __html: note.text.replace(/\n/g, '<br />') }} /> )}
                                                     {note.attachments && note.attachments.length > 0 && ( <div className="mt-2 space-y-1">{note.attachments.map((att, i) => ( <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><Paperclip className="h-4 w-4"/>{att.name}</a> ))}</div> )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : ( <p className="text-xs text-muted-foreground text-center py-4">No notes yet.</p> )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6 sticky top-24">
                    {assignee && ( <Card><CardHeader className="flex flex-row items-center gap-3 space-y-0"><UserIcon className="h-5 w-5 text-muted-foreground"/><CardTitle className="text-lg">Assigned To</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-4"><div><p className="font-semibold">{assignee.name}</p><p className="text-sm text-muted-foreground">{assignee.department}</p></div></div></CardContent></Card> )}


                </div>
            </div>
        </div>
    </Dialog>
  );
}
