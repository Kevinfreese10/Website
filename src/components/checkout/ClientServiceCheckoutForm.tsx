

'use client';

import { useState, useEffect } from 'react';
import { Service } from '@/lib/types';
import { Button } from '../ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Check, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

export default function ClientServiceCheckoutForm({ service }: { service: Service }) {
  const { addToCart, cartItems } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const itemInCart = cartItems.some(item => item.service.id === service.id);
    setIsAdded(itemInCart);
  }, [cartItems, service.id]);

  const handleAddToCart = () => {
    if (!isAdded) {
      addToCart(service);
      setIsAdded(true);
    }
  };

  const handleBuyNow = () => {
    if (!isAdded) {
      addToCart(service);
    }
    router.push('/cart');
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleBuyNow} 
        size="lg"
        className="w-full h-12 font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-md rounded-xl"
      >
        Buy Now & Proceed to Cart
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <Button 
        onClick={handleAddToCart} 
        disabled={isAdded}
        variant={isAdded ? "secondary" : "outline"}
        size="lg"
        className={`w-full h-11 font-bold text-xs rounded-xl ${isAdded ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'border-slate-300 hover:bg-slate-50'}`}
      >
        {isAdded ? (
          <>
            <Check className="mr-2 h-4 w-4 text-emerald-600" />
            Item Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart Only
          </>
        )}
      </Button>

      {isAdded && (
        <Button asChild variant="ghost" className="w-full text-xs font-bold text-primary hover:bg-primary/5" size="sm">
          <Link href="/cart">
            View Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      )}

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wide pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secure Payment
        </span>
        <span className="text-slate-300">·</span>
        <span>SARS Compliant</span>
      </div>
    </div>
  );
}
