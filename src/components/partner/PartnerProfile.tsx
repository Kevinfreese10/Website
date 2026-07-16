'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  Globe, 
  Layout, 
  Palette, 
  ExternalLink as ExternalLinkIcon, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Circle, 
  PartyPopper, 
  MapPin, 
  Building,
  Gavel,
  Settings,
  MousePointer2,
  Save,
  Search,
  Copy,
  Sparkles,
  Trash2,
  Plus,
  Eye,
  LayoutGrid,
  Star,
  ChevronDown,
  MessageSquare,
  Undo2,
  Redo2,
  BarChart3,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getFirestore, doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { User } from '@/lib/types';
import { generateCopywritingCopy } from '@/app/actions/ai-copywriter';
import { editLandingPageWithAI } from '@/app/actions/ai-landing-page';
import { syncCustomDomainMapping } from '@/app/actions/partner-settings';
import PartnerLandingPagePreview from './PartnerLandingPagePreview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const RESERVED_SLUGS = ['admin', 'login', 'signup', 'api', 'dashboard', 'partner', 'p', 'products', 'blog', 'about', 'contact', 'compliance', 'terms', 'popia', 'refund-policy', 'support'];

const formSchema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  name: z.string().min(2, 'Contact name is required.'),
  surname: z.string().min(2, 'Contact surname is required.'),
  email: z.string().email('Please enter a valid email.'),
  contactNumber: z.string().min(10, 'A valid contact number is required.'),
  address: z.object({
      street: z.string().optional(),
      suburb: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      zip: z.string().optional(),
  }).optional(),
  bankingDetails: z.object({
      bankName: z.string().optional(),
      accountHolder: z.string().optional(),
      accountNumber: z.string().optional(),
      branchCode: z.string().optional(),
  }).optional(),
  landingPage: z.object({
    enabled: z.boolean().default(false),
    slug: z.string()
        .min(3, "Slug must be at least 3 characters")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
        .refine(val => !RESERVED_SLUGS.includes(val), { message: "This slug is reserved for system use." }),
    heroTitle: z.string().min(5, "Hero title is too short"),
    heroSubtitle: z.string().min(10, "Hero subtitle is too short"),
    aboutUs: z.string().min(20, "About Us text is too short"),
    themePreset: z.enum(['custom', 'my_accountant', 'futuristic', 'tech_blue', 'facebook', 'lovable', 'monday', 'monday_crm', 'stripe', 'airbnb', 'linear', 'spotify', 'notion', 'apple']).default('custom'),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    textColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    cardBackgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    cardBorderColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    buttonTextColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    buttonStyle: z.enum(['solid', 'outline']).default('solid'),
    showLogo: z.boolean().default(true),
    hideHeaderBranding: z.boolean().default(false),
    logoUrl: z.string().url().optional().or(z.literal('')),
    logoHeight: z.preprocess(val => Number(val) || 40, z.number().min(20).max(120)),
    heroImageUrl: z.string().url().optional().or(z.literal('')),
    heroOverlayOpacity: z.preprocess(val => Number(val) || 0, z.number().min(0).max(100)),
    heroLayout: z.enum(['centered', 'split-left', 'split-right', 'background']).default('centered'),
    heroTextPosition: z.enum(['inside', 'below']).default('inside'),
    refundPolicy: z.string().optional(),
    popiaPolicy: z.string().optional(),
    termsAndConditions: z.string().optional(),
    heroTitleColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    heroSubtitleColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional(),
    showServicesHero: z.boolean().default(true),
    servicesHeroImageUrl: z.string().url().optional().or(z.literal('')),
    servicesHeroOverlayOpacity: z.preprocess(val => Number(val) || 0, z.number().min(0).max(100)),
    servicesHeroLayout: z.enum(['centered', 'split-left', 'split-right', 'background']).default('centered'),
    servicesHeroTitle: z.string().optional(),
    servicesHeroSubtitle: z.string().optional(),
    servicesHeroTextPosition: z.enum(['inside', 'below']).default('inside'),
    metaTitle: z.string().max(60, "Title must be 60 characters or less.").optional(),
    metaDescription: z.string().max(160, "Description must be 160 characters or less.").optional(),
    testimonials: z.array(z.object({
      name: z.string().min(2, "Name is required"),
      role: z.string().min(2, "Role/Title is required"),
      company: z.string().optional(),
      quote: z.string().min(5, "Quote is required"),
      rating: z.preprocess(val => Number(val) || 5, z.number().min(1).max(5)),
    })).optional(),
    faqs: z.array(z.object({
      question: z.string().min(3, "Question is too short"),
      answer: z.string().min(5, "Answer is too short"),
    })).optional(),
    showLeadForm: z.boolean().default(true),
    fontFamily: z.enum(['sans', 'serif', 'mono', 'inter', 'outfit']).default('sans'),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
    glassmorphism: z.boolean().default(false),
    googleAnalyticsId: z.string().optional().or(z.literal('')),
    metaPixelId: z.string().optional().or(z.literal('')),
    showCalculator: z.boolean().default(false),
    customDomain: z.string()
      .optional()
      .or(z.literal(''))
      .refine(val => !val || /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(val), {
        message: "Please enter a valid domain name (e.g. www.mycompany.co.za)"
      }),
  })
});

const THEMES = {
    my_accountant: {
        primaryColor: '#0866FF',
        secondaryColor: '#0054d1',
        backgroundColor: '#ffffff',
        textColor: '#1C1E21',
        cardBackgroundColor: '#e5e7eb',
        cardBorderColor: '#dddfe2',
        buttonColor: '#0866FF',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    futuristic: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#a78bfa',
        backgroundColor: '#020617',
        textColor: '#ffffff',
        cardBackgroundColor: '#0f172a',
        cardBorderColor: '#1e293b',
        buttonColor: '#8b5cf6',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    tech_blue: {
        primaryColor: '#0ea5e9',
        secondaryColor: '#38bdf8',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#e2e8f0',
        buttonColor: '#0ea5e9',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    facebook: {
        primaryColor: '#0866FF',
        secondaryColor: '#0054d1',
        backgroundColor: '#F0F2F5',
        textColor: '#1C1E21',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#dddfe2',
        buttonColor: '#0866FF',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    lovable: {
        primaryColor: '#9b87f5',
        secondaryColor: '#7E69AB',
        backgroundColor: '#ffffff',
        textColor: '#1A1F2C',
        cardBackgroundColor: '#F1F0FB',
        cardBorderColor: '#E5E7EB',
        buttonColor: '#9b87f5',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    monday: {
        primaryColor: '#e2445c',
        secondaryColor: '#ff158a',
        backgroundColor: '#ffffff',
        textColor: '#323338',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#c3c6d4',
        buttonColor: '#e2445c',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    monday_crm: {
        primaryColor: '#784bd1',
        secondaryColor: '#a25ddc',
        backgroundColor: '#ffffff',
        textColor: '#323338',
        cardBackgroundColor: '#f5f6f8',
        cardBorderColor: '#d0d4e4',
        buttonColor: '#784bd1',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    stripe: {
        primaryColor: '#635bff',
        secondaryColor: '#0a2540',
        backgroundColor: '#f6f9fc',
        textColor: '#425466',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#e6ebf1',
        buttonColor: '#635bff',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    airbnb: {
        primaryColor: '#FF385C',
        secondaryColor: '#D90B36',
        backgroundColor: '#ffffff',
        textColor: '#222222',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#DDDDDD',
        buttonColor: '#FF385C',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    linear: {
        primaryColor: '#5e6ad2',
        secondaryColor: '#8f9af3',
        backgroundColor: '#000000',
        textColor: '#f4f4f8',
        cardBackgroundColor: '#111216',
        cardBorderColor: '#2b2d31',
        buttonColor: '#5e6ad2',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    },
    spotify: {
        primaryColor: '#1DB954',
        secondaryColor: '#1ed760',
        backgroundColor: '#121212',
        textColor: '#ffffff',
        cardBackgroundColor: '#181818',
        cardBorderColor: '#282828',
        buttonColor: '#1DB954',
        buttonTextColor: '#000000',
        buttonStyle: 'solid',
    },
    notion: {
        primaryColor: '#000000',
        secondaryColor: '#333333',
        backgroundColor: '#ffffff',
        textColor: '#37352f',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#e9e9e7',
        buttonColor: '#000000',
        buttonTextColor: '#ffffff',
        buttonStyle: 'outline',
    },
    apple: {
        primaryColor: '#0071e3',
        secondaryColor: '#0077ED',
        backgroundColor: '#f5f5f7',
        textColor: '#1d1d1f',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#d2d2d7',
        buttonColor: '#0071e3',
        buttonTextColor: '#ffffff',
        buttonStyle: 'solid',
    }
};

const QUICK_COLORS = [
    '#214392', '#0ea5e9', '#4f46e5', '#8b5cf6', '#d946ef', '#e11d48', '#f43f5e', '#f97316', '#d97706', '#059669', '#10b981', '#1e293b', '#0f172a', '#ffffff', '#f3f4f6', '#e5e7eb', '#000000',
];

export default function PartnerProfile({ partner: propPartner }: { partner?: User }) {
  const { user: authUser, updateUser } = useAuth();
  
  // Use the provided partner prop if available, otherwise fallback to the logged-in user
  const targetUser = propPartner || authUser;
  const isTargetGrowth = !targetUser?.partnerTier || targetUser?.partnerTier === 'growth';
  
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingServicesHero, setIsUploadingServicesHero] = useState(false);
  const [overrideCount, setOverrideCount] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: targetUser?.companyName || '',
      name: targetUser?.name?.split(' ')[0] || targetUser?.contactPerson?.split(' ')[0] || '',
      surname: targetUser?.name?.split(' ').slice(1).join(' ') || targetUser?.contactPerson?.split(' ').slice(1).join(' ') || '',
      email: targetUser?.email || '',
      contactNumber: targetUser?.contactNumber || '',
      address: { 
          street: targetUser?.address?.street || '', 
          suburb: targetUser?.address?.suburb || '', 
          city: targetUser?.address?.city || '', 
          province: targetUser?.address?.province || '', 
          zip: targetUser?.address?.zip || ''
      },
      bankingDetails: { 
          bankName: targetUser?.bankingDetails?.bankName || '', 
          accountHolder: targetUser?.bankingDetails?.accountHolder || '', 
          accountNumber: targetUser?.bankingDetails?.accountNumber || '', 
          branchCode: targetUser?.bankingDetails?.branchCode || ''
      },
      landingPage: {
        enabled: targetUser?.landingPage?.enabled || false,
        slug: targetUser?.landingPage?.slug || '',
        heroTitle: targetUser?.landingPage?.heroTitle || `Professional Accounting Services for your Business`,
        heroSubtitle: targetUser?.landingPage?.heroSubtitle || `Expert tax, accounting, and compliance solutions tailored to your needs.`,
        aboutUs: targetUser?.landingPage?.aboutUs || `We are a dedicated team of accounting professionals committed to helping small businesses grow through accurate financial management and strategic advice.`,
        themePreset: targetUser?.landingPage?.themePreset || 'custom',
        primaryColor: targetUser?.landingPage?.primaryColor || '#214392',
        secondaryColor: targetUser?.landingPage?.secondaryColor || '#214392',
        backgroundColor: targetUser?.landingPage?.backgroundColor || '#ffffff',
        textColor: targetUser?.landingPage?.textColor || '#111827',
        cardBackgroundColor: targetUser?.landingPage?.cardBackgroundColor || '#ffffff',
        cardBorderColor: targetUser?.landingPage?.cardBorderColor || '#e5e7eb',
        buttonColor: targetUser?.landingPage?.buttonColor || '#214392',
        buttonTextColor: targetUser?.landingPage?.buttonTextColor || '#ffffff',
        buttonStyle: targetUser?.landingPage?.buttonStyle || 'solid',
        showLogo: targetUser?.landingPage?.showLogo !== undefined ? targetUser?.landingPage?.showLogo : true,
        hideHeaderBranding: targetUser?.landingPage?.hideHeaderBranding || false,
        logoUrl: targetUser?.landingPage?.logoUrl || '',
        logoHeight: targetUser?.landingPage?.logoHeight || 40,
        heroImageUrl: targetUser?.landingPage?.heroImageUrl || '',
        heroOverlayOpacity: targetUser?.landingPage?.heroOverlayOpacity || 0,
        heroLayout: targetUser?.landingPage?.heroLayout || 'centered',
        heroTextPosition: targetUser?.landingPage?.heroTextPosition || 'inside',
        refundPolicy: targetUser?.landingPage?.refundPolicy || '',
        popiaPolicy: targetUser?.landingPage?.popiaPolicy || '',
        termsAndConditions: targetUser?.landingPage?.termsAndConditions || '',
        heroTitleColor: targetUser?.landingPage?.heroTitleColor || '#111827',
        heroSubtitleColor: targetUser?.landingPage?.heroSubtitleColor || '#4b5563',
        showServicesHero: targetUser?.landingPage?.showServicesHero !== undefined ? targetUser?.landingPage?.showServicesHero : true,
        servicesHeroImageUrl: targetUser?.landingPage?.servicesHeroImageUrl || '',
        servicesHeroOverlayOpacity: targetUser?.landingPage?.servicesHeroOverlayOpacity || 0,
        servicesHeroLayout: targetUser?.landingPage?.servicesHeroLayout || 'centered',
        servicesHeroTitle: targetUser?.landingPage?.servicesHeroTitle || 'Accounting & Tax Solutions',
        servicesHeroSubtitle: targetUser?.landingPage?.servicesHeroSubtitle || 'Comprehensive professional services for individuals and SMEs.',
        servicesHeroTextPosition: targetUser?.landingPage?.servicesHeroTextPosition || 'inside',
        metaTitle: targetUser?.landingPage?.metaTitle || '',
        metaDescription: targetUser?.landingPage?.metaDescription || '',
        testimonials: targetUser?.landingPage?.testimonials || [],
        faqs: targetUser?.landingPage?.faqs || [],
        showLeadForm: targetUser?.landingPage?.showLeadForm !== undefined ? targetUser?.landingPage?.showLeadForm : true,
        fontFamily: targetUser?.landingPage?.fontFamily || 'sans',
        borderRadius: targetUser?.landingPage?.borderRadius || 'md',
        glassmorphism: targetUser?.landingPage?.glassmorphism || false,
        googleAnalyticsId: targetUser?.landingPage?.googleAnalyticsId || '',
        metaPixelId: targetUser?.landingPage?.metaPixelId || '',
        showCalculator: targetUser?.landingPage?.showCalculator || false,
        customDomain: targetUser?.landingPage?.customDomain || '',
      }
    },
  });

  const { setValue, watch, reset } = form;

  // Ensure form resets if propPartner changes (important for Modal reuse)
  useEffect(() => {
      if (propPartner) {
          const initialLp = {
            ...form.getValues().landingPage,
            ...propPartner.landingPage,
            enabled: propPartner.landingPage?.enabled || false,
            slug: propPartner.landingPage?.slug || '',
            testimonials: propPartner.landingPage?.testimonials || [],
            faqs: propPartner.landingPage?.faqs || [],
            showLeadForm: propPartner.landingPage?.showLeadForm !== undefined ? propPartner.landingPage?.showLeadForm : true,
          };
          reset({
            companyName: propPartner.companyName || '',
            name: propPartner.name?.split(' ')[0] || propPartner.contactPerson?.split(' ')[0] || '',
            surname: propPartner.name?.split(' ').slice(1).join(' ') || propPartner.contactPerson?.split(' ').slice(1).join(' ') || '',
            email: propPartner.email || '',
            contactNumber: propPartner.contactNumber || '',
            address: { 
                street: propPartner.address?.street || '', 
                suburb: propPartner.address?.suburb || '', 
                city: propPartner.address?.city || '', 
                province: propPartner.address?.province || '', 
                zip: propPartner.address?.zip || ''
            },
            bankingDetails: { 
                bankName: propPartner.bankingDetails?.bankName || '', 
                accountHolder: propPartner.bankingDetails?.accountHolder || '', 
                accountNumber: propPartner.bankingDetails?.accountNumber || '', 
                branchCode: propPartner.bankingDetails?.branchCode || ''
            },
            landingPage: initialLp
          });
          setConfigHistory([JSON.parse(JSON.stringify(initialLp))]);
          setHistoryIndex(0);
      }
  }, [propPartner, reset]);

  const watchedBanking = watch('bankingDetails');
  const watchedLp = watch('landingPage');
  const themePreset = watch('landingPage.themePreset');

  // Preview and custom managers
  const [previewMode, setPreviewMode] = useState<'edit' | 'split'>('edit');
  const [generatingFields, setGeneratingFields] = useState<Record<string, boolean>>({});

  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial, replace: replaceTestimonials } = useFieldArray({
    control: form.control,
    name: "landingPage.testimonials" as any
  });

  const { fields: faqFields, append: appendFaq, remove: removeFaq, replace: replaceFaqs } = useFieldArray({
    control: form.control,
    name: "landingPage.faqs" as any
  });

  const handleAiGenerate = async (fieldName: 'heroTitle' | 'heroSubtitle' | 'aboutUs' | 'metaTitle' | 'metaDescription') => {
    const partnerName = form.getValues('companyName') || targetUser?.companyName || targetUser?.name || 'our practice';
    setGeneratingFields(prev => ({ ...prev, [fieldName]: true }));
    try {
      let context = '';
      if (fieldName === 'heroSubtitle' || fieldName === 'aboutUs' || fieldName === 'metaDescription') {
        context = form.getValues('landingPage.aboutUs') || '';
      }
      const res = await generateCopywritingCopy({
        field: fieldName,
        partnerName,
        additionalContext: context
      });
      if (res.success && res.text) {
        setValue(`landingPage.${fieldName}`, res.text, { shouldDirty: true });
        toast({ title: 'Copy Generated!', description: `AI generated content for ${fieldName}` });
      } else {
        toast({ title: 'AI Generation Failed', description: res.error || 'Please try again.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'AI Generation Failed', description: 'Failed to connect to copywriting service.', variant: 'destructive' });
    } finally {
      setGeneratingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [isAiEditingPage, setIsAiEditingPage] = useState(false);
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pendingAiConfig, setPendingAiConfig] = useState<any | null>(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  const getDiffDescription = (current: any, pending: any) => {
    const diffs: { field: string; label: string; from: string; to: string }[] = [];
    if (!current || !pending) return diffs;

    const fieldLabels: Record<string, string> = {
      heroTitle: 'Hero Headline',
      heroSubtitle: 'Hero Subtitle',
      aboutUs: 'About Us Paragraph',
      primaryColor: 'Primary Theme Color',
      secondaryColor: 'Secondary Theme Color',
      backgroundColor: 'Page Background Color',
      textColor: 'Text Color',
      cardBackgroundColor: 'Card Background Color',
      cardBorderColor: 'Card Border Color',
      buttonColor: 'Button Color',
      buttonTextColor: 'Button Text Color',
      buttonStyle: 'Button Style',
      showLogo: 'Show Logo Flag',
      heroOverlayOpacity: 'Hero Overlay Opacity',
      heroLayout: 'Hero Layout Style',
      metaTitle: 'SEO Meta Title',
      metaDescription: 'SEO Meta Description',
      showLeadForm: 'Lead Capture Form Toggle',
    };

    Object.keys(fieldLabels).forEach((key) => {
      const curVal = current[key];
      const penVal = pending[key];
      if (penVal !== undefined && curVal !== penVal) {
        diffs.push({
          field: key,
          label: fieldLabels[key],
          from: String(curVal ?? 'None'),
          to: String(penVal ?? 'None'),
        });
      }
    });

    const curTestimonials = current.testimonials || [];
    const penTestimonials = pending.testimonials || [];
    if (JSON.stringify(curTestimonials) !== JSON.stringify(penTestimonials)) {
      diffs.push({
        field: 'testimonials',
        label: 'Testimonials / Reviews',
        from: `${curTestimonials.length} reviews`,
        to: `${penTestimonials.length} reviews (updated)`,
      });
    }

    const curFaqs = current.faqs || [];
    const penFaqs = pending.faqs || [];
    if (JSON.stringify(curFaqs) !== JSON.stringify(penFaqs)) {
      diffs.push({
        field: 'faqs',
        label: 'FAQ Items',
        from: `${curFaqs.length} questions`,
        to: `${penFaqs.length} questions (updated)`,
      });
    }

    return diffs;
  };

  const applyConfigValues = (config: any) => {
    if (!config) return;
    Object.keys(config).forEach((key) => {
      if (key === 'testimonials') {
        replaceTestimonials(config.testimonials || []);
      } else if (key === 'faqs') {
        replaceFaqs(config.faqs || []);
      } else {
        setValue(`landingPage.${key}` as any, config[key], { shouldDirty: true, shouldValidate: true });
      }
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevConfig = configHistory[prevIndex];
      setHistoryIndex(prevIndex);
      applyConfigValues(prevConfig);
      toast({ title: 'Undo Applied', description: 'Reverted to previous AI design.' });
    }
  };

  const handleRedo = () => {
    if (historyIndex < configHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextConfig = configHistory[nextIndex];
      setHistoryIndex(nextIndex);
      applyConfigValues(nextConfig);
      toast({ title: 'Redo Applied', description: 'Restored newer AI design.' });
    }
  };

  const handleAiPageEdit = async () => {
    if (!aiEditPrompt.trim()) return;
    setIsAiEditingPage(true);
    try {
      const partnerName = form.getValues('companyName') || targetUser?.companyName || targetUser?.name || 'our practice';
      const currentConfig = form.getValues('landingPage');
      const res = await editLandingPageWithAI({
        currentConfig,
        instruction: aiEditPrompt,
        partnerName
      });
      if (res.success && res.config) {
        setPendingAiConfig(res.config);
        setIsDiffOpen(true);
      } else {
        toast({
          title: 'AI Update Failed',
          description: res.error || 'Failed to update page configuration.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'AI Update Failed',
        description: err.message || 'An error occurred while communicating with the AI service.',
        variant: 'destructive'
      });
    } finally {
      setIsAiEditingPage(false);
    }
  };

  const handleApplyPendingConfig = () => {
    if (!pendingAiConfig) return;
    
    applyConfigValues(pendingAiConfig);

    // Add to history
    const newHistory = configHistory.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(pendingAiConfig)));
    setConfigHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setPendingAiConfig(null);
    setIsDiffOpen(false);
    setAiEditPrompt('');

    toast({
      title: 'Redesign Applied!',
      description: 'AI landing page changes have been applied. See the live preview simulator.'
    });
  };

  const COLOR_PRESETS = [
    {
      name: 'Master Theme',
      primaryColor: '#0866FF',
      secondaryColor: '#0054d1',
      backgroundColor: '#ffffff',
      cardBackgroundColor: '#e5e7eb',
      cardBorderColor: '#dddfe2',
      buttonColor: '#0866FF',
      buttonTextColor: '#ffffff',
      textColor: '#1C1E21',
    },
    {
      name: 'Emerald Growth',
      primaryColor: '#059669',
      secondaryColor: '#34d399',
      backgroundColor: '#f9fafb',
      cardBackgroundColor: '#ffffff',
      cardBorderColor: '#e5e7eb',
      buttonColor: '#059669',
      buttonTextColor: '#ffffff',
      textColor: '#111827',
    },
    {
      name: 'Sleek Dark',
      primaryColor: '#8b5cf6',
      secondaryColor: '#a78bfa',
      backgroundColor: '#020617',
      cardBackgroundColor: '#0f172a',
      cardBorderColor: '#1e293b',
      buttonColor: '#8b5cf6',
      buttonTextColor: '#ffffff',
      textColor: '#ffffff',
    },
    {
      name: 'Amber Trust',
      primaryColor: '#d97706',
      secondaryColor: '#f59e0b',
      backgroundColor: '#fffdfa',
      cardBackgroundColor: '#ffffff',
      cardBorderColor: '#f3e8ff',
      buttonColor: '#d97706',
      buttonTextColor: '#ffffff',
      textColor: '#1f2937',
    },
    {
      name: 'Teal Minimal',
      primaryColor: '#0d9488',
      secondaryColor: '#2dd4bf',
      backgroundColor: '#fafafa',
      cardBackgroundColor: '#ffffff',
      cardBorderColor: '#e5e5e5',
      buttonColor: '#0d9488',
      buttonTextColor: '#ffffff',
      textColor: '#171717',
    }
  ];

  const handleApplyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setValue('landingPage.themePreset', 'custom', { shouldDirty: true });
    setValue('landingPage.primaryColor', preset.primaryColor, { shouldDirty: true });
    setValue('landingPage.secondaryColor', preset.secondaryColor, { shouldDirty: true });
    setValue('landingPage.backgroundColor', preset.backgroundColor, { shouldDirty: true });
    setValue('landingPage.cardBackgroundColor', preset.cardBackgroundColor, { shouldDirty: true });
    setValue('landingPage.cardBorderColor', preset.cardBorderColor, { shouldDirty: true });
    setValue('landingPage.buttonColor', preset.buttonColor, { shouldDirty: true });
    setValue('landingPage.buttonTextColor', preset.buttonTextColor, { shouldDirty: true });
    setValue('landingPage.textColor', preset.textColor, { shouldDirty: true });
    toast({ title: `Theme Applied!`, description: `Loaded colors for ${preset.name}` });
  };

  const STOCK_HERO_IMAGES = [
    { name: 'Modern Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Business Analysis', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Tax Compliance & Ledger', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Consulting Session', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Calculator & Charts', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Cozy Workspace', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200' }
  ];

  useEffect(() => {
      const pId = targetUser?.uid;
      if (!pId) return;
      
      const overridesRef = collection(db, 'users', pId, 'serviceOverrides');
      const unsubscribe = onSnapshot(overridesRef, (snap) => {
          setOverrideCount(snap.size);
      });
      return () => unsubscribe();
  }, [targetUser?.uid]);

  const checklist = useMemo(() => {
      return [
          { label: 'Update Pricing', done: overrideCount > 0, description: 'Set practice markups in the Services tab.' },
          { label: 'Update Banking Details', done: !!(watchedBanking?.bankName && watchedBanking?.accountNumber), description: 'Required for client EFT payments.' },
          { label: 'Edit Landing Content & Images', done: !!(watchedLp.heroImageUrl && watchedLp.aboutUs && watchedLp.aboutUs.length > 50), description: 'Customize the public practice website.' },
          { 
              label: 'Branding & Theme', 
              done: !!watchedLp.themePreset && (watchedLp.themePreset !== 'custom' || (watchedLp.primaryColor && watchedLp.primaryColor !== '#214392')), 
              description: 'Apply your custom colors and styling.' 
          },
      ];
  }, [watchedBanking, watchedLp, overrideCount]);

  const progressPercentage = useMemo(() => {
      const completed = checklist.filter(i => i.done).length;
      const total = checklist.length;
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
  }, [checklist]);

  useEffect(() => {
    if (themePreset && themePreset !== 'custom') {
        const theme = THEMES[themePreset as keyof typeof THEMES];
        if (theme) {
            Object.entries(theme).forEach(([key, value]) => {
                (setValue as any)(`landingPage.${key}`, value, { shouldDirty: true });
            });
        }
    }
  }, [themePreset, setValue]);

  const handleFileUpload = async (file: File, type: 'logo' | 'hero' | 'servicesHero') => {
      if (!targetUser) return;
      if (type === 'logo') setIsUploadingLogo(true); 
      else if (type === 'hero') setIsUploadingHero(true);
      else setIsUploadingServicesHero(true);

      try {
          const path = `partners/${targetUser.uid}/${type}/${Date.now()}-${file.name}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          
          if (type === 'logo') setValue('landingPage.logoUrl', url, { shouldDirty: true });
          else if (type === 'hero') setValue('landingPage.heroImageUrl', url, { shouldDirty: true });
          else setValue('landingPage.servicesHeroImageUrl', url, { shouldDirty: true });
          toast({ title: 'Upload Successful' });
      } catch (e) {
          toast({ title: 'Upload Failed', variant: 'destructive' });
      } finally {
          if (type === 'logo') setIsUploadingLogo(false); 
          else if (type === 'hero') setIsUploadingHero(false);
          else setIsUploadingServicesHero(false);
      }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!targetUser) return;
    setIsSaving(true);
    try {
        const oldDomain = targetUser.landingPage?.customDomain || null;
        const newDomain = values.landingPage.customDomain || null;
        const slug = values.landingPage.slug;

        const userRef = doc(db, 'users', targetUser.uid);
        const updateData = {
            companyName: values.companyName,
            contactNumber: values.contactNumber,
            address: values.address,
            bankingDetails: values.bankingDetails,
            name: `${values.name} ${values.surname}`,
            landingPage: values.landingPage,
        };
        await updateDoc(userRef, updateData);
        
        if (oldDomain !== newDomain) {
            const syncResult = await syncCustomDomainMapping(oldDomain, newDomain, slug);
            if (!syncResult.success) {
                console.error("Domain sync failed:", syncResult.error);
                toast({ title: 'Domain Sync Failed', description: syncResult.error, variant: 'destructive' });
            }
        }
        
        // Update local auth context ONLY if we are editing our own profile
        if (!propPartner && authUser?.uid === targetUser.uid) {
            updateUser({ ...authUser, ...updateData });
        }
        
        toast({ title: 'Profile Updated!' });
    } catch (error) {
        console.error("Profile update failed:", error);
        toast({ title: 'Update Failed', description: "There was a problem saving the profile settings.", variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  }

  const landingPageEnabled = watch('landingPage.enabled');
  const landingPageSlug = watch('landingPage.slug');

  const handleCopyLandingLink = () => {
      if (!landingPageSlug) {
          toast({ title: "Slug missing", description: "Please enter a slug for your landing page first.", variant: "destructive" });
          return;
      }
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za';
      const fullUrl = `${baseUrl}/p/${landingPageSlug}`;
      
      navigator.clipboard.writeText(fullUrl).then(() => {
          toast({ title: "Link Copied!", description: "Practice landing page URL is ready to share." });
      });
  };

  const ColorField = ({ name, label, description }: { name: any, label: string, description?: string }) => (
    <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
            <FormItem className="space-y-3">
                <div className="flex justify-between items-center">
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">{label}</FormLabel>
                    {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 w-full">
                        <FormControl>
                            <ColorPicker
                                value={field.value || '#ffffff'}
                                onChange={(val) => { field.onChange(val); setValue('landingPage.themePreset', 'custom'); }}
                                className="w-full"
                            />
                        </FormControl>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_COLORS.map((color) => (
                            <button key={color} type="button" onClick={() => { field.onChange(color); setValue('landingPage.themePreset', 'custom'); }} className={cn("w-5 h-5 rounded-full border border-muted-foreground/20 transition-all hover:scale-125", field.value === color && "ring-2 ring-primary ring-offset-1 scale-110")} style={{ backgroundColor: color }} title={color} />
                        ))}
                    </div>
                </div>
                <FormMessage />
            </FormItem>
        )}
    />
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10">
        {isTargetGrowth && (
            <Card className="border-2 border-primary/20 shadow-lg overflow-hidden animate-in fade-in duration-300">
                <CardHeader className="bg-primary/5 pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Practice Setup Progress</CardTitle>
                        <Badge variant={progressPercentage === 100 ? "success" : "secondary"} className="font-bold">
                            {progressPercentage === 100 && <PartyPopper className="h-3 w-3 mr-1" />}
                            {progressPercentage}% Complete
                        </Badge>
                    </div>
                    <Progress value={progressPercentage} className="h-2.5 mt-4" />
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {checklist.map((item, idx) => (
                            <div key={idx} className={cn("p-3 rounded-lg border flex flex-col gap-1 transition-all", item.done ? "bg-green-50/50 border-green-200" : "bg-muted/30 border-muted opacity-70")}>
                                <div className="flex items-center gap-2">
                                    {item.done ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                                    <span className={cn("text-xs font-bold truncate", item.done ? "text-green-800" : "text-slate-600")}>{item.label}</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground leading-tight italic ml-6">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}

        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error("Partner profile validation failed:", errors);
            toast({
                title: "Validation Failed",
                description: "Please check all required fields and correct any errors before saving.",
                variant: "destructive"
            });
        })} className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Company Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="contactNumber" render={({ field }) => ( <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Contact First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="surname" render={({ field }) => ( <FormItem><FormLabel>Contact Surname</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="md:col-span-2">
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Login Email Address</FormLabel><FormControl><Input {...field} readOnly disabled className="bg-muted/50" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        <MapPin className="h-4 w-4" /> Physical Address
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="address.street" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel className="text-xs">Street Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="address.suburb" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Suburb</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="address.city" render={({ field }) => ( <FormItem><FormLabel className="text-xs">City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="address.province" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Province</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="address.zip" render={({ field }) => ( <FormItem><FormLabel className="text-xs">ZIP / Postal Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                </div>
            </div>

            {isTargetGrowth && (
                <>
                    <Separator />

                    <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Banking Details (For Client EFTs)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     <FormField control={form.control} name="bankingDetails.bankName" render={({ field }) => ( <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="bankingDetails.accountNumber" render={({ field }) => ( <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="bankingDetails.accountHolder" render={({ field }) => ( <FormItem><FormLabel>Account Holder</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="bankingDetails.branchCode" render={({ field }) => ( <FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
                </>
            )}

            {isTargetGrowth && (
                <>
                    <Separator />

                    <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> White-Label Landing Page</h3>
                    <div className="flex items-center gap-2">
                        <FormField control={form.control} name="landingPage.enabled" render={({ field }) => ( <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-xs uppercase font-bold text-muted-foreground">Enabled</FormLabel></FormItem> )} />
                        {landingPageEnabled && (
                          <div className="ml-4 flex border rounded-md overflow-hidden shrink-0">
                            <Button type="button" variant={previewMode === 'edit' ? 'default' : 'ghost'} size="xs" className="rounded-none h-7 px-2.5 font-bold" onClick={() => setPreviewMode('edit')}>
                              <Layout className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button type="button" variant={previewMode === 'split' ? 'default' : 'ghost'} size="xs" className="rounded-none h-7 px-2.5 font-bold" onClick={() => setPreviewMode('split')}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Split Preview
                            </Button>
                          </div>
                        )}
                    </div>
                </div>

                {landingPageEnabled && (
                    <div className={cn("grid grid-cols-1 gap-6 animate-in fade-in zoom-in-95 duration-300", previewMode === 'split' && "lg:grid-cols-12 max-w-[1450px] mx-auto")}>
                      <div className={cn("space-y-6", previewMode === 'split' && "lg:col-span-6")}>
                        <Card className="border-primary/20">
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Public Link</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <div className="bg-muted px-3 py-2 rounded-md font-mono text-sm flex-grow">/p/{landingPageSlug || 'your-slug'}</div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={handleCopyLandingLink} className="gap-2 font-bold border-primary/20 text-primary">
                                            <Copy className="h-4 w-4" /> Copy Link
                                        </Button>
                                        {landingPageSlug && <Button variant="outline" size="sm" asChild><Link href={`/p/${landingPageSlug}`} target="_blank"><ExternalLinkIcon className="h-4 w-4 mr-2"/>Visit Page</Link></Button>}
                                    </div>
                                </div>
                                <FormField control={form.control} name="landingPage.slug" render={({ field }) => ( 
                                    <FormItem className="mt-4">
                                        <FormLabel className="text-xs">Custom Slug</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormDescription className="text-[10px]">
                                            Must be unique, lowercase, no spaces. Avoid reserved keywords like 'admin', 'api', or 'login'.
                                            <span className="block mt-1 text-amber-600 font-bold text-[11px]">Warning: This URL cannot be changed later. Choose carefully!</span>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem> 
                                )} />
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm">Custom Domain & DNS Setup</CardTitle>
                                </div>
                                <CardDescription className="text-[10px]">
                                    Link your own domain (e.g. <span className="font-semibold text-foreground">www.interscopeadvisory.co.za</span>) directly to your branded landing page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-xs space-y-3">
                                    <div className="bg-muted/40 p-3 rounded-lg border border-border/60">
                                        <p className="font-semibold text-foreground mb-1">Step 1: Configure your DNS settings</p>
                                        <p className="text-muted-foreground leading-relaxed mb-3">
                                            Log in to your domain registrar (e.g., xneelo, GoDaddy, Cloudflare) and add the following <span className="font-semibold text-foreground">CNAME</span> record to your domain's DNS zone file.
                                            <br/><br/>
                                            <span className="text-[11px] bg-primary/5 p-1.5 rounded border border-primary/10 block">
                                                <strong className="text-primary">Note:</strong> You must map a subdomain (like <strong>www</strong>, <strong>app</strong>, or <strong>portal</strong>). Most registrars do not allow CNAME records on the "root" domain (the domain without www).
                                            </span>
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 bg-background p-3 rounded border font-mono text-[11px] select-all">
                                            <div>
                                                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider mb-1">Type</span>
                                                <span className="font-bold text-foreground">CNAME</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider mb-1">Host/Name</span>
                                                <span className="font-bold text-foreground">www <span className="text-[9px] text-muted-foreground font-normal ml-1">(or app, etc.)</span></span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider mb-1">Points To / Target</span>
                                                <span className="font-bold text-foreground">domains.myacc.co.za</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted/40 p-3 rounded-lg border border-border/60">
                                        <p className="font-semibold text-foreground mb-1">Step 2: Enter your domain</p>
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            Once your CNAME record is saved, enter the full domain you configured below (e.g. <span className="font-mono bg-muted/50 px-1 rounded text-[11px] text-foreground">www.interscopeadvisory.co.za</span>).
                                            <br/><br/>
                                            <span className="text-amber-600 text-[11px] font-medium flex items-start gap-1.5 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                <span>Enter exactly what you configured in your DNS (including the www. part). It may take up to 24 hours for global DNS propagation and SSL certificates to provision.</span>
                                            </span>
                                        </p>
                                        <FormField control={form.control} name="landingPage.customDomain" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="www.interscopeadvisory.co.za" {...field} className="font-mono text-sm" />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription className="text-[10px]">
                                                    Enter exactly as you configured in your DNS (e.g. including www. if applicable). It may take up to 24 hours for SSL certificates to provision.
                                                </FormDescription>
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-primary/30 shadow-md overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                            <CardHeader className="pb-3 bg-muted/40">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                    <div>
                                        <CardTitle className="text-sm font-bold">AI Page Designer</CardTitle>
                                        <CardDescription className="text-[10px]">Describe the look or content you want, and the AI will update your page configuration instantly.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <Textarea
                                    value={aiEditPrompt}
                                    onChange={(e) => setAiEditPrompt(e.target.value)}
                                    placeholder="e.g., Change theme to futuristic dark mode with neon cyan buttons, write a catchy hero title for South African startups, and add 3 FAQs about audit requirements."
                                    className="min-h-[90px] text-xs resize-none"
                                />
                                
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[
                                        { label: '🎨 Sleek Dark Mode', prompt: 'Change primary theme to a sleek dark mode with dark gray background and gold buttons/accents' },
                                        { label: '🌿 Forest Green', prompt: 'Change theme to forest green and minimal cream card backgrounds' },
                                        { label: '📊 Startup Focused', prompt: 'Rewrite hero title and subtitle to target modern tech startups and SMEs' },
                                        { label: '💬 Add Reviews', prompt: 'Add 3 client testimonials highlighting fast turnaround times and accurate bookkeeping' },
                                        { label: '❓ Add FAQs', prompt: 'Add 4 common FAQs about South African company registration, tax compliance, and payroll' },
                                    ].map((tag) => (
                                        <button
                                            key={tag.label}
                                            type="button"
                                            onClick={() => setAiEditPrompt(tag.prompt)}
                                            className="text-[9px] bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-full px-2 py-0.5 transition-colors font-medium text-left"
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            onClick={handleUndo}
                                            disabled={historyIndex <= 0}
                                            title="Undo last AI redesign"
                                            className="h-8 px-2 border-primary/10 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                                        >
                                            <Undo2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            onClick={handleRedo}
                                            disabled={historyIndex >= configHistory.length - 1}
                                            title="Redo design"
                                            className="h-8 px-2 border-primary/10 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                                        >
                                            <Redo2 className="h-4 w-4" />
                                        </Button>
                                        {configHistory.length > 1 && (
                                            <span className="text-[9px] text-muted-foreground font-mono ml-1">
                                                {historyIndex + 1}/{configHistory.length}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAiPageEdit}
                                        disabled={isAiEditingPage || !aiEditPrompt.trim()}
                                        className="font-bold gap-2"
                                    >
                                        {isAiEditingPage ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Redesigning Page...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Apply AI Edits
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 gap-6">
                            <Card className="border-2">
                                <CardHeader className="bg-muted/30"><CardTitle className="text-sm flex items-center gap-2"><Layout className="h-4 w-4" /> Content & Images</CardTitle></CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <FormField control={form.control} name="landingPage.heroTitle" render={({ field }) => ( 
                                        <FormItem>
                                            <div className="flex justify-between items-center">
                                                <FormLabel className="text-xs">Hero Title</FormLabel>
                                                <Button type="button" variant="ghost" size="xs" className="h-6 gap-1 text-[10px] text-primary px-1 hover:bg-primary/5" onClick={() => handleAiGenerate('heroTitle')} disabled={generatingFields['heroTitle']}>
                                                    {generatingFields['heroTitle'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate with AI
                                                </Button>
                                            </div>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem> 
                                    )} />
                                    <ColorField name="landingPage.heroTitleColor" label="Hero Title Color" />
                                    <Separator />
                                    <FormField control={form.control} name="landingPage.heroSubtitle" render={({ field }) => ( 
                                        <FormItem>
                                            <div className="flex justify-between items-center">
                                                <FormLabel className="text-xs">Hero Subtitle</FormLabel>
                                                <Button type="button" variant="ghost" size="xs" className="h-6 gap-1 text-[10px] text-primary px-1 hover:bg-primary/5" onClick={() => handleAiGenerate('heroSubtitle')} disabled={generatingFields['heroSubtitle']}>
                                                    {generatingFields['heroSubtitle'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate with AI
                                                </Button>
                                            </div>
                                            <FormControl><Textarea {...field} rows={2} /></FormControl>
                                            <FormMessage />
                                        </FormItem> 
                                    )} />
                                    <ColorField name="landingPage.heroSubtitleColor" label="Hero Subtitle Color" />
                                    
                                    <Separator />
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Hero Section Image</FormLabel>
                                            <div className="flex items-center gap-1.5">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button type="button" variant="outline" size="xs" className="h-7"><LayoutGrid className="h-3 w-3 mr-1" /> Choose Stock</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>Select Stock Background</DialogTitle>
                                                            <DialogDescription>Choose a professionally shot background image for your website header.</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                                            {STOCK_HERO_IMAGES.map((img) => (
                                                                <button
                                                                    key={img.name}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setValue('landingPage.heroImageUrl', img.url, { shouldDirty: true });
                                                                        toast({ title: 'Header Image Selected', description: `Applied ${img.name}` });
                                                                    }}
                                                                    className="group flex flex-col gap-1 text-left rounded-lg overflow-hidden border hover:border-primary transition-all bg-muted/30"
                                                                >
                                                                    <img src={img.url} alt={img.name} className="h-20 w-full object-cover group-hover:scale-105 transition-transform" />
                                                                    <span className="p-1.5 text-[9px] font-bold truncate block w-full">{img.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                                <Button variant="outline" size="xs" className="h-7" asChild disabled={isUploadingHero}><label className="cursor-pointer">{isUploadingHero ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}Upload<input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'hero')} /></label></Button>
                                            </div>
                                        </div>
                                        <FormField control={form.control} name="landingPage.heroImageUrl" render={({ field }) => ( <FormItem><FormControl><Input {...field} className="text-xs h-8" /></FormControl><FormMessage /></FormItem> )} />
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                                                <span>Hero Overlay Opacity</span>
                                                <span>{watch('landingPage.heroOverlayOpacity')}%</span>
                                            </div>
                                            <Slider 
                                                value={[watch('landingPage.heroOverlayOpacity')]} 
                                                onValueChange={(val) => setValue('landingPage.heroOverlayOpacity', val[0], { shouldDirty: true })} 
                                                max={100} 
                                                step={1} 
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <FormField control={form.control} name="landingPage.heroTextPosition" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">Text Position</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="inside">Inside Image (Overlay)</SelectItem>
                                                            <SelectItem value="below">Below Image</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="landingPage.heroLayout" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">Layout Alignment</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="centered">Centered</SelectItem>
                                                            <SelectItem value="split-left">Split Left</SelectItem>
                                                            <SelectItem value="split-right">Split Right</SelectItem>
                                                            <SelectItem value="background">Background Only</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>

                                    <Separator />
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Practice Logo</FormLabel>
                                            <Button variant="outline" size="xs" className="h-7" asChild disabled={isUploadingLogo}><label className="cursor-pointer">{isUploadingLogo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}Upload<input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')} /></label></Button>
                                        </div>
                                        <FormField control={form.control} name="landingPage.logoUrl" render={({ field }) => ( <FormItem><FormControl><Input {...field} className="text-xs h-8" /></FormControl><FormMessage /></FormItem> )} />
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                                                <span>Logo Height</span>
                                                <span>{watch('landingPage.logoHeight')}px</span>
                                            </div>
                                            <Slider 
                                                value={[watch('landingPage.logoHeight')]} 
                                                onValueChange={(val) => setValue('landingPage.logoHeight', val[0], { shouldDirty: true })} 
                                                min={20}
                                                max={120} 
                                                step={1} 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="landingPage.showLogo" render={({ field }) => ( <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">Show Logo</FormLabel></FormItem> )} />
                                            <FormField control={form.control} name="landingPage.hideHeaderBranding" render={({ field }) => ( <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">Hide Title</FormLabel></FormItem> )} />
                                        </div>
                                    </div>
                                    <Separator />
                                    <FormField control={form.control} name="landingPage.aboutUs" render={({ field }) => ( 
                                        <FormItem>
                                            <div className="flex justify-between items-center">
                                                <FormLabel className="text-xs">About Us Paragraph</FormLabel>
                                                <Button type="button" variant="ghost" size="xs" className="h-6 gap-1 text-[10px] text-primary px-1 hover:bg-primary/5" onClick={() => handleAiGenerate('aboutUs')} disabled={generatingFields['aboutUs']}>
                                                    {generatingFields['aboutUs'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate with AI
                                                </Button>
                                            </div>
                                            <FormControl><Textarea {...field} rows={4} /></FormControl>
                                            <FormMessage />
                                        </FormItem> 
                                    )} />
                                </CardContent>
                            </Card>

                            <Card className="border-2">
                                <CardHeader className="bg-muted/30"><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Branding & Theme</CardTitle></CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <FormField control={form.control} name="landingPage.themePreset" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Theme Preset</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a theme..." /></SelectTrigger></FormControl><SelectContent>
                                        <SelectItem value="custom">Custom</SelectItem>
                                        <SelectItem value="my_accountant">Master</SelectItem>
                                        <SelectItem value="tech_blue">Light</SelectItem>
                                        <SelectItem value="futuristic">Dark</SelectItem>
                                        <SelectItem value="facebook">Facebook</SelectItem>
                                        <SelectItem value="lovable">Lovable</SelectItem>
                                        <SelectItem value="monday">Monday.com</SelectItem>
                                        <SelectItem value="monday_crm">Monday CRM</SelectItem>
                                        <SelectItem value="stripe">Stripe</SelectItem>
                                        <SelectItem value="airbnb">Airbnb</SelectItem>
                                        <SelectItem value="linear">Linear</SelectItem>
                                        <SelectItem value="spotify">Spotify</SelectItem>
                                        <SelectItem value="notion">Notion</SelectItem>
                                        <SelectItem value="apple">Apple</SelectItem>
                                    </SelectContent></Select><FormMessage /></FormItem> )} />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="landingPage.fontFamily"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Typography / Fonts</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-9 text-xs">
                                                                <SelectValue placeholder="Select a font..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="sans">Default Sans-Serif</SelectItem>
                                                            <SelectItem value="inter">Inter (Modern & Clean)</SelectItem>
                                                            <SelectItem value="outfit">Outfit (Geometric & Bold)</SelectItem>
                                                            <SelectItem value="serif">Playfair Display (Elegant)</SelectItem>
                                                            <SelectItem value="mono">Fira Code (Monospace)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="landingPage.borderRadius"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Border Radius (Corners)</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-9 text-xs">
                                                                <SelectValue placeholder="Select radius..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="none">Sharp (0px)</SelectItem>
                                                            <SelectItem value="sm">Subtle (4px)</SelectItem>
                                                            <SelectItem value="md">Rounded (8px)</SelectItem>
                                                            <SelectItem value="lg">Bubbly (16px)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    
                                    <FormField
                                        control={form.control}
                                        name="landingPage.glassmorphism"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center space-x-2 space-y-0 py-1 bg-muted/20 p-2.5 rounded-lg border border-dashed">
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <div>
                                                    <FormLabel className="text-xs font-bold cursor-pointer">Enable Glassmorphism Overlay</FormLabel>
                                                    <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Applies translucent backing with glass-like backdrop blur onto page cards.</p>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Curated Theme Presets</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {COLOR_PRESETS.map((preset) => (
                                                <Button
                                                    key={preset.name}
                                                    type="button"
                                                    variant="outline"
                                                    size="xs"
                                                    onClick={() => handleApplyPreset(preset)}
                                                    className="h-8 justify-start gap-1.5 px-2 text-[10px] font-bold truncate"
                                                >
                                                    <span className="flex gap-0.5 shrink-0">
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.secondaryColor }} />
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.backgroundColor }} />
                                                    </span>
                                                    <span className="truncate">{preset.name.split(' ')[0]}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="grid grid-cols-1 gap-6">
                                        <ColorField name="landingPage.primaryColor" label="Primary Brand Color" description="Main theme color." />
                                        <ColorField name="landingPage.secondaryColor" label="Icon & Accent Color" description="Controls icon coloring." />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <ColorField name="landingPage.cardBackgroundColor" label="Card Background" />
                                            <ColorField name="landingPage.cardBorderColor" label="Card Border" />
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-widest">
                                                <MousePointer2 className="h-3 w-3" /> Button Branding
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="landingPage.buttonStyle"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Style Type</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="flex gap-4"
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="solid" id="r-solid" />
                                                                    <Label htmlFor="r-solid" className="text-xs font-bold cursor-pointer">Solid Fill</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="outline" id="r-outline" />
                                                                    <Label htmlFor="r-outline" className="text-xs font-bold cursor-pointer">Outline</Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <ColorField name="landingPage.buttonColor" label="Button Color" description="Fill or border color." />
                                                <ColorField name="landingPage.buttonTextColor" label="Button Text" />
                                            </div>
                                        </div>
                                        <Separator className="my-2" />
                                        <ColorField name="landingPage.backgroundColor" label="Page Background" />
                                        <ColorField name="landingPage.textColor" label="Default Text Color" />
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Services Section Hero Image</FormLabel>
                                            <Button variant="outline" size="xs" className="h-7" asChild disabled={isUploadingServicesHero}><label className="cursor-pointer">{isUploadingServicesHero ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}Upload<input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'servicesHero')} /></label></Button>
                                        </div>
                                        <FormField control={form.control} name="landingPage.servicesHeroImageUrl" render={({ field }) => ( <FormItem><FormControl><Input {...field} className="text-xs h-8" /></FormControl><FormMessage /></FormItem> )} />
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                                                <span>Services Hero Opacity</span>
                                                <span>{watch('landingPage.servicesHeroOverlayOpacity')}%</span>
                                            </div>
                                            <Slider 
                                                value={[watch('landingPage.servicesHeroOverlayOpacity')]} 
                                                onValueChange={(val) => setValue('landingPage.servicesHeroOverlayOpacity', val[0], { shouldDirty: true })} 
                                                max={100} 
                                                step={1} 
                                            />
                                        </div>
                                        
                                        <div className="space-y-4 pt-4 border-t border-dashed">
                                            <FormField control={form.control} name="landingPage.servicesHeroTitle" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Services Title</FormLabel><FormControl><Input {...field} placeholder="e.g. Accounting & Tax Solutions" /></FormControl><FormMessage /></FormItem> )} />
                                            <FormField control={form.control} name="landingPage.servicesHeroSubtitle" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Services Subtitle</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="e.g. Comprehensive professional services for individuals and SMEs." /></FormControl><FormMessage /></FormItem> )} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="landingPage.servicesHeroTextPosition" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">Text Position</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="inside">Inside Image (Overlay)</SelectItem>
                                                                <SelectItem value="below">Below Image</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="landingPage.servicesHeroLayout" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">Layout Alignment</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="centered">Centered</SelectItem>
                                                                <SelectItem value="split-left">Split Left</SelectItem>
                                                                <SelectItem value="split-right">Split Right</SelectItem>
                                                                <SelectItem value="background">Background Only</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2">
                                <CardHeader className="bg-muted/30">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Testimonials & Reviews</span>
                                        <Button type="button" size="xs" className="h-7" onClick={() => appendTestimonial({ name: '', role: '', company: '', quote: '', rating: 5 })}>
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Review
                                        </Button>
                                    </CardTitle>
                                    <CardDescription className="text-[10px]">Manage reviews from your clients displayed on your landing page.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    {testimonialFields.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground text-center py-6">No testimonials added yet. Click "Add Review" to show client quotes.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {testimonialFields.map((field, index) => (
                                                <div key={field.id} className="p-3 border rounded-lg bg-muted/10 relative space-y-3">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-2 top-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeTestimonial(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    
                                                    <div className="grid grid-cols-2 gap-3 pr-8">
                                                        <FormField
                                                            control={form.control}
                                                            name={`landingPage.testimonials.${index}.name` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px]">Client Name</FormLabel>
                                                                    <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`landingPage.testimonials.${index}.role` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px]">Role / Job Title</FormLabel>
                                                                    <FormControl><Input {...field} className="h-8 text-xs" placeholder="e.g. Director, Founder" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`landingPage.testimonials.${index}.company` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px]">Company Name (Optional)</FormLabel>
                                                                    <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`landingPage.testimonials.${index}.rating` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px]">Rating (1-5 Stars)</FormLabel>
                                                                    <Select onValueChange={(val) => setValue(`landingPage.testimonials.${index}.rating`, Number(val), { shouldDirty: true })} value={String(form.watch(`landingPage.testimonials.${index}.rating`) || 5)}>
                                                                        <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="5">⭐⭐⭐⭐⭐ (5/5)</SelectItem>
                                                                            <SelectItem value="4">⭐⭐⭐⭐ (4/5)</SelectItem>
                                                                            <SelectItem value="3">⭐⭐⭐ (3/5)</SelectItem>
                                                                            <SelectItem value="2">⭐⭐ (2/5)</SelectItem>
                                                                            <SelectItem value="1">⭐ (1/5)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name={`landingPage.testimonials.${index}.quote` as any}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[10px]">Client Quote</FormLabel>
                                                                <FormControl><Textarea {...field} rows={2} className="text-xs" placeholder="What the client said about your work..." /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-2">
                                <CardHeader className="bg-muted/30">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        <span className="flex items-center gap-2"><ChevronDown className="h-4 w-4 text-primary" /> Frequently Asked Questions</span>
                                        <Button type="button" size="xs" className="h-7" onClick={() => appendFaq({ question: '', answer: '' })}>
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ
                                        </Button>
                                    </CardTitle>
                                    <CardDescription className="text-[10px]">Add collapsible FAQs to answer standard customer inquiries on-page.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    {faqFields.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground text-center py-6">No FAQs added yet. Click "Add FAQ" to create standard questions and answers.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {faqFields.map((field, index) => (
                                                <div key={field.id} className="p-3 border rounded-lg bg-muted/10 relative space-y-3">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-2 top-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeFaq(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    
                                                    <FormField
                                                        control={form.control}
                                                        name={`landingPage.faqs.${index}.question` as any}
                                                        render={({ field }) => (
                                                            <FormItem className="pr-8">
                                                                <FormLabel className="text-[10px]">Question</FormLabel>
                                                                <FormControl><Input {...field} className="h-8 text-xs" placeholder="e.g. Do you offer virtual consultations?" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`landingPage.faqs.${index}.answer` as any}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[10px]">Answer</FormLabel>
                                                                <FormControl><Textarea {...field} rows={2} className="text-xs" placeholder="Detail your response to this question..." /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-2">
                                <CardHeader className="bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Lead Contact Form</CardTitle>
                                        <FormField control={form.control} name="landingPage.showLeadForm" render={({ field }) => ( <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> )} />
                                    </div>
                                    <CardDescription className="text-[10px]">Toggle whether to show the contact form for client inquiries on your landing page.</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>

                        <Card className="border-2">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-sm flex items-center gap-2"><Search className="h-4 w-4" /> SEO & Metadata</CardTitle>
                                <CardDescription className="text-[10px]">Customize how your practice appears in Google search results.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <FormField control={form.control} name="landingPage.metaTitle" render={({ field }) => ( 
                                    <FormItem>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <FormLabel className="text-xs">Meta Title</FormLabel>
                                                <Button type="button" variant="ghost" size="xs" className="h-6 gap-1 text-[10px] text-primary px-1 hover:bg-primary/5" onClick={() => handleAiGenerate('metaTitle')} disabled={generatingFields['metaTitle']}>
                                                    {generatingFields['metaTitle'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                                                </Button>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{field.value?.length || 0}/60</span>
                                        </div>
                                        <FormControl><Input {...field} placeholder="e.g. Acme Tax Solutions | Professional Accounting in Sandton" /></FormControl>
                                        <FormMessage />
                                    </FormItem> 
                                )} />
                                <FormField control={form.control} name="landingPage.metaDescription" render={({ field }) => ( 
                                    <FormItem>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <FormLabel className="text-xs">Meta Description</FormLabel>
                                                <Button type="button" variant="ghost" size="xs" className="h-6 gap-1 text-[10px] text-primary px-1 hover:bg-primary/5" onClick={() => handleAiGenerate('metaDescription')} disabled={generatingFields['metaDescription']}>
                                                    {generatingFields['metaDescription'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                                                </Button>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{field.value?.length || 0}/160</span>
                                        </div>
                                        <FormControl><Textarea {...field} rows={3} placeholder="Provide a brief summary of your practice for search engines..." /></FormControl>
                                        <FormMessage />
                                    </FormItem> 
                                )} />
                            </CardContent>
                        </Card>

                        <Card className="border-2">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Integrations & Analytics</CardTitle>
                                <CardDescription className="text-[10px]">Configure third-party tracking scripts and lead generation widgets.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <FormField control={form.control} name="landingPage.googleAnalyticsId" render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel className="text-xs">Google Analytics Tag ID</FormLabel>
                                        <FormControl><Input {...field} placeholder="e.g. G-XXXXXXXXXX" /></FormControl>
                                        <FormDescription className="text-[10px]">Track website visitors using your Google Analytics 4 Measurement ID.</FormDescription>
                                        <FormMessage />
                                    </FormItem> 
                                )} />
                                <FormField control={form.control} name="landingPage.metaPixelId" render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel className="text-xs">Meta Pixel ID</FormLabel>
                                        <FormControl><Input {...field} placeholder="e.g. 1234567890" /></FormControl>
                                        <FormDescription className="text-[10px]">Run Facebook / Instagram ads directly to your white-label page.</FormDescription>
                                        <FormMessage />
                                    </FormItem> 
                                )} />
                                
                                <Separator />
                                
                                <FormField
                                    control={form.control}
                                    name="landingPage.showCalculator"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-dashed">
                                            <div className="space-y-0.5 pr-4">
                                                <FormLabel className="text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                                                    <Calculator className="h-3.5 w-3.5 text-primary" /> Monthly Pricing Calculator
                                                </FormLabel>
                                                <p className="text-[10px] text-muted-foreground leading-snug">
                                                    Allow clients to select services on-page to estimate and submit custom monthly accounting retaining quotes.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-2">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-sm flex items-center gap-2"><Gavel className="h-4 w-4" /> Legal & Policies</CardTitle>
                                <CardDescription className="text-[10px]">Provide custom policy text for your white-label practice landing page.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <FormField control={form.control} name="landingPage.refundPolicy" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Refund Policy</FormLabel><FormControl><Textarea {...field} rows={4} placeholder="Detail your practice's refund conditions..." /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="landingPage.popiaPolicy" render={({ field }) => ( <FormItem><FormLabel className="text-xs">POPIA Compliance Policy</FormLabel><FormControl><Textarea {...field} rows={4} placeholder="Outline your data protection procedures..." /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="landingPage.termsAndConditions" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Terms & Conditions</FormLabel><FormControl><Textarea {...field} rows={4} placeholder="General terms of service for your practice..." /></FormControl><FormMessage /></FormItem> )} />
                            </CardContent>
                        </Card>
                      </div>

                      {previewMode === 'split' && (
                        <div className="lg:col-span-6 lg:sticky lg:top-8 self-start hidden lg:block">
                          <div className="mb-2 font-bold text-muted-foreground text-xs uppercase tracking-widest flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-primary" /> Live Preview Simulator
                          </div>
                          <PartnerLandingPagePreview 
                            watchedLp={watchedLp}
                            companyName={form.getValues('companyName')}
                            partnerEmail={form.getValues('email')}
                            partnerPhone={form.getValues('contactNumber')}
                            partnerAddress={form.getValues('address')}
                          />
                        </div>
                      )}
                    </div>
                )}
            </div>
                </>
            )}

            <Separator />
            <Button type="submit" disabled={isSaving} className="w-full h-14 text-lg font-black shadow-xl">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving Changes...' : (propPartner ? 'Update Partner Practice' : 'Save All Practice Settings')}
            </Button>
        </form>
        </Form>

        <Dialog open={isDiffOpen} onOpenChange={setIsDiffOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Redesign Proposals
              </DialogTitle>
              <DialogDescription>
                Review the changes proposed by the AI based on your prompt before applying them to your landing page.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {pendingAiConfig && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="p-3 font-bold">Field / Section</th>
                        <th className="p-3 font-bold">Current State</th>
                        <th className="p-3 font-bold text-primary">AI Proposed State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDiffDescription(form.getValues('landingPage'), pendingAiConfig).map((diff, idx) => (
                        <tr key={diff.field} className={`border-b ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50'}`}>
                          <td className="p-3 font-semibold">{diff.label}</td>
                          <td className="p-3 text-muted-foreground break-words max-w-[200px]">
                            {diff.field.includes('Color') ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded border" style={{ backgroundColor: diff.from }} />
                                <code>{diff.from}</code>
                              </span>
                            ) : (
                              diff.from
                            )}
                          </td>
                          <td className="p-3 text-primary font-medium break-words max-w-[200px]">
                            {diff.field.includes('Color') ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded border" style={{ backgroundColor: diff.to }} />
                                <code>{diff.to}</code>
                              </span>
                            ) : (
                              diff.to
                            )}
                          </td>
                        </tr>
                      ))}
                      {getDiffDescription(form.getValues('landingPage'), pendingAiConfig).length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground">
                            No changes detected. The AI generated a config identical to your current one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPendingAiConfig(null);
                  setIsDiffOpen(false);
                }}
              >
                Discard Edits
              </Button>
              <Button
                type="button"
                onClick={handleApplyPendingConfig}
                disabled={getDiffDescription(form.getValues('landingPage'), pendingAiConfig).length === 0}
                className="gap-2 font-bold"
              >
                <Sparkles className="h-4 w-4" />
                Accept & Apply
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
