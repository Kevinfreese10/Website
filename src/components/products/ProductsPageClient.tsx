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
          const categoryMatches = activeCategory === 'all' || s.category === category.name;
          const thisCategoryMatch = s.category === category.name;
          const searchMatches = !q || 
            s.title.toLowerCase().includes(q) || 
            s.description.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q);
          return thisCategoryMatch && categoryMatches && searchMatches;
        });
        return {
          ...category,
          data: filteredData
        };
      })
      .filter(c => c.data.length > 0);
  }, [categories, services, searchQuery, activeCategory]);


  return (
    <div className="w-full bg-white flex flex-col min-h-screen animate-in fade-in">
      {/* RICH HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-slate-50 border-b pt-12 pb-16 text-center mb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider">Service Catalog</Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
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

      <section className="py-12 bg-white border-y mb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-black md:text-4xl uppercase tracking-tighter text-slate-900">How Our Online Accounting Process Works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps to full compliance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            {[
              { step: "01", title: "Choose Your Service", desc: "Browse our online store and select the accounting, tax, or compliance service your business requires.", icon: ShoppingCart },
              { step: "02", title: "Upload Your Documents", desc: "Securely upload your supporting documents through our online platform.", icon: FileUp },
              { step: "03", title: "We Process Your Application", desc: "Our team handles the accounting, SARS, CIPC, or compliance process on your behalf.", icon: RefreshCw },
              { step: "04", title: "Receive Confirmation & Support", desc: "We provide updates, confirmations, and ongoing support throughout the process.", icon: CheckCircle2 }
            ].map((step, idx) => (
              <div key={idx} className="relative text-center space-y-6 group">
                <div className="h-20 w-20 rounded-3xl bg-slate-50 text-primary flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-md border border-primary/5">
                  <step.icon className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none block mb-1">Step {step.step}</span>
                  <h3 className="font-bold text-xl leading-tight text-slate-900">{step.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">{step.desc}</p>
                {idx < 3 && <ArrowRight className="hidden lg:block absolute -right-6 top-10 h-8 w-8 text-primary/10" />}
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
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search for tax clearance, VAT, registration..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory('all'); }}
              className="block w-full pl-11 pr-10 py-3 border border-slate-200 rounded-2xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-sm font-medium text-slate-800 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-2 justify-center animate-in fade-in duration-300">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-200",
                activeCategory === 'all'
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary"
              )}
            >
              All Services
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-200",
                  activeCategory === cat.name
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary"
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
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
            categorizedServices.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <p className="text-slate-500 font-medium text-lg">No services found matching &ldquo;{searchQuery}&rdquo;</p>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="rounded-xl font-semibold">
                        Clear Search
                    </Button>
                </div>
            ) : (
                categorizedServices.map(category => (
                <section key={category.id} id={category.name.toLowerCase().replace(/ /g, '-')} className="scroll-m-20">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-2xl font-black text-slate-900">{category.name}</h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{category.data.length} service{category.data.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.data.map(service => (
                    <Card
                    key={service.id}
                    className={cn(
                      "flex flex-col overflow-hidden transition-all duration-300 bg-slate-50 border border-slate-200 group",
                      "hover:shadow-xl hover:-translate-y-1 hover:border-primary/40",
                      service.isFeatured && "ring-2 ring-primary/30 border-primary/20"
                    )}
                    >
                    <CardHeader className="pb-3 relative">
                        {/* Featured / Popular badge */}
                        {service.isFeatured && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider border border-amber-200">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Popular
                            </span>
                          </div>
                        )}

                        {/* Category chip */}
                        <Badge variant="secondary" className="w-fit text-[10px] uppercase tracking-wider mb-2 font-bold">
                          {service.category}
                        </Badge>

                        <CardTitle className="leading-snug text-slate-900 text-base font-extrabold pr-14">
                          {service.title}
                        </CardTitle>

                        {/* Price + Turnaround row */}
                        <div className="flex items-center justify-between mt-2">
                          {service.isPriceTbc ? (
                            <p className="text-base font-bold text-muted-foreground">Price on Request</p>
                          ) : (
                            <p className="text-2xl font-black text-primary leading-none">{formatPrice(service.price)}</p>
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
                        {/* Add to Cart */}
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
                        {/* View Details */}
                        <Button
                          asChild
                          size="sm"
                          variant={service.isPriceTbc ? "default" : "outline"}
                          className={cn(
                            "font-bold h-9 text-xs gap-1 transition-all",
                            service.isPriceTbc ? "flex-1" : "flex-none px-3"
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
            )))
        )}
      </div>
    </div>
  </div>
  );
}
