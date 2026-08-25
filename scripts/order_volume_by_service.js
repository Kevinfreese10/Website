/**
 * Order volume by service — read-only report.
 *
 * Counts how many orders included each service over a lookback window, so the
 * AI order agent's service procedures can be reviewed in order of how much each
 * service actually matters to the business.
 *
 * READ-ONLY. This script writes nothing to Firestore.
 *
 * Usage (from the repo root, in your own terminal):
 *
 *   node scripts/order_volume_by_service.js
 *   node scripts/order_volume_by_service.js --months 24
 *   node scripts/order_volume_by_service.js --out scratch/order-volume.json
 *
 * Credentials: set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON,
 * or pass --key "C:/path/to/serviceAccount.json".
 */

const fs = require('fs');
const path = require('path');
const admin = require(path.join(__dirname, '..', 'node_modules', 'firebase-admin'));

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const MONTHS = parseInt(arg('months', '12'), 10);
const OUT = arg('out', 'scratch/order-volume.json');
const KEY = arg('key', process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!admin.apps.length) {
  if (KEY && fs.existsSync(KEY)) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(KEY, 'utf8'))) });
  } else {
    // Falls back to application-default credentials (gcloud auth application-default login).
    admin.initializeApp();
  }
}

const db = admin.firestore();

function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

(async () => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - MONTHS);

  console.log(`Reading orders placed since ${cutoff.toISOString().slice(0, 10)} ...`);

  const [ordersSnap, servicesSnap] = await Promise.all([
    db.collection('orders').get(),
    db.collection('services').get(),
  ]);

  // slug/title lookup so the report is readable, and so we can spot services that never sell.
  const services = new Map();
  servicesSnap.forEach(doc => {
    const d = doc.data();
    services.set(doc.id, {
      id: doc.id,
      slug: d.slug || null,
      title: d.title || '(untitled)',
      category: d.category || null,
      price: d.price ?? null,
      hasChecklist: Array.isArray(d.fulfillmentChecklist) && d.fulfillmentChecklist.length > 0,
      requirementCount: Array.isArray(d.informationToProvide) ? d.informationToProvide.length : 0,
    });
  });

  const stats = new Map();
  function bump(key, order, item) {
    if (!stats.has(key)) {
      stats.set(key, {
        orders: 0, units: 0, revenue: 0,
        completed: 0, cancelled: 0, open: 0,
        firstSeen: null, lastSeen: null,
        titles: new Set(),
      });
    }
    const s = stats.get(key);
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    s.orders += 1;
    s.units += qty;
    s.revenue += (item.unitPrice ?? item.price ?? item.basePrice ?? 0) * qty;
    if (order.status === 'Completed') s.completed += 1;
    else if (order.status === 'Cancelled') s.cancelled += 1;
    else s.open += 1;
    if (item.title) s.titles.add(item.title);
    const d = toDate(order.date);
    if (d) {
      if (!s.firstSeen || d < s.firstSeen) s.firstSeen = d;
      if (!s.lastSeen || d > s.lastSeen) s.lastSeen = d;
    }
  }

  let scanned = 0, inWindow = 0, undatedSkipped = 0, itemsWithoutServiceId = 0;

  ordersSnap.forEach(doc => {
    scanned += 1;
    const o = doc.data();
    const d = toDate(o.date);
    if (!d) { undatedSkipped += 1; return; }
    if (d < cutoff) return;
    inWindow += 1;

    for (const item of (o.items || [])) {
      const sid = item.serviceId || item.id;
      if (!sid || !services.has(sid)) {
        itemsWithoutServiceId += 1;
        bump(`UNMATCHED::${item.title || 'unknown'}`, o, item);
        continue;
      }
      bump(sid, o, item);
    }
  });

  const rows = [...stats.entries()].map(([key, s]) => {
    const svc = services.get(key);
    return {
      serviceId: svc ? svc.id : null,
      slug: svc ? svc.slug : null,
      title: svc ? svc.title : key.replace('UNMATCHED::', '') + '  [UNMATCHED]',
      category: svc ? svc.category : null,
      hasChecklist: svc ? svc.hasChecklist : null,
      requirementCount: svc ? svc.requirementCount : null,
      orders: s.orders,
      units: s.units,
      revenue: Math.round(s.revenue),
      completed: s.completed,
      cancelled: s.cancelled,
      open: s.open,
      firstSeen: s.firstSeen ? s.firstSeen.toISOString().slice(0, 10) : null,
      lastSeen: s.lastSeen ? s.lastSeen.toISOString().slice(0, 10) : null,
    };
  }).sort((a, b) => b.orders - a.orders);

  // Services that exist but sold nothing in the window — useful to know before
  // spending review time on a procedure nobody needs.
  const sold = new Set(rows.map(r => r.serviceId).filter(Boolean));
  const neverSold = [...services.values()]
    .filter(s => !sold.has(s.id))
    .map(s => ({ serviceId: s.id, slug: s.slug, title: s.title, category: s.category }))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  console.log('');
  console.log(`Orders scanned:            ${scanned}`);
  console.log(`Orders inside the window:  ${inWindow}`);
  console.log(`Orders with no date:       ${undatedSkipped}`);
  console.log(`Line items unmatched:      ${itemsWithoutServiceId}`);
  console.log(`Services in catalogue:     ${services.size}`);
  console.log(`Services with zero sales:  ${neverSold.length}`);
  console.log('');
  console.log('Top 25 by order count');
  console.log('-'.repeat(96));
  console.log('  #  orders  compl  open   revenue  chk  reqs  service');
  console.log('-'.repeat(96));
  rows.slice(0, 25).forEach((r, i) => {
    console.log(
      String(i + 1).padStart(3) + '  ' +
      String(r.orders).padStart(6) + '  ' +
      String(r.completed).padStart(5) + '  ' +
      String(r.open).padStart(4) + '  ' +
      ('R' + r.revenue).padStart(8) + '  ' +
      (r.hasChecklist ? ' Y ' : r.hasChecklist === false ? ' - ' : ' ? ') + '  ' +
      String(r.requirementCount ?? '?').padStart(4) + '  ' +
      r.title
    );
  });
  console.log('-'.repeat(96));

  const outPath = path.join(__dirname, '..', OUT);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    lookbackMonths: MONTHS,
    ordersScanned: scanned,
    ordersInWindow: inWindow,
    ordersWithoutDate: undatedSkipped,
    unmatchedLineItems: itemsWithoutServiceId,
    services: rows,
    neverSold,
  }, null, 2));

  console.log(`\nFull report written to ${OUT}`);
  console.log('Send me that file and I can start drafting the service procedures.');
  process.exit(0);
})().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
