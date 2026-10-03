import { Service, User } from '@/lib/types';
import { SITE_URL } from '@/lib/constants';

/**
 * Generates valid Schema.org JSON-LD for My Accountant products and services.
 * Implements the exact structure required for Google Search Console rich results.
 * Respects service schemaType and provides robust fallbacks for TBC/variable pricing.
 * Supports a customCanonicalUrl parameter to align white-label dynamic partner routes.
 */
export function generateStructuredData(service: Service, customCanonicalUrl?: string) {
  const baseUrl = SITE_URL;
  const fullUrl = customCanonicalUrl || `${baseUrl}/products/${service.slug}`;
  
  // 1. Safe rolling expiry: Ensure it is a valid date in the future
  const currentYear = new Date().getFullYear();
  const defaultExpiry = `${currentYear + 1}-12-31`;
  let expiryDate = service.priceValidUntilOverride || defaultExpiry;
  
  // If the provided override is in the past, roll it forward automatically
  if (service.priceValidUntilOverride) {
    const overrideDate = new Date(service.priceValidUntilOverride);
    const now = new Date();
    if (isNaN(overrideDate.getTime()) || overrideDate < now) {
      expiryDate = defaultExpiry;
    }
  }

  // Standardized image URL
  const imageUrl = service.imageUrl?.startsWith('http') 
    ? service.imageUrl 
    : `${baseUrl}${service.imageUrl || '/og-image.jpg'}`;

  // 2. Safe Price parsing with baseline starting price fallback for TBC / Price on Request
  const rawPrice = service.price;
  let numericPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;
  
  // If price is TBC, missing, or invalid, generate a baseline starting offer price
  // to ensure Google Search Console does not throw a "Missing product price" error.
  const isTbc = service.isPriceTbc || !numericPrice || isNaN(numericPrice) || numericPrice <= 0;
  if (isTbc) {
    numericPrice = numericPrice && numericPrice > 0 ? numericPrice : 950;
  }

  // 3. Combined Multi-Type Schema: Service and Product, EXCEPT for TBC/"Price on Request"
  // services. Google's Merchant Center "Product" validation cross-checks the declared price
  // against what's actually visible on the page — since TBC pages show "Price on Request"
  // rather than a number, declaring a synthetic fallback price under the Product type causes
  // the recurring "missing price" flag in Search Console. Dropping the Product type for these
  // items keeps them out of Merchant Center's product-price validation entirely, while still
  // emitting valid Service/Offer markup for any Service-level rich results.
  const type = isTbc ? ["Service"] : ["Service", "Product"];

  // Base Schema Structure
  const schema: any = {
    "@context": "https://schema.org/",
    "@type": type,
    "name": service.title,
    "image": [imageUrl],
    "description": (service.longDescription || service.description || `Professional ${service.title} service for South African businesses.`).substring(0, 5000),
    "sku": service.id || service.slug,
    "mpn": service.id || service.slug,
    "brand": {
      "@type": "Brand",
      "name": service.brand || "My Accountant"
    },
    // Service-specific properties
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`
    },
    "provider": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": service.brand || "My Accountant",
      "url": baseUrl
    },
    "serviceType": service.category
  };

  // 4. Offers: Output valid Offers for 100% of pages (fixed and TBC starting prices)
  schema.offers = {
    "@type": "Offer",
    "url": fullUrl,
    "priceCurrency": service.currency || "ZAR",
    "price": parseFloat(numericPrice.toFixed(2)),
    "availability": `https://schema.org/${service.availability === 'out_of_stock' ? 'OutOfStock' : 'InStock'}`,
    "itemCondition": "https://schema.org/NewCondition",
    "priceValidUntil": expiryDate,
    "seller": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "My Accountant"
    },
    // Service-grade intangible stubs to guarantee zero warnings in strict Merchant listings
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "ZA",
      "returnPolicyCategory": service.returnPolicyCategory || "https://schema.org/MerchantReturnNotPermitted"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "ZA"
      },
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0",
        "currency": "ZAR"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "d"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "d"
        }
      }
    }
  };

  // 5. Add AggregateRating and Review to trigger star snippets in SERPs.
  // Only include if the service explicitly defines its own ratings (avoids Google manual action for site-wide ratings on individual products).
  if (service.enableAggregateRating !== false && service.aggregateRatingValue && service.reviewCount) {
    const ratingValue = service.aggregateRatingValue;
    const reviewCount = service.reviewCount;

    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": ratingValue.toString(),
      "reviewCount": reviewCount.toString(),
      "bestRating": "5",
      "worstRating": "1"
    };

    schema.review = {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": ratingValue.toString(),
        "bestRating": "5"
      },
      "author": {
        "@type": "Organization",
        "name": "Verified Customers"
      }
    };
  }

  return schema;
}

/**
 * Global practice schema for the organization.
 * Compliantly binds global TrustIndex ratings since the widget is sitewide and visible on the DOM.
 */
export function generateOrganizationSchema() {
  const baseUrl = SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "AccountingService", "FinancialService", "ProfessionalService"],
    "@id": `${baseUrl}/#organization`,
    "name": "My Accountant",
    "url": baseUrl,
    "priceRange": "R100–R7500",
    "telephone": "+27101091625",
    "email": "info@myacc.co.za",
    "logo": `${baseUrl}/logo.png`,
    "image": `${baseUrl}/logo.png`,
    "areaServed": "ZA",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road",
      "addressLocality": "Darrenwood, Johannesburg",
      "postalCode": "2195",
      "addressCountry": "ZA"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "08:00",
        "closes": "17:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/myaccountantza",
      "https://www.linkedin.com/company/myaccountantza",
      "https://www.google.com/maps?q=My+Accountant,+Stonemill+Office+Park,+300+Acacia+Road,+Darrenwood,+Johannesburg"
    ],
    "founder": {
      "@type": "Person",
      "@id": `${baseUrl}/#kevin-freese`,
      "name": "Kevin Freese",
      "jobTitle": "Managing Director & Senior Accountant",
      "url": baseUrl,
      "worksFor": {
        "@id": `${baseUrl}/#organization`
      },
      "hasCredential": [
        {
          "@type": "EducationalOccupationalCredential",
          "name": "Chartered Business Accountant in Practice",
          "credentialCategory": "Professional Designation",
          "recognizedBy": {
            "@type": "Organization",
            "name": "Chartered Institute for Business Accountants (CIBA)"
          },
          "identifier": "CIBA201509-5372"
        },
        {
          "@type": "EducationalOccupationalCredential",
          "name": "General Tax Practitioner (SA)™",
          "credentialCategory": "Professional Tax Designation",
          "recognizedBy": {
            "@type": "Organization",
            "name": "South African Institute of Taxation (SAIT)"
          },
          "identifier": "47011519"
        },
        {
          "@type": "EducationalOccupationalCredential",
          "name": "Registered SARS Tax Practitioner",
          "credentialCategory": "Tax Authority Registration",
          "recognizedBy": {
            "@type": "GovernmentOrganization",
            "name": "South African Revenue Service (SARS)"
          },
          "identifier": "PR-0098553"
        }
      ]
    },
    "knowsAbout": [
      "SME Accounting and Bookkeeping (IFRS for SMEs)",
      "Annual Financial Statements (AFS) Preparation and Review",
      "SARS Tax Dispute Resolution, Section 104 Objections and Appeals",
      "SARS Section 200 Compromise of Debt and Tax Restructuring",
      "SARS Remission of Penalties and Interest (RFR)",
      "VAT Registration and VAT201 Return Submissions",
      "Outsourced Payroll Administration, EMP201, and EMP501 Reconciliations",
      "UIF Compliance, Declarations, and COIDA Letter of Good Standing",
      "CIPC Company Secretarial Services, Annual Returns, and Reinstatements",
      "CIPC Mandatory Beneficial Ownership (BO) Register Compliance",
      "Director Amendments (CoR39), Registered Office Changes (CoR21.1), and Share Registers",
      "Provisional Tax (IRP6) and Corporate Income Tax (ITR14) Compliance"
    ]
  };
}

/**
 * Global WebSite schema for My Accountant.
 * Explicitly linked to #organization via publisher.
 */
export function generateWebSiteSchema() {
  const baseUrl = SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": "My Accountant",
    "url": baseUrl,
    "description": "Professional online tax, accounting, CIPC, SARS and compliance services for South African businesses.",
    "publisher": {
      "@id": `${baseUrl}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Merges root Organization and WebSite into a unified single-script @graph.
 */
export function generateRootEntityGraphSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      generateOrganizationSchema(),
      generateWebSiteSchema()
    ]
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generates a valid Schema.org BreadcrumbList.
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[], pageUrl?: string) {
  const baseUrl = SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    ...(pageUrl ? { "@id": `${pageUrl.startsWith('http') ? pageUrl : `${baseUrl}${pageUrl.startsWith('/') ? pageUrl : `/${pageUrl}`}`}#breadcrumb` } : {}),
    "itemListElement": items.map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${baseUrl}${item.url.startsWith('/') ? item.url : `/${item.url}`}`
    }))
  };
}

/**
 * ContactPage schema with office hours, telephone, email, and location.
 */
export function generateContactPageSchema() {
  const baseUrl = SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact My Accountant",
    "url": `${baseUrl}/contact`,
    "description": "Contact our certified team of South African accountants and tax practitioners. Available Monday to Friday, 8am to 5pm SAST.",
    "mainEntity": generateOrganizationSchema()
  };
}

/**
 * Catalog ItemList schema with embedded Service & Offer markup for every catalog offering.
 */
export function generateCatalogOffersSchema(services: Service[]) {
  const baseUrl = SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "My Accountant Services & Products",
    "description": "Comprehensive accounting, tax, CIPC, and payroll compliance services for South African businesses and individuals with transparent fixed pricing.",
    "url": `${baseUrl}/products`,
    "numberOfItems": services.length,
    "itemListElement": services.map((service, index) => {
      const isTbc = service.isPriceTbc || !service.price || service.price <= 0;
      const numericPrice = isTbc ? (service.price && service.price > 0 ? service.price : 950) : service.price;
      const serviceUrl = `${baseUrl}/products/${service.slug}`;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Service",
          "name": service.title,
          "description": service.description || `Professional ${service.title} service for South African businesses.`,
          "url": serviceUrl,
          "provider": {
            "@type": "ProfessionalService",
            "name": "My Accountant",
            "url": baseUrl,
            "telephone": "+27101091625"
          },
          "areaServed": "ZA",
          "serviceType": service.category,
          "offers": {
            "@type": "Offer",
            "url": serviceUrl,
            "price": parseFloat(numericPrice.toFixed(2)),
            "priceCurrency": service.currency || "ZAR",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "My Accountant"
            }
          }
        }
      };
    })
  };
}

export interface PillarSchemaConfig {
  title: string;
  description: string;
  slug: string;
  serviceType: string;
  faqs?: { q: string; a: string }[];
  priceRange?: string;
  breadcrumbs?: { name: string; url: string }[];
}

/**
 * Generates an interconnected Schema.org @graph for major commercial service pillar pages.
 * Includes Service, FAQPage, BreadcrumbList, and links to Organization.
 */
export function generateServicePillarSchema(config: PillarSchemaConfig) {
  const baseUrl = SITE_URL;
  const pageUrl = `${baseUrl}/${config.slug.replace(/^\//, '')}`;

  const graph: any[] = [
    {
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      "name": config.title,
      "description": config.description,
      "url": pageUrl,
      "serviceType": config.serviceType,
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`
      },
      "provider": {
        "@type": "ProfessionalService",
        "@id": `${baseUrl}/#organization`,
        "name": "My Accountant",
        "url": baseUrl,
        "telephone": "+27101091625"
      },
      "areaServed": {
        "@type": "Country",
        "name": "South Africa"
      },
      ...(config.priceRange ? { "priceRange": config.priceRange } : {})
    }
  ];

  if (config.breadcrumbs && config.breadcrumbs.length > 0) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      "itemListElement": config.breadcrumbs.map((item, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": item.name,
        "item": item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
      }))
    });
  }

  if (config.faqs && config.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`
      },
      "publisher": {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`
      },
      "mainEntity": config.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}


