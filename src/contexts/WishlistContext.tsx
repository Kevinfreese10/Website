'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Service } from '@/lib/types';

interface WishlistContextType {
  wishlist: Service[];
  addToWishlist: (service: Service) => void;
  removeFromWishlist: (serviceId: string) => void;
  isInWishlist: (serviceId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Service[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('myacc_wishlist');
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('myacc_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  const addToWishlist = (service: Service) => {
    setWishlist((prev) => {
      if (!prev.find(item => item.id === service.id)) {
        return [...prev, service];
      }
      return prev;
    });
  };

  const removeFromWishlist = (serviceId: string) => {
    setWishlist((prev) => prev.filter(item => item.id !== serviceId));
  };

  const isInWishlist = (serviceId: string) => {
    return wishlist.some(item => item.id === serviceId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
