'use client';
import { useState, useMemo } from 'react';
import { Search, X, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ServiceCheckoutForm from '@/components/checkout/ServiceCheckoutForm';
import { cn } from '@/lib/utils';
import AnimatedSection from './AnimatedSection';
import { Service } from '@/lib/types';

export type Category = {
  id: string;
  name: string;
  description?: string;
  order?: number;
  data?: Service[];
};

interface PartnerServicesListProps {
  categories: Category[];
  services: Service[];
  mostPopularId: string | null;
  slug: string;
  partnerId: string;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

export default function PartnerServicesList({ categories, services, mostPopularId, slug, partnerId }: PartnerServicesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredCategories = useMemo(() => {
    let filteredCats = categories.slice();
    
    if (activeCategory !== 'all') {
      filteredCats = filteredCats.filter(c => c.name === activeCategory);
    }

    const q = searchQuery.toLowerCase().trim();
    return filteredCats
      .map(category => {
        const filteredData = services.filter(s => {
          const thisCategoryMatch = s.category === category.name;
          const searchMatches = !q || 
            s.title.toLowerCase().includes(q) || 
            (s.description || '').toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q);
          return thisCategoryMatch && searchMatches;
        });
        
        return {
          ...category,
          data: filteredData
        };
      })
      .filter(c => c.data.length > 0);
  }, [categories, services, searchQuery, activeCategory]);

  const scrollToSection = (categoryName: string) => {
    setActiveCategory(categoryName);
    if (categoryName !== 'all') {
      // Small timeout to allow render before scroll
      setTimeout(() => {
        const el = document.getElementById(`category-${categoryName.replace(/\s+/g, '-')}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  return (
    <>
      {/* SEARCH + CATEGORY FILTER */}
      <div className="flex flex-col gap-5 mb-12">
        {/* Search Bar */}
        <div className="max-w-md mx-auto w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 partner-text-main opacity-60" />
            </div>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search for tax clearance, VAT, registration..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory('all'); }}
              className="block w-full pl-10 pr-10 py-3 border partner-border opacity-30 rounded-xl partner-page-bg placeholder:partner-text-main opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm font-medium partner-text-main transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                suppressHydrationWarning
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center partner-text-main opacity-60 hover:partner-text-main opacity-70 transition-colors"
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
              suppressHydrationWarning
              onClick={() => scrollToSection('all')}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200",
                activeCategory === 'all'
                  ? "partner-btn shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground shadow-sm"
              )}
            >
              All Services
            </button>
            {categories.slice().map(cat => (
              <button
                suppressHydrationWarning
                key={cat.id}
                onClick={() => scrollToSection(cat.name)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200",
                  activeCategory === cat.name
                    ? "partner-btn shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground shadow-sm"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 space-y-20">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 partner-text-main opacity-70 font-medium">
                No services found matching your search.
            </div>
          ) : (
            filteredCategories.map((category) => (
              <AnimatedSection key={category.id} className="space-y-12">
                  <div id={`category-${category.name.replace(/\s+/g, '-')}`} className="text-center space-y-4 max-w-2xl mx-auto scroll-m-24">
                      <h3 className="text-3xl md:text-4xl font-black tracking-tight partner-text-main">{category.name}</h3>
                      {category.description && (
                          <p className="text-lg partner-text-main opacity-70 max-w-2xl mx-auto leading-relaxed">
                              {category.description}
                          </p>
                      )}
                      <div className="w-16 mx-auto partner-border border-b-2 opacity-30" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {category.data.map((service: Service) => {
                          const isPopular = service.id === mostPopularId;
                          return (
                              <Card key={service.id} className={cn(
                                "flex flex-col group hover:shadow-xl transition-all duration-300 partner-card shadow-sm hover:scale-[1.02] relative",
                                isPopular && "ring-2 ring-primary/30 shadow-md"
                              )}>
                                {/* Most Popular Badge */}
                                {isPopular && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                    <span className="partner-btn px-4 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md whitespace-nowrap">
                                      ⭐ Most Popular
                                    </span>
                                  </div>
                                )}
                                <CardHeader className={cn("space-y-2 pb-4", isPopular && "pt-8")}>
                                    <CardTitle className="text-2xl font-bold leading-tight group-hover:partner-text transition-colors">
                                        {service.title}
                                    </CardTitle>
                                    <div className="space-y-1">
                                        {service.isPriceTbc ? (
                                            <span className="text-xl font-bold opacity-50 block">Price on Request</span>
                                        ) : (
                                            <span className="text-2xl font-bold partner-text block">
                                                {formatPrice(service.price)}
                                            </span>
                                        )}
                                        <div className="flex items-center text-xs opacity-70 font-medium">
                                            <Clock className="h-4 w-4 mr-1.5 opacity-70 partner-icon" />
                                            {service.turnaroundTime}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-6 pt-2">
                                    <p className="text-sm opacity-80 leading-relaxed line-clamp-3">
                                        {service.description}
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-0 flex gap-2">
                                    <a href={`/p/${slug}/products/${service.slug}`} className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm h-11 px-4 py-2 border border-border bg-background hover:bg-muted text-foreground">
                                        Learn More
                                    </a>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button suppressHydrationWarning className="flex-1 partner-btn inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow h-11 px-4 py-2">
                                                Buy Now <ArrowRight className="ml-2 h-4 w-4" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Order {service.title}</DialogTitle>
                                            </DialogHeader>
                                            <div className="mt-4">
                                                <ServiceCheckoutForm service={service} partnerId={partnerId} />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardFooter>
                            </Card>
                          );
                      })}
                  </div>
              </AnimatedSection>
            ))
          )}
      </div>
    </>
  );
}
