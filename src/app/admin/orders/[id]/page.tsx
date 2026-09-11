'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { recordRecentItem } from '@/hooks/use-recent-items';
import { OrderStickyHeader } from '@/components/admin/orders/OrderStickyHeader';
import { DocumentPreviewDrawer, type PreviewDoc } from '@/components/shared/DocumentPreviewDrawer';
import { FileDropZone } from '@/components/ui/file-drop-zone';
import { useFormDraft } from '@/components/forms/use-form-draft';
import { AutosaveIndicator } from '@/components/forms/AutosaveIndicator';
import { notFound, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, getDocs, where, query, setDoc, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Order, Service, User, OrderNote, DocumentUpload } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  updateOrderStatusAtomic, 
  transitionOrderStatusAtomic,
  reassignOrderStaffAtomic, 
  linkOrderDependencyAtomic, 
  unlinkOrderDependencyAtomic,
  reviewOrderDocumentAtomic,
  requestCustomDocumentAtomic,
  runAiDocumentAuditAtomic
} from '@/app/actions/order-admin-actions';
import { 
  ArrowLeft, Loader2, User as UserIcon, Users, Mail, Phone, Send, FileText, Star, MessageSquare, 
  Percent, CheckCircle, AlertTriangle, XCircle, Download, Info, Paperclip, Sparkles, BellRing, 
  Briefcase, Clock, Lock, Eye, EyeOff, Calendar, ShoppingBag, CreditCard, Link as LinkIcon, 
  Unlink, Plus, CheckCircle2, Search, AlertCircle, ExternalLink, ListChecks, CheckSquare, 
  Square, Bot, ShieldCheck, FileCheck, RefreshCw, HelpCircle, FileStack, FileSignature, History, ScrollText
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { render } from '@react-email/components';
import PartnerAssignmentEmail from '@/components/emails/PartnerAssignmentEmail';
import { notifyOfNewNote, notifyAllocatedUserOfInternalNote, sendDocumentReviewFeedback, sendOutstandingDocumentsReminder } from '@/app/actions';
import { proofreadNote } from '@/ai/flows/proofread-note';
import { customAlphabet } from 'nanoid';
import { cn, formatDate, isStaffActive, isEligibleOrderStaff } from '@/lib/utils';
import OrderPrerequisiteRequirementsCard from '@/components/orders/OrderPrerequisiteRequirementsCard';
import { NoteAttachmentsPreview } from '@/components/orders/NoteAttachmentsPreview';
import { db, firebaseApp } from '@/lib/firebase';
import { getStatusVariant } from '@/lib/order-status';

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

const safeFormatDate = (rawDate: any, formatStr = 'dd MMM yyyy'): string => {
  if (!rawDate) return '';
  try {
    if (typeof rawDate?.toDate === 'function') {
      return format(rawDate.toDate(), formatStr);
    }
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '';
    return format(d, formatStr);
  } catch {
    return '';
  }
};

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

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

  // Order Dependency States
  const [prereqOrders, setPrereqOrders] = useState<Order[]>([]);
  const [dependentOrders, setDependentOrders] = useState<Order[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [candidateOrders, setCandidateOrders] = useState<Order[]>([]);
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
  const [isLinkingDependency, setIsLinkingDependency] = useState(false);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<Order['status'] | null>(null);
  // Attached files & Screenshots state for live preview
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { noteText: "" },
  });

  // Draft autosave + recovery for the note editor (Premium UI Phase 6)
  const noteTextValue = noteForm.watch('noteText') || '';
  const noteDraft = useFormDraft(`order-note.${id}`, noteTextValue);
  useEffect(() => {
    if (noteDraft.restored && !noteForm.getValues('noteText')) {
      noteForm.setValue('noteText', noteDraft.restored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteDraft.restored]);

  const rejectionForm = useForm<z.infer<typeof rejectionFormSchema>>({
    resolver: zodResolver(rejectionFormSchema),
    defaultValues: { reason: '' },
  });

  const fetchOrderAndStaff = async (silent = false) => {
      if (!id) return;
      if (!silent) setIsLoading(true);
      try {
        let fetchedStaff = allStaff;
        let fetchedServices = allServices;

        if (!silent || allStaff.length === 0) {
          const staffQuery = query(collection(db, "users"), where('role', 'in', ['staff', 'admin', 'consultant', 'senior_accountant', 'accountant', 'support_agent']));
          const staffSnapshot = await getDocs(staffQuery);
          fetchedStaff = staffSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id, id: doc.id } as User));
          setAllStaff(fetchedStaff);
        }

        if (!silent || allServices.length === 0) {
          const servicesQuery = query(collection(db, "services"));
          const servicesSnapshot = await getDocs(servicesQuery);
          fetchedServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
          setAllServices(fetchedServices);
        }

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
          recordRecentItem({
            type: 'order',
            id: fetchedOrder.id,
            label: `${fetchedOrder.id} — ${fetchedOrder.customerName || fetchedOrder.customerEmail || 'Order'}`,
            sublabel: fetchedOrder.status,
            href: `/admin/orders/${fetchedOrder.id}`,
          });
          
          if (fetchedOrder.assignedTo && fetchedOrder.assignedTo.length > 0) {
            const assignedUser = fetchedStaff.find(u => u.uid === fetchedOrder.assignedTo![0]);
            setAssignee(assignedUser || null);
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
          if (!silent) notFound();
        }
      } catch (error) {
        console.error("Error fetching order details: ", error);
        if (!silent) notFound();
      } finally {
        if (!silent) setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchOrderAndStaff();
  }, [id]);

  // Fetch detailed info for prerequisite and dependent orders
  useEffect(() => {
    if (!order) return;

    const loadDependencies = async () => {
      const prereqIds = order.dependsOnOrderIds || [];
      const blockedIds = order.blockedOrderIds || [];

      try {
        if (prereqIds.length > 0) {
          const prereqDocs = await Promise.all(
            prereqIds.map((prereqId) => getDoc(doc(db, 'orders', prereqId)))
          );
          const loadedPrereqs: Order[] = prereqDocs
            .filter((d) => d.exists())
            .map((d) => {
              const data = d.data() || {};
              return {
                ...data,
                id: d.id,
                date: data.date?.toDate ? data.date.toDate().toISOString() : (data.date || new Date().toISOString()),
              } as Order;
            });
          setPrereqOrders(loadedPrereqs);
        } else {
          setPrereqOrders([]);
        }

        if (blockedIds.length > 0) {
          const blockedDocs = await Promise.all(
            blockedIds.map((blockedId) => getDoc(doc(db, 'orders', blockedId)))
          );
          const loadedBlocked: Order[] = blockedDocs
            .filter((d) => d.exists())
            .map((d) => {
              const data = d.data() || {};
              return {
                ...data,
                id: d.id,
                date: data.date?.toDate ? data.date.toDate().toISOString() : (data.date || new Date().toISOString()),
              } as Order;
            });
          setDependentOrders(loadedBlocked);
        } else {
          setDependentOrders([]);
        }
      } catch (err) {
        console.error('Error loading order dependencies:', err);
      }
    };

    loadDependencies();
  }, [order?.dependsOnOrderIds, order?.blockedOrderIds, order?.id]);

  // Search candidate orders to link as prerequisite
  useEffect(() => {
    if (!isLinkModalOpen) return;

    const searchOrders = async () => {
      setIsSearchingCandidates(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('date', 'desc'), limit(100));
        const snap = await getDocs(q);
        const allFetched = snap.docs
          .map((d) => {
            const data = d.data() || {};
            return {
              ...data,
              id: d.id,
              date: data.date?.toDate ? data.date.toDate().toISOString() : (data.date || new Date().toISOString()),
            } as Order;
          })
          .filter((o) => o.id !== order?.id && !(order?.dependsOnOrderIds || []).includes(o.id));
        setCandidateOrders(allFetched);
      } catch (err) {
        console.error('Error searching candidate orders:', err);
      } finally {
        setIsSearchingCandidates(false);
      }
    };

    searchOrders();
  }, [isLinkModalOpen, order?.id, order?.dependsOnOrderIds]);

  const incompletePrerequisites = useMemo(() => {
    return prereqOrders.filter((p) => p.status !== 'Completed');
  }, [prereqOrders]);

  const filteredCandidates = useMemo(() => {
    if (!orderSearchTerm.trim()) return candidateOrders;
    const term = orderSearchTerm.toLowerCase();
    return candidateOrders.filter((o) => {
      return (
        o.id.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.customerEmail?.toLowerCase().includes(term) ||
        o.items?.some((i) => i.title?.toLowerCase().includes(term))
      );
    });
  }, [candidateOrders, orderSearchTerm]);

  const sameClientCandidates = useMemo(() => {
    if (!order) return [];
    const clientEmail = (order.customerEmail || '').toLowerCase().trim();
    const userId = order.userId;
    return candidateOrders.filter((o) => {
      const matchEmail = clientEmail && (o.customerEmail || '').toLowerCase().trim() === clientEmail;
      const matchUser = userId && o.userId === userId;
      return matchEmail || matchUser;
    });
  }, [candidateOrders, order]);

  const handleLinkPrerequisite = async (targetOrderId: string) => {
    if (!order || !currentUser) return;
    setIsLinkingDependency(true);
    try {
      const res = await linkOrderDependencyAtomic(order.id, targetOrderId, {
        id: currentUser.id || currentUser.uid,
        name: currentUser.name || currentUser.email || 'Admin',
      });
      if (res.success) {
        toast({ title: 'Prerequisite Linked', description: res.message });
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                dependsOnOrderIds: [...(prev.dependsOnOrderIds || []), targetOrderId],
              }
            : null
        );
        setIsLinkModalOpen(false);
      } else {
        toast({ title: 'Linking Failed', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLinkingDependency(false);
    }
  };

  const handleUnlinkPrerequisite = async (targetOrderId: string) => {
    if (!order || !currentUser) return;
    try {
      const res = await unlinkOrderDependencyAtomic(order.id, targetOrderId, {
        id: currentUser.id || currentUser.uid,
        name: currentUser.name || currentUser.email || 'Admin',
      });
      if (res.success) {
        toast({ title: 'Prerequisite Unlinked', description: res.message });
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                dependsOnOrderIds: (prev.dependsOnOrderIds || []).filter((id) => id !== targetOrderId),
              }
            : null
        );
      } else {
        toast({ title: 'Unlink Failed', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const executeStatusChange = async (newStatus: Order['status'], isOverride = false, overrideReasonText?: string) => {
    if (!order || !currentUser) return;
    const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!idToken) {
      toast({ title: 'Session expired', description: 'Please sign in again to change the order status.', variant: 'destructive' });
      return;
    }

    const res = await transitionOrderStatusAtomic(
      order.id,
      newStatus,
      idToken,
      {
        bypassChecks: isOverride,
        bypassReason: overrideReasonText,
      }
    );

    if (res.success) {
      setOrder((prev) => (prev ? { ...prev, status: newStatus, fulfillmentStatus: res.fulfillmentStatus || prev.fulfillmentStatus } : null));
      toast({ title: 'Status Updated', description: `Status changed to ${newStatus}` });
      setIsOverrideDialogOpen(false);
      setOverrideReason('');
      setPendingStatusChange(null);
    } else {
      if (!isOverride && res.isBlockedByPrerequisites) {
        setPendingStatusChange(newStatus);
        setIsOverrideDialogOpen(true);
      }
      toast({ title: 'Status Transition Blocked', description: res.error, variant: 'destructive' });
    }
  };

  const handleStatusChangeRequest = (newStatus: Order['status']) => {
    executeStatusChange(newStatus);
  };

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
            const storageRef = ref(storage, `orders/${order.id}/notes/${uniqueFileName}`);
            const contentType = file.type || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
            const uploadTask = uploadBytesResumable(storageRef, file, { contentType });
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
          console.error("Failed to sync note to original order:", syncErr);
        }
      }

      if (isInternalNote) {
        notifyAllocatedUserOfInternalNote({
          orderId: order.id,
          senderName: currentUser.name || currentUser.email || 'Admin / Staff',
          senderEmail: currentUser.email || undefined,
          noteText: values.noteText || '',
        }).catch(err => console.error("Failed to send internal note notification:", err));
      } else {
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
      noteDraft.clear();
      setAttachedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchOrderAndStaff(true); 
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

  const [isAuditing, setIsAuditing] = useState(false);

  const handleAiAudit = async () => {
    if (!order) return;
    setIsAuditing(true);
    try {
      const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
      if (!idToken) throw new Error('Not signed in');
      const res: any = await runAiDocumentAuditAtomic(order.id, idToken);
      if (!res.success) throw new Error(res.error);
      const c = res.counts;
      toast({
        title: res.state === 'complete' ? 'AI audit: all documents approved' : res.state === 'awaiting_consultant' ? 'AI audit: needs your decision' : 'AI audit: client has work to do',
        description: `${c.approved} approved · ${c.rejected} rejected · ${c.missing} missing · ${c.pending} for you${res.emailedKevin ? ' · report sent to info@myacc.co.za' : ''}`,
      });
      await fetchOrderAndStaff(true);
    } catch (e: any) {
      toast({ title: 'AI audit failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDocumentStatusUpdate = async (
    identifier: string, 
    status: 'approved' | 'rejected' | 'ignored' | 'pending', 
    reason?: string,
    options?: { serviceId?: string; requirementLabel?: string }
  ) => {
    if (!order || !currentUser) return;
    try {
      const auth = getAuth(firebaseApp);
      const idToken = await auth.currentUser?.getIdToken();
      const performer = idToken || {
        id: currentUser.id || currentUser.uid,
        name: currentUser.name || currentUser.email || 'Admin',
      };

      const res = await reviewOrderDocumentAtomic(order.id, identifier, status, performer, reason, options);
      if (res.success) {
        toast({ 
          title: status === 'ignored' ? 'Requirement Bypassed / Ignored' : status === 'pending' ? 'Requirement Reset' : 'Document Status Updated', 
          description: status === 'ignored' ? 'Requirement will bypass AI validation and not block order progress.' : (res.message || 'Status updated.') 
        });
        await fetchOrderAndStaff(true);
      } else {
        throw new Error(res.error || 'Failed to update document status.');
      }
    } catch (error: any) {
      console.error("Error updating document status:", error);
      toast({ title: 'Error', description: error.message || 'Failed to update document status.', variant: "destructive" });
    }
  };

  const handleBatchApprove = async () => {
    if (!order || !order.documentUploads || !currentUser) return;

    try {
      const auth = getAuth(firebaseApp);
      const idToken = await auth.currentUser?.getIdToken();
      const performer = idToken || {
        id: currentUser.id || currentUser.uid,
        name: currentUser.name || currentUser.email || 'Admin',
      };

      for (const doc of order.documentUploads) {
        if (doc.status === 'pending') {
          const docId = doc.requirementId || doc.id || (doc.type === 'file' ? doc.fileUrl : doc.textValue) || doc.requirementLabel;
          await reviewOrderDocumentAtomic(order.id, docId, 'approved', performer);
        }
      }
      
      toast({ title: 'Documents Approved', description: 'All pending documents have been approved.'});
      await fetchOrderAndStaff(true);
    } catch (error: any) {
      console.error("Error batch approving documents:", error);
      toast({ title: 'Error', description: 'Failed to batch approve documents.', variant: "destructive" });
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
        id: currentUser?.id || 'admin',
        name: currentUser?.name || 'Staff Member',
        email: currentUser?.email || '',
        role: (currentUser?.role || 'admin') as 'admin' | 'staff',
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
      fetchOrderAndStaff(true);
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
            await fetchOrderAndStaff(true);

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
            await fetchOrderAndStaff(true);

            toast({ title: "Reminder Sent!", description: "The client has been notified to log in and upload missing items." });
        } catch(e) {
            console.error(e);
            toast({ title: "Failed to Send Reminder", variant: "destructive" });
        } finally {
            setIsSendingReminder(false);
        }
    }
  
  if (isLoading) {
    return <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>;
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
            {/* Link Prerequisite Order Dialog */}
            <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6">
                    <DialogHeader className="pb-2 border-b">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <LinkIcon className="h-5 w-5 text-primary" /> Link Prerequisite Order
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Select an order that must be completed <strong>before</strong> Order #{order.originalOrderId || order.id} can be finalized.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3 flex-1 flex flex-col min-h-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by Order ID, Client Name, Email, or Service..."
                                className="pl-9 h-10 border-primary/20 bg-background"
                                value={orderSearchTerm}
                                onChange={(e) => setOrderSearchTerm(e.target.value)}
                                autoFocus
                            />
                            {orderSearchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setOrderSearchTerm('')}
                                    className="absolute right-3 top-3 text-xs text-muted-foreground hover:text-foreground font-semibold"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto max-h-[52vh] pr-1 space-y-4">
                            {isSearchingCandidates ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                                    <span className="text-xs font-medium">Loading orders...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Same Client Quick Picks */}
                                    {!orderSearchTerm.trim() && sameClientCandidates.length > 0 && (
                                        <div className="space-y-2.5 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/70">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                                                    <UserIcon className="h-3.5 w-3.5" /> Orders From This Client
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                    {sameClientCandidates.length} Found
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {sameClientCandidates.map((candidate) => (
                                                    <div 
                                                        key={candidate.id}
                                                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 transition-all shadow-sm"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-extrabold text-sm text-foreground">
                                                                    Order #{candidate.originalOrderId || candidate.id}
                                                                </span>
                                                                <Badge variant={getStatusVariant(candidate.status)} className="text-[10px] uppercase font-black px-2 py-0.5">
                                                                    {candidate.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs font-semibold text-foreground/90 mt-1 truncate">
                                                                {candidate.items?.map(i => i.title).join(', ') || 'Custom Service Order'}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                                <span>{safeFormatDate(candidate.date, 'dd MMM yyyy')}</span>
                                                                <span>•</span>
                                                                <span className="font-semibold text-foreground/80">{formatPrice(candidate.total)}</span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            disabled={isLinkingDependency}
                                                            onClick={() => handleLinkPrerequisite(candidate.id)}
                                                            className="shrink-0 font-bold h-9 px-3.5 gap-1.5 shadow-sm"
                                                        >
                                                            {isLinkingDependency ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                                            Link Prereq
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* All Matching Orders */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                                {orderSearchTerm.trim() ? `Search Results (${filteredCandidates.length})` : 'All Recent Orders'}
                                            </span>
                                        </div>
                                        {filteredCandidates.length > 0 ? (
                                            <div className="space-y-2">
                                                {filteredCandidates.map((candidate) => {
                                                    const isSameClient = order && (
                                                        ((order.customerEmail || '').toLowerCase().trim() === (candidate.customerEmail || '').toLowerCase().trim()) ||
                                                        (order.userId && order.userId === candidate.userId)
                                                    );
                                                    return (
                                                        <div 
                                                            key={candidate.id}
                                                            className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 hover:border-primary/40 transition-all shadow-sm"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-extrabold text-sm text-foreground">
                                                                        Order #{candidate.originalOrderId || candidate.id}
                                                                    </span>
                                                                    <Badge variant={getStatusVariant(candidate.status)} className="text-[10px] uppercase font-black px-2 py-0.5">
                                                                        {candidate.status}
                                                                    </Badge>
                                                                    {isSameClient && (
                                                                        <Badge variant="outline" className="text-[9px] font-bold text-blue-600 bg-blue-50 border-blue-200">
                                                                            Same Client
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-foreground font-medium mt-1 truncate">
                                                                    {candidate.customerName} <span className="text-muted-foreground">({candidate.customerEmail})</span>
                                                                </p>
                                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                                                                    <span className="truncate max-w-[240px]">
                                                                        {candidate.items?.map(i => i.title).join(', ') || 'Custom Service'}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{safeFormatDate(candidate.date, 'dd MMM yyyy')}</span>
                                                                    <span>•</span>
                                                                    <span className="font-semibold text-foreground/80">{formatPrice(candidate.total)}</span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant={isSameClient ? 'default' : 'outline'}
                                                                disabled={isLinkingDependency}
                                                                onClick={() => handleLinkPrerequisite(candidate.id)}
                                                                className="shrink-0 font-bold h-9 px-3.5 gap-1.5 shadow-sm"
                                                            >
                                                                {isLinkingDependency ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                                                Link
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10 space-y-1">
                                                <p className="font-medium">No matching orders found.</p>
                                                <p className="text-[11px] opacity-75">Try searching with a different order number or customer name.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-3 border-t flex justify-end">
                        <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Transition Validation Blocked / Override Dialog */}
            <AlertDialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5 shrink-0" /> Order Completion Validation Blocked
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2 text-left">
                            <p className="text-sm text-foreground">
                                Order #{order.id} has unmet criteria for transition to <strong>{pendingStatusChange || 'Completed'}</strong>:
                            </p>
                            
                            {incompletePrerequisites.length > 0 && (
                                <div className="bg-amber-500/10 p-3 rounded-md border border-amber-500/20 text-xs text-amber-900 space-y-1">
                                    <p className="font-bold">Incomplete Prerequisite Orders:</p>
                                    {incompletePrerequisites.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between">
                                            <span>Order #{p.id} ({p.items?.map(i => i.title).join(', ') || 'Custom'})</span>
                                            <Badge variant={getStatusVariant(p.status)} className="text-[9px] uppercase">
                                                {p.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {order.documentUploads && order.documentUploads.some(d => d.status === 'pending' || d.status === 'rejected') && (
                                <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-xs text-destructive space-y-1">
                                    <p className="font-bold">Outstanding Documents:</p>
                                    {order.documentUploads.filter(d => d.status === 'pending' || d.status === 'rejected').map((d, dIdx) => (
                                        <div key={dIdx} className="flex items-center justify-between">
                                            <span>{d.requirementLabel}</span>
                                            <span className="font-bold uppercase">{d.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {order.checklist && order.checklist.some(s => s.status !== 'completed' && s.status !== 'skipped') && (
                                <div className="bg-blue-500/10 p-3 rounded-md border border-blue-500/20 text-xs text-blue-900 space-y-1">
                                    <p className="font-bold">Incomplete SOP Checklist Steps:</p>
                                    {order.checklist.filter(s => s.status !== 'completed' && s.status !== 'skipped').map((s, sIdx) => (
                                        <div key={sIdx} className="flex items-center justify-between">
                                            <span>{s.title}</span>
                                            <span className="font-bold uppercase">{s.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-foreground">
                                    Staff Override Reason (Required to Bypass):
                                </label>
                                <Input
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    placeholder="e.g. Verified manually with client & partner on phone"
                                    className="text-xs"
                                />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-2">
                        <AlertDialogCancel onClick={() => { setPendingStatusChange(null); setOverrideReason(''); }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            disabled={!overrideReason.trim()}
                            onClick={() => {
                                if (pendingStatusChange) {
                                    executeStatusChange(pendingStatusChange, true, overrideReason.trim());
                                }
                            }}
                        >
                            Override & Complete Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" asChild><Link href="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link></Button>

            <OrderStickyHeader
                order={order}
                customerName={order.endCustomerName || order.customerName}
                onStatusChange={handleStatusChangeRequest}
            />

            <DocumentPreviewDrawer doc={previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }} />

            {/* Prerequisite Dependency Warning Banner */}
            {incompletePrerequisites.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3.5 text-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                        <p className="font-bold flex items-center gap-2">
                            Prerequisite Order Dependency Warning
                            <Badge variant="outline" className="bg-amber-500/20 text-amber-800 border-amber-500/40 text-[10px]">
                                {incompletePrerequisites.length} Pending {incompletePrerequisites.length === 1 ? 'Prerequisite' : 'Prerequisites'}
                            </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            This order is dependent on{' '}
                            {incompletePrerequisites.map((p, idx) => (
                                <span key={p.id}>
                                    <Link href={`/admin/orders/${p.id}`} className="font-bold underline text-primary hover:text-primary/80">
                                        Order #{p.id} ({p.items?.map(i => i.title).join(', ') || 'Custom'} - {p.status})
                                    </Link>
                                    {idx < incompletePrerequisites.length - 1 ? ', ' : ''}
                                </span>
                            ))}{' '}
                            being finished first. Please ensure prerequisite work is finalized before completing this order.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <OrderPrerequisiteRequirementsCard 
                        order={order} 
                        allServices={allServices} 
                        baseRoute="/admin/orders" 
                        onOrderUpdated={() => fetchOrderAndStaff(true)} 
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
                                            {safeFormatDate(order.date, 'dd/MM/yyyy, HH:mm')}
                                        </span>
                                        {order.source && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                                                Source: {order.source}
                                            </span>
                                        )}
                                        {order.paymentMethod && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <CreditCard className="h-3.5 w-3.5 text-primary" />
                                                Paid via {order.paymentMethod}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {order.resellerId && (
                                    <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary px-3 py-1 font-semibold text-xs">
                                        Reseller / Partner Order
                                    </Badge>
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
                                                <p className="font-bold text-foreground">{formatPrice(item.price || item.unitPrice || 0)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-lg flex justify-between items-center text-primary font-black text-lg">
                                        <span>Total Amount</span>
                                        <span>{formatPrice(order.total)}</span>
                                    </div>
                                </div>

                                {/* Contact Details Container */}
                                <div className="bg-muted/40 p-5 rounded-xl border border-border/60 space-y-4">
                                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" /> Contact Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Customer Name</p>
                                            <p className="font-extrabold text-base text-foreground mt-0.5">{order.customerName}</p>
                                        </div>
                                        {order.customerEmail && (
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                                                <a href={`mailto:${order.customerEmail}`} className="text-sm font-bold text-primary hover:underline flex items-center gap-2 mt-0.5">
                                                    <Mail className="h-4 w-4 text-primary shrink-0" />
                                                    {order.customerEmail}
                                                </a>
                                            </div>
                                        )}
                                        {order.customerPhone && (
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                                                <a href={`tel:${order.customerPhone}`} className="text-sm font-bold text-foreground hover:text-primary flex items-center gap-2 mt-0.5">
                                                    <Phone className="h-4 w-4 text-primary shrink-0" />
                                                    {order.customerPhone}
                                                </a>
                                            </div>
                                        )}
                                        {order.endCustomerName && (
                                            <div className="pt-2 border-t border-border/40">
                                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">End Client</p>
                                                <p className="text-xs font-bold text-foreground">{order.endCustomerName} ({order.endCustomerEmail})</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Required Information & Document Review Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <FileCheck className="h-5 w-5 text-primary" />
                                        Required Documents & Information
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Client uploads and verification for statutory processing.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button variant="default" size="sm" className="text-xs h-8" onClick={handleAiAudit} disabled={isAuditing} title="Check every required document and answer, approve/reject with reasons, notify the client, and email Kevin when complete">
                                        {isAuditing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <Sparkles className="h-3.5 w-3.5 mr-1.5"/>}Run AI Audit
                                    </Button>
                                    {order.documentUploads && order.documentUploads.some(d => d.status === 'pending') && (
                                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50 text-xs h-8" onClick={handleBatchApprove}>
                                            <CheckCircle className="h-3.5 w-3.5 mr-1.5"/>Approve All Pending
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setIsCustomDocOpen(true)}>
                                        <FileText className="h-3.5 w-3.5 mr-1.5"/>Request Custom Doc
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleSendFollowUp} disabled={isSendingReminder}>
                                        {isSendingReminder ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <MessageSquare className="h-3.5 w-3.5 mr-1.5"/>}Follow Up
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {orderItemsWithServices.map(item => (
                                <div key={item.id} className="space-y-2">
                                    <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                                    {item.service.informationToProvide.length > 0 ? (
                                        <ul className="space-y-3 pl-3 border-l-2 border-primary/20">
                                            {item.service.informationToProvide.map((req, index) => {
                                                const upload = order.documentUploads?.find(d => 
                                                    (req.id && d.requirementId === req.id) ||
                                                    ((d.serviceId === item.id || d.serviceId === item.service?.id) && d.requirementLabel === req.label) ||
                                                    d.requirementLabel === req.label
                                                );
                                                const identifier = upload ? (upload.requirementId || upload.id || (upload.type === 'file' ? upload.fileUrl! : upload.textValue!) || upload.requirementLabel) : (req.id || req.label);
                                                const isIgnored = upload?.status === 'ignored' || upload?.isIgnored;

                                                return (
                                                    <li key={index} className="pt-2 p-3.5 rounded-lg bg-muted/20 border border-border/60 space-y-2.5">
                                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-semibold text-sm text-foreground">
                                                                    {req.label}
                                                                </p>
                                                                {req.isRequired === false && (
                                                                    <Badge variant="outline" className="text-[10px] py-0 font-normal border-dashed text-muted-foreground">
                                                                        Optional
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isIgnored ? (
                                                                    <Badge variant="secondary" className="text-xs font-semibold bg-purple-100 text-purple-800 border-purple-300 gap-1">
                                                                        <EyeOff className="h-3 w-3" /> IGNORED / BYPASSED
                                                                    </Badge>
                                                                ) : upload ? ( 
                                                                    <Badge variant={upload.status === 'approved' ? 'success' : upload.status === 'rejected' ? 'destructive' : 'warning'} className="text-xs font-semibold">
                                                                        {upload.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                                                                        {upload.status === 'rejected' && <AlertTriangle className="mr-1 h-3 w-3" />}
                                                                        {upload.status.toUpperCase()}
                                                                    </Badge> 
                                                                ) : <Badge variant="secondary" className="text-xs">Awaiting Client Upload</Badge>}
                                                            </div>
                                                        </div>

                                                        {upload && (
                                                            <div className="space-y-2.5 pt-1">
                                                                {/* Missing Document Explanation */}
                                                                {upload.notAvailableReason && (
                                                                    <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                                                                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                                                            <HelpCircle className="h-4 w-4" /> Client Note: Document is Not Available
                                                                        </div>
                                                                        <p className="pl-5 text-muted-foreground italic font-medium whitespace-pre-wrap break-words leading-relaxed">"{upload.notAvailableReason}"</p>
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
                                                                                    <button type="button" onClick={() => setPreviewDoc({ name: f.fileName || `Attachment ${fIdx + 1}`, url: f.fileUrl })} className="text-primary font-semibold hover:underline flex items-center gap-1.5 truncate max-w-md text-left">
                                                                                        <Download className="h-3.5 w-3.5 shrink-0 text-primary" /> {f.fileName || `Attachment ${fIdx + 1}`}
                                                                                    </button>
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
                                                                    <div className="flex items-center justify-between bg-card p-2.5 rounded-md border text-xs">
                                                                        <button type="button" onClick={() => setPreviewDoc({ name: upload.fileName || 'Uploaded Document', url: upload.fileUrl! })} className="text-primary font-semibold hover:underline flex items-center gap-1.5 truncate max-w-md text-left">
                                                                            <Download className="h-4 w-4 shrink-0 text-primary" /> {upload.fileName || 'View Uploaded Document'}
                                                                        </button>
                                                                    </div>
                                                                ) : upload.textValue ? (
                                                                    <div className="bg-muted/70 p-3 rounded-md border text-xs">
                                                                        <p className="font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                                                            "{upload.isEncrypted ? '•••••••• (stored encrypted)' : upload.textValue}"
                                                                        </p>
                                                                    </div>
                                                                ) : null}

                                                                {/* AI Verification Findings & Rule Followed */}
                                                                {isIgnored ? (
                                                                    <div className="p-2 rounded-md bg-purple-50/80 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                                                                        <EyeOff className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                                                                        <span>Requirement manually ignored / bypassed by consultant (will not block order processing or fail AI audits).</span>
                                                                    </div>
                                                                ) : upload.status === 'approved' ? (
                                                                    <div className="p-2.5 rounded-md bg-green-50/90 border border-green-200 text-xs space-y-1 text-green-950">
                                                                        <div className="flex items-center gap-1.5 font-bold text-green-800">
                                                                            <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                                                            <span>AI Verification Rule Followed:</span>
                                                                        </div>
                                                                        <p className="text-[11px] text-green-900 leading-relaxed pl-5">
                                                                            {upload.aiVerification?.summary || upload.aiVerification?.reason || (upload.textValue ? 'Format, length, and syntax check passed.' : 'Statutory document rules verified (validity dates, name matching, and required format).')}
                                                                        </p>
                                                                        {upload.aiVerification?.extractedData?.facts && (
                                                                            <div className="pl-5 text-[11px] text-green-800/90 font-mono">
                                                                                Facts: {[
                                                                                    upload.aiVerification.extractedData.facts.documentKind && `Kind: ${upload.aiVerification.extractedData.facts.documentKind}`,
                                                                                    upload.aiVerification.extractedData.facts.names?.length && `Names: ${upload.aiVerification.extractedData.facts.names.map((n: any) => n.name || n).join(', ')}`,
                                                                                    upload.aiVerification.extractedData.facts.dates?.length && `Dates: ${upload.aiVerification.extractedData.facts.dates.map((d: any) => d.date || d).join(', ')}`,
                                                                                    upload.aiVerification.extractedData.facts.certified && 'Certified: Yes',
                                                                                ].filter(Boolean).join(' · ')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : upload.status === 'rejected' ? (
                                                                    <div className="p-2.5 rounded-md bg-red-50/90 border border-red-200 text-xs space-y-1 text-red-950">
                                                                        <div className="flex items-center gap-1.5 font-bold text-red-800">
                                                                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                                                                            <span>AI Rule Violated / Rejection Reason:</span>
                                                                        </div>
                                                                        <p className="text-[11px] text-red-900 leading-relaxed pl-5">
                                                                            {upload.rejectionReason || upload.aiVerification?.reason || 'Document or input does not meet statutory compliance requirements.'}
                                                                        </p>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        )}

                                                        {/* Staff Actions Toolbar for Every Requirement */}
                                                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                                                            {upload?.status !== 'approved' && !isIgnored && (
                                                                <Button 
                                                                    size="xs" 
                                                                    variant="outline" 
                                                                    className="h-7 text-xs font-semibold text-green-700 hover:bg-green-50 border-green-300 gap-1" 
                                                                    onClick={() => handleDocumentStatusUpdate(identifier, 'approved', undefined, { serviceId: item.service?.id || item.id, requirementLabel: req.label })}
                                                                >
                                                                    <CheckCircle className="h-3 w-3" /> Approve
                                                                </Button>
                                                            )}
                                                            {upload && upload.status !== 'rejected' && !isIgnored && (
                                                                <Button 
                                                                    size="xs" 
                                                                    variant="destructive" 
                                                                    className="h-7 text-xs font-semibold gap-1" 
                                                                    onClick={() => handleOpenRejectionDialog(upload)}
                                                                >
                                                                    <XCircle className="h-3 w-3" /> Reject with Reason
                                                                </Button>
                                                            )}
                                                            {isIgnored ? (
                                                                <Button 
                                                                    size="xs" 
                                                                    variant="outline" 
                                                                    className="h-7 text-xs font-semibold text-muted-foreground hover:bg-muted gap-1" 
                                                                    onClick={() => handleDocumentStatusUpdate(identifier, 'pending', undefined, { serviceId: item.service?.id || item.id, requirementLabel: req.label })}
                                                                >
                                                                    <RefreshCw className="h-3 w-3" /> Unignore / Reset
                                                                </Button>
                                                            ) : (
                                                                <Button 
                                                                    size="xs" 
                                                                    variant="outline" 
                                                                    className="h-7 text-xs font-semibold text-purple-700 hover:bg-purple-50 border-purple-300 gap-1" 
                                                                    onClick={() => handleDocumentStatusUpdate(identifier, 'ignored', undefined, { serviceId: item.service?.id || item.id, requirementLabel: req.label })}
                                                                >
                                                                    <EyeOff className="h-3 w-3" /> Ignore / Bypass AI
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-muted-foreground mt-1 pl-3">No specific document requirements configured.</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                        {order.documentUploads && order.documentUploads.length > 0 && allDocumentsReviewed && (
                            <CardFooter>
                                <Button onClick={handleSendFeedback} disabled={isSendingFeedback}>
                                    {isSendingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Notify Client of Review Outcome
                                </Button>
                            </CardFooter>
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
                            <FileDropZone
                                onFiles={(files) => setAttachedFiles(prev => [...prev, ...files])}
                                onRejected={(msg) => toast({ title: 'File rejected', description: msg, variant: 'destructive' })}
                            >
                            <form onSubmit={noteForm.handleSubmit(onNoteSubmit)} className="space-y-4">
                                <FormField control={noteForm.control} name="noteText" render={({ field }) => ( 
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
                                                            description: `${newImages.length} screenshot(s) attached. See preview below before posting.` 
                                                        });
                                                    }
                                                }} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem> 
                                )} />

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

                                <div className="flex justify-between items-center gap-3"><AutosaveIndicator status={noteDraft.status} savedAt={noteDraft.savedAt} className="order-last" /><div className="flex gap-2"><Button type="submit" size="sm" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Post Note</Button><Button type="button" variant="outline" size="sm" onClick={handleProofread} disabled={isProofreading}>{isProofreading ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <Sparkles className="mr-2" />}Proofread</Button></div></div>
                            </form>
                            </FileDropZone>
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
                                                        <p className="text-xs text-muted-foreground">{safeFormatDate(note.date, 'dd/MM/yyyy, HH:mm')}</p>
                                                    </div>
                                                    {isEmail ? ( <div><div className="flex items-center gap-2 mb-1"><Mail className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold">{note.subject}</p></div><p className="text-sm italic text-muted-foreground">"{note.text}"</p></div> ) : ( <p className="text-sm whitespace-pre-wrap">{note.text}</p> )}
                                                     {note.attachments && note.attachments.length > 0 && ( <div className="mt-2 space-y-1">{note.attachments.map((att, i) => ( <button key={i} type="button" onClick={() => setPreviewDoc({ name: att.name, url: att.url })} className="text-sm text-primary hover:underline flex items-center gap-1 text-left"><Paperclip className="h-4 w-4"/>{att.name}</button> ))}</div> )}
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
                    {/* Status Control Card */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <BellRing className="h-4 w-4 text-primary" /> Order Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Current:</span>
                                <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                            </div>
                            <Select 
                                value={order.status} 
                                onValueChange={(newStatus: any) => handleStatusChangeRequest(newStatus)}
                            >
                                <SelectTrigger className="w-full h-9 text-xs font-semibold">
                                    <SelectValue placeholder="Change Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                                    <SelectItem value="Processing">Processing</SelectItem>
                                    <SelectItem value="Waiting on Customer">Waiting on Customer</SelectItem>
                                    <SelectItem value="Waiting on External">Waiting on External</SelectItem>
                                    <SelectItem value="Under Review">Under Review</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Staff Assignment Card */}
                    <Card>
                        <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-primary" /> Staff Assignment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            {assignee ? (
                                <div className="space-y-1 bg-muted/50 p-2.5 rounded-md border text-xs">
                                    <p className="font-bold">{assignee.name}</p>
                                    <p className="text-muted-foreground text-[11px]">{assignee.department || 'No Department'}</p>
                                    <p className="text-[10px] text-primary">{assignee.email}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                                    ⚠️ Unassigned
                                </p>
                            )}

                            <Select 
                                value={assignee?.id || (assignee as any)?.uid || ''} 
                                onValueChange={async (staffId: string) => {
                                    if (!currentUser) return;
                                    const selectedStaff = allStaff.find(s => s.id === staffId || (s as any).uid === staffId);
                                    const dept = selectedStaff?.department as any || order.department || null;
                                    const res = await reassignOrderStaffAtomic(order.id, [staffId], dept, {
                                        id: currentUser.id || (currentUser as any).uid,
                                        name: currentUser.name || currentUser.email || 'Admin',
                                    });
                                    if (res.success) {
                                        setAssignee(selectedStaff || null);
                                        setOrder(prev => prev ? { ...prev, assignedTo: [staffId] } : null);
                                        toast({ title: 'Staff Reassigned', description: `Assigned to ${selectedStaff?.name || staffId}` });
                                    } else {
                                        toast({ title: 'Reassignment Failed', description: res.error, variant: 'destructive' });
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full h-9 text-xs">
                                    <SelectValue placeholder="Reassign Staff..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allStaff.filter(isEligibleOrderStaff).map((staff) => (
                                        <SelectItem key={staff.id || (staff as any).uid} value={staff.id || (staff as any).uid}>
                                            {staff.name} ({staff.department || 'General'})
                                        </SelectItem>
                                    ))}
                                    {assignee && !isEligibleOrderStaff(assignee) && (
                                        <SelectItem key={assignee.id || (assignee as any).uid} value={assignee.id || (assignee as any).uid} disabled>
                                            {assignee.name} (Inactive / Ineligible - {assignee.department || 'General'})
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Order Dependencies & Linked Orders Card */}
                    <Card className="border shadow-sm">
                        <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-primary" /> Order Dependencies
                            </CardTitle>
                            <Button 
                                size="xs" 
                                variant="outline" 
                                className="h-7 text-xs font-semibold gap-1"
                                onClick={() => {
                                    setOrderSearchTerm('');
                                    setIsLinkModalOpen(true);
                                }}
                            >
                                <Plus className="h-3 w-3" /> Link Prereq
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                            {/* Prerequisites List (Must finish before this order) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                        Prerequisites (Must finish first)
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground">
                                        {prereqOrders.length}
                                    </span>
                                </div>
                                {prereqOrders.length > 0 ? (
                                    <div className="space-y-2">
                                        {prereqOrders.map((prereq) => (
                                            <div key={prereq.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30 text-xs">
                                                <div className="min-w-0 pr-2">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Link href={`/admin/orders/${prereq.id}`} className="font-bold text-primary hover:underline">
                                                            #{prereq.id}
                                                        </Link>
                                                        <Badge variant={getStatusVariant(prereq.status)} className="text-[9px] px-1.5 py-0 uppercase font-black">
                                                            {prereq.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground truncate max-w-[170px] mt-0.5">
                                                        {prereq.items?.map(i => i.title).join(', ') || prereq.customerName}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="xs"
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                                    onClick={() => handleUnlinkPrerequisite(prereq.id)}
                                                    title="Unlink Prerequisite"
                                                >
                                                    <Unlink className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded border border-dashed text-center">
                                        No prerequisite orders linked.
                                    </p>
                                )}
                            </div>

                            {/* Dependent Orders (Orders waiting on this one) */}
                            {dependentOrders.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-border/40">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                            Dependent Orders (Blocked by this)
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                            {dependentOrders.length}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {dependentOrders.map((dep) => (
                                            <div key={dep.id} className="flex items-center justify-between p-2 rounded-md border bg-blue-500/5 border-blue-500/20 text-xs">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Link href={`/admin/orders/${dep.id}`} className="font-bold text-primary hover:underline">
                                                            #{dep.id}
                                                        </Link>
                                                        <Badge variant={getStatusVariant(dep.status)} className="text-[9px] px-1.5 py-0 uppercase font-black">
                                                            {dep.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground truncate max-w-[190px] mt-0.5">
                                                        {dep.customerName} • {dep.items?.map(i => i.title).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Audit Log Trail Card */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" /> Audit Log Trail
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0 max-h-64 overflow-y-auto">
                            {order.auditLog && order.auditLog.length > 0 ? (
                                order.auditLog.slice().reverse().map((entry) => (
                                    <div key={entry.id} className="text-xs border-l-2 border-primary/40 pl-3 py-1 space-y-0.5 bg-muted/30 rounded-r">
                                        <div className="flex items-center justify-between font-bold text-foreground">
                                            <span>{entry.action.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-muted-foreground font-normal">
                                                {safeFormatDate(entry.timestamp, 'dd/MM, HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground leading-snug">{entry.details}</p>
                                        <p className="text-[10px] text-primary font-medium">By: {entry.performedByName || entry.performedBy}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-3">No audit entries recorded yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
  );
}
