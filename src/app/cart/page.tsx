'use client';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingCart, ArrowRight, ShieldCheck, Clock, ChevronRight } from 'lucide-react';


export default function CartPage() {
  const { cartItems, removeFromCart, cartTotal, itemCount } = useCart();

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-3">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-700 font-bold">Cart</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Your Cart</h1>
            {itemCount > 0 && (
              <Badge className="bg-primary text-white font-extrabold text-xs px-2 py-0.5 rounded-full">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {itemCount > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div
                  key={item.service.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold mb-1">
                      {item.service.category}
                    </Badge>
                    <Link href={`/products/${item.service.slug}`}>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight group-hover:text-primary transition-colors truncate">
                        {item.service.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-semibold">{item.service.turnaroundTime}</span>
                    </div>
                  </div>

                  {/* Price + Remove */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-black text-primary text-base">{formatPrice(item.service.price)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-slate-400 hover:text-destructive hover:bg-red-50 transition-all"
                      onClick={() => removeFromCart(item.service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </div>
                </div>
              ))}

              {/* Continue shopping */}
              <div className="pt-2">
                <Button asChild variant="outline" className="rounded-xl font-bold text-sm gap-2">
                  <Link href="/products">
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 sticky top-24">
              <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <CardTitle className="text-base font-extrabold text-slate-900">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  {cartItems.map(item => (
                    <div key={item.service.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium truncate max-w-[180px]">{item.service.title}</span>
                      <span className="font-bold text-slate-900 shrink-0 ml-2">{formatPrice(item.service.price)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-extrabold text-lg text-slate-900">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(cartTotal)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-0 pb-5 px-5">
                  <Button asChild className="w-full h-12 font-extrabold text-sm shadow-md" size="lg">
                    <Link href="/checkout">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {/* Trust signals */}
                  <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wide pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-green-600" />Secure Payment
                    </span>
                    <span className="text-slate-200">·</span>
                    <span>SARS Compliant</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 space-y-6 animate-in fade-in">
            <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto border border-slate-200 shadow-inner">
              <ShoppingCart className="h-10 w-10 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Your cart is empty</h2>
              <p className="text-muted-foreground font-medium">Looks like you haven&apos;t added any services yet.</p>
            </div>
            <Button asChild size="lg" className="font-bold rounded-xl shadow-md gap-2">
              <Link href="/products">
                Browse Our Services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
