import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Order } from '@/lib/types';
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

async function fetchPayFastTransactionsForDate(dateStr: string): Promise<any[]> {
    // Try date range format: from=YYYY-MM-DD 00:00:00&to=YYYY-MM-DD 23:59:59
    const from = encodeURIComponent(`${dateStr} 00:00:00`);
    const to   = encodeURIComponent(`${dateStr} 23:59:59`);
    const url  = `${PAYFAST_API}/transactions/query?from=${from}&to=${to}`;

    try {
        const res  = await fetch(url, { method: 'GET', headers: buildHeaders() });
        const text = await res.text();
        if (!res.ok) return [];
        const json = JSON.parse(text);
        return json?.data?.response || json?.response || [];
    } catch {
        return [];
    }
}

export async function POST(req: NextRequest) {
    // Simple admin guard — only allow if caller passes the admin secret header
    const adminSecret = req.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const specificOrderId: string | null = body.orderId || null;
        const daysBack: number = body.daysBack || 3;

        const adminDb = getAdminDb();

        // 1. Fetch PayFast transactions for the date range
        const allTransactions: any[] = [];
        for (let i = 0; i < daysBack; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const txns = await fetchPayFastTransactionsForDate(dateStr);
            allTransactions.push(...txns);
        }

        // Build lookup: m_payment_id → transaction
        const txnMap = new Map<string, any>();
        for (const txn of allTransactions) {
            if (txn.m_payment_id) txnMap.set(String(txn.m_payment_id), txn);
        }

        // 2. Load pending orders from Firestore
        let query = adminDb.collection('orders').where('status', '==', 'Pending Payment') as FirebaseFirestore.Query;
        if (specificOrderId) {
            query = adminDb.collection('orders').where('id', '==', specificOrderId);
        }
        const snapshot = await query.get();

        const results = { updated: [] as string[], skipped: [] as string[], notFound: [] as string[] };

        for (const doc of snapshot.docs) {
            const data = doc.data() as Order;
            const orderId = String(data.id);

            // If specific order requested but already processed, skip
            if (specificOrderId && data.status !== 'Pending Payment') {
                results.skipped.push(orderId);
                continue;
            }

            const txn = txnMap.get(orderId);

            if (!txn) {
                results.notFound.push(orderId);
                continue;
            }

            if (txn.payment_status !== 'COMPLETE') {
                results.skipped.push(orderId);
                continue;
            }

            // Payment confirmed — update to Processing
            await doc.ref.update({
                status: 'Processing',
                paymentMethod: 'PayFast',
                itnHistory: FieldValue.arrayUnion({
                    status: 'Success',
                    message: `Reconciled via admin API. PF Payment ID: ${txn.pf_payment_id}.`,
                    receivedAt: new Date(),
                    payload: txn,
                }),
                notes: FieldValue.arrayUnion({
                    text: `Order reconciled to "Processing" via /api/admin/reconcile-orders endpoint. PF Payment ID: ${txn.pf_payment_id}.`,
                    date: new Date(),
                    authorId: 'system',
                    type: 'note',
                    subject: null,
                    attachments: null,
                }),
            });

            results.updated.push(orderId);
        }

        return NextResponse.json({
            success: true,
            mode: IS_SANDBOX ? 'sandbox' : 'live',
            payfastTransactionsFound: allTransactions.length,
            results,
        });

    } catch (error: any) {
        console.error('Reconcile API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
