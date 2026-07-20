'use client';

import Link from 'next/link';
import { ShoppingCart, LogIn, Menu, ChevronDown } from 'lucide-react';
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
    href: '/services',
    items: []
  },
  {
    label: 'Accounting',
    href: '/monthly-accounting',
    items: [
        { label: 'Monthly Accounting', href: '/monthly-accounting' },
        { label: 'SME Accounting', href: '/sme-accounting' },
        { label: 'Bookkeeping', href: '/bookkeeping' },
        { label: 'Financial Statements', href: '/financial-statements' },
        { label: 'Financial Advisory', href: '/financial-advisory' },
        { label: 'Joburg Bookkeeping', href: '/bookkeeping-services-johannesburg' },
        { label: 'Fractional CFO Services', href: '/fractional-cfo-services-south-africa' },
        { label: 'Movie & Film Accounting', href: '/movie-film-production-accounting-south-africa' },
        { label: 'Film Accountant Randburg', href: '/movie-film-production-accountant-randburg' },
        { label: 'Xero Accountant', href: '/xero-accountant-south-africa' },
        { label: 'Sage Accountant', href: '/sage-accountant-south-africa' },
        { label: 'Zoho Accountant', href: '/zoho-accountant-south-africa' },
        { label: 'Pastel Accountant', href: '/pastel-accountant-south-africa' },
    ]
  },
  {
    label: 'Payroll',
    href: '/monthly-payroll',
    items: [
        { label: 'Monthly Payroll', href: '/monthly-payroll' },
        { label: 'Payroll Services', href: '/payroll-services' },
        { label: 'Outsourced Payroll Fees', href: '/outsourced-payroll-fees-sa' },
    ]
  },
  {
    label: 'Tax',
    href: '/products#sars-services',
    items: [
      { label: 'Tax Returns', href: '/tax-returns' },
      { label: 'Individual Tax Returns', href: '/individual-tax-returns' },
      { label: 'Tax Compliance', href: '/tax-compliance' },
      { label: 'Tax Consulting', href: '/tax-consulting' },
      { label: 'Tax Planning', href: '/tax-planning' },
      { label: 'Provisional Tax', href: '/provisional-tax' },
      { label: 'Tax Disputes', href: '/tax-disputes' },
      { label: 'Free Tax Refund Check', href: '/sars-tax-refund' },
      { label: 'SARS Compromises', href: '/sars-compromise' },
      { label: 'Remission of Fines', href: '/remission-of-fines' },
    ],
  },
  {
    label: 'Registrations',
    href: '/cipc-company-registration-online',
    items: [
        { label: 'Company Registration', href: '/company-registration' },
        { label: 'Compliance Services', href: '/compliance-services' },
        { label: 'Trust Services', href: '/trust-services' },
        { label: 'Specialist Services', href: '/specialist-services' },
        { label: 'Registration Pricing', href: '/register-company-south-africa-price' },
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
    ]
  },
  {
    label: 'Company',
    href: '/#about',
    items: [
      { label: 'About Us', href: '/#about' },
      { label: 'Tax Tip Blog', href: '/blog' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    label: 'Become a Partner',
    href: '/become-a-partner',
    items: [
      { label: 'Partner Program (BEI)', href: '/become-a-partner' },
      { label: 'Partner Jobs Board', href: '/jobs' },
      { label: 'Sign Up', href: '/partner-signup' },
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

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-nav shadow-none">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4 lg:gap-8">
          {!isAuthPage && (
            <nav className="hidden items-center gap-2 lg:flex">
              {navGroups.map(group => (
                group.items && group.items.length > 0 ? (
                  <DropdownMenu key={group.label}>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 px-3 text-sm font-medium hover:bg-transparent hover:text-primary gap-1">
                              {group.label}
                              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
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
                  <Button key={group.label} variant="ghost" className="h-9 px-3 text-sm font-medium hover:bg-transparent hover:text-primary" asChild>
                    <Link href={group.href}>{group.label}</Link>
                  </Button>
                )
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
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
          
          <div className="lg:hidden">
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
                            <Link href={user.role === 'partner' ? '/partner/dashboard' : '/admin/dashboard'} className="block text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Go to Dashboard</Link>
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
