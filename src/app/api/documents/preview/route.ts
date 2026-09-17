import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminStorage } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

// Allowed remote storage hosts to prevent open-proxy SSRF
const ALLOWED_STORAGE_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'storage.cloud.google.com',
  'googleusercontent.com',
  'myacc.co.za',
  'www.myacc.co.za',
  'localhost',
  '127.0.0.1',
];

function getMimeType(fileName: string, remoteContentType?: string | null): string {
  if (remoteContentType && remoteContentType !== 'application/octet-stream') {
    return remoteContentType;
  }
  const cleanName = fileName.toLowerCase().split('?')[0];
  if (cleanName.endsWith('.pdf')) return 'application/pdf';
  if (cleanName.endsWith('.png')) return 'image/png';
  if (cleanName.endsWith('.jpg') || cleanName.endsWith('.jpeg')) return 'image/jpeg';
  if (cleanName.endsWith('.webp')) return 'image/webp';
  if (cleanName.endsWith('.svg')) return 'image/svg+xml';
  if (cleanName.endsWith('.gif')) return 'image/gif';
  if (cleanName.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (cleanName.endsWith('.csv')) return 'text/csv; charset=utf-8';
  return 'application/pdf'; // Default to PDF for order attachments
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const customName = searchParams.get('name') || 'document.pdf';
    const queryToken = searchParams.get('token');

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target document URL (?url=)' }, { status: 400 });
    }

    // 1. Verify User Authentication (Header or Query Token)
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split('Bearer ')[1]
      : queryToken;

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: authentication token required.' }, { status: 401 });
    }

    try {
      await getAdminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Unauthorized: invalid or expired session.' }, { status: 401 });
    }

    // 2. Validate URL Security
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid document URL format.' }, { status: 400 });
    }

    const isHostAllowed = ALLOWED_STORAGE_HOSTS.some(
      (h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`)
    );

    if (!isHostAllowed) {
      return NextResponse.json({ error: 'Forbidden: untrusted storage host.' }, { status: 403 });
    }

    // 3. Fetch Document Server-Side
    let fileBuffer: Buffer;
    let upstreamContentType: string | null = null;

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'MyAccountant-DocumentProxy/1.0',
      },
    });

    if (upstreamRes.ok) {
      const arrayBuffer = await upstreamRes.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      upstreamContentType = upstreamRes.headers.get('content-type');
    } else {
      // Fallback: If upstream fetch was rejected (e.g. 403 from Firebase Storage due to missing download token),
      // and target is in our Firebase Storage bucket, fetch directly via Admin SDK
      const defaultBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-2604127518-57889.firebasestorage.app';
      if (
        parsedUrl.hostname === 'firebasestorage.googleapis.com' &&
        parsedUrl.pathname.includes('/o/')
      ) {
        try {
          const match = parsedUrl.pathname.match(/\/v0\/b\/([^/]+)\/o\/(.+)/);
          const bucketName = match ? match[1] : defaultBucket;
          const rawPath = match ? match[2] : parsedUrl.pathname.split('/o/')[1];
          const decodedPath = decodeURIComponent(rawPath.split('?')[0]);

          const bucket = getAdminStorage().bucket(bucketName);
          const file = bucket.file(decodedPath);
          const [exists] = await file.exists();
          if (exists) {
            const [downloadedBuffer] = await file.download();
            const [metadata] = await file.getMetadata();
            fileBuffer = downloadedBuffer;
            upstreamContentType = metadata.contentType || null;
          } else {
            return NextResponse.json(
              { error: `Upstream storage returned status ${upstreamRes.status} and file not found via Admin SDK: ${decodedPath}` },
              { status: upstreamRes.status }
            );
          }
        } catch (adminErr) {
          console.error('[DocumentPreviewProxy] Admin SDK fallback error:', adminErr);
          return NextResponse.json(
            { error: `Upstream storage returned status ${upstreamRes.status}` },
            { status: upstreamRes.status }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Upstream storage returned status ${upstreamRes.status}` },
          { status: upstreamRes.status }
        );
      }
    }

    const mimeType = getMimeType(customName || parsedUrl.pathname, upstreamContentType);

    const safeFileName = (customName || 'document.pdf').replace(/["\r\n]/g, '_');

    // 4. Stream response with forced INLINE disposition (renders inside iframe without downloading or blocking)
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${safeFileName}"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Error proxying document preview:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error serving document preview' },
      { status: 500 }
    );
  }
}
