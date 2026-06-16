import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

const MERCHANT_ID = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '23836312';
const PASSPHRASE  = process.env.PAYFAST_PASSPHRASE || 'KhaiFreese11';
const IS_SANDBOX  = MERCHANT_ID === '10049800' || MERCHANT_ID === '10042278';
const PAYFAST_API = IS_SANDBOX
    ? 'https://sandbox.payfast.co.za'
    : 'https://api.payfast.co.za';

function buildHeaders(): Record<string, string> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
    const params: Record<string, string> = {
        'merchant-id': MERCHANT_ID,
        passphrase: PASSPHRASE,
        timestamp,
        version: 'v1',
    };
    const signatureString = Object.keys(params)
        .sort()
        .map(k => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
        .join('&');
    const signature = crypto.createHash('md5').update(signatureString).digest('hex');
    return { 'merchant-id': MERCHANT_ID, version: 'v1', timestamp, signature, Accept: 'application/json' };
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        const partnerId = decodedToken.uid;

        const db = getAdminDb();
        const userRef = db.collection('users').doc(partnerId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const userData = userSnap.data();
        const payfastToken = userData?.partnerSubscription?.payfastToken;
        
        if (payfastToken) {
            console.log(`Cancelling PayFast subscription ${payfastToken} for partner ${partnerId}`);
            const url = `${PAYFAST_API}/subscriptions/${payfastToken}/cancel`;
            try {
                const res = await fetch(url, {
                    method: 'PUT',
                    headers: buildHeaders()
                });
                const text = await res.text();
                console.log(`PayFast cancel API response for token ${payfastToken}:`, text);
            } catch (err) {
                console.error(`Failed to cancel via PayFast API:`, err);
            }
        }
        
        await userRef.update({
            'partnerSubscription.status': 'cancelled',
            'partnerSubscription.cancelledAt': new Date(),
        });
        
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Error cancelling subscription:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
