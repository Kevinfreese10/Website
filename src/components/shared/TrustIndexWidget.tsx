'use client';

import { useEffect } from 'react';

export default function TrustindexWidget() {
  useEffect(() => {
    // Load Trustindex script dynamically after a 2-second delay to protect TBT
    const timer = setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://cdn.trustindex.io/loader.js?ba9c9164025b8697c4168930da4';
      script.async = true;
      script.defer = true;
      
      // Find the container and append script
      const container = document.getElementById('trustindex-widget-container');
      if (container) {
        container.appendChild(script);

        // Ensure above-the-fold review images are loaded eagerly to prevent LCP delay
        const observer = new MutationObserver(() => {
          const lazyImgs = container.querySelectorAll('img[loading="lazy"]');
          lazyImgs.forEach((img) => {
            img.removeAttribute('loading');
            img.setAttribute('loading', 'eager');
          });

          // Prevent external widget from injecting duplicate/incomplete Organization schema
          document.querySelectorAll('head script[type="application/ld+json"]').forEach((el) => {
            if (el.textContent && el.textContent.includes('Trustindex') && el.textContent.includes('aggregateRating')) {
              el.remove();
            }
          });
        });
        observer.observe(container, { childList: true, subtree: true });
      }
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      const container = document.getElementById('trustindex-widget-container');
      if (container) {
        container.innerHTML = ''; // Clean up any injected content
      }
    };
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8 overflow-hidden">
      <div className="w-full flex justify-center">
        <div
          id="trustindex-widget-container"
          className="w-full max-w-6xl mx-auto min-h-[220px] overflow-hidden"
        />
      </div>
    </section>
  );
}

