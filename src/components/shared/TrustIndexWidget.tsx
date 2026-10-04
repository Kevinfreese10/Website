'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, ShieldCheck } from 'lucide-react';

export default function TrustindexWidget() {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scriptLoaded = false;

    const loadScript = () => {
      if (scriptLoaded) return;
      scriptLoaded = true;
      setIsLoaded(true);

      const script = document.createElement('script');
      script.src = 'https://cdn.trustindex.io/loader.js?ba9c9164025b8697c4168930da4';
      script.async = true;
      script.defer = true;

      const container = document.getElementById('trustindex-widget-container');
      if (container) {
        container.appendChild(script);

        // Observer to sanitize widget DOM mutations
        const observer = new MutationObserver(() => {
          // 1. Eagerly load images once injected
          const lazyImgs = container.querySelectorAll('img[loading="lazy"]');
          lazyImgs.forEach((img) => {
            img.removeAttribute('loading');
            img.setAttribute('loading', 'eager');
          });

          // 2. Fix broken relative links emitted without protocol (e.g. href="www.trustindex.io...")
          const links = container.querySelectorAll('a[href]');
          links.forEach((a) => {
            const href = a.getAttribute('href') || '';
            if (href.startsWith('www.trustindex.io') || href.startsWith('/www.trustindex.io')) {
              a.setAttribute('href', 'https://' + href.replace(/^\/?/, ''));
              a.setAttribute('target', '_blank');
              a.setAttribute('rel', 'noopener noreferrer');
            }
          });

          // 3. Prevent external widget from injecting duplicate/incomplete Organization schema
          document.querySelectorAll('head script[type="application/ld+json"]').forEach((el) => {
            if (el.textContent && el.textContent.includes('Trustindex') && el.textContent.includes('aggregateRating')) {
              el.remove();
            }
          });
        });

        observer.observe(container, { childList: true, subtree: true });
      }
    };

    // Load on intersection (scroll within 400px) or on user touch/scroll/click
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadScript();
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const onUserInteraction = () => {
      loadScript();
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
    };

    window.addEventListener('scroll', onUserInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
    };
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8 overflow-hidden">
      <div className="w-full flex justify-center" ref={containerRef}>
        <div
          id="trustindex-widget-container"
          className="w-full max-w-6xl mx-auto min-h-[220px] overflow-hidden"
        >
          {/* Static placeholder badge rendering instantly for 0 CLS and high trust */}
          {!isLoaded && (
            <div className="flex flex-col items-center justify-center p-8 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 text-center animate-pulse">
              <div className="flex items-center gap-1.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 font-bold text-lg text-foreground">4.9 / 5.0</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Google Reviews • South Africa&apos;s Top Online Accounting &amp; Tax Practice</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

