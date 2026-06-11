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

// Rotating accent colours per category index
const CATEGORY_ACCENTS = [
  { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200',   ring: 'hover:border-blue-400',   price: 'text-blue-600' },
  { bar: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-200', ring: 'hover:border-violet-400', price: 'text-violet-600' },
  { bar: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'hover:border-emerald-400', price: 'text-emerald-600' },
  { bar: 'bg-rose-500',   badge: 'bg-rose-50 text-rose-700 border-rose-200',   ring: 'hover:border-rose-400',   price: 'text-rose-600' },
  { bar: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200', ring: 'hover:border-amber-400', price: 'text-amber-600' },
  { bar: 'bg-cyan-500',   badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',   ring: 'hover:border-cyan-400',   price: 'text-cyan-600' },
  { bar: 'bg-pink-500',   badge: 'bg-pink-50 text-pink-700 border-pink-200',   ring: 'hover:border-pink-400',   price: 'text-pink-600' },
  { bar: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', ring: 'hover:border-indigo-400', price: 'text-indigo-600' },
  { bar: 'bg-teal-500',   badge: 'bg-teal-50 text-teal-700 border-teal-200',   ring: 'hover:border-teal-400',   price: 'text-teal-600' },
  { bar: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', ring: 'hover:border-orange-400', price: 'text-orange-600' },
];

const SECTION_GRADIENTS = [
  'from-blue-50/60 to-transparent',
  'from-violet-50/60 to-transparent',
  'from-emerald-50/60 to-transparent',
  'from-rose-50/60 to-transparent',
  'from-amber-50/60 to-transparent',
  'from-cyan-50/60 to-transparent',
  'from-pink-50/60 to-transparent',
  'from-indigo-50/60 to-transparent',
  'from-teal-50/60 to-transparent',
  'from-orange-50/60 to-transparent',
];

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
    }
  }, []);
  
  const categorizedServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories
      .map(category => {
        const filteredData = services.filter(s => {
          const thisCategoryMatch = s.category === category.name;
          const searchMatches = !q || 
            s.title.toLowerCase().includes(q) || 
            s.description.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q);
          return thisCategoryMatch && searchMatches;
        });
        return { ...category, data: filteredData };
      })
      .filter(c => c.data.length > 0);
  }, [categories, services, searchQuery]);

  return (
    <div className="w-full flex flex-col min-h-screen animate-in fade-in bg-white">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden pt-16 pb-20 text-center">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute top-10 right-0 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-2xl" />
        </div>

        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center gap-1.5 mb-5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Service Catalog
          </div>
          <h1 className="mb-5 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl leading-tight">
            Professional Services<br />
            <span className="text-gradient">Built for South Africa</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-slate-500 md:text-xl leading-relaxed">
            Accounting, taxation, company registration, and compliance — all in one place, handled by experts.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            {[
              { value: '500+', label: 'Clients Served' },
              { value: '4.9★', label: 'Average Rating' },
              { value: '48h', label: 'Avg. Turnaround' },
              { value: '100%', label: 'SARS Compliant' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-2xl font-black text-primary leading-none">{stat.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST WIDGET ─────────────────────────────────────── */}
      <div className="text-center mb-2 animate-in fade-in">
        <TrustIndexWidget />
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-16 mb-4">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-black md:text-4xl tracking-tight text-slate-900">How It Works</h2>
            <p className="text-slate-400 text-base font-medium">Four simple steps to full compliance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { step: '01', title: 'Choose a Service', desc: 'Browse the catalog and pick the service your business needs.', icon: ShoppingCart, color: 'bg-blue-500' },
              { step: '02', title: 'Upload Documents', desc: 'Securely share your supporting documents through our platform.', icon: FileUp, color: 'bg-violet-500' },
              { step: '03', title: 'We Handle It', desc: 'Our team processes everything with SARS, CIPC, or the relevant authority.', icon: RefreshCw, color: 'bg-emerald-500' },
              { step: '04', title: 'Done & Supported', desc: 'Receive your confirmation and ongoing support.', icon: CheckCircle2, color: 'bg-amber-500' },
            ].map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center group">
                <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg text-white transition-transform duration-300 group-hover:-translate-y-1', step.color)}>
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                  <span className="text-[9px] font-black text-slate-500">{step.step}</span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                {idx < 3 && <ArrowRight className="hidden lg:block absolute -right-4 top-6 h-6 w-6 text-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16 flex-grow">

        {/* ── SEARCH + TABS ─────────────────────────────────── */}
        <div className="flex flex-col gap-5 mb-12">
          {/* Search */}
          <div className="max-w-lg mx-auto w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search services…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory('all'); }}
                className="block w-full pl-11 pr-10 py-3.5 border border-slate-200 rounded-2xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium text-slate-800 shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-2 justify-center animate-in fade-in duration-300">
              <button
                onClick={() => scrollToSection('all')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-200',
                  activeCategory === 'all'
                    ? 'bg-primary text-white border-primary shadow-md scale-105'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary hover:bg-primary/5'
                )}
              >
                All Services
              </button>
              {categories.map((cat, i) => {
                const accent = CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length];
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToSection(cat.name)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-200',
                      isActive
                        ? `${accent.badge} border-current shadow-md scale-105`
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SERVICE GRID ──────────────────────────────────── */}
        <div className="space-y-16">
          {isLoading && services.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : categorizedServices.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-slate-500 font-medium text-lg">No services found matching &ldquo;{searchQuery}&rdquo;</p>
              <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="rounded-xl font-semibold">
                Clear Search
              </Button>
            </div>
          ) : (
            categorizedServices.map((category, catIdx) => {
              const accent = CATEGORY_ACCENTS[catIdx % CATEGORY_ACCENTS.length];
              const gradient = SECTION_GRADIENTS[catIdx % SECTION_GRADIENTS.length];
              return (
                <section
                  key={category.id}
                  id={category.name.toLowerCase().replace(/ /g, '-')}
                  className={cn('scroll-m-24 rounded-3xl p-6 md:p-8 bg-gradient-to-br border border-white/80 shadow-sm', gradient)}
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-7">
                    <div className={cn('h-1 w-8 rounded-full flex-shrink-0', accent.bar)} />
                    <h2 className="text-xl font-black text-slate-900">{category.name}</h2>
                    <div className="flex-1 h-px bg-slate-200/60" />
                    <span className={cn('text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border', accent.badge)}>
                      {category.data.length} service{category.data.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {category.data.map(service => (
                      <Card
                        key={service.id}
                        className={cn(
                          'flex flex-col overflow-hidden bg-white border border-slate-100 shadow-sm transition-all duration-300 group rounded-2xl',
                          'hover:shadow-xl hover:-translate-y-1',
                          accent.ring,
                          service.isFeatured && 'ring-2 ring-amber-300/50'
                        )}
                      >
                        {/* Coloured accent bar at top */}
                        <div className={cn('h-1 w-full flex-shrink-0', accent.bar)} />

                        <CardHeader className="pb-2 pt-4 relative">
                          {/* Popular badge */}
                          {service.isFeatured && (
                            <div className="absolute top-3 right-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider border border-amber-200">
                                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Popular
                              </span>
                            </div>
                          )}

                          <CardTitle className="leading-snug text-slate-900 text-sm font-extrabold pr-16">
                            {service.title}
                          </CardTitle>

                          {/* Price + Turnaround */}
                          <div className="flex items-center justify-between mt-2">
                            {service.isPriceTbc ? (
                              <p className="text-sm font-bold text-slate-400">Price on Request</p>
                            ) : (
                              <p className={cn('text-2xl font-black leading-none', accent.price)}>{formatPrice(service.price)}</p>
                            )}
                            <div className="flex items-center text-slate-400 gap-1">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-xs font-semibold">{service.turnaroundTime}</span>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-grow pt-0 pb-3">
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{service.description}</p>
                        </CardContent>

                        <CardFooter className="pt-0 pb-4 px-4 flex gap-2">
                          {!service.isPriceTbc && (
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 font-bold gap-1.5 shadow-sm h-9 text-xs"
                              onClick={() => addToCart(service)}
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              Add to Cart
                            </Button>
                          )}
                          <Button
                            asChild
                            size="sm"
                            variant={service.isPriceTbc ? 'default' : 'outline'}
                            className={cn(
                              'font-bold h-9 text-xs gap-1 transition-all',
                              service.isPriceTbc ? 'flex-1' : 'flex-none px-3'
                            )}
                          >
                            <Link href={`/products/${service.slug}`}>
                              {service.isPriceTbc ? 'Get a Quote' : 'Details'}
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
          )}
        </div>
      </div>
    </div>
  );
}
