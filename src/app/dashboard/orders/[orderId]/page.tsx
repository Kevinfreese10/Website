'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from '@/lib/firebase';
import { Order, Service, User, OrderNote, DocumentUpload } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Upload, ClipboardCheck, MessageSquare, Send, Mail, CheckCircle, AlertTriangle, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { notifyStaffOfDocumentUpload, notifyOfNewNote, notifyStaffOfClientNote } from '@/app/actions';


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
              toast({ title: "Submission Failed", description: "Could not save.", variant: "destructive" });
          }
      }
  };   const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { noteText: "" },
  });

  const fetchOrderAndServices = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        let fetchedStaff: User[] = [];
        if (currentUser?.role === 'admin') {
            try {
                const staffQuery = query(collection(db, "users"), where('role', 'in', ['staff', 'admin', 'partner', 'partner_staff', 'ai_accountant']));
                const staffSnapshot = await getDocs(staffQuery);
                fetchedStaff = staffSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id, id: doc.id } as User));
            } catch (err) {
                console.error("Error fetching staff:", err);
            }
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
          setOrder({
            ...data,
            id: docSnap.id,
            date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
            notes: (data.notes || []).map((note: any) => ({...note, date: note.date?.toDate ? note.date.toDate() : new Date(note.date), attachments: note.attachments || null })),
            documentUploads: (data.documentUploads || []).map((doc: any) => ({...doc, uploadedAt: doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toISOString() : (doc.uploadedAt ? (typeof doc.uploadedAt === 'string' ? doc.uploadedAt : new Date(doc.uploadedAt).toISOString()) : new Date().toISOString())})),
          } as Order);
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
    fetchOrderAndServices();
  }, [id]);
  
  const handleFileUpload = (file: File, serviceId: string, requirementLabel: string) => {
    if (!currentUser || !order) return;
    
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: 'File Exceeds Size Limit',
        description: 'Maximum file size allowed is 25MB. Please compress or select a smaller file.',
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
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const newUpload: DocumentUpload = {
                serviceId,
                requirementLabel,
                type: 'file',
                fileUrl: downloadURL,
                fileName: file.name,
                uploadedAt: Timestamp.now(),
                status: 'pending',
            };
            
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

            toast({ title: 'File Uploaded', description: `${file.name} has been submitted for review.`});
            setUploadingFiles(prev => {
                const newUploading = { ...prev };
                delete newUploading[uploadKey];
                return newUploading;
            });
            fetchOrderAndServices(); // Re-fetch to update UI
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
            fetchOrderAndServices(); // Re-fetch to update UI
        } catch (error) {
            console.error("Error submitting text:", error);
            toast({ title: "Submission Failed", description: "Could not save the information.", variant: "destructive" });
        }
    };


  const onNoteSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    if (!currentUser || !order) return;

    setIsSubmitting(true);
    let attachments: { name: string; url: string }[] = [];
    const file = values.attachment?.[0];

    if (file) {
      toast({ title: 'Uploading attachment...', description: 'Please wait.' });
      try {
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `uploads/${currentUser.uid}/orders/${order.id}/notes/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        const snapshot = await uploadTask;
        const downloadURL = await getDownloadURL(snapshot.ref);
        attachments = [{ name: file.name, url: downloadURL }];
        toast({ title: 'Attachment Uploaded' });
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
        const serviceDetails = allServices.find(s => 
          s.id === item.id || 
          s.title.toLowerCase() === item.id.toLowerCase() || 
          s.title.toLowerCase() === item.title.toLowerCase() ||
          s.slug === item.id
        );
        
        const standardReqs = serviceDetails?.informationToProvide || [];
        const customReqs = (order.documentUploads || [])
            .filter(d => (d.serviceId === item.id || d.serviceId === serviceDetails?.id) && !standardReqs.some(p => p.label === d.requirementLabel))
            .map(d => ({
                label: d.requirementLabel,
                type: d.type,
                helpText: '',
                isRequired: true,
            }));
            
        const combinedRequirements = [...standardReqs, ...customReqs];

        return { ...item, service: serviceDetails, combinedRequirements };
    });

  const allRequirements = orderedItemsWithServices.flatMap(item => item.combinedRequirements || []);
  const requiredRequirements = allRequirements.filter(req => req.isRequired !== false);

  const allSubmitted = requiredRequirements.every(req => 
      order.documentUploads?.some(doc => doc.requirementLabel === req.label && doc.status !== 'rejected' && (doc.fileUrl || (doc.textValue && doc.textValue !== 'Applicable (Yes)')))
  );

  const submittedCount = requiredRequirements.filter(req => 
      order.documentUploads?.some(doc => doc.requirementLabel === req.label && doc.status !== 'rejected' && (doc.fileUrl || (doc.textValue && doc.textValue !== 'Applicable (Yes)')))
  ).length;
  const consultantNotified = order.notes?.some(note => note.text === "Client has submitted their documents for review.") || false;

  return (
    <div className="space-y-8">
        <div>
            <Button variant="outline" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
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
                                    <p className="text-sm">All required documents have been uploaded. Please submit them so your consultant can start processing your order.</p>
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
                        <span>Date: {format(new Date(order.date), 'dd MMMM yyyy')}</span> | <span>Status: </span><Badge variant={getStatusVariant(order.status)}>{(order.status as any) === 'Outsourced' ? 'Processing' : order.status}</Badge>
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
                                        <h4 className="font-medium text-md">Documents Required:</h4>
                                        {item.combinedRequirements.map((info: any, infoIndex: number) => {
                                            const upload = order.documentUploads?.find(d => (d.serviceId === item.id || d.serviceId === item.service?.id) && d.requirementLabel === info.label);
                                            const uploadKey = `${item.service?.id || item.id}-${info.label}`;
                                            const isUploading = uploadingFiles[uploadKey] !== undefined;
                                            const isRejected = upload?.status === 'rejected';
                                            const hasPassedConditional = upload?.textValue === 'Applicable (Yes)' || conditionalAnswers[uploadKey] === true;
                                            const isNotUploaded = !upload || (upload.status === 'pending' && !upload.fileUrl && upload.textValue === 'Applicable (Yes)') || (!upload.fileUrl && !upload.textValue);

                                             return (
                                            <div key={infoIndex} className={`space-y-2 p-3 rounded-md border ${isRejected ? 'border-destructive bg-destructive/5 dark:bg-destructive/10' : ''}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <label className="text-sm font-medium flex items-center gap-2">
                                                            <ClipboardCheck className="h-4 w-4" />
                                                            {info.label}
                                                            {info.isRequired === false && (
                                                                <Badge variant="outline" className="text-[10px] py-0 font-normal border-dashed text-muted-foreground">
                                                                    Optional
                                                                </Badge>
                                                            )}
                                                        </label>
                                                        {info.helpText && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 pl-6">{info.helpText}</p>
                                                        )}
                                                    </div>
                                                    {upload && (upload.fileUrl || (upload.textValue && upload.textValue !== 'Applicable (Yes)')) && ( <Badge variant={upload.status === 'approved' ? 'success' : upload.status === 'rejected' ? 'destructive' : 'warning'}>{upload.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}{upload.status === 'rejected' && <AlertTriangle className="mr-1 h-3 w-3" />}{upload.status.charAt(0).toUpperCase() + upload.status.slice(1).replace('_', ' ')}</Badge> )}
                                                </div>
                                                {isRejected && (
                                                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive flex items-start gap-2 mt-1">
                                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="font-semibold">Rejection Reason:</span> {upload.rejectionReason}
                                                            <p className="mt-1 text-muted-foreground font-normal">Please upload a corrected version below.</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {isRejected || isNotUploaded ? (
                                                    <>
                                                        {info.isConditional && !hasPassedConditional && (!upload || upload.textValue !== 'N/A (No)') ? (
                                                            <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border">
                                                                <p className="text-sm font-medium">{info.conditionalQuestion || info.label}</p>
                                                                <div className="flex gap-2">
                                                                    <Button size="sm" onClick={() => handleConditionalAnswer(item.service?.id || item.id, info.label, true)}>Yes</Button>
                                                                    <Button size="sm" variant="outline" onClick={() => handleConditionalAnswer(item.service?.id || item.id, info.label, false)}>No</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {isUploading ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                                                        <p className="text-sm">Uploading... {Math.round(uploadingFiles[uploadKey])}%</p>
                                                                    </div>
                                                                ) : (
                                                                    info.type === 'pdf' ? (
                                                                        <Input type="file" accept="application/pdf" className="h-9" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], item.service?.id || item.id, info.label)} />
                                                                    ) : info.type === 'excel' ? (
                                                                        <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="h-9" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], item.service?.id || item.id, info.label)} />
                                                                    ) : info.type === 'image' ? (
                                                                        <Input type="file" accept="image/*, .png, .jpg, .jpeg, .webp, .heic" className="h-9" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], item.service?.id || item.id, info.label)} />
                                                                    ) : info.type === 'any' ? (
                                                                        <Input type="file" accept="*" className="h-9" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], item.service?.id || item.id, info.label)} />
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <Input type="text" className="h-9" placeholder="Enter information here..." value={textInputs[info.label] || ''} onChange={(e) => handleTextChange(info.label, e.target.value)} />
                                                                            <Button size="sm" onClick={() => handleTextSubmit(item.service?.id || item.id, info.label)}>Save</Button>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                ) : ( <div className="p-2 bg-green-50 text-green-800 rounded-md border border-green-200 text-sm">{upload.type === 'file' ? `Submitted: ${upload.fileName}` : `Submitted: "${upload.textValue}"`}</div> )}
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
                                                <div className="flex justify-between items-center mb-1"><p className="text-xs font-semibold">{author?.name || 'System'}</p><p className="text-xs text-muted-foreground">{format(new Date(note.date), 'dd/MM/yyyy, HH:mm')}</p></div>
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
                                <FormField control={noteForm.control} name="noteText" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Add a new note..." {...field} rows={3} onPaste={(e) => {
                                    const items = e.clipboardData?.items;
                                    if (!items) return;
                                    for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                            const file = items[i].getAsFile();
                                            if (file) {
                                                const renamedFile = new File([file], `screenshot-${Date.now()}.png`, { type: file.type });
                                                const dataTransfer = new DataTransfer();
                                                const existing = noteForm.getValues('attachment');
                                                if (existing) {
                                                    Array.from(existing as FileList).forEach(f => dataTransfer.items.add(f));
                                                }
                                                dataTransfer.items.add(renamedFile);
                                                noteForm.setValue('attachment', dataTransfer.files);
                                            }
                                            break;
                                        }
                                    }
                                }} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="flex items-center gap-2"><FormField control={noteForm.control} name="attachment" render={({ field }) => ( <FormItem><FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files)} className="max-w-xs" /></FormControl><FormMessage /></FormItem> )} /><Button type="submit" size="sm" disabled={isSubmitting}><Send className="h-4 w-4 mr-2" />Post Note</Button></div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
