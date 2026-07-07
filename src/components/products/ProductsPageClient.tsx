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
  Clock, 
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
  FileText,
  Building2,
  Calculator,
  Scale,
  Landmark,
  Receipt,
  Briefcase,
  Shield,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { collection, getFirestore, orderBy, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Service } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const db = getFirestore(firebaseApp);

type Category = { 
    id: string; 
    name: string; 
    description: string; 
    order: number; 
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

// Vibrant colour palette — one per category, cycling if needed
const CATEGORY_PALETTES = [
  {
    stripe: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: 'bg-violet-500/10 text-violet-400',
    heading: 'text-violet-400',
    glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] hover:border-violet-500/30',
  },
  {
    stripe: 'from-cyan-500 to-blue-600',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: 'bg-cyan-500/10 text-cyan-400',
    heading: 'text-cyan-400',
    glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.12)] hover:border-cyan-500/30',
  },
  {
    stripe: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: 'bg-emerald-500/10 text-emerald-400',
    heading: 'text-emerald-400',
    glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.12)] hover:border-emerald-500/30',
  },
  {
    stripe: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: 'bg-amber-500/10 text-amber-400',
    heading: 'text-amber-400',
    glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.12)] hover:border-amber-500/30',
  },
  {
    stripe: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: 'bg-rose-500/10 text-rose-400',
    heading: 'text-rose-400',
    glow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.12)] hover:border-rose-500/30',
  },
  {
    stripe: 'from-indigo-500 to-blue-700',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    icon: 'bg-indigo-500/10 text-indigo-400',
    heading: 'text-indigo-400',
    glow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.12)] hover:border-indigo-500/30',
  },
];

const CATEGORY_ICONS = [BookOpen, Building2, Calculator, Scale, Landmark, Receipt, Briefcase, Shield, TrendingUp, FileText];

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
  const { addToCart } = useCart();

  const scrollToSection = (categoryName: string) => {
    if (categoryName === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveCategory('all');
      return;
    }
    const id = categoryName.toLowerCase().replace(/ /g, '-');
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
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
    };
  }, []);
  
  const categorizedServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories
      .map((category, idx) => {
        const filteredData = services.filter(s => {
          const thisCategoryMatch = s.category === category.name;
          const searchMatches = !q || 
            s.title.toLowerCase().includes(q) || 
            s.description.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q);
          return thisCategoryMatch && searchMatches;
        });
        return {
          ...category,
          data: filteredData,
          palette: CATEGORY_PALETTES[idx % CATEGORY_PALETTES.length],
          Icon: CATEGORY_ICONS[idx % CATEGORY_ICONS.length],
        };
      })
      .filter(c => c.data.length > 0);
  }, [categories, services, searchQuery]);

  return (
    <div className="w-full bg-background flex flex-col min-h-screen animate-in fade-in">

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-background pt-12 pb-16 text-center mb-12">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4 max-w-4xl">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider bg-primary/10 text-primary border-primary/20 neon-border">
            <Sparkles className="h-3 w-3 mr-1" />
            Service Catalog
          </Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl font-headline">
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

        {/* HOW IT WORKS */}
        <section className="py-12 bg-secondary/30 mb-12 rounded-3xl glass-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-black md:text-4xl uppercase tracking-tighter text-foreground font-headline">How Our Online Accounting Process Works</h2>
              <p className="text-muted-foreground text-lg">Four simple steps to full compliance.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
              {[
                { step: "01", title: "Choose Your Service", desc: "Browse our online store and select the accounting, tax, or compliance service your business requires.", icon: ShoppingCart, bg: "bg-amber-50/80 border-amber-200/60 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400", textColor: "text-amber-600 dark:text-amber-400" },
                { step: "02", title: "Upload Your Documents", desc: "Securely upload your supporting documents through our online platform.", icon: FileUp, bg: "bg-blue-50/80 border-blue-200/60 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400", textColor: "text-blue-600 dark:text-blue-400" },
                { step: "03", title: "We Process Your Application", desc: "Our team handles the accounting, SARS, CIPC, or compliance process on your behalf.", icon: RefreshCw, bg: "bg-purple-50/80 border-purple-200/60 text-purple-600 dark:bg-purple-950/20 dark:border-purple-900/30 dark:text-purple-400", textColor: "text-purple-600 dark:text-purple-400" },
                { step: "04", title: "Receive Confirmation & Support", desc: "We provide updates, confirmations, and ongoing support throughout the process.", icon: CheckCircle2, bg: "bg-emerald-50/80 border-emerald-200/60 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400", textColor: "text-emerald-600 dark:text-emerald-400" }
              ].map((step, idx) => (
                <div key={idx} className="relative text-center space-y-6 group">
                  <div className={cn("h-20 w-20 rounded-3xl border flex items-center justify-center mx-auto mb-6 shadow-sm transition-all duration-300 group-hover:scale-105", step.bg)}>
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
          <div className="max-w-md mx-auto w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <input
                type="text"
                placeholder="Search for tax clearance, VAT, registration..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory('all'); }}
                className="block w-full pl-11 pr-10 py-3 border border-white/10 rounded-2xl bg-white/[0.04] backdrop-blur-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 focus:bg-white/[0.06] text-sm font-medium text-foreground shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {!searchQuery && (
            <div className="flex flex-wrap gap-2 justify-center animate-in fade-in duration-300">
              <button
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
              {categorizedServices.map(cat => (
                <button
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

        {/* SERVICE GRID */}
        <div className="space-y-16">
          {isLoading && services.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            categorizedServices.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="text-muted-foreground font-medium text-lg">No services found matching &ldquo;{searchQuery}&rdquo;</p>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="rounded-xl font-semibold border-white/10 hover:border-primary/30">
                  Clear Search
                </Button>
              </div>
            ) : (
              categorizedServices.map(category => {
                const { palette, Icon } = category;
                return (
                  <section key={category.id} id={category.name.toLowerCase().replace(/ /g, '-')} className="scroll-m-20">

                    {/* Category heading — coloured icon + heading + gradient rule */}
                    <div className="flex items-center gap-3 mb-8">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", palette.icon)}>
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <h2 className={cn("text-2xl font-black shrink-0", palette.heading)}>{category.name}</h2>
                      <div className={cn("flex-1 h-px bg-gradient-to-r to-transparent", palette.stripe)} style={{ opacity: 0.25 }} />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">{category.data.length} service{category.data.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {category.data.map(service => (
                        <Card
                          key={service.id}
                          className={cn(
                            "flex flex-col overflow-hidden transition-all duration-300 glass-card border border-white/[0.06] group relative",
                            palette.glow,
                            "hover:-translate-y-1",
                            service.isFeatured && "ring-2 ring-primary/20 border-primary/15 neon-glow"
                          )}
                        >
                          {/* Top colour stripe */}
                          <div className={cn("h-1 w-full bg-gradient-to-r shrink-0", palette.stripe)} />

                          <CardHeader className="pb-3 relative">
                            {service.isFeatured && (
                              <div className="absolute top-3 right-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/20">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> Popular
                                </span>
                              </div>
                            )}

                            {/* Coloured category chip */}
                            <Badge variant="secondary" className={cn("w-fit text-[10px] uppercase tracking-wider mb-2 font-bold border", palette.badge)}>
                              {service.category}
                            </Badge>

                            <CardTitle className="leading-snug text-foreground text-base font-extrabold pr-14">
                              {service.title}
                            </CardTitle>

                            <div className="flex items-center justify-between mt-2">
                              {service.isPriceTbc ? (
                                <p className="text-base font-bold text-muted-foreground">Price on Request</p>
                              ) : (
                                <p className="text-2xl font-black text-gradient leading-none">{formatPrice(service.price)}</p>
                              )}
                              <div className="flex items-center text-muted-foreground gap-1">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs font-semibold">{service.turnaroundTime}</span>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="flex-grow pt-0 pb-3">
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{service.description}</p>
                          </CardContent>

                          <CardFooter className="pt-0 pb-4 flex gap-2">
                            {!service.isPriceTbc && (
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1 font-bold gap-1.5 shadow-sm h-9 text-xs bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300"
                                onClick={() => addToCart(service)}
                              >
                                <ShoppingBag className="h-3.5 w-3.5" />
                                Add to Cart
                              </Button>
                            )}
                            <Button
                              asChild
                              size="sm"
                              variant={service.isPriceTbc ? "default" : "outline"}
                              className={cn(
                                "font-bold h-9 text-xs gap-1 transition-all",
                                service.isPriceTbc 
                                  ? "flex-1 bg-gradient hover:opacity-90 text-white neon-glow" 
                                  : "flex-none px-3 border-white/10 hover:border-primary/30 hover:text-primary text-foreground"
                              )}
                            >
                              <Link href={`/products/${service.slug}`}>
                                {service.isPriceTbc ? "Get a Quote" : "Details"}
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </section>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
}
