/**
 * PayFast Order Reconciliation Script
 * =====================================
 * Run this script whenever a payment was completed on PayFast but the
 * order status didn't automatically update to "Processing".
 *
 * Usage:
 *   npx tsx scratch/reconcile-pending-orders.ts
 *   npx tsx scratch/reconcile-pending-orders.ts --order 9956
 *   npx tsx scratch/reconcile-pending-orders.ts --days 3
 *
 * What it does:
 *   1. Fetches PayFast transaction history for today (and optionally --days back)
 *   2. Finds all Firestore orders with "Pending Payment" status
 *   3. Cross-references by m_payment_id — if PayFast shows COMPLETE → updates to "Processing"
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as crypto from 'crypto';

// ─── Config ───────────────────────────────────────────────────────────────────

const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID  || '23836312';
const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE   || 'KhaiFreese11';
const IS_SANDBOX   = MERCHANT_ID === '10049800' || MERCHANT_ID === '10042278';
const PAYFAST_API  = IS_SANDBOX
    ? 'https://sandbox.payfast.co.za'
    : 'https://api.payfast.co.za';

const args = process.argv.slice(2);
const specificOrder = args.includes('--order') ? args[args.indexOf('--order') + 1] : null;
const daysBack = args.includes('--days') ? parseInt(args[args.indexOf('--days') + 1]) : 1;

// ─── Firebase ─────────────────────────────────────────────────────────────────

function findServiceAccount(): string | null {
    const downloadsPath = 'C:/Users/kev/Downloads';
    if (fs.existsSync(downloadsPath)) {
        const files = fs.readdirSync(downloadsPath);
        const keyFile = files.find(f =>
            f.toLowerCase().includes('studio-2604127518-57889') && f.endsWith('.json')
        );
        if (keyFile) return `${downloadsPath}/${keyFile}`;
    }
    return null;
}

function initFirebase() {
    const saPath = findServiceAccount();
    if (!saPath) {
        console.error('❌ Firebase service account not found in Downloads folder.');
        process.exit(1);
    }
    console.log(`🔑 Firebase: ${saPath.split('/').pop()}`);
    const credentials = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(credentials),
            projectId: credentials.project_id,
        });
    }
    return admin.firestore();
}

// ─── PayFast API Auth ─────────────────────────────────────────────────────────

function buildPayFastHeaders(extraParams: Record<string, string> = {}): Record<string, string> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');

    const params: Record<string, string> = {
        'merchant-id': MERCHANT_ID,
        passphrase: PASSPHRASE,
        timestamp,
        version: 'v1',
        ...extraParams,
    };

    const signatureString = Object.keys(params)
        .sort()
        .map(k => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
        .join('&');

    const signature = crypto.createHash('md5').update(signatureString).digest('hex');

    return {
        'merchant-id': MERCHANT_ID,
        version: 'v1',
        timestamp,
        signature,
        Accept: 'application/json',
    };
}

// ─── PayFast Transaction History ──────────────────────────────────────────────

interface PayFastTransaction {
    m_payment_id: string;
    pf_payment_id: string;
    payment_status: string;
    amount_gross: string;
    item_name?: string;
    payment_date?: string;
}

async function fetchPayFastTransactionsByDate(date: string): Promise<PayFastTransaction[]> {
    // API: GET /transactions/query?date=YYYY-MM-DD
    const url = `${PAYFAST_API}/transactions/query?date=${date}`;
    const headers = buildPayFastHeaders();

    console.log(`  📡 Fetching PayFast transactions for ${date}...`);

    try {
        const res = await fetch(url, { method: 'GET', headers });
        const text = await res.text();

        if (!res.ok) {
            console.warn(`  ⚠️  PayFast API ${res.status}: ${text.substring(0, 200)}`);
            return [];
        }

        const json = JSON.parse(text);
        // Response shape: { status: 200, data: { response: [...] } }
        const transactions: PayFastTransaction[] =
            json?.data?.response || json?.response || json || [];

        if (Array.isArray(transactions)) {
            console.log(`  ✅ Got ${transactions.length} transaction(s) for ${date}`);
            return transactions;
        }
        return [];
    } catch (err: any) {
        console.warn(`  ⚠️  Error fetching PayFast transactions: ${err.message}`);
        return [];
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║       PayFast Order Reconciliation Script             ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`  Mode:        ${IS_SANDBOX ? '🧪 Sandbox' : '🔴 Live Production'}`);
    console.log(`  Merchant ID: ${MERCHANT_ID}`);
    console.log(`  PayFast API: ${PAYFAST_API}`);
    if (specificOrder) {
        console.log(`  Filter:      Order ${specificOrder} only`);
    } else {
        console.log(`  Filter:      Last ${daysBack} day(s) of PayFast transactions`);
    }
    console.log('');

    const db = initFirebase();

    // Step 1: Collect PayFast transactions for the date range
    console.log('\n📥 Fetching PayFast transaction history...');
    const allTransactions: PayFastTransaction[] = [];
    for (let i = 0; i < daysBack; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        const txns = await fetchPayFastTransactionsByDate(dateStr);
        allTransactions.push(...txns);
    }

    if (allTransactions.length === 0) {
        console.log('\n💤 No PayFast transactions found in the selected date range.');
        console.log('   If you expect transactions, check your PayFast dashboard directly.');
        process.exit(0);
    }

    // Build a lookup map: m_payment_id → transaction
    const txnMap = new Map<string, PayFastTransaction>();
    for (const txn of allTransactions) {
        if (txn.m_payment_id) {
            txnMap.set(String(txn.m_payment_id), txn);
        }
    }

    const completeIds = [...txnMap.values()]
        .filter(t => t.payment_status === 'COMPLETE')
        .map(t => t.m_payment_id);

    console.log(`\n  Total transactions found : ${allTransactions.length}`);
    console.log(`  COMPLETE transactions    : ${completeIds.length}  [${completeIds.join(', ')}]`);

    // Step 2: Load Firestore "Pending Payment" orders
    console.log('\n📋 Loading pending orders from Firestore...');
    let firestoreQuery: admin.firestore.Query = db.collection('orders').where('status', '==', 'Pending Payment');
    if (specificOrder) {
        firestoreQuery = db.collection('orders').where('id', '==', specificOrder);
    }

    const snapshot = await firestoreQuery.get();

    if (snapshot.empty) {
        console.log('✅ No pending orders in Firestore.');
        process.exit(0);
    }

    console.log(`  Found ${snapshot.size} pending order(s) in Firestore`);

    // Step 3: Cross-reference and update
    console.log('\n🔄 Cross-referencing and updating...\n');

    const results = {
        updated: [] as string[],
        not_in_payfast: [] as string[],
        not_complete: [] as string[],
        already_done: [] as string[],
    };

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const orderId = String(data.id);

        if (specificOrder && data.status !== 'Pending Payment') {
            console.log(`  ℹ️  Order ${orderId} is already "${data.status}".`);
            results.already_done.push(orderId);
            continue;
        }

        const txn = txnMap.get(orderId);

        if (!txn) {
            console.log(`  ⏭️  Order ${orderId} — not found in PayFast history`);
            results.not_in_payfast.push(orderId);
            continue;
        }

        if (txn.payment_status !== 'COMPLETE') {
            console.log(`  ⚠️  Order ${orderId} — PayFast status: ${txn.payment_status}`);
            results.not_complete.push(orderId);
            continue;
        }

        // COMPLETE — update Firestore
        console.log(`  ✅ Order ${orderId} (R${data.total}, ${data.customerName}) → Processing`);

        await doc.ref.update({
            status: 'Processing',
            paymentMethod: 'PayFast',
            itnHistory: admin.firestore.FieldValue.arrayUnion({
                status: 'Success',
                message: `Reconciled via PayFast transaction history API. PF Payment ID: ${txn.pf_payment_id}.`,
                receivedAt: new Date(),
                payload: txn,
            }),
            notes: admin.firestore.FieldValue.arrayUnion({
                text: `Order reconciled to "Processing" via PayFast API (reconcile script). PF Payment ID: ${txn.pf_payment_id}.`,
                date: new Date(),
                authorId: 'system',
                type: 'note',
                subject: null,
                attachments: null,
            }),
        });

        results.updated.push(orderId);
    }

    // Summary
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                      Summary                          ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`  ✅ Updated to Processing  : ${results.updated.length}  ${results.updated.join(', ')}`);
    console.log(`  💤 Not in PayFast history : ${results.not_in_payfast.length}  ${results.not_in_payfast.join(', ')}`);
    console.log(`  ⚠️  Payment not complete   : ${results.not_complete.length}  ${results.not_complete.join(', ')}`);
    console.log(`  ℹ️  Already processed      : ${results.already_done.length}  ${results.already_done.join(', ')}`);
    console.log('');

    if (results.updated.length > 0) {
        console.log(`🎉 ${results.updated.length} order(s) successfully updated!`);
    } else {
        console.log('ℹ️  No orders were changed.');
    }
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err.message || err);
    process.exit(1);
});
