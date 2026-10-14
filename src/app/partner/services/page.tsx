'use client';

import { useState, useEffect, useMemo } from 'react';
import { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Search,
  PlusCircle,
  Sparkles,
  FileText,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { usePartner } from '@/contexts/PartnerContext';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { getPartnerServicePrice } from '@/lib/partner-pricing';
import CreatePartnerOrderForm from '@/components/partner/CreatePartnerOrderForm';

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);

export default function PartnerServicesCatalogPage() {
  const { tier, tierPlan, discountPercent } = usePartner();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedServiceForDetails, setSelectedServiceForDetails] =
    useState<Service | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'services'), orderBy('title'));
        const snap = await getDocs(q);
        const fetched = snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as Service))
          .filter((s) => s.price > 0 && !s.isPriceTbc);
        setServices(fetched);
      } catch (err) {
        console.error('Error loading services:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          s.title.toLowerCase().includes(term) ||
          (s.category || '').toLowerCase().includes(term) ||
          (s.description || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [services, selectedCategory, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-2xl">
                Wholesale Back-Office Service Catalog
              </CardTitle>
              <Badge variant="default" className="font-bold">
                {tierPlan.name} Tier ({discountPercent}% Off)
              </Badge>
            </div>
            <CardDescription className="max-w-2xl">
              Order any statutory, CIPC, SARS, COIDA, NCR, or accounting service at your{' '}
              <strong>{discountPercent}% wholesale discount</strong>. You bill your client your own retail fee — we fulfill the work behind the scenes and communicate strictly with you.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {tier !== 'enterprise' && (
              <Button variant="outline" size="sm" asChild className="font-semibold">
                <Link href="/partner/settings">
                  <Sparkles className="mr-1.5 h-4 w-4 text-primary" />
                  {tier === 'starter'
                    ? 'Upgrade for 30%–50% Off'
                    : 'Upgrade to Enterprise (50% Off)'}
                </Link>
              </Button>
            )}
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Back-Office Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>New Back-Office Order</DialogTitle>
                  <DialogDescription>
                    Place a wholesale order at your {discountPercent}% partner discount.
                  </DialogDescription>
                </DialogHeader>
                <CreatePartnerOrderForm
                  onOrderCreated={() => setIsOrderDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Catalog Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search 100+ back-office services..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories ({services.length})</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Standard Retail</TableHead>
                    <TableHead className="text-right">Starter (10% Off)</TableHead>
                    <TableHead className="text-right">Practice (30% Off)</TableHead>
                    <TableHead className="text-right">Enterprise (50% Off)</TableHead>
                    <TableHead className="text-right text-emerald-600 font-bold">
                      Your Margin
                    </TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => {
                    const retail = service.price;
                    const starterPrice = getPartnerServicePrice(service, 'starter');
                    const practicePrice = getPartnerServicePrice(service, 'practice');
                    const enterprisePrice = getPartnerServicePrice(
                      service,
                      'enterprise'
                    );
                    const myWholesale = getPartnerServicePrice(service, tier);
                    const myMargin = Math.max(0, retail - myWholesale);

                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-semibold text-sm">
                            {service.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-normal"
                            >
                              {service.category}
                            </Badge>
                            {service.turnaroundTime && (
                              <span className="text-[11px] text-muted-foreground">
                                • {service.turnaroundTime}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatPrice(retail)}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            tier === 'starter'
                              ? 'font-bold text-primary bg-primary/5'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatPrice(starterPrice)}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            tier === 'practice'
                              ? 'font-bold text-primary bg-primary/5'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatPrice(practicePrice)}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            tier === 'enterprise'
                              ? 'font-bold text-primary bg-primary/5'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatPrice(enterprisePrice)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          +{formatPrice(myMargin)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedServiceForDetails(service)}
                          >
                            <FileText className="h-4 w-4 mr-1" /> Specs
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredServices.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No services found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Details & Requirements Modal */}
      <Dialog
        open={!!selectedServiceForDetails}
        onOpenChange={(open) => !open && setSelectedServiceForDetails(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {selectedServiceForDetails && (
            <>
              <DialogHeader>
                <Badge variant="outline" className="w-fit mb-1">
                  {selectedServiceForDetails.category}
                </Badge>
                <DialogTitle className="text-xl">
                  {selectedServiceForDetails.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedServiceForDetails.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/60 border text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Retail Price
                    </div>
                    <div className="font-bold text-base">
                      {formatPrice(selectedServiceForDetails.price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Your Cost ({discountPercent}% Off)
                    </div>
                    <div className="font-bold text-base text-primary">
                      {formatPrice(
                        getPartnerServicePrice(selectedServiceForDetails, tier)
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Your Margin
                    </div>
                    <div className="font-bold text-base text-emerald-600">
                      +
                      {formatPrice(
                        Math.max(
                          0,
                          selectedServiceForDetails.price -
                            getPartnerServicePrice(
                              selectedServiceForDetails,
                              tier
                            )
                        )
                      )}
                    </div>
                  </div>
                </div>

                {selectedServiceForDetails.whatsIncluded?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">What&apos;s Included</h4>
                    <ul className="space-y-1.5">
                      {selectedServiceForDetails.whatsIncluded.map(
                        (item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {selectedServiceForDetails.informationToProvide?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      Required Documents / Information (Collect from Your Client)
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-5 text-xs text-muted-foreground">
                      {selectedServiceForDetails.informationToProvide.map(
                        (req, idx) => (
                          <li key={idx} className="text-foreground">
                            {req.label}
                            {req.helpText && (
                              <span className="block text-muted-foreground text-[11px]">
                                {req.helpText}
                              </span>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedServiceForDetails(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedServiceForDetails(null);
                      setIsOrderDialogOpen(true);
                    }}
                  >
                    Order This Service <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
