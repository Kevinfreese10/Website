'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, getDocs, where, query, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Order, Service, User, OrderNote, DocumentUpload } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import { ProcessOrderModal } from '@/components/partner/ProcessOrderModal';
import { completeOrderWithRoyalty, outsourceOrderFromWallet } from '@/app/actions/wallet-actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  generateOrderDocumentDraftsAction, 
  regenerateOrderDraftWithFeedbackAction, 
  approveAndSendDraftToClientAction 
} from '@/app/actions/order-fulfillment-pipeline';
import { 
  reviewOrderDocumentAtomic, 
  transitionOrderStatusAtomic,
  requestCustomDocumentAtomic 
} from '@/app/actions/order-admin-actions';
import { submitClientDocumentUploadAction } from '@/app/actions/client-order-actions';
import { getAuth } from 'firebase/auth';
import { GeneratedDocumentDraft } from '@/lib/types';
import { ArrowLeft, Loader2, User as UserIcon, Users, Mail, Phone, Send, FileText, Star, MessageSquare, Percent, CheckCircle, AlertTriangle, XCircle, Download, Info, Paperclip, Sparkles, BellRing, Briefcase, Clock, Lock, Bot, ExternalLink, RefreshCw, FileSignature, History, Plus, ScrollText, Calendar, ShoppingBag, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { render } from '@react-email/components';
import { Input } from '@/components/ui/input';
import { proofreadNote } from '@/ai/flows/proofread-note';
import { customAlphabet } from 'nanoid';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notifyOfNewNote, notifyAllocatedUserOfInternalNote, sendDocumentReviewFeedback, sendOutstandingDocumentsReminder } from '@/app/actions';
import OrderPrerequisiteRequirementsCard from '@/components/orders/OrderPrerequisiteRequirementsCard';
import { NoteAttachmentsPreview } from '@/components/orders/NoteAttachmentsPreview';
import OrderTemplateSelectorDialog from '@/components/admin/OrderTemplateSelectorDialog';
import { AVAILABLE_DOCUMENT_TEMPLATES } from '@/lib/types';
import { db, firebaseApp } from '@/lib/firebase';

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

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function PartnerOrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItemsWithServices, setOrderItemsWithServices] = useState<OrderItemWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser } = useAuth();
  const { hasPlatformFee } = usePartner();
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const { toast } = useToast();
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isProofreading, setIsProofreading] = useState(false);
  const [isGeneratingDiscount, setIsGeneratingDiscount] = useState(false);
  const [noteTab, setNoteTab] = useState<'all' | 'public' | 'internal'>('all');
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<DocumentUpload | null>(null);
  const [isCustomDocOpen, setIsCustomDocOpen] = useState(false);
  const [customDocLabel, setCustomDocLabel] = useState('');
  const [customDocType, setCustomDocType] = useState<'pdf' | 'text'>('pdf');
  const [isSubmittingCustomDoc, setIsSubmittingCustomDoc] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const [textInputs, setTextInputs] = useState<{ [key: string]: string }>({});
  const [assignee, setAssignee] = useState<User | null>(null);

  // Attached files & Screenshots state for live preview
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft Document Templates States
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedDraftForFeedback, setSelectedDraftForFeedback] = useState<GeneratedDocumentDraft | null>(null);
  const [draftFeedbackText, setDraftFeedbackText] = useState('');
  const [isRegeneratingDraft, setIsRegeneratingDraft] = useState(false);
  const [sendingDraftId, setSendingDraftId] = useState<string | null>(null);

  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { noteText: "" },
  });

  const rejectionForm = useForm<z.infer<typeof rejectionFormSchema>>({
    resolver: zodResolver(rejectionFormSchema),
    defaultValues: { reason: '' },
  });

  const fetchOrder = async () => {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const staffQuery = query(collection(db, "users"), where('partnerId', '==', currentUser.partnerId || currentUser.uid));
        const staffSnapshot = await getDocs(staffQuery);
        const fetchedStaff = staffSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id, id: doc.id } as User));
        
        if (!fetchedStaff.some(s => s.id === currentUser.id)) {
            fetchedStaff.push(currentUser);
        }
        setAllStaff(fetchedStaff);

        const servicesQuery = query(collection(db, 'services'));
        const servicesSnapshot = await getDocs(servicesQuery);
        const fetchedServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setAllServices(fetchedServices);

        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          const targetPartnerId = currentUser.partnerId || currentUser.uid;
          const isAuthorized = 
            data.resellerId === targetPartnerId ||
            data.partnerId === targetPartnerId ||
            data.userId === targetPartnerId ||
            data.userId === currentUser.uid ||
            (currentUser.email && data.customerEmail === currentUser.email);

          if (!isAuthorized) {
             notFound();
             return;
          }

          const fetchedOrder = {
            ...data,
            id: docSnap.id,
            date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
            notes: (data.notes || []).map((note: any) => ({...note, date: note.date?.toDate ? note.date.toDate() : new Date(note.date), attachments: note.attachments || null})),
            documentUploads: (data.documentUploads || []).map((doc: any) => ({...doc, uploadedAt: doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toISOString() : (doc.uploadedAt ? (typeof doc.uploadedAt === 'string' ? doc.uploadedAt : new Date(doc.uploadedAt).toISOString()) : new Date().toISOString())})),
          } as Order;

          setOrder(fetchedOrder);

          if (fetchedOrder.assignedTo && fetchedOrder.assignedTo.length > 0) {
            try {
              const assigneeSnap = await getDoc(doc(db, 'users', fetchedOrder.assignedTo[0]));
              if (assigneeSnap.exists()) {
                setAssignee({ id: assigneeSnap.id, ...assigneeSnap.data() } as User);
              } else {
                setAssignee(null);
              }
            } catch (err) {
              console.error("Error loading assignee profile:", err);
              setAssignee(null);
            }
          } else {
            setAssignee(null);
          }

          const itemsWithServices = fetchedOrder.items.map(item => {
            const itemId = item.id || item.serviceId || item.title;
            const serviceDetails = fetchedServices.find(s => 
              s.id === itemId || 
              (item.id && s.title.toLowerCase() === item.id.toLowerCase()) || 
              s.title.toLowerCase() === item.title.toLowerCase() ||
              s.slug === itemId
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
    fetchOrder();
  }, [id, currentUser]);
  
  const onNoteSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    if (!currentUser || !order) return;

    let isLoadingToast = toast({ title: 'Adding note...', description: 'Please wait.' });
    let attachments: { name: string; url: string }[] = [];
    const filesToUpload = attachedFiles.length > 0 ? attachedFiles : (values.attachments ? Array.from(values.attachments as FileList) : []);

    if (filesToUpload.length > 0) {
      isLoadingToast.update({ id: isLoadingToast.id, title: `Uploading ${filesToUpload.length} file(s)...` });
      try {
        const uploadPromises = filesToUpload.map(async (file: any) => {
            const uniqueFileName = `${Date.now()}-${file.name}`;
            const storageRef = ref(storage, `uploads/${currentUser.uid}/orders/${order.id}/notes/${uniqueFileName}`);
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

      if (order.originalOrderId && order.originalOrderId !== order.id) {
        try {
          const origRef = doc(db, 'orders', order.originalOrderId);
          await updateDoc(origRef, { notes: arrayUnion(newNote) });
        } catch (syncErr) {
          console.error("Failed to sync note to master order:", syncErr);
        }
      }

      if (isInternalNote) {
        notifyAllocatedUserOfInternalNote({
          orderId: order.id,
          senderName: currentUser.name || currentUser.email || order.customerName || 'Partner',
          senderEmail: currentUser.email || undefined,
          noteText: values.noteText || '',
        }).catch(err => console.error("Failed to send internal note notification:", err));
      } else {
        const isToClient = order.documentContact === 'client';
        const emailTo = (isToClient ? order.endCustomerEmail : order.customerEmail) || order.customerEmail;
        const recipientName = ((isToClient ? order.endCustomerName : order.customerName) || order.customerName) || 'Client';

        if (emailTo && emailTo !== currentUser.email) {
            notifyOfNewNote({
                recipientEmail: emailTo,
                recipientName: recipientName,
                senderName: currentUser.name || 'Partner',
                orderId: order.originalOrderId || order.id,
                notePreview: (values.noteText || "").substring(0, 150) + ((values.noteText || "").length > 150 ? '...' : ''),
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`,
                isToClient: true,
                resellerId: order.resellerId
            }).catch(err => console.error("Failed to send note notification:", err));
        }
      }

      toast({ 
        title: isInternalNote ? "Internal Note Added 🔒" : "Note Added", 
        description: isInternalNote ? "Saved internally for staff and partners." : "Your note has been saved and client notified." 
      });
      noteForm.reset();
      setAttachedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchOrder();
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

  const generateNoteTemplate = (type: 'docs' | 'payment' | 'review') => {
      const contactName = (order?.documentContact === 'client' ? order?.endCustomerName : order?.customerName) || order?.customerName;
      let text = `Hi ${contactName?.split(' ')[0]},\n\n`;
      const orderId = order?.originalOrderId || order?.id;

      if (type === 'payment') {
          text += `This is a friendly reminder that your invoice for order #${orderId} is still outstanding. Please make payment at your earliest convenience to proceed.\n\n`;
      } else if (type === 'docs') {
          text += `This is a reminder to please upload the required documents for your order #${orderId} so that we can begin processing it.\n\n`;
      } else if (type === 'review') {
          text += `We hope you were happy with our service for order #${orderId}. If you have a moment, we would greatly appreciate it if you could leave us a review.\n\n`;
      }
      text += `Kind regards,\nThe ${currentUser?.companyName || 'My Accountant'} Team`;
      noteForm.setValue('noteText', text);
  };

  const handleGenerateDiscount = async () => {
    if (!order) return;
    const contactName = (order?.documentContact === 'client' ? order?.endCustomerName : order?.customerName) || order?.customerName;
    
    if (order.discountCode) {
      toast({ title: 'Discount Already Generated', description: `This order already has a discount code: ${order.discountCode}`, variant: 'destructive' });
      const text = `Hi ${contactName?.split(' ')[0]},\n\nAs a token of our appreciation for your business, here is your 10% discount code for your next order: ${order.discountCode}\n\nKind regards,\nThe ${currentUser?.companyName || 'My Accountant'} Team`;
      noteForm.setValue('noteText', text);
      return;
    }

    setIsGeneratingDiscount(true);
    toast({ title: 'Generating Discount...', description: 'Please wait a moment.' });

    const newDiscountCode = `WELCOME-${nanoid()}`;
    const discountData = {
        percentage: 10,
        status: 'active',
        clientEmail: order.customerEmail,
        createdAt: Timestamp.now(),
        orderId: order.id,
    };
    
    try {
      await setDoc(doc(db, "discounts", newDiscountCode), discountData);
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { discountCode: newDiscountCode });
      
      setOrder(prev => prev ? { ...prev, discountCode: newDiscountCode } : null);
      
      const text = `Hi ${contactName?.split(' ')[0]},\n\nAs a token of our appreciation for your business, here is your 10% discount code for your next order: ${newDiscountCode}\n\nKind regards,\nThe ${currentUser?.companyName || 'My Accountant'} Team`;
      noteForm.setValue('noteText', text);
      toast({ title: 'Discount Generated!', description: `Code ${newDiscountCode} has been created and saved.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to generate discount', variant: 'destructive' });
    } finally {
      setIsGeneratingDiscount(false);
    }
  };

  const handleDocumentStatusUpdate = async (identifier: string, status: 'approved' | 'rejected', reason?: string) => {
    if (!order) return;
    try {
      const auth = getAuth(firebaseApp);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast({ title: 'Authentication Error', description: 'Please log in to review documents.', variant: 'destructive' });
        return;
      }

      const res = await reviewOrderDocumentAtomic(order.id, identifier, status, idToken, reason);
      if (res.success) {
        toast({ title: 'Document Status Updated', description: `The document has been ${status}.`});
        fetchOrder();
      } else {
        toast({ title: 'Update Failed', description: res.error || 'Failed to update document status.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Error updating document status:", error);
      toast({ title: 'Error', description: error?.message || 'Failed to update document status.', variant: "destructive" });
    }
  };

  const handleBatchApprove = async () => {
    if (!order || !order.documentUploads) return;
    try {
      const auth = getAuth(firebaseApp);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast({ title: 'Authentication Error', description: 'Please log in to review documents.', variant: 'destructive' });
        return;
      }

      const pendingDocs = order.documentUploads.filter(d => d.status === 'pending');
      for (const doc of pendingDocs) {
        const identifier = doc.requirementId || doc.id || (doc.type === 'file' ? doc.fileUrl : doc.textValue) || doc.requirementLabel;
        await reviewOrderDocumentAtomic(order.id, identifier, 'approved', idToken);
      }

      toast({ title: 'Documents Approved', description: 'All pending documents have been approved.'});
      fetchOrder();
    } catch (error: any) {
      console.error("Error batch approving documents:", error);
      toast({ title: 'Error', description: error?.message || 'Failed to batch approve documents.', variant: "destructive" });
    }
  };

  const handleOrderStatusTransition = async (newStatus: Order['status']) => {
    if (!order) return;

    // Intercept: show modal for Processing (wallet payment required)
    if (newStatus === 'Processing' && !order.isOutsourced) {
      setProcessModalOpen(true);
      return;
    }

    try {
      const auth = getAuth(firebaseApp);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast({ title: 'Authentication Error', description: 'Please log in to update order status.', variant: 'destructive' });
        return;
      }

      const res = await transitionOrderStatusAtomic(order.id, newStatus as any, idToken);
      if (res.success) {
        toast({ title: 'Order Status Updated', description: `Order is now ${newStatus}.` });
        fetchOrder();
      } else {
        toast({ title: 'Status Transition Blocked', description: res.error || 'Failed to update order status.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast({ title: 'Error', description: error?.message || 'Failed to update order status.', variant: 'destructive' });
    }
  };

  const handleRequestCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !customDocLabel.trim()) return;

    setIsSubmittingCustomDoc(true);

    try {
      const auth = getAuth(firebaseApp);
      const idToken = await auth.currentUser?.getIdToken();
      const performer = idToken || {
        id: currentUser?.id || 'partner',
        name: currentUser?.name || 'Partner',
        email: currentUser?.email || '',
        role: 'partner' as any,
      };

      const res = await requestCustomDocumentAtomic(
        order.id,
        order.items[0]?.id || 'custom',
        customDocLabel.trim(),
        customDocType === 'pdf' ? 'file' : 'text',
        performer
      );

      if (!res.success) {
        toast({ title: 'Error', description: res.error || 'Failed to request document.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Request Sent', description: `Requested: "${customDocLabel}"` });
      setIsCustomDocOpen(false);
      setCustomDocLabel('');
      setCustomDocType('pdf');
      fetchOrder();
    } catch (error: any) {
      console.error("Error requesting custom document:", error);
      toast({ title: 'Error', description: error.message || 'Failed to request document.', variant: "destructive" });
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

  const handleFileUpload = (file: File, serviceId: string, requirementLabel: string) => {
    if (!currentUser || !order) return;

    // Validation: Max 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size allowed is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
    const storageRef = ref(storage, `uploads/${currentUser.uid}/orders/${order.id}/${uniqueFileName}`);
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
            toast({ title: 'Upload Failed', description: error.message || 'Could not upload your file.', variant: 'destructive'});
            setUploadingFiles(prev => {
                const newUploading = { ...prev };
                delete newUploading[uploadKey];
                return newUploading;
            });
        },
        async () => {
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const auth = getAuth(firebaseApp);
                const idToken = await auth.currentUser?.getIdToken();

                if (!idToken) {
                    toast({ title: 'Authentication Error', description: 'Please log in again.', variant: 'destructive' });
                    return;
                }

                const res = await submitClientDocumentUploadAction({
                    idToken,
                    orderId: order.id,
                    serviceId,
                    requirementLabel,
                    type: 'file',
                    fileUrl: downloadURL,
                });

                if (!res.success) {
                    toast({ title: 'Upload Failed', description: res.error, variant: 'destructive' });
                    return;
                }

                toast({ title: 'File Uploaded', description: `${file.name} has been successfully submitted for review.` });
                await fetchOrder();
            } catch (error: any) {
                console.error("Error saving document:", error);
                toast({ title: 'Error', description: error.message || 'Failed to save document record.', variant: 'destructive' });
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

  const handleTextChange = (requirementLabel: string, value: string) => {
    setTextInputs(prev => ({ ...prev, [requirementLabel]: value }));
  };

  const handleTextSubmit = async (serviceId: string, requirementLabel: string) => {
    const text = textInputs[requirementLabel];
    if (!currentUser || !order || !text || !text.trim()) {
         toast({ title: "Cannot Submit", description: "The field cannot be empty.", variant: "destructive" });
         return;
    }

    try {
        const auth = getAuth(firebaseApp);
        const idToken = await auth.currentUser?.getIdToken();

        if (!idToken) {
            toast({ title: 'Authentication Error', description: 'Please log in again.', variant: 'destructive' });
            return;
        }

        const res = await submitClientDocumentUploadAction({
            idToken,
            orderId: order.id,
            serviceId,
            requirementLabel,
            type: 'text',
            textValue: text.trim(),
        });

        if (!res.success) {
            toast({ title: 'Submission Failed', description: res.error, variant: 'destructive' });
            return;
        }

        toast({ title: 'Information Submitted', description: 'Your information has been successfully submitted for review.' });
        setTextInputs(prev => ({...prev, [requirementLabel]: ''}));
        await fetchOrder();
    } catch (error: any) {
        console.error("Error submitting text:", error);
        toast({ title: "Submission Failed", description: error.message || "Could not save the information.", variant: "destructive" });
    }
  };

  const handleSendFeedback = async () => {
    if (!order || !order.documentUploads) return;
    const emailTo = (order.documentContact === 'client' ? order.endCustomerEmail : order.customerEmail) || order.customerEmail;
    const clientName = (order.documentContact === 'client' ? order.endCustomerName : order.customerName) || order.customerName;

    if (!emailTo || !clientName) {
        toast({ title: "Cannot send feedback", description: "Missing client contact details.", variant: "destructive" });
        return;
    }

    setIsSendingFeedback(true);
    toast({ title: "Sending Feedback...", description: "Notifying the client of the review status." });

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
        await updateDoc(orderRef, { notes: arrayUnion(emailNote) });
        await fetchOrder();

        toast({ title: "Feedback Sent!", description: "The client has been notified." });
    } catch(e) {
        console.error(e);
        toast({ title: "Failed to Send Feedback", variant: "destructive" });
    } finally {
        setIsSendingFeedback(false);
    }
  };

  const handleGenerateDrafts = async () => {
    if (!order) return;
    setIsGeneratingDrafts(true);
    try {
        const res = await generateOrderDocumentDraftsAction(order.id);
        if (res.success) {
            toast({ title: "Drafts Generated", description: res.message });
            await fetchOrder();
        } else {
            toast({ title: "Draft Generation Failed", description: res.error, variant: "destructive" });
        }
    } catch (err: any) {
        toast({ title: "Draft Generation Error", description: err.message, variant: "destructive" });
    } finally {
        setIsGeneratingDrafts(false);
    }
  };

  const handleGenerateSpecificTemplates = async (templateIds: string[]) => {
    if (!order || templateIds.length === 0) return;
    setIsGeneratingDrafts(true);
    try {
        const res = await generateOrderDocumentDraftsAction(order.id, templateIds);
        if (res.success) {
            toast({ title: "Drafts Generated", description: res.message });
            await fetchOrder();
        } else {
            toast({ title: "Draft Generation Failed", description: res.error, variant: "destructive" });
        }
    } catch (err: any) {
        toast({ title: "Draft Generation Error", description: err.message, variant: "destructive" });
    } finally {
        setIsGeneratingDrafts(false);
    }
  };

  const handleOpenFeedbackDialog = (draft: GeneratedDocumentDraft) => {
    setSelectedDraftForFeedback(draft);
    setDraftFeedbackText('');
    setFeedbackDialogOpen(true);
  };

  const handleRegenerateDraftSubmit = async () => {
    if (!order || !selectedDraftForFeedback || !draftFeedbackText.trim()) return;
    setIsRegeneratingDraft(true);
    try {
        const res = await regenerateOrderDraftWithFeedbackAction(
            order.id,
            selectedDraftForFeedback.id,
            draftFeedbackText,
            { id: currentUser?.uid || 'partner', name: currentUser?.name || 'Partner' }
        );
        if (res.success) {
            toast({ title: "Draft Regenerated", description: res.message });
            setFeedbackDialogOpen(false);
            await fetchOrder();
        } else {
            toast({ title: "Regeneration Failed", description: res.error, variant: "destructive" });
        }
    } catch (err: any) {
        toast({ title: "Regeneration Error", description: err.message, variant: "destructive" });
    } finally {
        setIsRegeneratingDraft(false);
    }
  };

  const handleApproveAndSendDraft = async (draft: GeneratedDocumentDraft) => {
    if (!order) return;
    setSendingDraftId(draft.id);
    try {
        const res = await approveAndSendDraftToClientAction(
            order.id,
            draft.id,
            { id: currentUser?.uid || 'partner', name: currentUser?.name || 'Partner' }
        );
        if (res.success) {
            toast({ title: "Draft Approved & Sent", description: res.message });
            await fetchOrder();
        } else {
            toast({ title: "Action Failed", description: res.error, variant: "destructive" });
        }
    } catch (err: any) {
        toast({ title: "Send Error", description: err.message, variant: "destructive" });
    } finally {
        setSendingDraftId(null);
    }
  };

  const handleSendFollowUp = async () => {
    if (!order) return;
    const emailTo = (order.documentContact === 'client' ? order.endCustomerEmail : order.customerEmail) || order.customerEmail;
    const clientName = (order.documentContact === 'client' ? order.endCustomerName : order.customerName) || order.customerName;

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
        await updateDoc(orderRef, { notes: arrayUnion(emailNote) });
        await fetchOrder();

        toast({ title: "Reminder Sent!", description: "The client has been notified." });
    } catch(e) {
        console.error(e);
        toast({ title: "Failed to Send Reminder", variant: "destructive" });
    } finally {
        setIsSendingReminder(false);
    }
  };

  const getAuthor = (authorId: string): { name: string } | undefined => {
    if (authorId === 'system') return { name: currentUser?.companyName || 'Practice System' };
    if (order && authorId === order.userId) return { name: order.endCustomerName || order.customerName };
    const staff = allStaff.find(u => u.uid === authorId || u.id === authorId);
    if (staff) return staff;
    return undefined;
  }

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

  const allDocumentsReviewed = order?.documentUploads && order.documentUploads.length > 0 && order.documentUploads.every(d => d.status !== 'pending');

  
  const handleProcessOrderConfirm = async (choice: 'complete' | 'outsource', documentContact?: 'partner' | 'client') => {
    if (!order || !currentUser?.uid) return;
    const partnerId = currentUser.partnerId || currentUser.uid;
    try {
      if (choice === 'complete') {
        const result = await completeOrderWithRoyalty(order.id, partnerId);
        if ('error' in result) {
          toast({ title: 'Failed', description: result.error === 'INSUFFICIENT_FUNDS' ? 'Insufficient wallet balance. Please top up.' : result.error, variant: 'destructive' });
          return;
        }
        toast({ title: 'Order Processing', description: `Royalty of R${result.royalty.toFixed(2)} deducted from your wallet.` });
      } else {
        const result = await outsourceOrderFromWallet(order.id, partnerId, documentContact || 'partner');
        if ('error' in result) {
          toast({ title: 'Failed', description: result.error === 'INSUFFICIENT_FUNDS' ? 'Insufficient wallet balance. Please top up.' : result.error, variant: 'destructive' });
          return;
        }
        toast({ title: 'Order Outsourced', description: `R${result.cost.toFixed(2)} deducted from your wallet. My Accountant will begin work immediately.` });
      }
      setProcessModalOpen(false);
      await fetchOrder(); // refresh order state
    } catch (err) {
      console.error('Process order failed:', err);
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
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

  return (
    <div className="space-y-8">
        <ProcessOrderModal
            open={processModalOpen}
            onOpenChange={setProcessModalOpen}
            order={order}
            walletBalance={currentUser?.creditBalance ?? 0}
            allServices={allServices}
            hasPlatformFee={hasPlatformFee}
            onConfirm={handleProcessOrderConfirm}
        />
        <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Document</DialogTitle>
                    <DialogDescription>Please provide a clear reason for rejecting this document.</DialogDescription>
                </DialogHeader>
                <Form {...rejectionForm}>
                    <form onSubmit={rejectionForm.handleSubmit(handleRejectionSubmit)} className="space-y-4">
                        <FormField
                            control={rejectionForm.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl><Textarea {...field} rows={4} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsRejectionDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" variant="destructive">Reject</Button>
                        </div>
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button variant="outline" asChild className="w-fit">
                <Link href="/partner/orders">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                </Link>
            </Button>
            {!order?.isOutsourced && order?.status !== 'Cancelled' && order?.status !== 'Completed' && (
                <Button onClick={() => setProcessModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Process / Outsource Order
                </Button>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className={order?.isOutsourced ? "lg:col-span-2 space-y-8" : "lg:col-span-3 space-y-8"}>
                <OrderPrerequisiteRequirementsCard 
                    order={order} 
                    allServices={allServices} 
                    baseRoute="/partner/orders" 
                    onOrderUpdated={fetchOrder} 
                />
                <Card className="border shadow-md bg-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                                        Order #{order.originalOrderId || order.id}
                                    </h2>
                                    <Badge variant={getStatusVariant(order.status)} className="px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        {formatDate(order.date, 'datetime')}
                                    </span>
                                </div>
                            </div>
                            {!order.isOutsourced && (
                                <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border shadow-sm">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-2">Status:</span>
                                    <Select
                                        value={order.status}
                                        onValueChange={(val) => handleOrderStatusTransition(val as Order['status'])}
                                    >
                                        <SelectTrigger className="w-[140px] h-8 text-xs font-bold border-0 bg-transparent focus:ring-0">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                                            <SelectItem value="Processing">Processing</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Order Items Container */}
                            <div className="bg-muted/40 p-5 rounded-xl border border-border/60 space-y-4">
                                <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4" /> Order Items
                                </h3>
                                <div className="space-y-3">
                                    {order.items.map((item: any, idx: number) => (
                                        <div key={item.id || idx} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 text-sm">
                                            <div>
                                                <p className="font-bold text-foreground">{item.title}</p>
                                                <p className="text-xs text-muted-foreground font-medium">Quantity: {item.quantity || 1}</p>
                                            </div>
                                            <p className="font-bold text-foreground">{formatPrice(item.clientPrice || item.price || item.unitPrice || 0)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-lg flex justify-between items-center text-primary font-black text-lg">
                                    <span>Total Amount</span>
                                    <span>{formatPrice(order.clientTotal || order.total || 0)}</span>
                                </div>
                            </div>

                            {/* Contact Details Container */}
                            <div className="bg-muted/40 p-5 rounded-xl border border-border/60 space-y-4">
                                <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" /> Client Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">Customer Name</p>
                                        <p className="font-extrabold text-base text-foreground mt-0.5">{order.endCustomerName || order.customerName}</p>
                                    </div>
                                    {(order.endCustomerEmail || order.customerEmail) && (
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                                            <a href={`mailto:${order.endCustomerEmail || order.customerEmail}`} className="text-sm font-bold text-primary hover:underline flex items-center gap-2 mt-0.5">
                                                <Mail className="h-4 w-4 text-primary shrink-0" />
                                                {order.endCustomerEmail || order.customerEmail}
                                            </a>
                                        </div>
                                    )}
                                    {order.customerPhone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{order.customerPhone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Required Information</CardTitle>
                                <CardDescription>Documents and information needed from your client.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {order.documentUploads && order.documentUploads.some(d => d.status === 'pending') && (
                                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50" onClick={handleBatchApprove}>
                                        <CheckCircle className="h-4 w-4 mr-2"/>Approve All Pending
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setIsCustomDocOpen(true)}>
                                    <FileText className="h-4 w-4 mr-2"/>Request Custom Doc
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleSendFollowUp} disabled={isSendingReminder}>
                                    {isSendingReminder ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <MessageSquare className="h-4 w-4 mr-2"/>}
                                    Follow Up
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            {orderItemsWithServices.map(item => (
                                <div key={item.id}>
                                    <h4 className="font-semibold">{item.title}</h4>
                                    {item.service.informationToProvide.length > 0 ? (
                                        <ul className="mt-2 space-y-3 pl-4 border-l">
                                            {item.service.informationToProvide.map((req, index) => {
                                                const upload = order.documentUploads?.find(d => (d.serviceId === item.id || d.serviceId === item.service?.id) && d.requirementLabel === req.label);
                                                const identifier = upload ? (upload.type === 'file' ? upload.fileUrl! : upload.textValue!) : '';
                                                const uploadKey = `${item.id}-${req.label}`;
                                                return (
                                                    <li key={index} className="pt-3">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-sm flex items-center gap-2">
                                                                {req.label}
                                                                {req.isRequired === false && (
                                                                    <Badge variant="outline" className="text-[10px] py-0 font-normal border-dashed text-muted-foreground">
                                                                        Optional
                                                                    </Badge>
                                                                )}
                                                            </p>
                                                            {upload ? (
                                                                 <Badge variant={upload.status === 'approved' ? 'success' : upload.status === 'rejected' ? 'destructive' : 'warning'}>
                                                                    {upload.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                                                                    {upload.status === 'rejected' && <AlertTriangle className="mr-1 h-3 w-3" />}
                                                                    {upload.status}
                                                                </Badge>
                                                            ) : <Badge variant="secondary">Pending</Badge>}
                                                        </div>
                                                        {upload ? (
                                                            <div className="mt-2 space-y-2">
                                                                {/* Missing Document Explanation */}
                                                                {upload.notAvailableReason && (
                                                                    <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                                                                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                                                                            Client Stated Document is Unavailable
                                                                        </div>
                                                                        <p className="text-muted-foreground italic font-medium">"{upload.notAvailableReason}"</p>
                                                                    </div>
                                                                )}

                                                                {/* Multiple Files List */}
                                                                {upload.files && upload.files.length > 0 ? (
                                                                    <div className="space-y-1.5">
                                                                        <div className="text-[11px] font-semibold text-muted-foreground">
                                                                            {upload.files.length} {upload.files.length === 1 ? 'file uploaded' : 'files uploaded'}:
                                                                        </div>
                                                                        <div className="grid grid-cols-1 gap-1.5">
                                                                            {upload.files.map((f, fIdx) => (
                                                                                <div key={f.id || fIdx} className="flex items-center justify-between bg-card p-2 rounded-md border text-xs gap-2">
                                                                                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline flex items-center gap-1.5 truncate max-w-md">
                                                                                        <Download className="h-3.5 w-3.5 shrink-0 text-primary" /> {f.fileName || `Attachment ${fIdx + 1}`}
                                                                                    </a>
                                                                                    {f.fileSize && (
                                                                                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                                                                            {formatFileSize(f.fileSize)}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ) : upload.fileUrl ? (
                                                                    <a href={upload.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                                                        <Download className="h-4 w-4" /> {upload.fileName || 'View Document'}
                                                                    </a>
                                                                ) : upload.textValue ? (
                                                                    <p className="text-sm p-2 bg-muted rounded-md mt-1">"{upload.textValue}"</p>
                                                                ) : null}
                                                                {upload.status === 'pending' && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Button size="xs" variant="outline" onClick={() => handleDocumentStatusUpdate(identifier, 'approved')}>Approve</Button>
                                                                        <Button size="xs" variant="destructive" onClick={() => handleOpenRejectionDialog(upload)}>Reject</Button>
                                                                    </div>
                                                                )}
                                                                 {upload.status === 'rejected' && upload.rejectionReason && (
                                                                    <p className="text-xs text-destructive italic">Reason: {upload.rejectionReason}</p>
                                                                )}
                                                                {upload.status === 'rejected' && (
                                                                    <div className="mt-3 pt-3 border-t space-y-2">
                                                                        <p className="text-xs font-semibold text-muted-foreground">Upload replacement:</p>
                                                                        {req.type === 'pdf' ? (
                                                                            uploadingFiles[uploadKey] !== undefined ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                                                    <p className="text-sm text-muted-foreground">Uploading... {Math.round(uploadingFiles[uploadKey])}%</p>
                                                                                </div>
                                                                            ) : (
                                                                                <Input 
                                                                                    type="file" 
                                                                                    accept="application/pdf,image/*" 
                                                                                    className="h-9 cursor-pointer" 
                                                                                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], item.id, req.label)} 
                                                                                />
                                                                            )
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <Input 
                                                                                    type="text" 
                                                                                    className="h-9" 
                                                                                    placeholder="Enter information here..." 
                                                                                    value={textInputs[req.label] || ''} 
                                                                                    onChange={(e) => handleTextChange(req.label, e.target.value)} 
                                                                                />
                                                                                <Button size="sm" onClick={() => handleTextSubmit(item.id, req.label)}>Save</Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 space-y-2">
                                                                {req.type === 'pdf' ? (
                                                                    uploadingFiles[uploadKey] !== undefined ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                                            <p className="text-sm text-muted-foreground">Uploading... {Math.round(uploadingFiles[uploadKey])}%</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-1">
                                                                            <Input 
                                                                                type="file" 
                                                                                accept="application/pdf,image/*" 
                                                                                className="h-9 cursor-pointer" 
                                                                                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], item.id, req.label)} 
                                                                            />
                                                                            <p className="text-xs text-muted-foreground">Upload document (PDF or Image) on behalf of client</p>
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Input 
                                                                                type="text" 
                                                                                className="h-9" 
                                                                                placeholder="Enter information here..." 
                                                                                value={textInputs[req.label] || ''} 
                                                                                onChange={(e) => handleTextChange(req.label, e.target.value)} 
                                                                            />
                                                                            <Button size="sm" onClick={() => handleTextSubmit(item.id, req.label)}>Save</Button>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground font-light">Submit response on behalf of client</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : <p className="text-sm text-muted-foreground mt-2 pl-4">No specific information required.</p>}
                                </div>
                            ))}
                         </div>
                    </CardContent>
                     {order.documentUploads && order.documentUploads.length > 0 && allDocumentsReviewed && (
                        <CardFooter>
                            <Button onClick={handleSendFeedback} disabled={isSendingFeedback}>
                                {isSendingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Notify Client of Review
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Communication History</CardTitle>
                        <CardDescription>Internal notes and sent emails for this order.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => generateNoteTemplate('payment')}><Phone className="h-4 w-4 mr-2"/>Payment Follow-up</Button>
                            <Button size="sm" variant="outline" onClick={() => generateNoteTemplate('docs')}><FileText className="h-4 w-4 mr-2"/>Request Documents</Button>
                            <Button size="sm" variant="outline" onClick={() => generateNoteTemplate('review')}><Star className="h-4 w-4 mr-2"/>Request Review</Button>
                            <Button size="sm" variant="outline" onClick={handleGenerateDiscount} disabled={isGeneratingDiscount || !!order.discountCode}>
                                {isGeneratingDiscount ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <Percent className="h-4 w-4 mr-2"/>}
                                {order.discountCode ? 'Discount Generated' : 'Generate 10% Discount'}
                            </Button>
                        </div>
                        <Separator className="my-4" />
                        <Form {...noteForm}>
                            <form onSubmit={noteForm.handleSubmit(onNoteSubmit)} className="space-y-4">
                                <FormField
                                    control={noteForm.control}
                                    name="noteText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Add a new note... (Tip: You can paste screenshots directly with Ctrl+V)" 
                                                    {...field} 
                                                    rows={4} 
                                                    onPaste={(e) => {
                                                        const items = e.clipboardData?.items;
                                                        if (!items) return;
                                                        const newImages: File[] = [];
                                                        for (let i = 0; i < items.length; i++) {
                                                            if (items[i].type.indexOf('image') !== -1) {
                                                                const file = items[i].getAsFile();
                                                                if (file) {
                                                                    const renamedFile = new File([file], `screenshot-${Date.now()}.png`, { type: file.type });
                                                                    newImages.push(renamedFile);
                                                                }
                                                            }
                                                        }
                                                        if (newImages.length > 0) {
                                                            setAttachedFiles(prev => [...prev, ...newImages]);
                                                            toast({ 
                                                                title: '📸 Screenshot Captured!', 
                                                                description: `${newImages.length} screenshot(s) attached. Review preview below before posting.` 
                                                            });
                                                        }
                                                    }} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-700">Attachments (optional)</label>
                                        <span className="text-[11px] text-muted-foreground font-mono">PNG, JPG, WebP, PDF, DOCX or Ctrl+V</span>
                                    </div>
                                    <Input 
                                        ref={fileInputRef}
                                        type="file" 
                                        multiple 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                const filesArray = Array.from(e.target.files);
                                                setAttachedFiles(prev => [...prev, ...filesArray]);
                                            }
                                        }} 
                                    />
                                </div>

                                {/* Live Thumbnail & File Attachment Preview */}
                                <NoteAttachmentsPreview 
                                    files={attachedFiles} 
                                    onRemoveFile={(idx) => {
                                        setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                    onClearAll={() => {
                                        setAttachedFiles([]);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                />
                                
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

                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                        Post Note
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleProofread} disabled={isProofreading}>
                                        {isProofreading ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                        Proofread
                                    </Button>
                                </div>
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
                                                    <p className="text-xs text-muted-foreground">{formatDate(note.date, 'datetime')}</p>
                                                </div>
                                                {isEmail ? (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                            <p className="text-sm font-semibold">{note.subject}</p>
                                                        </div>
                                                        <p className="text-sm italic text-muted-foreground">"{note.text}"</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: note.text.replace(/\n/g, '<br />') }} />
                                                )}
                                                 {note.attachments && note.attachments.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {note.attachments.map((att, i) => (
                                                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                                                <Paperclip className="h-4 w-4"/>
                                                                {att.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">No notes for this order yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {order?.isOutsourced && (
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                            <UserIcon className="h-5 w-5 text-muted-foreground"/>
                            <CardTitle className="text-lg">Fulfillment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                This order is being processed by My Accountant.
                            </p>
                            {assignee ? (
                                <div className="space-y-4 pt-2">
                                     <h4 className="font-semibold text-sm">Assigned To</h4>
                                     <div className="flex items-center gap-4">
                                        <div>
                                            <p className="font-semibold">{assignee.name}</p>
                                            <p className="text-sm text-muted-foreground">{assignee.department}</p>
                                        </div>
                                     </div>
                                     <Button variant="outline" className="w-full" asChild>
                                        <a href={`mailto:${assignee.email}?subject=Query regarding Order ${order.id}`}>
                                            <Mail className="mr-2 h-4 w-4"/>
                                            Contact Accountant
                                        </a>
                                     </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground pt-2">
                                    Our team will be assigned to this order shortly.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    </div>
  );
}
