import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MAIN_DOMAIN = 'myacc.co.za';
const FIREBASE_PROJECT_ID = 'studio-2604127518-57889';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Skip if it's the main domain, localhost, or Vercel domains
  if (
      hostname.includes(MAIN_DOMAIN) || 
      hostname.includes('localhost') || 
      hostname.includes('.vercel.app')
  ) {
    return NextResponse.next();
  }

  try {
      // Look up which partner slug owns this custom domain
      // We use the Firestore REST API because the Admin SDK isn't fully supported in Edge Runtime
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/domainMappings/${hostname}`;
      
      const response = await fetch(firestoreUrl, { next: { revalidate: 60 } }); // Cache for 60 seconds
      
      if (!response.ok) {
          // If not found (404) or error, just pass through
          return NextResponse.next();
      }

      const data = await response.json();
      
      // Extract the slug from the Firestore document fields
      const slug = data.fields?.slug?.stringValue;

      if (!slug) {
          return NextResponse.next();
      }

      const url = request.nextUrl.clone();
      
      // Rewrite / -> /p/slug
      // Rewrite /products/x -> /p/slug/products/x
      // Rewrite /checkout/x -> /p/slug/checkout/x
      const pathPrefix = `/p/${slug}`;
      url.pathname = url.pathname === '/' ? pathPrefix : `${pathPrefix}${url.pathname}`;
      
      return NextResponse.rewrite(url);
      
  } catch (error) {
      console.error("Middleware domain lookup error:", error);
      return NextResponse.next();
  }
}

export const config = {
  // Run on all requests except internal Next.js assets, API routes, and static files
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
