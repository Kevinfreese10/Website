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
    <section className="container mx-auto px-4 py-8">
      <div className="flex justify-center">
        <div id="trustindex-widget-container" />
      </div>
    </section>
  );
}

