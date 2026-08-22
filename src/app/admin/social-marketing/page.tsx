'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Megaphone, Copy, Facebook, Share2, Info, ArrowRight, RefreshCw, Trash2, X, Settings, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { Service, BlogPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateSocialAds, SocialAdOutput } from '@/ai/flows/generate-social-ad';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { testFacebookConnectionAction, saveFacebookSettingsAction, postToFacebookPageAction } from './actions';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

const db = getFirestore(firebaseApp);

interface AdSource {
    id: string;
    title: string;
    description: string;
    price?: number;
    turnaroundTime?: string;
    category: string;
    slug: string;
    type: 'service' | 'page' | 'blog';
    imageUrl?: string;
}

export default function SocialMarketingPage() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const [sources, setSources] = useState<AdSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [generatedAds, setGeneratedAds] = useState<SocialAdOutput | null>(null);
    const [tone, setTone] = useState<'professional' | 'friendly' | 'urgent' | 'educational'>('professional');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [postFormat, setPostFormat] = useState<'link' | 'photo'>('link');

    const getSourceUrls = (service: AdSource | undefined) => {
        if (!service) return { linkUrl: undefined, imageUrl: undefined };
        
        const linkUrl = service.type === 'service'
            ? `${process.env.NEXT_PUBLIC_APP_URL || SITE_URL}/products/${service.slug}`
            : service.type === 'blog'
                ? `${process.env.NEXT_PUBLIC_APP_URL || SITE_URL}/blog/${service.slug}`
                : `${process.env.NEXT_PUBLIC_APP_URL || SITE_URL}/${service.slug}`;

        let imageUrl = service.imageUrl || '';
        if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = `${SITE_URL}${imageUrl}`;
        }
        if (!imageUrl) {
            imageUrl = GLOBAL_OG_IMAGE;
        }

        return { linkUrl, imageUrl };
    };

    const categories = useMemo(() => {
        return Array.from(new Set(sources.map(s => s.category))).filter(Boolean).sort();
    }, [sources]);

    const filteredServices = useMemo(() => {
        return selectedCategory === 'all'
            ? sources
            : sources.filter(s => s.category === selectedCategory);
    }, [sources, selectedCategory]);

    // Facebook settings state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [pageId, setPageId] = useState('');
    const [pageAccessToken, setPageAccessToken] = useState('');
    const [resolvedPageAccessToken, setResolvedPageAccessToken] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
    const [testError, setTestError] = useState('');
    const [testResult, setTestResult] = useState<{ pageName: string; pagePictureUrl: string | null } | null>(null);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isPostingAll, setIsPostingAll] = useState(false);
    
    // Track posting status per ad index
    const [postingStatus, setPostingStatus] = useState<Record<number, 'idle' | 'posting' | 'success' | 'failed'>>({});

    useEffect(() => {
        if (user?.facebookSettings) {
            setPageId(user.facebookSettings.pageId || '');
            setPageAccessToken(user.facebookSettings.pageAccessToken || '');
            setResolvedPageAccessToken(user.facebookSettings.pageAccessToken || '');
            if (user.facebookSettings.pageName) {
                setTestResult({
                    pageName: user.facebookSettings.pageName,
                    pagePictureUrl: user.facebookSettings.pagePictureUrl || null
                });
                setTestStatus('success');
            }
        }
    }, [user]);

    useEffect(() => {
        const fetchAllSources = async () => {
            try {
                // 1. Fetch Services
                const servicesQuery = query(collection(db, "services"), orderBy("title"));
                const servicesSnap = await getDocs(servicesQuery);
                const fetchedServices = servicesSnap.docs.map(doc => {
                    const data = doc.data() as Service;
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        price: data.price,
                        turnaroundTime: data.turnaroundTime,
                        category: data.category || 'Service',
                        slug: data.slug,
                        type: 'service' as const,
                        imageUrl: data.imageUrl || data.seoImageUrl || ''
                    };
                });

                // 2. Fetch Blog Posts
                const blogQuery = query(collection(db, "blogPosts"), orderBy("date", "desc"));
                const blogSnap = await getDocs(blogQuery);
                const fetchedBlogs = blogSnap.docs.map(doc => {
                    const data = doc.data() as BlogPost;
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.excerpt || data.content.substring(0, 150),
                        category: 'Blog Post',
                        slug: data.slug,
                        type: 'blog' as const,
                        imageUrl: data.imageUrl || data.seoImageUrl || ''
                    };
                });

                // 3. Define Static Pages
                const staticPagesConfig = [
                    { id: 'home', slug: '', title: 'Home Page', description: 'Professional Accounting & Tax Services for South Africa. We handle SARS, CIPC, and all your compliance needs.', category: 'Static Page', type: 'page' as const, imageUrl: '' },
                    { id: 'about', slug: 'about', title: 'About Us', description: 'Learn about My Accountant, our vision, mission, and the expertise that drives us to provide top-tier financial services.', category: 'Static Page', type: 'page' as const, imageUrl: '' },
                    { id: 'compliance', slug: 'compliance', title: 'Compliance Check', description: 'Ensure your South African business is compliant. Get a free, no-obligation compliance assessment for CIPC and SARS.', category: 'Static Page', type: 'page' as const, imageUrl: '' },
                    { id: 'sars-compromise', slug: 'sars-compromise', title: 'SARS Compromise of Debt', description: 'Negotiate a settlement with SARS to resolve outstanding tax debt.', category: 'Static Page', type: 'page' as const, imageUrl: '' },
                    { id: 'sars-disputes', slug: 'sars-disputes', title: 'SARS Disputes & Objections', description: 'Professional assistance with SARS disputes, objections (Section 104), and appeals.', category: 'Static Page', type: 'page' as const, imageUrl: '' },
                    { id: 'remission-of-fines', slug: 'remission-of-fines', title: 'Remission of Fines & Penalties', description: 'Apply for a SARS Request for Remission (RFR) to remove or reduce administrative and understatement penalties.', category: 'Static Page', type: 'page' as const, imageUrl: '' },
                    { id: 'liquidations', slug: 'liquidations', title: 'Company Liquidations', description: 'Professional assistance with voluntary company liquidations in South Africa.', category: 'Static Page', type: 'page' as const, imageUrl: '' },
                    { id: 'become-a-partner', slug: 'become-a-partner', title: 'Become a Partner', description: 'Partner with My Accountant to grow your practice and scale with our technology.', category: 'Static Page', type: 'page' as const, imageUrl: '' }
                ];

                setSources([...fetchedServices, ...staticPagesConfig, ...fetchedBlogs]);
            } catch (e) {
                console.error("Error loading ad sources:", e);
                toast({
                    title: "Fetch Error",
                    description: "Could not retrieve services or blog posts from server.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllSources();
    }, []);

    const handleTestConnection = async () => {
        if (!pageId || !pageAccessToken) {
            toast({
                title: "Validation Error",
                description: "Please enter both Page ID and Page Access Token.",
                variant: "destructive"
            });
            return;
        }

        setTestStatus('testing');
        setTestError('');
        setTestResult(null);

        try {
            const res = await testFacebookConnectionAction(pageId, pageAccessToken);
            if (res.success && res.pageName) {
                setTestStatus('success');
                setTestResult({
                    pageName: res.pageName,
                    pagePictureUrl: res.pagePictureUrl || null
                });
                setResolvedPageAccessToken(res.resolvedPageToken || pageAccessToken);
                toast({
                    title: "Connection Success!",
                    description: `Successfully connected to page "${res.pageName}".`
                });
            } else {
                setTestStatus('failed');
                setTestError(res.error || "Connection failed. Please check credentials.");
                toast({
                    title: "Connection Failed",
                    description: res.error || "Please verify credentials and page permissions.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            setTestStatus('failed');
            setTestError(err.message || "An unexpected error occurred.");
        }
    };

    const handleSaveSettings = async () => {
        if (!user) {
            toast({
                title: "Not Authenticated",
                description: "You must be logged in to save settings.",
                variant: "destructive"
            });
            return;
        }

        if (testStatus !== 'success' || !testResult) {
            toast({
                title: "Connection Required",
                description: "Please test and confirm the connection before saving settings.",
                variant: "destructive"
            });
            return;
        }

        setIsSavingSettings(true);
        try {
            const tokenToSave = resolvedPageAccessToken || pageAccessToken;
            const res = await saveFacebookSettingsAction(
                user.uid,
                pageId,
                tokenToSave,
                testResult.pageName,
                testResult.pagePictureUrl || '',
        await getAuth(firebaseApp).currentUser?.getIdToken()
      );

            if (res.success) {
                updateUser({
                    ...user,
                    facebookSettings: {
                        pageId: pageId.trim(),
                        pageAccessToken: tokenToSave.trim(),
                        pageName: testResult.pageName,
                        pagePictureUrl: testResult.pagePictureUrl || ''
                    }
                });
                toast({
                    title: "Settings Saved",
                    description: "Your Facebook integration settings have been updated successfully."
                });
                setIsSettingsOpen(false);
            } else {
                toast({
                    title: "Save Failed",
                    description: res.error || "Could not save settings to database.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            toast({
                title: "Save Failed",
                description: err.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handlePostToFacebook = async (index: number, adText: string, service?: AdSource) => {
        if (!user?.facebookSettings?.pageId) {
            setIsSettingsOpen(true);
            toast({
                title: "Setup Required",
                description: "Please set up your Facebook Page integration first."
            });
            return;
        }

        setPostingStatus(prev => ({ ...prev, [index]: 'posting' }));
        try {
            const { linkUrl, imageUrl } = getSourceUrls(service);
            const res = await postToFacebookPageAction(user.uid, adText, {
                link: linkUrl,
                imageUrl: imageUrl,
                postMode: postFormat
            }, await getAuth(firebaseApp).currentUser?.getIdToken());
            if (res.success && res.postId) {
                setPostingStatus(prev => ({ ...prev, [index]: 'success' }));
                toast({
                    title: "Post Published!",
                    description: (
                        <div className="flex flex-col gap-1">
                            <span>Your ad was posted directly to Facebook.</span>
                            <a 
                                href={`https://facebook.com/${res.postId}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-primary hover:underline font-bold inline-flex items-center gap-1 mt-1 text-xs"
                            >
                                View published post <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    ),
                    duration: 7000
                });
            } else {
                setPostingStatus(prev => ({ ...prev, [index]: 'failed' }));
                toast({
                    title: "Posting Failed",
                    description: res.error || "Could not publish post to Facebook Page.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            setPostingStatus(prev => ({ ...prev, [index]: 'failed' }));
            toast({
                title: "Posting Failed",
                description: err.message || "An error occurred while publishing.",
                variant: "destructive"
            });
        }
    };

    const handlePostAllToFacebook = async () => {
        if (!generatedAds || generatedAds.ads.length === 0) return;
        if (!user?.facebookSettings?.pageId) {
            setIsSettingsOpen(true);
            toast({
                title: "Setup Required",
                description: "Please set up your Facebook Page integration first."
            });
            return;
        }

        setIsPostingAll(true);
        toast({
            title: "Bulk Posting Started",
            description: `Publishing all ${generatedAds.ads.length} ads to Facebook Page...`
        });

        let successCount = 0;
        let failCount = 0;

        for (let idx = 0; idx < generatedAds.ads.length; idx++) {
            const ad = generatedAds.ads[idx];
            const adContent = `${ad.hook}\n\n${ad.body}\n\n${ad.cta}\n\n${ad.hashtags}`;
            const service = sources.find(s => s.id === ad.productId);
            
            setPostingStatus(prev => ({ ...prev, [idx]: 'posting' }));
            
            try {
                const { linkUrl, imageUrl } = getSourceUrls(service);
                const res = await postToFacebookPageAction(user.uid, adContent, {
                    link: linkUrl,
                    imageUrl: imageUrl,
                    postMode: postFormat
                }, await getAuth(firebaseApp).currentUser?.getIdToken());
                if (res.success) {
                    setPostingStatus(prev => ({ ...prev, [idx]: 'success' }));
                    successCount++;
                } else {
                    setPostingStatus(prev => ({ ...prev, [idx]: 'failed' }));
                    failCount++;
                }
            } catch (e) {
                setPostingStatus(prev => ({ ...prev, [idx]: 'failed' }));
                failCount++;
            }
            
            // Wait 500ms between posts to avoid rate limit/spam detection
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setIsPostingAll(false);
        if (successCount > 0) {
            toast({
                title: "Bulk Posting Complete",
                description: `Successfully posted ${successCount} of ${generatedAds.ads.length} ads to your page feed.`
            });
        } else {
            toast({
                title: "Bulk Posting Failed",
                description: "Failed to publish ads. Please check credentials.",
                variant: "destructive"
            });
        }
    };

    const handleGenerate = async () => {
        if (selectedIds.length === 0) return;
        
        setIsGenerating(true);
        const productsToAd = sources
            .filter(s => selectedIds.includes(s.id))
            .map(s => ({
                id: s.id,
                productName: s.title,
                price: s.price,
                turnaroundTime: s.turnaroundTime,
                description: s.description,
                category: s.category,
                url: s.type === 'service'
                    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/products/${s.slug}`
                    : s.type === 'blog'
                        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/blog/${s.slug}`
                        : `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/${s.slug}`
            }));

        try {
            const result = await generateSocialAds({ products: productsToAd, tone });
            if (result && result.success && result.ads) {
                setGeneratedAds({ ads: result.ads } as SocialAdOutput);
                toast({ title: "Ads Generated!", description: `Created marketing content for ${selectedIds.length} products.` });
            } else {
                throw new Error(result?.error || "Invalid output received from AI");
            }
        } catch (e: any) {
            console.error("Ad Generation Error:", e);
            toast({ 
                title: "Generation Failed", 
                description: e.message || "The AI failed to generate content. Please try again.", 
                variant: "destructive" 
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Social Marketing</h1>
                    <p className="text-sm text-muted-foreground font-medium">Bulk generate high-converting ad copy for your services.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsSettingsOpen(true)}
                        className="h-10 font-bold px-4 gap-2 border-primary/20 bg-white"
                    >
                        <Facebook className="h-4 w-4 text-[#1877F2] fill-[#1877F2]" />
                        Facebook Settings
                    </Button>
                    <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                        <SelectTrigger className="w-[180px] bg-white h-10 font-bold border-primary/20">
                            <SelectValue placeholder="Select Tone" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="professional">Professional & Trustworthy</SelectItem>
                            <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                            <SelectItem value="urgent">Urgent (Limited Time)</SelectItem>
                            <SelectItem value="educational">Educational / Info-heavy</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={postFormat} onValueChange={(v: any) => setPostFormat(v)}>
                        <SelectTrigger className="w-[210px] bg-white h-10 font-bold border-primary/20">
                            <SelectValue placeholder="Post Format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="link">🔗 Link Card (Clickable Preview)</SelectItem>
                            <SelectItem value="photo">🖼️ Photo Post (Direct Image)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button 
                        onClick={handleGenerate} 
                        disabled={selectedIds.length === 0 || isGenerating}
                        className="h-10 font-black px-6 gap-2 shadow-lg"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {isGenerating ? 'Generating...' : `Generate ${selectedIds.length > 0 ? selectedIds.length : ''} Ads`}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <Card className="lg:col-span-4 border-2">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-primary" />
                            Select Services
                        </CardTitle>
                        <CardDescription className="text-[10px]">Pick the services you want to promote.</CardDescription>
                    </CardHeader>
                    <div className="px-3 py-2 border-b bg-slate-50/50 flex gap-2 items-center justify-between">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-8 text-[11px] font-bold bg-white border-slate-200 w-full">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedCategory !== 'all' && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[10px] font-black px-3 flex-shrink-0 border-primary/20 hover:bg-primary/5 hover:text-primary"
                                onClick={() => {
                                    const idsToSelect = filteredServices.map(s => s.id);
                                    setSelectedIds(prev => Array.from(new Set([...prev, ...idsToSelect])));
                                }}
                            >
                                Select All
                            </Button>
                        )}
                    </div>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            <div className="divide-y">
                                {filteredServices.map(service => (
                                    <div 
                                        key={service.id} 
                                        className={cn(
                                            "flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer",
                                            selectedIds.includes(service.id) && "bg-primary/5"
                                        )}
                                        onClick={() => toggleSelect(service.id)}
                                    >
                                        <Checkbox checked={selectedIds.includes(service.id)} onCheckedChange={() => toggleSelect(service.id)} />
                                        <div className="flex-grow min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">{service.title}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Badge className={cn(
                                                    "text-[8px] px-1 py-0 h-3.5 uppercase font-bold",
                                                    service.type === 'service' && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
                                                    service.type === 'page' && "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50",
                                                    service.type === 'blog' && "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
                                                )} variant="outline">
                                                    {service.type}
                                                </Badge>
                                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter truncate">{service.category}</p>
                                            </div>
                                        </div>
                                        {service.price !== undefined && (
                                            <Badge variant="outline" className="text-[9px] font-mono flex-shrink-0">R{service.price}</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 border-t bg-muted/10 justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{selectedIds.length} selected</span>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black" onClick={() => setSelectedIds([])}>Clear All</Button>
                    </CardFooter>
                </Card>

                <div className="lg:col-span-8 h-[calc(100vh-12rem)] min-h-[600px] flex flex-col">
                    {!generatedAds ? (
                        <div className="flex-grow border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-12 bg-muted/5">
                            <Sparkles className="h-16 w-16 text-primary opacity-10 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">Campaign Content Creator</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                                Select products from the list and choose a tone to generate optimized Facebook ad variants.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-grow">
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pr-4">
                            {user?.facebookSettings?.pageId ? (
                                <Alert className="bg-emerald-50 border-emerald-200 border-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <AlertTitle className="text-xs font-black uppercase text-emerald-800 tracking-widest">
                                        Facebook Integration Active
                                    </AlertTitle>
                                    <AlertDescription className="text-xs font-medium text-emerald-700 leading-relaxed mt-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {user.facebookSettings.pagePictureUrl && (
                                                <img 
                                                    src={user.facebookSettings.pagePictureUrl} 
                                                    alt="Page profile" 
                                                    className="w-5 h-5 rounded-full border border-emerald-200"
                                                />
                                            )}
                                            <span>Auto-posting directly to your page: <strong>{user.facebookSettings.pageName || user.facebookSettings.pageId}</strong></span>
                                        </div>
                                        <Button 
                                            variant="link" 
                                            className="p-0 h-auto text-emerald-800 hover:text-emerald-950 font-bold text-xs underline justify-start animate-none"
                                            onClick={() => setIsSettingsOpen(true)}
                                        >
                                            Change Settings
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert className="bg-amber-50 border-amber-200 border-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertTitle className="text-xs font-black uppercase text-amber-800 tracking-widest">Facebook Setup Required</AlertTitle>
                                    <AlertDescription className="text-xs font-medium text-amber-700 leading-relaxed mt-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <span>Direct posting is disabled. Configure your Meta credentials to publish ads automatically.</span>
                                        <Button 
                                            variant="link" 
                                            className="p-0 h-auto text-amber-800 hover:text-amber-950 font-bold text-xs underline justify-start animate-none"
                                            onClick={() => setIsSettingsOpen(true)}
                                        >
                                            Configure Facebook Integration
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {user?.facebookSettings?.pageId && (
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 border-2 rounded-2xl border-slate-100 gap-3">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Bulk Social Publisher</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Publish all {generatedAds.ads.length} ad variants with a single click.</p>
                                    </div>
                                    <Button 
                                        onClick={handlePostAllToFacebook}
                                        disabled={isPostingAll}
                                        size="sm"
                                        className="font-black px-5 h-9 gap-2 shadow-sm uppercase text-[10px]"
                                    >
                                        {isPostingAll ? (
                                            <>Posting All... <Loader2 className="h-3.5 w-3.5 animate-spin" /></>
                                        ) : (
                                            <>Publish All Ads <Share2 className="h-3.5 w-3.5" /></>
                                        )}
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                {generatedAds.ads.map((ad, idx) => {
                                    const service = sources.find(s => s.id === ad.productId);
                                    const adContent = `${ad.hook}\n\n${ad.body}\n\n${ad.cta}\n\n${ad.hashtags}`;
                                    return (
                                        <Card key={idx} className="border-2 shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/30 border-b py-3 flex flex-row justify-between items-center">
                                                <Badge className="bg-primary font-black text-[9px] uppercase tracking-widest">{service?.title || 'Ad Variant'}</Badge>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 gap-2 font-bold text-xs"
                                                    onClick={() => handleCopy(adContent)}
                                                >
                                                    <Copy className="h-3 w-3" /> Copy All
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="p-6 space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">The Hook</p>
                                                    <p className="text-sm font-bold text-slate-900">{ad.hook}</p>
                                                </div>
                                                <Separator />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ad Body</p>
                                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{ad.body}</p>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Call to Action</p>
                                                        <p className="text-xs font-bold text-primary">{ad.cta}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hashtags</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{ad.hashtags}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-slate-50 border-t py-3 flex justify-between">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
                                                    <Facebook className="h-4 w-4 text-[#1877F2]" />
                                                    Facebook Optimized
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    className="font-bold h-8 text-[10px] uppercase gap-2 min-w-[100px]"
                                                    onClick={() => handlePostToFacebook(idx, adContent, service)}
                                                    disabled={postingStatus[idx] === 'posting'}
                                                >
                                                    {postingStatus[idx] === 'posting' ? (
                                                        <>Posting... <Loader2 className="h-3 w-3 animate-spin" /></>
                                                    ) : postingStatus[idx] === 'success' ? (
                                                        <>Posted! <CheckCircle2 className="h-3 w-3 text-green-600" /></>
                                                    ) : (
                                                        <>Post Now <Share2 className="h-3 w-3" /></>
                                                    )}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                        </ScrollArea>
                    )}
                </div>
            </div>

            {/* Facebook Settings Modal */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                            <Facebook className="h-5 w-5 text-[#1877F2] fill-[#1877F2]" />
                            Facebook Page Integration
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Configure your page credentials to post advertisements directly to your Facebook Page.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="page-id" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Facebook Page ID
                            </Label>
                            <Input 
                                id="page-id"
                                placeholder="e.g., 109703190755392"
                                value={pageId}
                                onChange={(e) => {
                                    setPageId(e.target.value);
                                    setTestStatus('idle');
                                }}
                                className="border-slate-200"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="page-token" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Page Access Token
                            </Label>
                            <Input 
                                id="page-token"
                                type="password"
                                placeholder="Paste your Facebook Page Access Token"
                                value={pageAccessToken}
                                onChange={(e) => {
                                    setPageAccessToken(e.target.value);
                                    setTestStatus('idle');
                                }}
                                className="border-slate-200"
                            />
                        </div>

                        {/* Connection Verification Feedback */}
                        {testStatus === 'testing' && (
                            <div className="flex items-center gap-2 p-3 text-xs bg-slate-50 border rounded-lg text-slate-600 font-semibold">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span>Verifying credentials with Meta Graph API...</span>
                            </div>
                        )}

                        {testStatus === 'success' && testResult && (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
                                {testResult.pagePictureUrl && (
                                    <img 
                                        src={testResult.pagePictureUrl} 
                                        alt="Page avatar" 
                                        className="w-10 h-10 rounded-full border border-emerald-200 object-cover"
                                    />
                                )}
                                <div className="flex-grow">
                                    <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                                        Verified Successfully
                                    </p>
                                    <p className="text-emerald-700 mt-0.5 font-medium">
                                        Page Name: <strong>{testResult.pageName}</strong>
                                    </p>
                                </div>
                            </div>
                        )}

                        {testStatus === 'failed' && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                                <p className="font-bold flex items-center gap-1.5 text-rose-900">
                                    <AlertTriangle className="h-4 w-4 text-rose-600 fill-rose-100" />
                                    Connection Verification Failed
                                </p>
                                <p className="text-rose-700 mt-1 font-mono text-[10px] break-all leading-normal">
                                    {testError}
                                </p>
                            </div>
                        )}

                        {/* Collapsible Setup Instructions */}
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                                <Info className="h-3 w-3 text-slate-400" /> Setup Instructions
                            </h4>
                            <ol className="list-decimal pl-4 text-xs space-y-1.5 text-slate-600 leading-normal font-medium">
                                <li>Log in to the <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">Meta Developers Portal <ExternalLink className="h-2.5 w-2.5" /></a> and create a Business App.</li>
                                <li>Navigate to the **Graph API Explorer** tool.</li>
                                <li>Select your developer app, choose **User Token**, and request permissions: `pages_manage_posts` and `pages_read_engagement`.</li>
                                <li>In the Token dropdown, select your **Facebook Page** under Page Tokens. Copy the Page Access Token.</li>
                            </ol>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing' || !pageId || !pageAccessToken}
                            className="font-bold border-slate-300"
                        >
                            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </Button>
                        <Button 
                            onClick={handleSaveSettings}
                            disabled={testStatus !== 'success' || isSavingSettings}
                            className="font-black"
                        >
                            {isSavingSettings ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
