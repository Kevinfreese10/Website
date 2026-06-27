'use client';

import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isContactVisible, setIsContactVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past 600px
      setIsVisible(window.scrollY > 600);
    };

    // Check if contact section is in view
    const contactObserver = new IntersectionObserver(
      ([entry]) => {
        setIsContactVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    const contactEl = document.getElementById('contact') || document.getElementById('calculator');
    if (contactEl) contactObserver.observe(contactEl);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      contactObserver.disconnect();
    };
  }, []);

  // Hide when contact form is in view or when at top
  if (!isVisible || isContactVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:hidden animate-in slide-in-from-bottom duration-300">
      <Button
        className="w-full partner-btn h-12 font-bold text-sm shadow-2xl gap-2"
        onClick={() => {
          const target = document.getElementById('contact') || document.getElementById('calculator');
          target?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <MessageSquare className="h-4 w-4" />
        Get a Free Quote
      </Button>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
