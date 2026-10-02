'use client';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  Loader2, 
  CheckCircle2,
  ArrowRight, 
  ShoppingCart, 
  FileUp, 
  RefreshCw,
  Search,
  X,
  Star,
  ShoppingBag,
  Sparkles,
  Globe,
  Heart
} from 'lucide-react';
import { collection, getFirestore, orderBy, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Service } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Badge } from '@/components/ui/badge';
import { useWishlist } from '@/contexts/WishlistContext';
import { cn, formatPrice } from '@/lib/utils';
import { getCategorySlugByName } from '@/lib/categories';

const db = getFirestore(firebaseApp);

type Category = { 
    id: string; 
    name: string; 
    description: string; 
    order: number; 
};

const getCategoryStyle = (category: string) => {
  if (category.includes('SARS')) return { badge: 'bg-white text-emerald-700 border-emerald-200/80 shadow-2xs', dot: 'bg-emerald-500' };
  if (category.includes('CIPC') || category.includes('Compliance')) return { badge: 'bg-white text-purple-700 border-purple-200/80 shadow-2xs', dot: 'bg-purple-500' };
  if (category.includes('Payroll') || category.includes('UIF') || category.includes('COIDA')) return { badge: 'bg-white text-amber-700 border-amber-200/80 shadow-2xs', dot: 'bg-amber-500' };
  if (category.includes('Entity') || category.includes('Company')) return { badge: 'bg-white text-blue-700 border-blue-200/80 shadow-2xs', dot: 'bg-blue-600' };
  if (category.includes('Licence') || category.includes('Permit')) return { badge: 'bg-white text-indigo-700 border-indigo-200/80 shadow-2xs', dot: 'bg-indigo-600' };
  return { badge: 'bg-white text-slate-700 border-slate-200/80 shadow-2xs', dot: 'bg-slate-500' };
};

export default function ProductsPageClient({ 
    initialServices = [], 
    initialCategories = [] 
}: { 
    initialServices?: Service[], 
    initialCategories?: Category[] 
}) {
   const [services, setServices] = useState<Service[]>(initialServices);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(initialServices.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToSection = (categoryName: string) => {
    if (categoryName === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveCategory('all');
      return;
    }
    const id = categoryName.toLowerCase().replace(/ /g, '-');
    const el = document.getElementById(id);
    if (el) {
      const offset = 100; // account for sticky header
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setActiveCategory(categoryName);
  };

  useEffect(() => {
    const servicesUnsubscribe = onSnapshot(query(collection(db, 'services'), orderBy('title')), (snapshot) => {
        const fetchedServices = snapshot.docs.map(doc => {
            const data = doc.data();
            const serviceData = { ...data, id: doc.id } as any;
            if (data.createdAt && data.createdAt instanceof Timestamp) {
                serviceData.createdAt = data.createdAt.toDate().toISOString();
            }
            return serviceData as Service;
        });
        setServices(fetchedServices);
        setIsLoading(false);
    });

    const categoriesUnsubscribe = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
        const fetchedCategories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
        setCategories(fetchedCategories);
    });

    return () => {
        servicesUnsubscribe();
        categoriesUnsubscribe();
    }
  }, []);
  
  const categorizedServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const stopWords = new Set(["i", "want", "to", "a", "the", "an", "my", "need", "for", "with", "of", "and", "in", "on", "do", "get", "help", "me", "am", "is", "are", "can", "you", "please"]);
    const tokens = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

    if (!q) {
      return categories.map(c => ({
        ...c,
        data: services.filter(s => s.category === c.name)
      })).filter(c => c.data.length > 0);
    }

    const scoredServices = services.map(s => {
      const searchableText = [
        s.title,
        s.description,
        s.category,
        ...(s.metaKeywords || []),
        ...(s.whatsIncluded || [])
      ].join(" ").toLowerCase();

      let score = 0;
      let matchedTokensCount = 0;

      // 1. Exact phrase match
      if (searchableText.includes(q)) {
          score += 20;
      }

      // 2. Token match
      tokens.forEach(token => {
         if (searchableText.includes(token)) {
             matchedTokensCount++;
             score += 1;
             if (s.title.toLowerCase().includes(token)) score += 3;
         }
      });

      return { service: s, score, matchedTokensCount };
    }).filter(item => item.matchedTokensCount > 0 || item.score > 0);

    // Sort by relevance score
    scoredServices.sort((a, b) => b.score - a.score);

    const bestMatches: Service[] = [];
    const relatedMatches: Service[] = [];

    scoredServices.forEach(item => {
        // A Best Match must either hit the exact phrase OR match all/most of the tokens.
        const isBestMatch = 
             item.score >= 20 || 
             (tokens.length <= 2 ? item.matchedTokensCount === tokens.length : item.matchedTokensCount >= tokens.length - 1);
             
        if (isBestMatch) {
            bestMatches.push(item.service);
        } else {
            relatedMatches.push(item.service);
        }
    });

    const results = [];
    
    if (bestMatches.length > 0) {
      results.push({
        id: 'best-matches',
        name: 'Best Matches',
        description: '',
        order: 0,
        data: bestMatches
      });
    }
    
    if (relatedMatches.length > 0) {
      results.push({
        id: 'related-services',
        name: 'Related Services',
        description: '',
        order: 1,
        data: relatedMatches
      });
    }

    return results;
  }, [categories, services, searchQuery]);


  return (
    <div className="w-full bg-background flex flex-col min-h-screen animate-in fade-in">
      {/* RICH HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-background border-white/[0.06] pt-12 pb-16 text-center mb-12">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[400px] h-[400px] -top-32 -left-32 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[350px] h-[350px] top-10 right-[-80px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4 max-w-4xl">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider bg-primary/10 text-primary border-primary/20 neon-border">
            <Sparkles className="h-3 w-3 mr-1" />
            Service Catalog
          </Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl font-headline text-hero-gradient pb-2">
            Our Professional <span className="text-gradient">Services &amp; Solutions</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            Explore our comprehensive range of accounting, taxation, company registration, and compliance solutions tailored for South African businesses, entrepreneurs, and individuals.
          </p>
        </div>
      </section>

      <div className="text-center mb-8 animate-in fade-in">
        <TrustIndexWidget />
      </div>
      
      <div className="container mx-auto px-4 pb-12 flex-grow">

      <section className="py-12 bg-secondary/30 border-white/[0.06] mb-12 rounded-xl glass-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-black md:text-4xl uppercase tracking-tighter text-foreground font-headline">How Our Online Accounting Process Works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps to full compliance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            {[
              { 
                step: "01", 
                title: "Choose Your Service", 
                desc: "Browse our online store and select the accounting, tax, or compliance service your business requires.", 
                icon: ShoppingCart, 
                bg: "bg-amber-50/80 border-amber-200/60 text-amber-600",
                textColor: "text-amber-600"
              },
              { 
                step: "02", 
                title: "Upload Your Documents", 
                desc: "Securely upload your supporting documents through our online platform.", 
                icon: FileUp, 
                bg: "bg-blue-50/80 border-blue-200/60 text-blue-600",
                textColor: "text-blue-600"
              },
              { 
                step: "03", 
                title: "We Process Your Application", 
                desc: "Our team handles the accounting, SARS, CIPC, or compliance process on your behalf.", 
                icon: RefreshCw, 
                bg: "bg-purple-50/80 border-purple-200/60 text-purple-600",
                textColor: "text-purple-600"
              },
              { 
                step: "04", 
                title: "Receive Confirmation & Support", 
                desc: "We provide updates, confirmations, and ongoing support throughout the process.", 
                icon: CheckCircle2, 
                bg: "bg-emerald-50/80 border-emerald-200/60 text-emerald-600",
                textColor: "text-emerald-600"
              }
            ].map((step, idx) => (
              <div key={idx} className="relative text-center space-y-6 group">
                <div className={cn("h-20 w-20 rounded-xl border flex items-center justify-center mx-auto mb-6 shadow-sm transition-all duration-300 group-hover:scale-105", step.bg)}>
                  <step.icon className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none block mb-1", step.textColor)}>Step {step.step}</span>
                  <h3 className="font-bold text-xl leading-tight text-foreground">{step.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">{step.desc}</p>
                {idx < 3 && <ArrowRight className="hidden lg:block absolute -right-6 top-10 h-8 w-8 text-muted-foreground/20" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEARCH + CATEGORY FILTER */}
      <div className="flex flex-col gap-4 mb-10">
        {/* Search Bar */}
        <div className="max-w-md mx-auto w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="E.g. 'I need to submit a provisional return' or 'Register a company'..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory('all'); }}
              className="block w-full pl-11 pr-10 py-3 border border-input rounded-xl bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium text-foreground shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                suppressHydrationWarning
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs — scroll to section */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-2 justify-center animate-in fade-in duration-300">
            <button
              suppressHydrationWarning
              onClick={() => scrollToSection('all')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-200",
                activeCategory === 'all'
                  ? "bg-gradient text-white border-primary/30 shadow-md neon-glow"
                  : "bg-white/[0.04] text-muted-foreground border-white/10 hover:border-primary/30 hover:text-primary"
              )}
            >
              All Services
            </button>
            {categories.map(cat => (
              <button
                suppressHydrationWarning
                key={cat.id}
                onClick={() => scrollToSection(cat.name)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-200",
                  activeCategory === cat.name
                    ? "bg-gradient text-white border-primary/30 shadow-md neon-glow"
                    : "bg-white/[0.04] text-muted-foreground border-white/10 hover:border-primary/30 hover:text-primary"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
 
      <div className="space-y-14">
        {isLoading && services.length === 0 ? (
            <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-40"><Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
        ) : (
            categorizedServices.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <p className="text-muted-foreground font-medium text-lg">No services found matching &ldquo;{searchQuery}&rdquo;</p>
                    <Button variant="outline" size="sm" suppressHydrationWarning onClick={() => setSearchQuery("")} className="rounded-xl font-semibold border-white/10 hover:border-primary/30">
                        Clear Search
                    </Button>
                </div>
            ) : (
                categorizedServices.map(category => (
                <section key={category.id} id={category.name.toLowerCase().replace(/ /g, '-')} className="scroll-m-20">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-foreground">{category.name}</h2>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">({category.data.length} service{category.data.length !== 1 ? 's' : ''})</span>
                      </div>
                      <Link
                        href={`/products/category/${getCategorySlugByName(category.name)}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors group/link"
                      >
                        <span>View All {category.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.data.map(service => (
                    <Card
                    key={service.id}
                    className={cn(
                      "flex flex-col overflow-hidden transition-all duration-500 border border-blue-200/90 bg-[#f4f8ff] group",
                      "shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_-4px_rgba(0,0,0,0.10)] hover:-translate-y-1.5 hover:border-primary/40",
                      service.isFeatured && "ring-2 ring-primary/20 border-primary/30 neon-glow"
                    )}
                    >
                    {/* Card header: badge row + title + stars + price/turnaround */}
                    <CardHeader className="pb-0 pt-5 px-5 relative">
                        {/* Featured / Popular badge */}
                        {service.isFeatured && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/20">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Popular
                            </span>
                          </div>
                        )}

                        {/* Category chip & Wishlist */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={cn("w-fit text-[9px] uppercase tracking-wider font-extrabold rounded-full px-2.5 py-0.5 flex items-center border", getCategoryStyle(service.category).badge)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse", getCategoryStyle(service.category).dot)} />
                              {service.category}
                            </Badge>
                            {(service.title.toLowerCase().includes('foreign') || service.title.toLowerCase().includes('external')) && (
                              <Badge variant="outline" className="w-fit text-[9px] uppercase tracking-wider font-extrabold rounded-md px-2 py-0.5 flex items-center bg-white text-slate-700 border-slate-200/80 shadow-2xs">
                                <Globe className="h-2.5 w-2.5 mr-1 text-slate-500" />
                                Foreign Entity
                              </Badge>
                            )}
                          </div>

                          <button
                            suppressHydrationWarning
                            onClick={(e) => {
                              e.preventDefault();
                              isInWishlist(service.id) ? removeFromWishlist(service.id) : addToWishlist(service);
                            }}
                            className="p-1.5 hover:bg-blue-100/60 rounded-full transition-colors group/heart"
                            aria-label="Save for later"
                          >
                            <Heart className={cn("h-4 w-4 transition-all duration-300", mounted && isInWishlist(service.id) ? "fill-rose-500 text-rose-500" : "text-slate-400 group-hover/heart:text-rose-400")} />
                          </button>
                        </div>

                        {/* Title */}
                        <CardTitle className="leading-snug text-slate-800 text-[16px] font-black group-hover:text-primary transition-colors duration-300 pr-2 mb-1.5">
                          <Link href={`/products/${service.slug}`} className="hover:underline line-clamp-2">
                            {service.title}
                          </Link>
                        </CardTitle>

                        {/* Stars */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <div className="flex items-center text-amber-400">
                            <Star className="h-3 w-3 fill-amber-400" />
                            <Star className="h-3 w-3 fill-amber-400" />
                            <Star className="h-3 w-3 fill-amber-400" />
                            <Star className="h-3 w-3 fill-amber-400" />
                            <Star className="h-3 w-3 fill-amber-400" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {service.aggregateRatingValue || "5.0"} ({service.reviewCount || "120+"})
                          </span>
                        </div>

                        {/* Price + Turnaround — separated by a subtle divider */}
                        <div className="flex items-center justify-between py-3 border-t border-blue-100/80">
                          <div>
                            {service.isPriceTbc ? (
                              <span className="text-lg font-black text-slate-800 leading-none">Price on Request</span>
                            ) : (
                              <span className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                                {formatPrice(service.price)}
                              </span>
                            )}
                          </div>
                          {/* Turnaround Time */}
                          <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg px-2.5 py-1.5">
                            <CalendarDays className="h-3 w-3 text-emerald-600 flex-none" />
                            <span className="text-[10px] font-bold text-emerald-700">{service.turnaroundTime}</span>
                          </div>
                        </div>
                    </CardHeader>

                    {/* Product Description */}
                    <CardContent className="flex-grow pt-0 pb-3 px-5">
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {service.description || (service.whatsIncluded && service.whatsIncluded.length > 0 ? service.whatsIncluded.join('. ') : '')}
                      </p>
                    </CardContent>

                    {/* Footer button */}
                    <CardFooter className="pt-2 pb-5 px-5">
                        <Button
                          asChild
                          size="sm"
                          variant="default"
                          className="w-full font-bold h-10 text-xs rounded-xl shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Link href={`/products/${service.slug}`} className="group/btn flex items-center justify-center gap-1.5">
                            {service.isPriceTbc ? "Get a Quote" : "View Service & Prerequisites"}
                            <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Link>
                        </Button>
                    </CardFooter>
                    </Card>
                ))}
                </div>
            </section>
            )))
        )}

        {/* SPECIALIST & QUOTE-BASED SERVICES */}
        <section className="mt-16 bg-card/40 border border-border/40 rounded-xl p-8 glass-card">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-2xl font-black md:text-3xl tracking-tighter text-foreground font-headline">Specialist & Complex Cases</h2>
            <p className="text-muted-foreground">Expert negotiation and compliance services available on a bespoke, quote-based model.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "SARS Compromise", desc: "Negotiate outstanding tax debts", href: "/sars-compromise" },
              { title: "SARS Disputes", desc: "Resolve disputes and audits", href: "/sars-disputes" },
              { title: "Remission of Fines", desc: "Apply for penalty waivers", href: "/remission-of-fines" },
              { title: "Liquidations", desc: "Corporate liquidation services", href: "/liquidations" }
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-border/40 p-6 flex flex-col items-center text-center space-y-4 hover:border-primary/30 transition-colors bg-background">
                <h3 className="font-bold text-foreground text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground flex-grow">{s.desc}</p>
                <Button asChild variant="outline" className="w-full font-bold">
                  <Link href={s.href}>Learn More</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  </div>
  );
}
