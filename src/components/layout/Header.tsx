'use client';

import Link from 'next/link';
import { ShoppingCart, LogIn, Menu, ChevronDown, Search } from 'lucide-react';
import { openServiceFinder } from '@/lib/service-finder';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Home',
    href: '/',
    items: []
  },
  {
    label: 'Online Store',
    href: '/products',
    items: []
  },
  {
    label: 'Accounting',
    href: '/monthly-accounting',
    items: [
        { label: 'Monthly Accounting & CFO', href: '/monthly-accounting' },
        { label: 'Annual Financial Statements', href: '/annual-financial-statements' },
        { label: 'Bookkeeping Services', href: '/bookkeeping-services' },
        { label: 'Fractional CFO Services', href: '/fractional-cfo-services-south-africa' },
        { label: 'SME Accounting', href: '/sme-accounting' },
        { label: 'Financial Advisory', href: '/financial-advisory' },
        { label: 'Xero Accountant', href: '/xero-accountant-south-africa' },
        { label: 'Sage Accountant', href: '/sage-accountant-south-africa' },
        { label: 'Zoho Accountant', href: '/zoho-accountant-south-africa' },
        { label: 'Pastel Accountant', href: '/pastel-accountant-south-africa' },
        { label: 'Accountant Johannesburg', href: '/accountant-johannesburg' },
        { label: 'Accountant Pretoria', href: '/accountant-pretoria' },
        { label: 'Accountant Cape Town', href: '/accountant-cape-town' },
        { label: 'Accountant Durban', href: '/accountant-durban' },
        { label: 'Accountant Randburg', href: '/accountant-randburg' },
        { label: 'Accountant Sandton', href: '/accountant-sandton' },
        { label: 'Accountant Centurion', href: '/accountant-centurion' },
        { label: 'Accountant Stellenbosch', href: '/accountant-stellenbosch' },
    ]
  },
  {
    label: 'Tax & SARS',
    href: '/products#tax-returns',
    items: [
      { label: 'VAT Registration South Africa', href: '/vat-registration-south-africa' },
      { label: 'SARS Debt Compromise', href: '/sars-compromise' },
      { label: 'SARS Disputes & Objections', href: '/sars-disputes' },
      { label: 'Remission of Fines & Penalties', href: '/remission-of-fines' },
      { label: 'Company Tax Returns (ITR14)', href: '/tax-returns' },
      { label: 'Individual Tax Returns (ITR12)', href: '/individual-tax-returns' },
      { label: 'Provisional Tax (IRP6)', href: '/provisional-tax' },
      { label: 'Tax Compliance Status (TCS PIN)', href: '/sars-tax-compliance-status-pin' },
      { label: 'Free Tax Refund Check', href: '/sars-tax-refund' },
      { label: 'Freelancer Tax Hub', href: '/freelancer-gig-economy-tax-hub' },
      { label: 'SARS Online Query Guide (SOQS)', href: '/sars-online-query-system-guide' },
      { label: 'Tax Deadlines 2026', href: '/tax-deadlines-calendar-2026' },
    ],
  },
  {
    label: 'Payroll',
    href: '/monthly-payroll',
    items: [
        { label: 'Monthly Payroll Services', href: '/monthly-payroll' },
        { label: 'COIDA Letter of Good Standing', href: '/coida-letter-of-good-standing' },
        { label: 'UIF & SDL Compliance', href: '/uif-compliance' },
        { label: 'PAYE Compliance & EMP201', href: '/paye-compliance' },
        { label: 'Outsourced Payroll Fees', href: '/outsourced-payroll-fees-sa' },
        { label: 'Payroll Services Overview', href: '/payroll-services' },
    ]
  },
  {
    label: 'Company Secretarial',
    href: '/company-secretarial-services-south-africa',
    items: [
        { label: 'Company Secretarial Services', href: '/company-secretarial-services-south-africa' },
        { label: 'Beneficial Ownership Register', href: '/cipc-beneficial-ownership-register-south-africa' },
        { label: 'CIPC Company Registration', href: '/company-registration' },
        { label: 'Annual Returns & FAS', href: '/products/annual-returns' },
        { label: 'Director Amendments (CoR39)', href: '/products/director-amendment' },
        { label: 'Company Reinstatements', href: '/products/company-reinstatement' },
        { label: 'Share Registers & Certificates', href: '/products/share-register' },
        { label: 'Registered Office Change (CoR21.1)', href: '/products/registered-office-change' },
        { label: 'Voluntary Liquidations', href: '/liquidations' },
    ]
  },
  {
    label: 'Calculators',
    href: '/calculators/salary-tax',
    items: [
        { label: 'Salary Tax Calculator', href: '/calculators/salary-tax' },
        { label: 'CIPC Annual Return Fee', href: '/calculators/cipc-annual-return-fee' },
        { label: 'SBC Tax Estimator', href: '/calculators/sbc-tax-estimator' },
        { label: 'Cost to Employer (TCOE)', href: '/calculators/total-cost-to-employer' },
        { label: 'NCR Registration Fee', href: '/calculators/ncr-registration-fee' },
        { label: 'CIDB Fee & Grade', href: '/calculators/cidb-fee-and-grade' },
        { label: 'VAT Calculator', href: '/calculators/vat-calculator' },
        { label: 'Provisional Tax', href: '/calculators/provisional-tax-estimator' },
        { label: 'Capital Gains Tax', href: '/calculators/capital-gains-tax-calculator' },
        { label: 'UIF / COIDA Calculator', href: '/calculators/uif-coida-calculator' },
        { label: 'BEE Scorecard', href: '/calculators/bee-scorecard-estimator' },
        { label: 'Turnover Tax Calculator', href: '/calculators/turnover-tax-calculator' },
    ]
  },
  {
    label: 'Company',
    href: '/#about',
    items: [
      { label: 'About Us', href: '/#about' },
      { label: 'Client Reviews', href: '/reviews' },
      { label: 'Tax Tip Blog', href: '/blog' },
      { label: 'Partner Program', href: '/become-a-partner' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
];

const Header = () => {
  const { itemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMac(typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || ''));
  }, []);
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-nav shadow-none">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3 lg:gap-5 2xl:gap-8">
          {/*
            * Brand / home link. The header previously contained NO logo or wordmark at any
            * breakpoint — its only child was the desktop nav, which is `hidden` below 1024px. On
            * mobile and tablet the left half of the bar rendered completely empty across ~150
            * public pages, with no brand recognition and none of the conventional
            * "click the logo to go home" affordance.
            */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="My Accountant — home"
          >
            <span className="text-base font-medium tracking-tight text-foreground sm:text-lg whitespace-nowrap">
              My Accountant
            </span>
          </Link>
          {!isAuthPage && (
            <nav className="hidden items-center gap-0.5 2xl:gap-1.5 xl:flex">
              {navGroups.map(group => (
                group.items && group.items.length > 0 ? (
                  <DropdownMenu key={group.label}>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 px-2 2xl:px-3 text-xs 2xl:text-sm font-medium hover:bg-transparent hover:text-primary gap-1 whitespace-nowrap">
                              {group.label}
                              <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64 max-h-[80vh] overflow-y-auto">
                          {group.items.map(item => (
                              <DropdownMenuItem key={item.label} asChild>
                                  <Link href={item.href} className="w-full cursor-pointer">
                                      {item.label}
                                  </Link>
                              </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button key={group.label} variant="ghost" className="h-9 px-2 2xl:px-3 text-xs 2xl:text-sm font-medium hover:bg-transparent hover:text-primary whitespace-nowrap" asChild>
                    <Link href={group.href}>{group.label}</Link>
                  </Button>
                )
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {!isAuthPage && (
            <button
              type="button"
              onClick={() => openServiceFinder()}
              aria-label="Search services: view prices and turnaround times"
              aria-haspopup="dialog"
              className="group relative flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-slate-100/70 p-0 text-xs font-medium text-slate-600 shadow-2xs transition-all hover:border-primary/40 hover:bg-white hover:text-foreground hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200 w-9 sm:w-auto sm:px-3 whitespace-nowrap"
            >
              <Search className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-primary shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline-block whitespace-nowrap">Find a service</span>
              <kbd className="hidden 2xl:inline-flex items-center rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-2xs transition-colors group-hover:border-slate-300 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400" aria-hidden="true">
                {mounted && isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>
          )}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {mounted && itemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-xs">
                  {itemCount}
                </Badge>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Link>
          </Button>

          <div className="hidden md:block">
            {mounted && isAuthenticated && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Portal Login
                </Link>
              </Button>
            )}
          </div>
          
          <div className="xl:hidden">
            {!isAuthPage && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
                  <div className="py-4 border-b">
                    <Link href="/" className="text-2xl font-bold text-primary" onClick={() => setMobileMenuOpen(false)}>
                      Home
                    </Link>
                  </div>
                  <ScrollArea className="flex-1 mt-4">
                    <Accordion type="single" collapsible className="w-full">
                        {navGroups.map((group, index) => (
                            group.items && group.items.length > 0 ? (
                              <AccordionItem key={group.label} value={`item-${index}`} className="border-none">
                                  <AccordionTrigger className="text-lg font-semibold py-3 hover:no-underline">
                                      {group.label}
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-4">
                                      <div className="flex flex-col gap-3 pl-4 border-l-2 border-primary/15 ml-1">
                                          {group.items.map(item => (
                                              <Link 
                                                  key={item.label} 
                                                  href={item.href} 
                                                  className="text-base text-muted-foreground hover:text-primary transition-colors"
                                                  onClick={() => setMobileMenuOpen(false)}
                                              >
                                                  {item.label}
                                              </Link>
                                          ))}
                                      </div>
                                  </AccordionContent>
                              </AccordionItem>
                            ) : (
                              <div key={group.label} className="py-3 border-none flex flex-1 items-center justify-between font-semibold">
                                <Link href={group.href} className="text-lg hover:text-primary transition-colors block w-full" onClick={() => setMobileMenuOpen(false)}>
                                  {group.label}
                                </Link>
                              </div>
                            )
                        ))}
                    </Accordion>
                  </ScrollArea>
                  <div className="mt-auto pt-6 border-t space-y-4">
                    {mounted && isAuthenticated && user ? (
                        <div className="space-y-4">
                            <Link 
                              href={
                                user.role === 'partner' || user.role === 'partner_staff' || user.role === 'partner_admin' 
                                  ? '/partner/dashboard' 
                                  : user.role === 'admin' || user.role === 'staff' 
                                    ? '/admin/dashboard' 
                                    : '/dashboard'
                              } 
                              className="block text-lg font-medium" 
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Go to Dashboard
                            </Link>
                            <Button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full">Logout</Button>
                        </div>
                      ) : (
                        <Button asChild className="w-full" onClick={() => setMobileMenuOpen(false)}>
                          <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" /> Portal Login
                          </Link>
                        </Button>
                      )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const UserMenu = ({ user, onLogout }: { user: any; onLogout: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary/10 text-primary font-bold">
        {user.name && <span>{user.name.charAt(0)}</span>}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="end" forceMount>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
       <DropdownMenuItem asChild>
        <Link href={user.role === 'partner' ? '/partner/dashboard' : '/admin/dashboard'}>Dashboard</Link>
      </DropdownMenuItem>
       <DropdownMenuItem asChild>
        <Link href={user.role === 'partner' ? '/partner/profile' : '/admin/staff'}>Profile</Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout}>
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

export default Header;
