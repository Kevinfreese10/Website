'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Service, PrerequisiteItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Trash, Sparkles, Loader2, Plus, Info, Images, Paperclip, ShieldCheck, Upload, 
  ArrowUp, ArrowDown, HelpCircle, CheckCircle2, DollarSign, Package, 
  ClipboardList, Globe, Clock, Layers, Star, ExternalLink, Search, Copy, BookOpen,
  FileText, FileSignature, Check, Eye, Building2, KeyRound, Edit3
} from 'lucide-react';
import ClientPortalIntakePreview from './ClientPortalIntakePreview';
import { generateServiceDetails } from '@/ai/flows/generate-service-details';
import { generateBlogPostSeo } from '@/ai/flows/generate-blog-post-seo';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MediaLibrary from './MediaLibrary';
import Image from 'next/image';
import { getFirestore, collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { normalizeRequirementsWithIds } from '@/lib/service-utils';
import { 
  STANDARD_PREREQUISITE_GROUPS, 
  STANDARD_DOCUMENT_REQUIREMENT_GROUPS, 
  SARS_EFILING_LOGIN_PACK,
  extractUniquePrerequisitesFromServices, 
  extractUniqueDocumentsFromServices,
  DocumentRequirementPreset
} from '@/lib/service-presets';
import PrerequisiteMultiSelectDialog from './PrerequisiteMultiSelectDialog';
import DocumentMultiSelectDialog from './DocumentMultiSelectDialog';
import CoidaIndustrySelect from './CoidaIndustrySelect';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const departments = ['Accounting and Tax', 'Administration', 'CAP'] as const;

type Category = { 
  id: string; 
  name: string; 
};

const returnPolicyCategories = [
  { value: 'https://schema.org/MerchantReturnFiniteReturnPeriod', label: 'Finite Period (e.g. 48 hours)' },
  { value: 'https://schema.org/MerchantReturnNotPermitted', label: 'Returns Not Permitted (Recommended)' },
  { value: 'https://schema.org/MerchantReturnUnlimitedWindow', label: 'Unlimited Window' },
  { value: 'https://schema.org/MerchantReturnSayNo', label: 'No Return Policy' },
];

const DOCUMENT_KIND_OPTIONS: { value: string; label: string }[] = [
  { value: 'sa_id', label: 'SA ID (smart card / green book)' },
  { value: 'passport', label: 'Passport' },
  { value: 'proof_of_address', label: 'Proof of address' },
  { value: 'cor14_3', label: 'CIPC CoR14.3 / CK' },
  { value: 'cor39', label: 'CIPC CoR39' },
  { value: 'moi', label: 'MOI' },
  { value: 'bank_confirmation', label: 'Bank confirmation letter' },
  { value: 'bank_statement', label: 'Bank statement' },
  { value: 'tcs_pin', label: 'Tax compliance status / PIN' },
  { value: 'sars_notice_of_registration', label: 'SARS notice of registration' },
  { value: 'afs', label: 'Annual financial statements' },
  { value: 'management_accounts', label: 'Management accounts' },
  { value: 'trial_balance', label: 'Trial balance' },
  { value: 'payslip', label: 'Payslip' },
  { value: 'irp5', label: 'IRP5 / IT3(a)' },
  { value: 'it3', label: 'IT3(b)/(c)' },
  { value: 'medical_aid_cert', label: 'Medical aid certificate' },
  { value: 'ra_cert', label: 'Retirement annuity certificate' },
  { value: 'logbook', label: 'Travel logbook' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt / slip' },
  { value: 'share_certificate', label: 'Share certificate / register' },
  { value: 'resolution', label: 'Resolution' },
  { value: 'power_of_attorney', label: 'Power of attorney / mandate' },
  { value: 'letterhead', label: 'Letter on letterhead' },
  { value: 'criminal_clearance', label: 'Criminal clearance' },
  { value: 'letter_of_good_standing', label: 'Letter of good standing' },
  { value: 'coida_registration', label: 'COIDA registration' },
  { value: 'coida_industry', label: 'COIDA Classification of Industries' },
  { value: 'coida_cf1b', label: 'COIDA CF-1B Form (Nature of Business)' },
  { value: 'cidb_certificate', label: 'CIDB certificate' },
  { value: 'completion_certificate', label: 'Completion certificate' },
  { value: 'letter_of_award', label: 'Letter of award' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' },
];

const formSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required.').max(100, 'Title must be 100 characters or less.'),
  description: z.string().min(1, 'Description is required.'),
  longDescription: z.string().optional(),
  price: z.preprocess(val => (val !== undefined && val !== '' ? Number(val) : 0), z.number().min(0, "Price must be positive.")),
  isPriceTbc: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  resellerPrice: z.preprocess(val => (val !== undefined && val !== '' ? Number(val) : 0), z.number().min(0, "Reseller price must be positive.")),
  subcontractorFee: z.preprocess(val => (val !== undefined && val !== '' ? Number(val) : 0), z.number().min(0, "Subcontractor fee must be positive.")),
  imageUrl: z.string().url('A valid URL is required.').or(z.literal('')),
  imageHint: z.string().optional(),
  attachmentUrl: z.string().url('A valid URL is required.').or(z.literal('')),
  category: z.string().min(1, 'Category is required.'),
  department: z.preprocess(val => departments.includes(val as any) ? val : 'Administration', z.enum(departments).default('Administration')),
  turnaroundTime: z.string().optional(),
  whatsIncluded: z.array(z.object({ value: z.string() })),
  clientRequirements: z.array(z.object({
    type: z.enum(['text', 'product']).default('text'),
    value: z.string().optional(),
    productId: z.string().optional(),
  })),
  informationToProvide: z.array(z.object({
    id: z.string().optional(),
    label: z.string().min(1, 'Label cannot be empty.'),
    type: z.enum(['text', 'pdf', 'excel', 'image', 'any', 'coida_industry', 'datetime']).optional(),
    helpText: z.string().optional(),
    isConditional: z.boolean().optional(),
    conditionalQuestion: z.string().optional(),
    isRequired: z.boolean().optional(),
    aiHint: z.string().optional(),
    // AI order agent verification fields (plan §5.1)
    documentKind: z.string().optional(),
    inNameOf: z.preprocess(val => val === 'person' ? 'either' : (val || undefined), z.enum(['entity', 'director', 'either']).optional()),
    maxAgeDays: z.preprocess(val => (val === '' || val === undefined || val === null ? undefined : Number(val)), z.number().min(0).optional()),
    mustBeCertified: z.boolean().optional(),
    alternativesText: z.string().optional(),
    isSecret: z.boolean().optional(),
  })),

  metaTitle: z.string().min(1, 'Meta Title is required.').max(60, 'Meta Title must be 60 characters or less.'),
  metaDescription: z.string().max(160, 'Meta Description must be 160 characters or less.').optional().or(z.literal('')),
  metaKeywords: z.array(z.object({ value: z.string() })).optional(),
  brand: z.string().optional(),
  availability: z.enum(['in_stock', 'out_of_stock', 'preorder']).default('in_stock'),
  condition: z.enum(['new', 'refurbished', 'used']).default('new'),
  product_type: z.string().optional(),
  google_product_category: z.string().optional(),
  currency: z.string().default('ZAR'),
  returnPolicyCategory: z.string().optional(),
  schemaType: z.enum(['Product', 'Service']).default('Product'),
  enableAggregateRating: z.boolean().default(true),
  aggregateRatingValue: z.preprocess(val => Number(val), z.number().optional()),
  reviewCount: z.preprocess(val => Number(val), z.number().optional()),
  priceValidUntilOverride: z.string().optional(),
  requiredProductIds: z.array(z.string()).optional(),
  coidaIndustries: z.array(z.string()).optional(),
});

type ServiceFormProps = {
  service: Service | null;
  allServices: Service[];
  onSubmit: (data: any) => void;
  onCancel?: () => void;
};

export default function ServiceForm({ service, allServices, onSubmit, onCancel }: ServiceFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'prerequisites' | 'intake' | 'seo'>('overview');
  const [isAiUpdating, setIsAiUpdating] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaLibraryTarget, setMediaLibraryTarget] = useState<'image' | 'attachment'>('image');
  const [isPrereqMultiOpen, setIsPrereqMultiOpen] = useState(false);
  const [isDocMultiOpen, setIsDocMultiOpen] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isOptimizingSeo, setIsOptimizingSeo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"), orderBy("order"));
        const querySnapshot = await getDocs(q);
        const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
        setServiceCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: service?.id || undefined,
      title: service?.title || '',
      description: service?.description || '',
      longDescription: service?.longDescription || '',
      price: service?.price || 0,
      isPriceTbc: service?.isPriceTbc || false,
      isFeatured: service?.isFeatured || false,
      resellerPrice: service?.resellerPrice || 0,
      subcontractorFee: service?.subcontractorFee || 0,
      imageUrl: service?.imageUrl || '',
      imageHint: service?.imageHint || '',
      attachmentUrl: service?.attachmentUrl || '',
      category: service?.category || '',
      department: service?.department || 'Administration',
      turnaroundTime: service?.turnaroundTime || '',
      coidaIndustries: service?.coidaIndustries || [],
      whatsIncluded: service?.whatsIncluded?.map((v: any) => ({ 
        value: typeof v === 'string' ? v : v?.value || '' 
      })) || [{ value: '' }],
      clientRequirements: service?.clientRequirements?.map((item: any) => {
        if (typeof item === 'string') {
          return { type: 'text' as const, value: item, productId: '' };
        } else if (item && typeof item === 'object' && item.type === 'product') {
          return { type: 'product' as const, value: item.text || item.value || '', productId: item.productId || '' };
        } else {
          return { type: 'text' as const, value: item?.text || item?.value || '', productId: '' };
        }
      }) || [{ type: 'text', value: '', productId: '' }],
      informationToProvide: normalizeRequirementsWithIds(service?.informationToProvide || []).map(r => ({
        ...r,
        alternativesText: Array.isArray((r as any).alternatives) ? (r as any).alternatives.join(', ') : '',
      })),
      metaTitle: service?.metaTitle || '',
      metaDescription: service?.metaDescription || '',
      metaKeywords: service?.metaKeywords?.map((v: any) => ({ 
        value: typeof v === 'string' ? v : v?.value || '' 
      })) || [{ value: '' }],
      brand: service?.brand || 'My Accountant',
      availability: service?.availability || 'in_stock',
      condition: service?.condition || 'new',
      product_type: service?.product_type || 'Accounting > Tax Services',
      google_product_category: service?.google_product_category || 'Business & Industrial > Business Services',
      currency: service?.currency || 'ZAR',
      returnPolicyCategory: service?.returnPolicyCategory || 'https://schema.org/MerchantReturnNotPermitted',
      schemaType: service?.schemaType || 'Product',
      enableAggregateRating: service?.enableAggregateRating ?? true,
      aggregateRatingValue: service?.aggregateRatingValue || 4.9,
      reviewCount: service?.reviewCount || 187,
      priceValidUntilOverride: service?.priceValidUntilOverride || '',
      requiredProductIds: service?.requiredProductIds || [],
    },
  });

  const [testingReqIndex, setTestingReqIndex] = useState<number | null>(null);
  const [intakeViewMode, setIntakeViewMode] = useState<'editor' | 'client'>('editor');
  const isPriceTbc = form.watch('isPriceTbc');
  const watchedPrice = form.watch('price') || 0;
  const watchedResellerPrice = form.watch('resellerPrice') || 0;
  const watchedTitle = form.watch('title') || '';
  const watchedCategory = form.watch('category') || '';
  const watchedDepartment = form.watch('department') || '';
  const watchedTurnaroundTime = form.watch('turnaroundTime') || '';
  const watchedRequirements = form.watch('informationToProvide') || [];
  const metaTitleLength = form.watch('metaTitle')?.length || 0;
  const metaDescriptionLength = form.watch('metaDescription')?.length || 0;

  // Margin calculation
  const partnerDiscountPercent = useMemo(() => {
    if (!watchedPrice || watchedPrice <= 0 || !watchedResellerPrice || watchedResellerPrice <= 0) return null;
    const discount = ((watchedPrice - watchedResellerPrice) / watchedPrice) * 100;
    return Math.round(discount);
  }, [watchedPrice, watchedResellerPrice]);

  // Extract previously used items across other services
  const previouslyUsedPrerequisites = useMemo(() => {
    return extractUniquePrerequisitesFromServices(allServices || []);
  }, [allServices]);

  const previouslyUsedDocuments = useMemo(() => {
    return extractUniqueDocumentsFromServices(allServices || []);
  }, [allServices]);

  const { fields: includedFields, append: appendIncluded, remove: removeIncluded } = useFieldArray({
    control: form.control,
    name: 'whatsIncluded',
  });

  const { fields: prereqFields, append: appendPrereq, remove: removePrereq } = useFieldArray({
    control: form.control,
    name: 'clientRequirements',
  });

  const { fields: infoFields, append: appendInfo, remove: removeInfo, replace: replaceInfo, move: moveInfo } = useFieldArray({
    control: form.control,
    name: 'informationToProvide',
  });
  
  const { fields: keywordFields, append: appendKeyword, remove: removeKeyword, replace: replaceKeywords } = useFieldArray({
    control: form.control,
    name: 'metaKeywords',
  });

  const handleAddMultiplePrerequisites = (selectedTexts: string[]) => {
    selectedTexts.forEach(text => {
      appendPrereq({ type: 'text', value: text, productId: '' });
    });
    toast({
      title: 'Prerequisites Added',
      description: `Added ${selectedTexts.length} standard prerequisite notice${selectedTexts.length > 1 ? 's' : ''}.`,
    });
  };

  const handleAddMultipleDocuments = (selectedPresets: DocumentRequirementPreset[]) => {
    selectedPresets.forEach(preset => {
      appendInfo({
        id: `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        label: preset.label,
        type: preset.type,
        helpText: preset.helpText || '',
        isRequired: preset.isRequired ?? true,
        isSecret: preset.isSecret ?? false,
        isConditional: preset.isConditional ?? false,
        conditionalQuestion: preset.conditionalQuestion || '',
        aiHint: preset.aiHint || '',
      });
    });
    toast({
      title: 'Documents Added',
      description: `Added ${selectedPresets.length} standard client document requirement${selectedPresets.length > 1 ? 's' : ''}.`,
    });
  };

  const handleAddSarsEfilingPack = () => {
    let addedCount = 0;
    SARS_EFILING_LOGIN_PACK.forEach(preset => {
      const existing = form.getValues('informationToProvide')?.some(
        (i: any) => i?.label?.trim().toLowerCase() === preset.label.trim().toLowerCase()
      );
      if (!existing) {
        appendInfo({
          id: `req_sars_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          label: preset.label,
          type: preset.type,
          helpText: preset.helpText || '',
          isRequired: preset.isRequired ?? true,
          isSecret: preset.isSecret ?? false,
          isConditional: preset.isConditional ?? false,
          conditionalQuestion: preset.conditionalQuestion || '',
          aiHint: preset.aiHint || '',
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast({
        title: 'SARS eFiling Login Pack Added',
        description: `Populated ${addedCount} credential & OTP intake fields with automated testing warning notices.`,
      });
    } else {
      toast({
        title: 'Already Added',
        description: 'The SARS eFiling login requirements are already in this service.',
      });
    }
  };

  const handleAiUpdate = async () => {
    const title = form.getValues('title');
    if (!title) {
      toast({
        title: 'Title is missing',
        description: 'Please enter a product title before using AI auto-fill.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsAiUpdating(true);
    toast({
      title: 'Generating Content...',
      description: 'The AI is creating structured descriptions, deliverables, and SEO details.',
    });

    try {
      const price = form.getValues('price');
      const isPriceTbc = form.getValues('isPriceTbc');
      const turnaroundTime = form.getValues('turnaroundTime');
      const result = await generateServiceDetails({ 
        title, 
        price: typeof price === 'number' ? price : undefined,
        isPriceTbc: Boolean(isPriceTbc),
        turnaroundTime: turnaroundTime || undefined
      });
      form.setValue('title', result.correctedTitle, { shouldDirty: true });
      form.setValue('description', result.shortDescription, { shouldDirty: true });
      form.setValue('longDescription', result.longDescription, { shouldDirty: true });
      form.setValue('turnaroundTime', result.turnaroundTime, { shouldDirty: true });
      form.setValue('whatsIncluded', result.whatsIncluded.map(item => ({ value: item })), { shouldDirty: true });
      form.setValue('clientRequirements', result.clientRequirements.map(item => ({ type: 'text' as const, value: item, productId: '' })), { shouldDirty: true });
      form.setValue('metaTitle', result.metaTitle, { shouldDirty: true });
      form.setValue('metaDescription', result.metaDescription, { shouldDirty: true });
      toast({
        title: 'AI Auto-Fill Completed',
        description: 'Product content and deliverables have been populated.',
      });
    } catch (error: any) {
      console.error("AI Update Error: ", error);
      toast({
        title: 'AI Update Failed',
        description: 'There was an error generating content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAiUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.uid) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to upload files.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'media'), {
        name: file.name,
        url: downloadURL,
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
      });

      form.setValue('imageUrl', downloadURL, { shouldDirty: true, shouldValidate: true });
      toast({
        title: 'Upload Successful',
        description: `"${file.name}" uploaded and set as display image.`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: 'Upload Failed',
        description: error?.message || 'There was an error uploading your image.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOptimizeSeo = async () => {
    const title = form.getValues('title');
    const content = form.getValues('longDescription') || form.getValues('description');

    if (!title) {
      toast({
        title: 'Title is missing',
        description: 'Please enter a product title before optimizing SEO.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsOptimizingSeo(true);
    try {
      const price = form.getValues('price');
      const isPriceTbc = form.getValues('isPriceTbc');
      const turnaroundTime = form.getValues('turnaroundTime');
      const result = await generateBlogPostSeo({ 
        title, 
        content,
        price: typeof price === 'number' ? price : undefined,
        isPriceTbc: Boolean(isPriceTbc),
        turnaroundTime: turnaroundTime || undefined
      });
      if (!result.success) {
        throw new Error(result.error.message);
      }
      const data = result.data;
      form.setValue('metaTitle', data.metaTitle, { shouldDirty: true, shouldValidate: true });
      form.setValue('metaDescription', data.metaDescription, { shouldDirty: true, shouldValidate: true });
      if (data.metaKeywords && data.metaKeywords.length > 0) {
        replaceKeywords(data.metaKeywords);
      }
      toast({
        title: 'SEO Optimized',
        description: 'SEO title, description, and keywords have been generated.',
      });
    } catch (error: any) {
      console.error("SEO Optimization Error: ", error);
      toast({
        title: 'SEO Optimization Failed',
        description: error?.message || 'There was an error generating SEO content.',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizingSeo(false);
    }
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const slug = values.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    const structuredRequirements = values.clientRequirements
      .map(item => {
        if (item.type === 'product' && item.productId) {
          return { type: 'product' as const, productId: item.productId, text: item.value || undefined };
        } else if (item.value) {
          return { type: 'text' as const, text: item.value };
        }
        return null;
      })
      .filter(Boolean) as PrerequisiteItem[];

    const productPrereqIds = structuredRequirements
      .filter(r => r.type === 'product')
      .map(r => (r as any).productId)
      .filter(Boolean);

    const normalizedInfo = normalizeRequirementsWithIds(values.informationToProvide.filter(v => v.label)).map((r: any) => {
      const { alternativesText, ...rest } = r;
      const alternatives = String(alternativesText || '').split(',').map((x: string) => x.trim()).filter(Boolean);
      return { ...rest, ...(alternatives.length ? { alternatives } : { alternatives: [] }) };
    });

    const serviceData = {
      ...values,
      slug,
      seoImageUrl: values.imageUrl,
      whatsIncluded: values.whatsIncluded.map(v => v.value).filter(Boolean),
      clientRequirements: structuredRequirements,
      informationToProvide: normalizedInfo,
      metaKeywords: values.metaKeywords?.map(v => v.value).filter(Boolean),
      returnPolicyCategory: values.returnPolicyCategory === 'none' ? '' : values.returnPolicyCategory,
      requiredProductIds: Array.from(new Set(productPrereqIds)),
    };
    onSubmit(serviceData);
  };
  
  const handleCopyFrom = (serviceId: string) => {
    const sourceService = allServices.find(s => s.id === serviceId);
    if (sourceService && sourceService.informationToProvide) {
      replaceInfo(sourceService.informationToProvide.map(v => ({
        label: v.label,
        type: v.type || 'text',
        helpText: v.helpText || '',
        isConditional: v.isConditional || false,
        conditionalQuestion: v.conditionalQuestion || '',
        isRequired: v.isRequired ?? true,
      })));
      toast({ title: 'Information Copied', description: `Copied requirements from "${sourceService.title}".`});
    }
  };

  const currentImageUrl = form.watch('imageUrl');
  const currentAttachmentUrl = form.watch('attachmentUrl');
  const attachmentFilename = currentAttachmentUrl ? currentAttachmentUrl.split('/').pop()?.split('?')[0].split('%2F').pop() : '';

  const onInvalid = (errors: any) => {
    console.error("Form Validation Errors:", errors);
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const firstErr = (errors as any)[firstKey];
      const message = firstErr?.message || (typeof firstErr === 'object' && firstErr?.root?.message ? firstErr.root.message : 'Please check required fields.');
      toast({
        title: 'Cannot Save Product',
        description: `Validation issue in "${firstKey}": ${message}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="flex flex-col h-full overflow-hidden bg-background">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground truncate max-w-md">
                  {watchedTitle || (service ? 'Edit Product' : 'Create New Product')}
                </h2>
                {form.watch('category') && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {form.watch('category')}
                  </Badge>
                )}
                {form.watch('isFeatured') && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-bold gap-1">
                    <Star className="h-3 w-3 fill-amber-500" /> Popular
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isPriceTbc ? 'Quote-based' : `R${watchedPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`} · {infoFields.length} Client Documents · {includedFields.length} Included Features
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAiUpdate} 
              disabled={isAiUpdating} 
              className="gap-1.5 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5"
            >
              {isAiUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
              <span>AI Auto-Fill</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="flex flex-col flex-grow overflow-hidden">
          <div className="px-6 pt-2 border-b bg-muted/10 shrink-0">
            <TabsList className="bg-muted/60 p-1 h-10 gap-1 w-full sm:w-auto justify-start">
              <TabsTrigger value="overview" className="gap-2 text-xs font-semibold data-[state=active]:shadow-sm">
                <DollarSign className="h-3.5 w-3.5" />
                Overview & Pricing
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="gap-2 text-xs font-semibold data-[state=active]:shadow-sm">
                <Layers className="h-3.5 w-3.5" />
                What's Included ({includedFields.length})
              </TabsTrigger>
              <TabsTrigger value="prerequisites" className="gap-2 text-xs font-semibold data-[state=active]:shadow-sm">
                <ExternalLink className="h-3.5 w-3.5" />
                Prerequisites ({prereqFields.length})
              </TabsTrigger>
              <TabsTrigger value="intake" className="gap-2 text-xs font-semibold data-[state=active]:shadow-sm">
                <ClipboardList className="h-3.5 w-3.5" />
                Client Documents ({infoFields.length})
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-2 text-xs font-semibold data-[state=active]:shadow-sm">
                <Globe className="h-3.5 w-3.5" />
                SEO & Google Trust
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Tab Content Container */}
          <div className="flex-grow overflow-y-auto px-6 py-5 space-y-6">
            
            {/* TAB 1: OVERVIEW & PRICING */}
            <TabsContent value="overview" className="space-y-6 m-0 focus-visible:outline-none">
              
              {/* Basic Details Card */}
              <div className="p-4 rounded-xl border bg-card space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">General Product Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 space-y-1.5">
                        <FormLabel className="text-xs font-semibold">Product Title *</FormLabel>
                        <FormControl>
                          <Input className="h-9 font-semibold text-sm" placeholder="e.g. Annual Financial Statements (Compilation)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="turnaroundTime"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold">Turnaround Time *</FormLabel>
                        <FormControl>
                          <Input className="h-9 text-xs" placeholder="e.g. 5-7 working days" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Responsible Department *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map(dep => (
                              <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Short Summary (Grid & Search Card)</FormLabel>
                        <FormControl>
                          <Textarea rows={2} className="text-xs resize-none" placeholder="One or two punchy sentences describing what this service solves..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Full Description (Product Page)</FormLabel>
                        <FormControl>
                          <Textarea rows={4} className="text-xs leading-relaxed" placeholder="Comprehensive description of the compliance requirements, benefits, and process..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                          <FormLabel className="text-xs font-semibold cursor-pointer">Mark as "Popular"</FormLabel>
                          <p className="text-[10px] text-muted-foreground">Displays a ⭐ Popular badge on storefront.</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing & Profit Margins Card */}
              <div className="p-4 rounded-xl border bg-card space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-1 border-b">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-bold text-foreground">Pricing & Commercials</h3>
                  </div>
                  {partnerDiscountPercent !== null && (
                    <Badge variant="outline" className="text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                      Partner Margin: {partnerDiscountPercent}% (R{(watchedPrice - watchedResellerPrice).toFixed(2)})
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Public Client Price (ZAR) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" className="h-9 font-bold text-sm" {...field} disabled={isPriceTbc} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resellerPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Accounting Partner Price (ZAR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" className="h-9 text-xs" {...field} disabled={isPriceTbc} />
                        </FormControl>
                        <FormDescription className="text-[10px]">Wholesale cost charged to white-label partners.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subcontractorFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Subcontractor / Direct Cost (ZAR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" className="h-9 text-xs" {...field} disabled={isPriceTbc} />
                        </FormControl>
                        <FormDescription className="text-[10px]">Internal fulfillment or filing cost.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isPriceTbc"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 pt-1">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 text-xs font-medium cursor-pointer">
                        Price to be confirmed (Quote-based service — requires consultation first)
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Display Image & Attachment Card */}
              <div className="p-4 rounded-xl border bg-card space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Images className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Media & Display Assets</h3>
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Display Image</FormLabel>
                      <div className="flex items-start gap-4">
                        <div className="relative h-20 w-20 flex-shrink-0 border rounded-lg overflow-hidden bg-muted/30">
                          {currentImageUrl ? (
                            <Image src={currentImageUrl} alt="Current service image" fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] text-center p-1">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-grow space-y-2">
                          <FormControl>
                            <Input {...field} placeholder="https://..." className="h-8 text-xs font-mono" />
                          </FormControl>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="xs" 
                              className="h-7 text-xs font-semibold gap-1"
                              onClick={() => { setMediaLibraryTarget('image'); setIsMediaLibraryOpen(true); }}
                            >
                              <Images className="h-3 w-3" /> Select from Media Library
                            </Button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleImageUpload} 
                              accept="image/*" 
                              className="hidden" 
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="xs" 
                              className="h-7 text-xs font-semibold gap-1"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                            >
                              {isUploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                              Upload from Computer
                            </Button>
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <FormField
                    control={form.control}
                    name="imageHint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Display Image AI Hint</FormLabel>
                        <FormControl>
                          <Input className="h-8 text-xs" placeholder="e.g. professional accountant reviewing balance sheet" {...field} />
                        </FormControl>
                        <FormDescription className="text-[10px]">Context for AI image generation.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attachmentUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Sample Output / Brochure (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 items-center">
                            {attachmentFilename && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">{decodeURIComponent(attachmentFilename)}</p>
                            )}
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="xs"
                              className="h-8 text-xs gap-1" 
                              onClick={() => { setMediaLibraryTarget('attachment'); setIsMediaLibraryOpen(true); }}
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              {attachmentFilename ? 'Change' : 'Select'} PDF
                            </Button>
                            {attachmentFilename && (
                              <Button type="button" variant="ghost" size="xs" className="h-8 text-destructive" onClick={() => field.onChange('')}>
                                Remove
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: WHAT'S INCLUDED & DELIVERABLES */}
            <TabsContent value="deliverables" className="space-y-4 m-0 focus-visible:outline-none">
              <div className="p-4 rounded-xl border bg-card space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-1 border-b">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">What's Included (Deliverables List)</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bullet points displayed on the product page and checkout confirmation explaining what the customer receives.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 text-xs font-semibold h-8"
                    onClick={() => appendIncluded({ value: '' })}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Deliverable
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {includedFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-7 w-7 rounded-md bg-green-500/10 text-green-700 font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <FormField
                        control={form.control}
                        name={`whatsIncluded.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-grow space-y-0">
                            <FormControl>
                              <Input className="h-8 text-xs font-medium" placeholder="e.g. CIPC Confirmation Certificate & Share Certificates" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button aria-label="Delete" 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" 
                        onClick={() => removeIncluded(index)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {includedFields.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">
                      No deliverables added yet. Click "+ Add Deliverable" to add bullet points.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: PREREQUISITES */}
            <TabsContent value="prerequisites" className="space-y-4 m-0 focus-visible:outline-none">
              <div className="p-4 rounded-xl border bg-card space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b">
                  <div>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Prerequisites (Public Notice & Linked Store Products)</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Standard prerequisite notices and linked store products shown to clients on the storefront.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs font-bold border-primary/40 text-primary hover:bg-primary/5 gap-1.5 shadow-xs"
                      onClick={() => setIsPrereqMultiOpen(true)}
                    >
                      <BookOpen className="h-3.5 w-3.5 text-primary" /> + Select Standard Notices (Multi)
                    </Button>

                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs font-semibold"
                      onClick={() => appendPrereq({ type: 'text', value: '', productId: '' })}
                    >
                      + Custom Text
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                      onClick={() => appendPrereq({ type: 'product', value: '', productId: '' })}
                    >
                      + Linked Product
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {prereqFields.map((field, index) => {
                    const currentType = form.watch(`clientRequirements.${index}.type`) || 'text';
                    return (
                      <div key={field.id} className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 text-xs">
                        <Select
                          value={currentType}
                          onValueChange={(val: 'text' | 'product') => {
                            form.setValue(`clientRequirements.${index}.type`, val);
                            if (val === 'text') form.setValue(`clientRequirements.${index}.productId`, '');
                          }}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs font-semibold shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text Notice</SelectItem>
                            <SelectItem value="product">Linked Product</SelectItem>
                          </SelectContent>
                        </Select>

                        {currentType === 'text' ? (
                          <FormField
                            control={form.control}
                            name={`clientRequirements.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1 space-y-0">
                                <FormControl>
                                  <Input {...field} placeholder="e.g. Certified ID copies of all active directors" className="h-8 text-xs font-medium" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormField
                            control={form.control}
                            name={`clientRequirements.${index}.productId`}
                            render={({ field }) => (
                              <FormItem className="flex-1 space-y-0">
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs font-medium">
                                      <SelectValue placeholder="Select required prerequisite service..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {allServices.filter(s => s.id !== service?.id).map((s) => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.title} ({s.isPriceTbc ? 'Quote' : `R${s.price?.toFixed(2)}`})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        )}

                        <Button aria-label="Delete" 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" 
                          onClick={() => removePrereq(index)}
                        >
                          <Trash className="h-3.5 w-3.5"/>
                        </Button>
                      </div>
                    );
                  })}

                  {prereqFields.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">
                      No prerequisites configured. Click "+ Select Standard Notices (Multi)" or "+ Custom Text" above.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: CLIENT DOCUMENTS & INTAKE */}
            <TabsContent value="intake" className="space-y-4 m-0 focus-visible:outline-none">
              <div className="p-4 rounded-xl border bg-card space-y-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Client Document Uploads & Required Data</h3>
                      <div className="inline-flex rounded-lg bg-muted p-0.5 border">
                        <button
                          type="button"
                          onClick={() => setIntakeViewMode('editor')}
                          className={cn(
                            "px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
                            intakeViewMode === 'editor' 
                              ? "bg-background text-foreground shadow-xs font-bold" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Form Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => setIntakeViewMode('client')}
                          className={cn(
                            "px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
                            intakeViewMode === 'client' 
                              ? "bg-blue-600 text-white shadow-xs font-bold" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Eye className="w-3.5 h-3.5" /> Client Portal View
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {intakeViewMode === 'client' 
                        ? 'Live simulation of the client portal document intake experience for this service.'
                        : 'Standardized intake documents the client must upload on their dashboard. The AI agent validates these during KYC.'}
                    </p>
                  </div>
                  
                  {intakeViewMode === 'editor' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs font-bold border-indigo-500/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-1.5 shadow-xs"
                        onClick={() => appendInfo({ 
                          id: `req_coida_${Date.now().toString(36)}`, 
                          label: 'COIDA Classification of Industries', 
                          type: 'coida_industry', 
                          helpText: 'Select one or more applicable industry classifications from the official 23 COIDA classes (W.Cl.150T) for Compensation Fund assessment rates.', 
                          isRequired: true 
                        })}
                      >
                        <Building2 className="h-3.5 w-3.5" /> + COIDA Classification of Industries
                      </Button>

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs font-bold border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1.5 shadow-xs"
                        onClick={handleAddSarsEfilingPack}
                      >
                        <KeyRound className="h-3.5 w-3.5 text-amber-600" /> + SARS eFiling Login Pack
                      </Button>

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs font-bold border-primary/40 text-primary hover:bg-primary/5 gap-1.5 shadow-xs"
                        onClick={() => setIsDocMultiOpen(true)}
                      >
                        <BookOpen className="h-3.5 w-3.5 text-primary" /> + Select Standard Documents (Multi)
                      </Button>

                      <Select onValueChange={handleCopyFrom}>
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <Copy className="h-3 w-3 mr-1 text-muted-foreground" />
                          <SelectValue placeholder="Copy from service..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allServices.filter(s => s.id !== service?.id).map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 text-xs font-semibold h-8"
                        onClick={() => appendInfo({ id: `req_${Date.now().toString(36)}`, label: '', type: 'pdf', helpText: '', isRequired: true })}
                      >
                        <Plus className="h-3.5 w-3.5" /> Custom Field
                      </Button>
                    </div>
                  )}
                </div>

                {intakeViewMode === 'client' ? (
                  <ClientPortalIntakePreview
                    serviceTitle={watchedTitle}
                    serviceCategory={watchedCategory}
                    department={watchedDepartment}
                    price={watchedPrice}
                    turnaroundTime={watchedTurnaroundTime}
                    requirements={watchedRequirements as any}
                    onSwitchToEditor={() => setIntakeViewMode('editor')}
                  />
                ) : (
                  <div className="space-y-3">
                    {infoFields.map((field, index) => (
                      <div key={field.id} className="p-3.5 rounded-lg border bg-muted/10 space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs mt-1 shrink-0">
                            {index + 1}
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`informationToProvide.${index}.label`}
                            render={({ field }) => (
                              <FormItem className="flex-grow space-y-1">
                                <FormLabel className="text-xs font-semibold">Requirement Name / Label *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Certified ID Copy / Passport" className="h-8 text-xs font-medium" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`informationToProvide.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="w-64 shrink-0 space-y-1">
                                <FormLabel className="text-xs font-semibold">Accepted Format</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || 'pdf'}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Format" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pdf">File (PDF Document)</SelectItem>
                                    <SelectItem value="image">File (Image/Photo)</SelectItem>
                                    <SelectItem value="excel">File (Excel/CSV)</SelectItem>
                                    <SelectItem value="any">File (Any format)</SelectItem>
                                    <SelectItem value="text">Text / Number Input</SelectItem>
                                    <SelectItem value="datetime">🗓️ Date & Time Selector (Appointment / OTP Window)</SelectItem>
                                    <SelectItem value="coida_industry">🏛️ COIDA Classification of Industries (Dropdown)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center gap-1 mt-5 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              disabled={index === 0}
                              onClick={() => moveInfo(index, index - 1)}
                              title="Move Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              disabled={index === infoFields.length - 1}
                              onClick={() => moveInfo(index, index + 1)}
                              title="Move Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button aria-label="Delete" 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeInfo(index)} 
                              title="Delete"
                            >
                              <Trash className="h-3.5 w-3.5"/>
                            </Button>
                          </div>
                        </div>

                        {form.watch(`informationToProvide.${index}.type`) === 'coida_industry' && (
                          <div className="p-2.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200">
                            <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                            <span>
                              <strong>Interactive COIDA Dropdown:</strong> When the client completes this requirement on their order dashboard, they will be presented with a searchable multi-select dropdown covering all 23 official COIDA Industry Classes (W.Cl.150T).
                            </span>
                          </div>
                        )}

                        {form.watch(`informationToProvide.${index}.type`) === 'datetime' && (
                          <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>Interactive Date & Time Selector:</strong> When the client completes this requirement on their order dashboard, they will choose an appointment date, preferred time window, and confirm their contact number for live OTP/consultant coordination.
                            </span>
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name={`informationToProvide.${index}.helpText`}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <HelpCircle className="h-3 w-3" /> Client Instructions & Upload Guidelines (Optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-7 text-xs bg-background"
                                  placeholder="e.g. Must not be older than 3 months. Color scan required."
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                          <div className="flex items-center gap-5">
                            <FormField
                              control={form.control}
                              name={`informationToProvide.${index}.isRequired`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-1.5 space-y-0">
                                  <FormControl>
                                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                                  </FormControl>
                                  <FormLabel className="!mt-0 text-xs font-medium cursor-pointer">Mandatory</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`informationToProvide.${index}.isConditional`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-1.5 space-y-0">
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                  <FormLabel className="!mt-0 text-xs font-medium cursor-pointer">Conditional Question</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>

                          {form.watch(`informationToProvide.${index}.isConditional`) && (
                            <FormField
                              control={form.control}
                              name={`informationToProvide.${index}.conditionalQuestion`}
                              render={({ field }) => (
                                <FormItem className="flex-grow max-w-sm ml-3 space-y-0">
                                  <FormControl>
                                    <Input
                                      className="h-7 text-xs"
                                      placeholder="Question to prompt client (e.g. Are you registered for VAT?)"
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    {infoFields.length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-3 text-center">
                        No document requirements configured. Select "+ Standard Document..." above to add from library.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 5: SEO, MARKETING & GOOGLE TRUST */}
            <TabsContent value="seo" className="space-y-4 m-0 focus-visible:outline-none">
              {/* Live Google Search Preview Card */}
              <div className="p-4 rounded-xl border bg-card space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Google Search Snippet Preview</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="xs" 
                      className="gap-1 font-semibold text-primary border-primary/30 hover:bg-primary/5 h-7 text-xs"
                      asChild
                    >
                      <a 
                        href={`/products/${service?.slug || (watchedTitle ? watchedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : 'product-slug')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View Live Page</span>
                      </a>
                    </Button>

                    <Button 
                      type="button" 
                      variant="outline" 
                      size="xs" 
                      onClick={handleOptimizeSeo} 
                      disabled={isOptimizingSeo}
                      className="gap-1 font-bold text-primary border-primary/30 hover:bg-primary/5 h-7 text-xs"
                    >
                      {isOptimizingSeo ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3" />}
                      <span>1-Click AI SEO Optimize</span>
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/20 border text-left space-y-1 font-sans">
                  {(() => {
                    const currentSlug = service?.slug || (watchedTitle ? watchedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : 'product-slug');
                    const targetUrl = `/products/${currentSlug}`;
                    return (
                      <>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <span>https://myacc.co.za</span>
                          <span>›</span>
                          <span>products</span>
                          <span>›</span>
                          <span className="text-foreground font-semibold">
                            {currentSlug}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-blue-600 hover:underline cursor-pointer truncate">
                          <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 group">
                            <span>{form.watch('metaTitle') || watchedTitle || 'Professional Accounting & Tax Services'} | My Accountant</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                          </a>
                        </h4>
                        {form.watch('enableAggregateRating') && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                            <span>Rating: {form.watch('aggregateRatingValue') || 4.9}/5</span>
                            <span>·</span>
                            <span>{form.watch('reviewCount') || 187} reviews</span>
                            <span>·</span>
                            <span>{isPriceTbc ? 'Quote based' : `ZAR ${watchedPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {form.watch('metaDescription') || form.watch('description') || 'Expert South African Chartered Accountants and CIPC compliance specialists. Professional, fast turnaround guaranteed.'}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Meta Tags */}
              <div className="p-4 rounded-xl border bg-card space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Meta Tags & Search Engine Keywords</h3>
                </div>

                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-end mb-1">
                        <FormLabel className="text-xs font-semibold">Meta Title (Under 60 chars)</FormLabel>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded",
                          metaTitleLength >= 60 ? 'bg-red-100 text-red-800' : metaTitleLength === 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                        )}>
                          {metaTitleLength}/59 chars
                        </span>
                      </div>
                      <FormControl><Input className="h-9 text-xs" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-end mb-1">
                        <FormLabel className="text-xs font-semibold">Meta Description (Under 160 chars)</FormLabel>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded",
                          metaDescriptionLength > 160 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        )}>
                          {metaDescriptionLength}/160 chars
                        </span>
                      </div>
                      <FormControl><Textarea rows={2} className="text-xs" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-xs font-semibold">Meta Keywords</FormLabel>
                    <Button type="button" variant="outline" size="xs" className="h-6 text-[11px]" onClick={() => appendKeyword({ value: '' })}>
                      + Add Keyword
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {keywordFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-1">
                        <FormField
                          control={form.control}
                          name={`metaKeywords.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="flex-1 space-y-0">
                              <FormControl><Input className="h-7 text-xs" placeholder="keyword..." {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                        <Button aria-label="Delete" type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeKeyword(index)}>
                          <Trash className="h-3 w-3"/>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Google Merchant & Schema Trust */}
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" /> Google Merchant Schema & Search Console Compliance
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    control={form.control} 
                    name="returnPolicyCategory" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Google Return Policy</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'https://schema.org/MerchantReturnNotPermitted'}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Policy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Omit from Schema)</SelectItem>
                            {returnPolicyCategories.map(item => (
                              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} 
                  />

                  <FormField 
                    control={form.control} 
                    name="schemaType" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Structured Data Schema Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Product">Product (Uses Offers)</SelectItem>
                            <SelectItem value="Service">Service (No Price Required)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <FormField 
                    control={form.control} 
                    name="brand" 
                    render={({ field }) => ( 
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Brand</FormLabel>
                        <FormControl><Input className="h-8 text-xs" {...field} /></FormControl>
                      </FormItem> 
                    )} 
                  />
                  <FormField 
                    control={form.control} 
                    name="google_product_category" 
                    render={({ field }) => ( 
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Google Product Category</FormLabel>
                        <FormControl><Input className="h-8 text-xs" placeholder="e.g. Business & Industrial > Business Services" {...field} /></FormControl>
                      </FormItem> 
                    )} 
                  />
                </div>

                <div className="pt-2 border-t border-primary/10">
                  <FormField 
                    control={form.control} 
                    name="enableAggregateRating" 
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-xs font-semibold cursor-pointer">Enable Aggregate Star Rating in Search</FormLabel>
                          <p className="text-[10px] text-muted-foreground">Generates Schema.org AggregateRating rich snippet badge.</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} 
                  />

                  {form.watch('enableAggregateRating') && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <FormField control={form.control} name="aggregateRatingValue" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold">Star Rating (1-5)</FormLabel>
                          <FormControl><Input type="number" step="0.1" className="h-8 text-xs" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="reviewCount" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold">Review Count</FormLabel>
                          <FormControl><Input type="number" className="h-8 text-xs" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

          </div>
        </Tabs>

        {/* Media Library Dialog Sub-Modal */}
        <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Media Asset Library</DialogTitle>
              <DialogDescription>
                {mediaLibraryTarget === 'image' ? 'Select a visual display asset for this service.' : 'Select a PDF document to attach.'}
              </DialogDescription>
            </DialogHeader>
            <MediaLibrary 
              onSelectImage={(url) => {
                if (mediaLibraryTarget === 'image') {
                  form.setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
                } else {
                  form.setValue('attachmentUrl', url, { shouldDirty: true, shouldValidate: true });
                }
                setIsMediaLibraryOpen(false);
              }} 
              accept={mediaLibraryTarget === 'image' ? 'image/*' : 'application/pdf'}
            />
          </DialogContent>
        </Dialog>

        {/* Prerequisites Multi-Select Library Dialog */}
        <PrerequisiteMultiSelectDialog
          open={isPrereqMultiOpen}
          onOpenChange={setIsPrereqMultiOpen}
          existingTexts={isPrereqMultiOpen ? (form.getValues('clientRequirements')?.map((r: any) => typeof r === 'string' ? r : r?.value || r?.text).filter(Boolean) || []) : []}
          previouslyUsed={previouslyUsedPrerequisites}
          onAddSelected={handleAddMultiplePrerequisites}
        />

        {/* Client Documents Multi-Select Library Dialog */}
        <DocumentMultiSelectDialog
          open={isDocMultiOpen}
          onOpenChange={setIsDocMultiOpen}
          existingLabels={isDocMultiOpen ? (form.getValues('informationToProvide')?.map((i: any) => i?.label).filter(Boolean) || []) : []}
          previouslyUsed={previouslyUsedDocuments}
          onAddSelected={handleAddMultipleDocuments}
        />

        {/* Sticky Bottom Action Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t bg-muted/40 shrink-0">
          <div className="text-xs text-muted-foreground">
            {form.formState.isDirty ? (
              <span className="text-amber-600 font-semibold">● Unsaved changes</span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs">
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              size="sm" 
              className="font-bold text-xs bg-primary hover:bg-primary/90 min-w-[120px]"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                'Save Product'
              )}
            </Button>
          </div>
        </div>

      </form>
    </Form>
  );
}
