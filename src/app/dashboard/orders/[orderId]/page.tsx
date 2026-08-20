'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from '@/lib/firebase';
import { Order, Service, User, OrderNote, DocumentUpload, UploadedFileItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Loader2, Upload, ClipboardCheck, MessageSquare, Send, Mail, 
  CheckCircle, AlertTriangle, Paperclip, FileText, FileSpreadsheet, FileImage, 
  File as FileIcon, Trash2, ExternalLink, HelpCircle, Info, Plus, RefreshCw, Edit3, CheckCircle2,
  MessageSquareQuote
} from 'lucide-react';
import { format } from 'date-fns';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { notifyStaffOfDocumentUpload, notifyOfNewNote, notifyStaffOfClientNote } from '@/app/actions';
import { NoteAttachmentsPreview } from '@/components/orders/NoteAttachmentsPreview';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileName?: string) {
  if (!fileName) return <FileText className="h-4 w-4 text-primary shrink-0" />;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />;
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'heic'].includes(ext || '')) {
    return <FileImage className="h-4 w-4 text-indigo-600 shrink-0" />;
  }
  if (ext === 'pdf') {
    return <FileText className="h-4 w-4 text-red-600 shrink-0" />;
  }
  return <FileIcon className="h-4 w-4 text-primary shrink-0" />;
}

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
  attachment: z.any().optional(),
}).refine(data => (data.noteText && data.noteText.trim().length >= 3) || (data.attachment && data.attachment.length > 0), {
  message: "Note must be at least 3 characters or include an attachment.",
  path: ["noteText"],
});

export default function ClientOrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const params = useParams();
  const id = params.orderId as string;
  const { user: currentUser } = useAuth();
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const [textInputs, setTextInputs] = useState<{ [key: string]: string }>({});
  const [conditionalAnswers, setConditionalAnswers] = useState<Record<string, boolean>>({});
  
  // Missing document explanations state
  const [unavailableReasons, setUnavailableReasons] = useState<Record<string, string>>({});
  const [activeUnavailableForms, setActiveUnavailableForms] = useState<Record<string, boolean>>({});
  const [editingRequirements, setEditingRequirements] = useState<Record<string, boolean>>({});

  // Attached files & screenshots state for live preview
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConditionalAnswer = async (serviceId: string, requirementLabel: string, answer: boolean) => {
      const uploadKey = `${serviceId}-${requirementLabel}`;
      if (answer) {
          setConditionalAnswers(prev => ({ ...prev, [uploadKey]: true }));
          if (!currentUser || !order) return;
          const newUpload: DocumentUpload = {
              serviceId,
              requirementLabel,
              type: 'text',
              textValue: 'Applicable (Yes)',
              uploadedAt: Timestamp.now(),
              status: 'pending',
          };
          try {
              const orderRef = doc(db, 'orders', order.id);
              const currentUploads = order.documentUploads || [];
              const existingIndex = currentUploads.findIndex(d => (d.serviceId === serviceId || d.serviceId === order.items[0]?.id) && d.requirementLabel === requirementLabel);
              let updatedUploads;
              if (existingIndex > -1) {
                  updatedUploads = [...currentUploads];
                  updatedUploads[existingIndex] = newUpload;
              } else {
                  updatedUploads = [...currentUploads, newUpload];
              }
              await updateDoc(orderRef, { documentUploads: updatedUploads });
              fetchOrderAndServices();
          } catch (error) {
              console.error("Error submitting answer:", error);
          }
      } else {
          if (!currentUser || !order) return;
          const newUpload: DocumentUpload = {
              serviceId,
              requirementLabel,
              type: 'text',
              textValue: 'N/A (No)',
              uploadedAt: Timestamp.now(),
              status: 'approved', // Mark as approved so it counts as completed
          };
          try {
              const orderRef = doc(db, 'orders', order.id);
              const currentUploads = order.documentUploads || [];
              const existingIndex = currentUploads.findIndex(d => (d.serviceId === serviceId || d.serviceId === order.items[0]?.id) && d.requirementLabel === requirementLabel);
              let updatedUploads;
              if (existingIndex > -1) {
                  updatedUploads = [...currentUploads];
                  updatedUploads[existingIndex] = newUpload;
              } else {
                  updatedUploads = [...currentUploads, newUpload];
              }
              await updateDoc(orderRef, { documentUploads: updatedUploads });
              toast({ title: 'Information Saved', description: 'Your answer has been saved.' });
              fetchOrderAndServices();
          } catch (error) {
              console.error("Error submitting answer:", error);
          }
      }
  };

  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      noteText: '',
      attachment: null,
    }
  });

    const fetchOrderAndServices = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
          setOrder(orderData);
        } else {
          setOrder(null);
        }

        const servicesSnap = await getDocs(collection(db, 'services'));
        const servicesList = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setAllServices(servicesList);

        const staffQuery = query(collection(db, 'users'), where('role', 'in', ['admin', 'consultant', 'senior_accountant', 'accountant', 'support_agent', 'partner']));
        const staffSnap = await getDocs(staffQuery);
        const staffList = staffSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        setAllStaff(staffList);

      } catch (error) {
        console.error("Error fetching order/services:", error);
        toast({
            title: "Error loading order",
            description: "Could not fetch the order details. Please try again later.",
            variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchOrderAndServices();
  }, [id]);
  
  const handleFilesUpload = async (filesList: FileList | File[], serviceId: string, requirementLabel: string, isAppend = true) => {
    if (!currentUser || !order) return;
    const filesArray = Array.from(filesList);
    if (filesArray.length === 0) return;

    for (const file of filesArray) {
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: 'File Exceeds Size Limit',
          description: `${file.name} is larger than 25MB. Please compress or select a smaller file.`,
          variant: 'destructive',
        });
        return;
      }
    }

    const uploadKey = `${serviceId}-${requirementLabel}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: 0 }));

    try {
      const uploadPromises = filesArray.map(async (file, idx) => {
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${Date.now()}_${idx}_${sanitizedFileName}`;
        const storageRef = ref(storage, `uploads/${currentUser.uid}/orders/${order.id}/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<UploadedFileItem>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadingFiles(prev => ({ ...prev, [uploadKey]: pct }));
            },
            (error) => {
              console.error("Upload error for file:", file.name, error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                fileUrl: downloadURL,
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
                status: 'pending',
              });
            }
          );
        });
      });

      const newUploadedItems = await Promise.all(uploadPromises);

      const orderRef = doc(db, 'orders', order.id);
      const currentUploads = order.documentUploads || [];
      const existingIndex = currentUploads.findIndex(d => (d.serviceId === serviceId || d.serviceId === order.items[0]?.id) && d.requirementLabel === requirementLabel);

      let existingFiles: UploadedFileItem[] = [];
      if (existingIndex > -1) {
        const existingUpload = currentUploads[existingIndex];
        if (existingUpload.files && existingUpload.files.length > 0) {
          existingFiles = existingUpload.files;
        } else if (existingUpload.fileUrl) {
          existingFiles = [{
            id: `${Date.now()}_legacy`,
            fileUrl: existingUpload.fileUrl,
            fileName: existingUpload.fileName || 'Uploaded Document',
            uploadedAt: existingUpload.uploadedAt?.toDate ? existingUpload.uploadedAt.toDate().toISOString() : new Date().toISOString(),
            status: existingUpload.status || 'pending',
          }];
        }
      }

      const mergedFiles = isAppend ? [...existingFiles, ...newUploadedItems] : newUploadedItems;
      const primaryFile = mergedFiles[0];

      const newUpload: DocumentUpload = {
        serviceId,
        requirementLabel,
        type: 'file',
        fileUrl: primaryFile?.fileUrl || '',
        fileName: primaryFile?.fileName || '',
        files: mergedFiles,
        uploadedAt: Timestamp.now(),
        status: 'pending',
        notAvailableReason: undefined, // Clear unavailable reason since files are uploaded
      };

      let updatedUploads;
      if (existingIndex > -1) {
        updatedUploads = [...currentUploads];
        updatedUploads[existingIndex] = newUpload;
      } else {
        updatedUploads = [...currentUploads, newUpload];
      }

      await updateDoc(orderRef, {
        documentUploads: updatedUploads
      });

      toast({ 
        title: filesArray.length === 1 ? 'File Uploaded' : `${filesArray.length} Files Uploaded`, 
        description: `${filesArray.length} document(s) saved for review.` 
      });

      setEditingRequirements(prev => ({ ...prev, [uploadKey]: false }));
      setActiveUnavailableForms(prev => ({ ...prev, [uploadKey]: false }));
      fetchOrderAndServices();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: 'Upload Failed', description: error.message || 'Could not upload selected file(s).', variant: 'destructive'});
    } finally {
      setUploadingFiles(prev => {
        const newUploading = { ...prev };
        delete newUploading[uploadKey];
        return newUploading;
      });
    }
  };

  const handleRemoveSingleFile = async (serviceId: string, requirementLabel: string, fileId: string) => {
    if (!currentUser || !order) return;
    const orderRef = doc(db, 'orders', order.id);
    const currentUploads = order.documentUploads || [];
    const existingIndex = currentUploads.findIndex(d => (d.serviceId === serviceId || d.serviceId === order.items[0]?.id) && d.requirementLabel === requirementLabel);
    if (existingIndex === -1) return;

    const existingUpload = currentUploads[existingIndex];
    let currentFiles: UploadedFileItem[] = existingUpload.files || [];
    if (currentFiles.length === 0 && existingUpload.fileUrl) {
      currentFiles = [{
        id: 'legacy',
        fileUrl: existingUpload.fileUrl,
        fileName: existingUpload.fileName || 'Uploaded Document',
        uploadedAt: new Date().toISOString(),
      }];
    }

    const remainingFiles = currentFiles.filter(f => f.id !== fileId && f.fileUrl !== fileId);

    let updatedUploads = [...currentUploads];
    if (remainingFiles.length > 0) {
      updatedUploads[existingIndex] = {
        ...existingUpload,
        fileUrl: remainingFiles[0].fileUrl,
        fileName: remainingFiles[0].fileName,
        files: remainingFiles,
      };
    } else {
      updatedUploads[existingIndex] = {
        ...existingUpload,
        fileUrl: '',
        fileName: '',
        files: [],
        status: 'pending',
      };
    }

    try {
      await updateDoc(orderRef, { documentUploads: updatedUploads });
      toast({ title: 'File Removed' });
      fetchOrderAndServices();
    } catch (err) {
      console.error('Error removing file:', err);
      toast({ title: 'Failed to remove file', variant: 'destructive' });
    }
  };

  const handleSaveExplanation = async (serviceId: string, requirementLabel: string) => {
    const uploadKey = `${serviceId}-${requirementLabel}`;
    const reason = unavailableReasons[uploadKey];
    if (!currentUser || !order || !reason || !reason.trim()) {
      toast({ title: 'Please enter a note', description: 'Explain why you cannot provide this document at this time.', variant: 'destructive' });
      return;
    }

    const newUpload: DocumentUpload = {
      serviceId,
      requirementLabel,
      type: 'explanation',
      notAvailableReason: reason.trim(),
      uploadedAt: Timestamp.now(),
      status: 'pending',
    };

    try {
      const orderRef = doc(db, 'orders', order.id);
      const currentUploads = order.documentUploads || [];
      const existingIndex = currentUploads.findIndex(d => (d.serviceId === serviceId || d.serviceId === order.items[0]?.id) && d.requirementLabel === requirementLabel);
      
      let updatedUploads;
      if (existingIndex > -1) {
        updatedUploads = [...currentUploads];
        updatedUploads[existingIndex] = { ...currentUploads[existingIndex], ...newUpload };
      } else {
        updatedUploads = [...currentUploads, newUpload];
      }

      await updateDoc(orderRef, { documentUploads: updatedUploads });
      toast({ title: 'Note Saved', description: 'Your consultant has been informed of why this document is unavailable.' });
      setActiveUnavailableForms(prev => ({ ...prev, [uploadKey]: false }));
      setEditingRequirements(prev => ({ ...prev, [uploadKey]: false }));
      fetchOrderAndServices();
    } catch (err) {
      console.error('Error saving explanation:', err);
      toast({ title: 'Failed to save note', variant: 'destructive' });
    }
  };

  const handleClearExplanation = async (serviceId: string, requirementLabel: string) => {
    if (!currentUser || !order) return;
    const uploadKey = `${serviceId}-${requirementLabel}`;
    const orderRef = doc(db, 'orders', order.id);
    const currentUploads = order.documentUploads || [];
    const existingIndex = currentUploads.findIndex(d => (d.serviceId === serviceId || d.serviceId === order.items[0]?.id) && d.requirementLabel === requirementLabel);
    if (existingIndex === -1) return;

    const existingUpload = currentUploads[existingIndex];
    const updatedUploads = [...currentUploads];
    updatedUploads[existingIndex] = {
      ...existingUpload,
      notAvailableReason: '',
      type: (existingUpload.files && existingUpload.files.length > 0) || existingUpload.fileUrl ? 'file' : 'text',
    };

    try {
      await updateDoc(orderRef, { documentUploads: updatedUploads });
      setActiveUnavailableForms(prev => ({ ...prev, [uploadKey]: false }));
      setUnavailableReasons(prev => ({ ...prev, [uploadKey]: '' }));
      fetchOrderAndServices();
    } catch (err) {
      console.error('Error clearing explanation:', err);
    }
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

      const newUpload: DocumentUpload = {
          serviceId,
          requirementLabel,
          type: 'text',
          textValue: text,
          uploadedAt: Timestamp.now(),
          status: 'pending',
      };

      try {
          const orderRef = doc(db, 'orders', order.id);
          const currentUploads = order.documentUploads || [];
          const existingIndex = currentUploads.findIndex(d => (d.serviceId === serviceId || d.serviceId === order.items[0]?.id) && d.requirementLabel === requirementLabel);
          
          let updatedUploads;
          if (existingIndex > -1) {
              updatedUploads = [...currentUploads];
              updatedUploads[existingIndex] = newUpload;
          } else {
              updatedUploads = [...currentUploads, newUpload];
          }

          await updateDoc(orderRef, {
              documentUploads: updatedUploads
          });
          toast({ title: 'Information Submitted', description: 'Your information has been securely saved.' });
          setTextInputs(prev => ({...prev, [requirementLabel]: ''}));
          setEditingRequirements(prev => ({ ...prev, [`${serviceId}-${requirementLabel}`]: false }));
          fetchOrderAndServices();
      } catch (error) {
          console.error("Error submitting text:", error);
          toast({ title: "Submission Failed", description: "Could not save the information.", variant: "destructive" });
      }
  };


  const onNoteSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    if (!currentUser || !order) return;

    if (!values.noteText?.trim() && attachedFiles.length === 0) {
      toast({ title: "Note Empty", description: "Please enter text or attach a screenshot/file.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let attachments: { name: string; url: string }[] = [];
    const filesToUpload = attachedFiles.length > 0 ? attachedFiles : (values.attachment ? Array.from(values.attachment as FileList) : []);

    if (filesToUpload.length > 0) {
      toast({ title: `Uploading ${filesToUpload.length} attachment(s)...`, description: 'Please wait.' });
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
        toast({ title: 'Attachments Uploaded' });
      } catch (error) {
        console.error('Attachment upload failed:', error);
        toast({ title: 'Attachment Upload Failed', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
    }

    const newNote: OrderNote = {
      text: values.noteText || "",
      authorId: currentUser.uid,
      date: Timestamp.now(),
      type: 'note',
      subject: null,
      attachments: attachments.length > 0 ? attachments : null,
    };

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        notes: arrayUnion(newNote),
      });

      // Notification logic (server action ensures correct lookup of assignee or info@myacc.co.za)
      notifyStaffOfClientNote({
          orderId: order.id,
          senderName: currentUser?.name || 'Client',
          noteText: values.noteText || "Attached File"
      }).catch(err => console.error("Failed to send note notification to staff:", err));

      toast({ title: "Note Added", description: "Your note has been saved." });
      noteForm.reset();
      setAttachedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchOrderAndServices();
    } catch (error) {
      console.error("Error adding note:", error);
      toast({ title: "Error", description: "Failed to add note.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifyConsultant = async () => {
    if (!currentUser || !order) return;
    
    let assignedStaffName = 'Admin';
    let assignedStaffEmail = 'info@myacc.co.za';

    if (order.assignedTo && order.assignedTo.length > 0) {
      const assignedStaff = allStaff.find(s => s.id === order.assignedTo![0]);
      if (assignedStaff && assignedStaff.email) {
        assignedStaffName = assignedStaff.name || 'Consultant';
        assignedStaffEmail = assignedStaff.email;
      }
    }

    setIsSubmitting(true);
    toast({ title: "Notifying Consultant...", description: "Please wait a moment." });

    const noteText = "Client has submitted their documents for review.";
    const newNote: OrderNote = {
      text: noteText,
      authorId: currentUser.uid,
      date: Timestamp.now(),
      type: 'note',
      subject: null,
      attachments: null,
    };

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { notes: arrayUnion(newNote) });
      
      await notifyStaffOfDocumentUpload({
          orderId: order.id,
          clientName: currentUser.name,
          assignedStaffName: assignedStaffName,
          assignedStaffEmail: assignedStaffEmail,
      });

      toast({ title: "Documents Submitted!", description: "Your consultant has been notified." });
      fetchOrderAndServices();
    } catch(error) {
      console.error("Error submitting documents:", error);
      toast({ title: "Submission Failed", description: "Could not notify the consultant.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusVariant = (status: Order['status'] | 'Outsourced') => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Processing':
      case 'Outsourced':
        return 'info';
      case 'Pending Payment': return 'warning';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getAuthor = (authorId: string): { name: string } | undefined => {
    if (authorId === 'system') return { name: 'My Accountant (System)' };
    if (currentUser?.uid === authorId) return currentUser;
    if (order && authorId === order.userId) return { name: order.customerName };
    const staff = allStaff.find(u => u.uid === authorId || u.id === authorId);
    if (staff) return staff;
    return { name: 'Consultant' };
  }
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!order) return notFound();

    const orderedItemsWithServices = order.items.map(item => {
        const itemId = item.id || item.serviceId || item.title;
        const serviceDetails = allServices.find(s => 
          s.id === itemId || 
          (item.id && s.title.toLowerCase() === item.id.toLowerCase()) || 
          s.title.toLowerCase() === item.title.toLowerCase() ||
          s.slug === itemId
        );
        
        const standardReqs = serviceDetails?.informationToProvide || [];
        const customReqs = (order.documentUploads || [])
            .filter(d => (d.serviceId === itemId || d.serviceId === serviceDetails?.id) && !standardReqs.some(p => p.label === d.requirementLabel))
            .map(d => ({
                label: d.requirementLabel,
                type: d.type,
                helpText: '',
                isRequired: true,
            }));
            
        const combinedRequirements = [...standardReqs, ...customReqs];

        return { id: itemId, price: item.price || item.unitPrice || 0, ...item, service: serviceDetails, combinedRequirements };
    });

  const allRequirements = orderedItemsWithServices.flatMap(item => item.combinedRequirements || []);
  const requiredRequirements = allRequirements.filter(req => req.isRequired !== false);

  const isRequirementComplete = (reqLabel: string) => {
    return order.documentUploads?.some(doc => {
      if (doc.requirementLabel !== reqLabel || doc.status === 'rejected') return false;
      const hasFiles = Boolean((doc.files && doc.files.length > 0) || (doc.fileUrl && doc.fileUrl.length > 0));
      const hasExplanation = Boolean(doc.notAvailableReason && doc.notAvailableReason.trim().length > 0);
      const hasText = Boolean(doc.textValue && doc.textValue.length > 0 && doc.textValue !== 'Applicable (Yes)');
      return hasFiles || hasExplanation || hasText;
    });
  };

  const allSubmitted = requiredRequirements.every(req => isRequirementComplete(req.label));
  const submittedCount = requiredRequirements.filter(req => isRequirementComplete(req.label)).length;
  const consultantNotified = order.notes?.some(note => note.text === "Client has submitted their documents for review.") || false;

  return (
    <div className="space-y-8">
        <div>
            <Button variant="outline" asChild>
                <Link href="/dashboard/orders">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                </Link>
            </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 items-start">
            <div className="space-y-8">
                {allSubmitted && (
                    consultantNotified ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 dark:bg-green-950/20 dark:border-green-900 dark:text-green-300">
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-green-900 dark:text-green-200">All documents submitted!</p>
                                <p className="text-sm">Your consultant has been notified and is currently reviewing your documents. We will update you here and via email once the review is complete.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-900 dark:text-amber-200">Action Required: Submit for Review</p>
                                    <p className="text-sm">All required items have been completed or explained. Please submit them so your consultant can start processing your order.</p>
                                </div>
                            </div>
                            <Button onClick={handleNotifyConsultant} disabled={isSubmitting} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                                Submit Documents Now
                            </Button>
                        </div>
                    )
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Order {order.id}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                        <span>Date: {formatDate(order.date, 'long')}</span> | <span>Status: </span><Badge variant={getStatusVariant(order.status)}>{(order.status as any) === 'Outsourced' ? 'Processing' : order.status}</Badge>
                        </div>
                        {order.status === 'Pending Payment' && (
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-semibold text-amber-800">Awaiting Payment</p>
                                    <p className="text-sm text-amber-700">This order will only be processed once payment is received.</p>
                                </div>
                                <Button asChild variant="default">
                                    <Link href={`/order-confirmation/${order.id}`}>
                                        Complete Payment
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {requiredRequirements.length > 0 && (
                            <div className="p-4 bg-muted/60 rounded-lg border space-y-2">
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <span>Document Collection Progress</span>
                                    <span className="text-muted-foreground">{submittedCount} of {requiredRequirements.length} required items completed</span>
                                </div>
                                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-primary h-full transition-all duration-300 rounded-full" 
                                        style={{ width: `${requiredRequirements.length > 0 ? Math.min(100, Math.round((submittedCount / requiredRequirements.length) * 100)) : 100}%` }} 
                                    />
                                </div>
                            </div>
                        )}

                        {orderedItemsWithServices.map((item, index) => (
                            <div key={item.id}>
                                <div className="flex justify-between items-center">
                                    <div><p className="font-semibold text-lg">{item.title}</p></div>
                                    <p className="font-semibold text-lg">{formatPrice(item.price)}</p>
                                </div>
                                {item.combinedRequirements && item.combinedRequirements.length > 0 && (
                                    <div className="mt-4 pl-4 ml-4 border-l-2 space-y-4">
                                        <h4 className="font-medium text-md">Documents & Data Required:</h4>
                                        {item.combinedRequirements.map((info: any, infoIndex: number) => {
                                            const upload = order.documentUploads?.find(d => (d.serviceId === item.id || d.serviceId === item.service?.id) && d.requirementLabel === info.label);
                                            const uploadKey = `${item.service?.id || item.id}-${info.label}`;
                                            const isUploading = uploadingFiles[uploadKey] !== undefined;
                                            const isRejected = upload?.status === 'rejected';
                                            const isApproved = upload?.status === 'approved';
                                            const hasPassedConditional = upload?.textValue === 'Applicable (Yes)' || conditionalAnswers[uploadKey] === true;
                                            const isEditing = editingRequirements[uploadKey] === true;
                                            const showUnavailableForm = activeUnavailableForms[uploadKey] === true;

                                            // Extract files list
                                            let filesList: UploadedFileItem[] = [];
                                            if (upload?.files && upload.files.length > 0) {
                                                filesList = upload.files;
                                            } else if (upload?.fileUrl) {
                                                filesList = [{
                                                    id: 'legacy',
                                                    fileUrl: upload.fileUrl,
                                                    fileName: upload.fileName || 'Uploaded Document',
                                                    uploadedAt: upload.uploadedAt,
                                                    status: upload.status,
                                                }];
                                            }

                                            const hasFiles = filesList.length > 0;
                                            const hasExplanation = Boolean(upload?.notAvailableReason && upload.notAvailableReason.trim().length > 0);
                                            const hasTextValue = Boolean(upload?.textValue && upload.textValue !== 'Applicable (Yes)' && upload.textValue !== 'N/A (No)');
                                            const isNotUploaded = !upload || (!hasFiles && !hasExplanation && !hasTextValue);

                                            return (
                                            <div key={infoIndex} className={`space-y-3 p-3.5 rounded-lg border transition-all ${
                                                isRejected 
                                                    ? 'border-destructive bg-destructive/5 dark:bg-destructive/10' 
                                                    : hasFiles || hasExplanation || hasTextValue 
                                                    ? 'border-border bg-card shadow-2xs' 
                                                    : 'border-dashed border-muted-foreground/30 bg-muted/20'
                                            }`}>
                                                {/* Header Row */}
                                                <div className="flex justify-between items-start gap-2 flex-wrap">
                                                    <div>
                                                        <label className="text-sm font-semibold flex items-center gap-2">
                                                            <ClipboardCheck className="h-4 w-4 text-primary" />
                                                            {info.label}
                                                            {info.isRequired === false && (
                                                                <Badge variant="outline" className="text-[10px] py-0 font-normal border-dashed text-muted-foreground">
                                                                    Optional
                                                                </Badge>
                                                            )}
                                                            {info.type && (
                                                                <Badge variant="secondary" className="text-[10px] uppercase font-mono py-0">
                                                                    {info.type}
                                                                </Badge>
                                                            )}
                                                        </label>
                                                        {info.helpText && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 pl-6">{info.helpText}</p>
                                                        )}
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div>
                                                        {isApproved && (
                                                            <Badge variant="success" className="text-xs">
                                                                <CheckCircle className="mr-1 h-3 w-3" /> Verified & Approved
                                                            </Badge>
                                                        )}
                                                        {isRejected && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                <AlertTriangle className="mr-1 h-3 w-3" /> Needs Revision
                                                            </Badge>
                                                        )}
                                                        {upload && !isApproved && !isRejected && (hasFiles || hasExplanation || hasTextValue) && (
                                                            <Badge variant="warning" className="text-xs">
                                                                {hasExplanation ? <HelpCircle className="mr-1 h-3 w-3" /> : <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                                                {hasExplanation ? 'Note Provided / Awaiting Review' : 'Under Review'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Rejection Alert */}
                                                {isRejected && (
                                                    <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive flex items-start gap-2">
                                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="font-semibold">Revision Required:</span> {upload.rejectionReason}
                                                            <p className="mt-1 text-muted-foreground font-normal">Please upload replacement files or provide clarification below.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Active Uploading Indicator */}
                                                {isUploading && (
                                                    <div className="p-3 bg-primary/5 rounded-md border border-primary/20 flex items-center gap-2.5">
                                                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0"/>
                                                        <div className="flex-1 space-y-1">
                                                            <p className="text-xs font-semibold text-primary">Uploading document(s)...</p>
                                                            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="bg-primary h-full transition-all duration-200" 
                                                                    style={{ width: `${Math.round(uploadingFiles[uploadKey] || 0)}%` }} 
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono font-bold text-primary">{Math.round(uploadingFiles[uploadKey] || 0)}%</span>
                                                    </div>
                                                )}

                                                {/* 1. Missing Document / Explanation Display */}
                                                {hasExplanation && !isEditing && (
                                                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-md text-xs dark:bg-amber-950/20 dark:border-amber-900/40 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                                                <MessageSquareQuote className="h-4 w-4 text-amber-600" />
                                                                Your Explanation for Missing Document:
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <Button 
                                                                    type="button" 
                                                                    size="xs" 
                                                                    variant="ghost" 
                                                                    className="h-7 text-xs text-amber-900 hover:text-amber-950 dark:text-amber-200"
                                                                    onClick={() => {
                                                                        setUnavailableReasons(prev => ({ ...prev, [uploadKey]: upload?.notAvailableReason || '' }));
                                                                        setActiveUnavailableForms(prev => ({ ...prev, [uploadKey]: true }));
                                                                    }}
                                                                >
                                                                    <Edit3 className="h-3 w-3 mr-1" /> Edit Note
                                                                </Button>
                                                                <Button 
                                                                    type="button" 
                                                                    size="xs" 
                                                                    variant="outline" 
                                                                    className="h-7 text-xs bg-background"
                                                                    onClick={() => setEditingRequirements(prev => ({ ...prev, [uploadKey]: true }))}
                                                                >
                                                                    <Upload className="h-3 w-3 mr-1" /> Upload File Instead
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <p className="pl-5 text-muted-foreground italic">"{upload?.notAvailableReason}"</p>
                                                    </div>
                                                )}

                                                {/* 2. Uploaded Files List Display (Supports Multiple Files) */}
                                                {hasFiles && !isEditing && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-semibold text-muted-foreground">
                                                                {filesList.length} {filesList.length === 1 ? 'file uploaded' : 'files uploaded (e.g. multi-month statements / multi-page documents)'}:
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="xs"
                                                                    className="h-7 text-xs text-primary"
                                                                    onClick={() => setEditingRequirements(prev => ({ ...prev, [uploadKey]: true }))}
                                                                >
                                                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add / Replace Files
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-1.5">
                                                            {filesList.map((fileItem, fIdx) => (
                                                                <div 
                                                                    key={fileItem.id || `file_${fIdx}`} 
                                                                    className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border text-xs gap-3"
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                        {getFileIcon(fileItem.fileName)}
                                                                        <span className="font-medium truncate text-foreground" title={fileItem.fileName}>
                                                                            {fileItem.fileName}
                                                                        </span>
                                                                        {fileItem.fileSize && (
                                                                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                                                                ({formatFileSize(fileItem.fileSize)})
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <a
                                                                            href={fileItem.fileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-2 py-1 rounded text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                                                                        >
                                                                            <ExternalLink className="h-3.5 w-3.5" /> View
                                                                        </a>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                            title="Remove this file"
                                                                            onClick={() => handleRemoveSingleFile(item.service?.id || item.id, info.label, fileItem.id || fileItem.fileUrl)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 3. Text Requirement Submitted Display */}
                                                {hasTextValue && !hasFiles && !hasExplanation && !isEditing && (
                                                    <div className="p-2.5 bg-green-50 text-green-900 rounded-md border border-green-200 text-xs flex items-center justify-between gap-2">
                                                        <span className="font-medium truncate">Submitted: "{upload?.textValue}"</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="xs"
                                                            className="h-7 text-xs text-green-900 hover:text-green-950 shrink-0"
                                                            onClick={() => {
                                                                setTextInputs(prev => ({ ...prev, [info.label]: upload?.textValue || '' }));
                                                                setEditingRequirements(prev => ({ ...prev, [uploadKey]: true }));
                                                            }}
                                                        >
                                                            <Edit3 className="h-3 w-3 mr-1" /> Edit
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* 4. Upload Input / Edit Controls */}
                                                {(isNotUploaded || isEditing) && (
                                                    <div className="space-y-3 pt-1">
                                                        {info.isConditional && !hasPassedConditional && (!upload || upload.textValue !== 'N/A (No)') ? (
                                                            <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border">
                                                                <p className="text-sm font-medium">{info.conditionalQuestion || info.label}</p>
                                                                <div className="flex gap-2">
                                                                    <Button size="sm" onClick={() => handleConditionalAnswer(item.service?.id || item.id, info.label, true)}>Yes</Button>
                                                                    <Button size="sm" variant="outline" onClick={() => handleConditionalAnswer(item.service?.id || item.id, info.label, false)}>No</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {showUnavailableForm ? (
                                                                    /* Explanation Form */
                                                                    <div className="p-3 bg-muted/40 rounded-lg border space-y-2.5">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                                                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                                                                Why is this document unavailable?
                                                                            </span>
                                                                            <Button 
                                                                                type="button" 
                                                                                variant="ghost" 
                                                                                size="xs" 
                                                                                className="h-6 text-xs text-muted-foreground"
                                                                                onClick={() => setActiveUnavailableForms(prev => ({ ...prev, [uploadKey]: false }))}
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </div>
                                                                        <Textarea 
                                                                            rows={2}
                                                                            placeholder="e.g. Bank account not opened yet, company is newly registered, director is currently abroad..."
                                                                            value={unavailableReasons[uploadKey] || ''}
                                                                            onChange={(e) => setUnavailableReasons(prev => ({ ...prev, [uploadKey]: e.target.value }))}
                                                                            className="text-xs"
                                                                        />
                                                                        <div className="flex justify-end gap-2">
                                                                            <Button 
                                                                                type="button" 
                                                                                size="sm" 
                                                                                className="h-7 text-xs"
                                                                                onClick={() => handleSaveExplanation(item.service?.id || item.id, info.label)}
                                                                            >
                                                                                Save Note
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    /* Main Upload / Input */
                                                                    <div className="space-y-2">
                                                                        {info.type === 'pdf' ? (
                                                                            <div className="space-y-1">
                                                                                <Input 
                                                                                    type="file" 
                                                                                    multiple
                                                                                    accept="application/pdf" 
                                                                                    className="h-9 text-xs cursor-pointer" 
                                                                                    onChange={(e) => e.target.files && handleFilesUpload(e.target.files, item.service?.id || item.id, info.label, true)} 
                                                                                />
                                                                                <p className="text-[11px] text-muted-foreground">Tip: You can select multiple PDF files at once (e.g. 12 monthly statements).</p>
                                                                            </div>
                                                                        ) : info.type === 'excel' ? (
                                                                            <div className="space-y-1">
                                                                                <Input 
                                                                                    type="file" 
                                                                                    multiple
                                                                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                                                                                    className="h-9 text-xs cursor-pointer" 
                                                                                    onChange={(e) => e.target.files && handleFilesUpload(e.target.files, item.service?.id || item.id, info.label, true)} 
                                                                                />
                                                                                <p className="text-[11px] text-muted-foreground">Select one or multiple Excel / CSV sheets.</p>
                                                                            </div>
                                                                        ) : info.type === 'image' ? (
                                                                            <div className="space-y-1">
                                                                                <Input 
                                                                                    type="file" 
                                                                                    multiple
                                                                                    accept="image/*, .png, .jpg, .jpeg, .webp, .heic" 
                                                                                    className="h-9 text-xs cursor-pointer" 
                                                                                    onChange={(e) => e.target.files && handleFilesUpload(e.target.files, item.service?.id || item.id, info.label, true)} 
                                                                                />
                                                                                <p className="text-[11px] text-muted-foreground">Select one or multiple clear photo scans.</p>
                                                                            </div>
                                                                        ) : info.type === 'any' ? (
                                                                            <div className="space-y-1">
                                                                                <Input 
                                                                                    type="file" 
                                                                                    multiple
                                                                                    accept="*" 
                                                                                    className="h-9 text-xs cursor-pointer" 
                                                                                    onChange={(e) => e.target.files && handleFilesUpload(e.target.files, item.service?.id || item.id, info.label, true)} 
                                                                                />
                                                                                <p className="text-[11px] text-muted-foreground">You can select multiple files of any type.</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <Input 
                                                                                    type="text" 
                                                                                    className="h-8 text-xs font-medium" 
                                                                                    placeholder="Enter information here..." 
                                                                                    value={textInputs[info.label] || ''} 
                                                                                    onChange={(e) => handleTextChange(info.label, e.target.value)} 
                                                                                />
                                                                                <Button size="sm" className="h-8 text-xs shrink-0" onClick={() => handleTextSubmit(item.service?.id || item.id, info.label)}>
                                                                                    Save
                                                                                </Button>
                                                                            </div>
                                                                        )}

                                                                        {/* "Don't have this document" trigger */}
                                                                        <div className="flex items-center justify-between pt-1">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="xs"
                                                                                className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-1"
                                                                                onClick={() => setActiveUnavailableForms(prev => ({ ...prev, [uploadKey]: true }))}
                                                                            >
                                                                                <HelpCircle className="h-3 w-3 mr-1 text-primary" />
                                                                                I don't have this document / Explain why
                                                                            </Button>

                                                                            {isEditing && (hasFiles || hasExplanation || hasTextValue) && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="xs"
                                                                                    className="h-6 text-[11px] text-muted-foreground"
                                                                                    onClick={() => setEditingRequirements(prev => ({ ...prev, [uploadKey]: false }))}
                                                                                >
                                                                                    Done Editing
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )})}
                                    </div>
                                )}
                                {index < orderedItemsWithServices.length - 1 && <Separator className="my-6" />}
                            </div>
                        ))}
                         <Separator className="my-4" /><div className="flex justify-between font-bold text-xl"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                    </CardContent>
                    {allRequirements.length > 0 && (
                        <CardFooter>
                            <Button 
                                onClick={handleNotifyConsultant} 
                                disabled={isSubmitting || !allSubmitted || consultantNotified}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : consultantNotified ? (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {consultantNotified ? "Consultant Notified" : "Notify Consultant of All Submissions"}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
                
                 <Card>
                    <CardHeader><CardTitle>Communication History</CardTitle><CardDescription>Notes and messages regarding this order.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {order.notes && order.notes.filter(n => !n.isInternal).length > 0 ? (
                                order.notes.filter(n => !n.isInternal).slice().reverse().map((note, index) => {
                                    const author = getAuthor(note.authorId);
                                    const isEmail = note.type === 'email';
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="p-3 rounded-lg w-full bg-muted">
                                                <div className="flex justify-between items-center mb-1"><p className="text-xs font-semibold">{author?.name || 'System'}</p><p className="text-xs text-muted-foreground">{formatDate(note.date, 'datetime')}</p></div>
                                                 {isEmail ? ( <div><div className="flex items-center gap-2 mb-1"><Mail className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold">{note.subject}</p></div><p className="text-sm italic text-muted-foreground">"{note.text}"</p></div> ) : ( <p className="text-sm" dangerouslySetInnerHTML={{ __html: note.text.replace(/\n/g, '<br />') }} /> )}
                                                 {note.attachments && note.attachments.length > 0 && ( <div className="mt-2 space-y-1">{note.attachments.map((att, i) => ( <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><Paperclip className="h-4 w-4"/>{att.name}</a> ))}</div> )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : ( <p className="text-xs text-muted-foreground text-center py-4">No notes for this order yet.</p> )}
                        </div>
                         <Form {...noteForm}>
                            <form onSubmit={noteForm.handleSubmit(onNoteSubmit)} className="space-y-4 pt-4">
                                <FormField control={noteForm.control} name="noteText" render={({ field }) => ( 
                                    <FormItem>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Add a new note... (Tip: You can paste screenshots directly with Ctrl+V)" 
                                                {...field} 
                                                rows={3} 
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
                                        <span className="text-[11px] text-muted-foreground font-mono">PNG, JPG, PDF, DOCX or Ctrl+V</span>
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

                                <div className="flex justify-end">
                                    <Button type="submit" size="sm" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                        Post Note
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
