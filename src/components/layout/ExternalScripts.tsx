'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    merchantwidget?: {
      start: (config: {
        merchant_id: number;
        position?: 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'INLINE';
        region?: string;
      }) => void;
    };
    renderOptIn?: (orderData: {
      id: string;
      customerEmail: string;
      estimated_delivery_date: string;
      delivery_country?: string;
      products?: { gtin: string }[];
    }) => void;
    gapi?: any;
  }
}

export default function ExternalScripts() {
  const pathname = usePathname();
  
  const isDashboardPage = pathname ? (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/partner') ||
    pathname.startsWith('/p/')
  ) : false;

  if (isDashboardPage) {
    return null;
  }

  return (
    <>
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-KBTZN40DGY"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KBTZN40DGY');
        `}
      </Script>
      
      {/* Google Customer Reviews Platform Script */}
      <Script src="https://apis.google.com/js/platform.js?onload=renderOptIn" strategy="lazyOnload" />
      
      <Script id="google-reviews-opt-in" strategy="lazyOnload">
        {`
          window.renderOptIn = function(orderData) {
            if (!orderData || !orderData.id || !orderData.customerEmail || !orderData.estimated_delivery_date) {
              console.warn('Google Review Opt-in: Missing mandatory order data.');
              return;
            }
            if (window.gapi) {
              window.gapi.load('surveyoptin', function() {
                const optInParams = {
                  "merchant_id": 5394656984,
                  "order_id": orderData.id,
                  "email": orderData.customerEmail,
                  "delivery_country": orderData.delivery_country || "ZA",
                  "estimated_delivery_date": orderData.estimated_delivery_date
                };

                // Pass optional products array if it contains valid GTINs
                if (orderData.products && orderData.products.length > 0) {
                  optInParams["products"] = orderData.products;
                }

                window.gapi.surveyoptin.render(optInParams);
              });
            }
          }
        `}
      </Script>

      <Script
        id="merchant-widget"
        src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
        strategy="lazyOnload"
      />
      <Script id="merchant-widget-init" strategy="lazyOnload">
        {`
          (function tryInitWidget(attempts) {
            if (window.merchantwidget) {
              window.merchantwidget.start({
                merchant_id: 5394656984,
                position: "BOTTOM_RIGHT",
                region: "ZA",
              });
              // Monitor and add title when the iframe is injected
              var checks = 0;
              var interval = setInterval(function() {
                var iframe = document.getElementById("merchantwidgetiframe");
                if (iframe) {
                  iframe.setAttribute("title", "Google Customer Reviews");
                  clearInterval(interval);
                }
                checks++;
                if (checks > 30) clearInterval(interval);
              }, 500);
            } else if (attempts > 0) {
              setTimeout(function() { tryInitWidget(attempts - 1); }, 500);
            }
          })(10);
        `}
      </Script>
    </>
  );
}
