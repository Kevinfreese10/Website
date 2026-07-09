'use client';

import { CartProvider } from '@/contexts/CartContext';
import { BlogProvider } from './BlogContext';
import { Toaster } from '@/components/ui/toaster';
import { ReactNode } from 'react';
import { WishlistProvider } from '@/contexts/WishlistContext';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <BlogProvider>
      <WishlistProvider>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </WishlistProvider>
    </BlogProvider>
  );
}
