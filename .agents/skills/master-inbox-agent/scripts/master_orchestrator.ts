import fs from 'fs';
import path from 'path';
import dns from 'dns';
import imapSimple from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';
import nodemailer from 'nodemailer';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { getAdminDb } from '../../../src/lib/firebase-admin';

// Load environment variables across workspaces
const ENV_PATHS = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  'C:/Users/kev/.gemini/antigravity/scratch/.env',
  'c:/myacc/.env',
  'c:/myacc/.env.local'
];
for (const p of ENV_PATHS) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}

const STATE_FILE = 'C:/Users/kev/.gemini/antigravity/scratch/master_inbox_state.json';
const KEVIN_EMAIL = process.env.ALERT_RECIPIENTS || 'kev@thinkestry.co.za';

export type TriageCategory =
  | 'SPAM_SOLICITATION'
  | 'SYSTEM_RECEIPT'
  | 'CATALOG_INQUIRY'
  | 'ACTIVE_ORDER_UPDATE'
  | 'RETAINER_INQUIRY'
  | 'SARS_DEBT_COMPROMISE'
  | 'REGULATOR_NOTICE'
  | 'PERSONAL_PRIVATE'
  | 'GENERAL_CONSULTATION';

export interface PendingItem {
  id: string;
  mailbox: string;
  category: TriageCategory;
  subject: string;
  sender: string;
  entityName?: string;
  orderId?: string;
  proposedAction: string;
  approvalCommand: string;
  details: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'DISMISSED';
}

export interface MasterInboxState {
  accounts: string[];
  lastChecked: string | null;
  processedUids: Record<string, string[]>; // mailbox -> UIDs
  processedMessageIds: string[];
  pendingApprovals: PendingItem[];
  history: Array<{
    mailbox: string;
    uid: number;
    messageId: string;
    from: string;
    subject: string;
    category: TriageCategory;
    actionTaken: string;
    date: string;
    processedAt: string;
  }>;
}

export function loadMasterState(): MasterInboxState {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (!data.processedUids || Array.isArray(data.processedUids)) {
        data.processedUids = { 'info@myacc.co.za': Array.isArray(data.processedUids) ? data.processedUids : [] };
      }
      if (!data.processedMessageIds) data.processedMessageIds = [];
      if (!data.pendingApprovals) data.pendingApprovals = [];
      if (!data.history) data.history = [];
      return data;
    } catch (e: any) {
      console.error('[master-inbox] Error reading state:', e.message);
    }
  }
  return {
    accounts: ['info@myacc.co.za', 'kev@thinkestry.co.za'],
    lastChecked: null,
    processedUids: { 'info@myacc.co.za': [], 'kev@thinkestry.co.za': [] },
    processedMessageIds: [],
    pendingApprovals: [],
    history: []
  };
}

export function saveMasterState(state: MasterInboxState): void {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

export async function resolveHostWithFallback(hostname: string): Promise<string> {
  try {
    const res = await dns.promises.lookup(hostname);
    if (res && res.address) return res.address;
  } catch {}

  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    const addresses = await resolver.resolve4(hostname);
    if (addresses && addresses.length > 0) return addresses[0];
  } catch {}

  if (hostname === 'mail.myacc.co.za' || hostname === 'mail.thinkestry.co.za') return '169.239.218.67';
  return hostname;
}

// ----------------- Classification Engine -----------------

export function classifyEmail(parsed: ParsedMail, isExecutiveInbox: boolean = false): { category: TriageCategory; confidence: number; reason: string; orderId?: string } {
  const subject = (parsed.subject || '').trim();
  const fromAddr = (parsed.from?.value?.[0]?.address || '').toLowerCase();
  const text = (parsed.text || parsed.html || '').toString().toLowerCase();

  // Strict Loop Protection for Executive Inbox (kev@thinkestry.co.za)
  if (isExecutiveInbox) {
    if (
      fromAddr === 'no_reply@myacc.co.za' ||
      fromAddr === 'info@myacc.co.za' ||
      fromAddr === 'kev@thinkestry.co.za' ||
      subject.includes('[Master Inbox Briefing]') ||
      subject.includes('Master Inbox Briefing') ||
      subject.includes('[Executive Review]')
    ) {
      return {
        category: 'SYSTEM_RECEIPT',
        confidence: 1.0,
        reason: 'Loop Protection: Ignored self-sent briefing / review alert'
      };
    }

    // Personal / Non-business email protection (leave untouched in inbox)
    const personalKeywords = ['medical aid', 'vitality', 'gym', 'newsletter', 'uber receipt', 'vodacom account'];
    if (personalKeywords.some(kw => text.includes(kw) || subject.toLowerCase().includes(kw)) && !subject.match(/#\d{4,6}/)) {
      return {
        category: 'PERSONAL_PRIVATE',
        confidence: 0.90,
        reason: 'Personal correspondence / personal receipt (left untouched in INBOX)'
      };
    }
  }

  // 0. System Receipts & Internal Order Assignment Alerts
  if (
    fromAddr === 'noreply@payfast.io' ||
    (fromAddr === 'no_reply@myacc.co.za' && subject.startsWith('New Order Assigned:')) ||
    subject.startsWith('You received R') ||
    text.includes('payment received notification')
  ) {
    return {
      category: 'SYSTEM_RECEIPT',
      confidence: 0.99,
      reason: 'Automated bank receipt or internal order assignment alert'
    };
  }

  // 1. Regulator Notices (CIPC, NCR, SARS, Labour)
  if (
    fromAddr.endsWith('@cipc.co.za') ||
    fromAddr.endsWith('@ncr.org.za') ||
    fromAddr.endsWith('@sars.gov.za') ||
    fromAddr.endsWith('@labour.gov.za')
  ) {
    const orderMatch = subject.match(/#(\d{4,6})/);
    return {
      category: 'REGULATOR_NOTICE',
      confidence: 0.98,
      reason: `Statutory regulator domain (${fromAddr})`,
      orderId: orderMatch ? orderMatch[1] : undefined
    };
  }

  // 2. Active Order Note Notifications / Client uploads
  const orderSubjectMatch = subject.match(/(?:New Note on Order|Order)\s*#?(\d{4,6})/i);
  if (orderSubjectMatch) {
    return {
      category: 'ACTIVE_ORDER_UPDATE',
      confidence: 0.95,
      reason: `Order reference #${orderSubjectMatch[1]} in subject`,
      orderId: orderSubjectMatch[1]
    };
  }

  // 3. Spam & Unsolicited Marketing
  const spamKeywords = [
    'seo ranking', 'first page of google', 'guest post', 'backlinks', 'crypto investment',
    'lead generation service', 'offshore development', 'outsource your', 'web development agency',
    'hire developers', 'pbn', 'domain authority', 'da/dr'
  ];
  if (spamKeywords.some(kw => text.includes(kw) || subject.toLowerCase().includes(kw))) {
    return {
      category: 'SPAM_SOLICITATION',
      confidence: 0.92,
      reason: 'Detected cold marketing/SEO solicitation keywords'
    };
  }

  // 4. SARS Tax Debt Compromise
  if (
    text.includes('debt compromise') ||
    text.includes('tax debt') ||
    text.includes('compromise of tax') ||
    text.includes('section 200') ||
    subject.toLowerCase().includes('tax debt')
  ) {
    return {
      category: 'SARS_DEBT_COMPROMISE',
      confidence: 0.90,
      reason: 'SARS tax debt compromise / Section 200 inquiry'
    };
  }

  // 5. Accounting & Bookkeeping Retainer
  if (
    text.includes('monthly accounting') ||
    text.includes('monthly bookkeeping') ||
    text.includes('management accounts') ||
    text.includes('monthly retainer') ||
    text.includes('payroll services')
  ) {
    return {
      category: 'RETAINER_INQUIRY',
      confidence: 0.88,
      reason: 'Monthly accounting or payroll retainer inquiry'
    };
  }

  // 6. Fixed Catalog Inquiries (Pty Ltd, CIDB, Tax Clearance, etc.)
  const catalogKeywords = [
    'company registration', 'register a company', 'pty ltd', 'tax clearance', 'tcs pin',
    'cidb', 'coida', 'letter of good standing', 'vat registration', 'import licence',
    'export licence', 'external company', 'beneficial ownership', 'non-profit', 'npc'
  ];
  if (catalogKeywords.some(kw => text.includes(kw) || subject.toLowerCase().includes(kw))) {
    return {
      category: 'CATALOG_INQUIRY',
      confidence: 0.85,
      reason: 'Standard fixed catalog service match'
    };
  }

  // 7. General Consultation fallback
  return {
    category: 'GENERAL_CONSULTATION',
    confidence: 0.70,
    reason: 'Inquiry requires general advisory or manual scoping'
  };
}

// ----------------- SMTP Dispatcher -----------------

async function sendExecutiveBriefingEmail(pendingCount: number, markdownContent: string): Promise<void> {
  const host = process.env.SMTP_HOST || 'mail.myacc.co.za';
  const resolvedHost = await resolveHostWithFallback(host);
  const user = process.env.SMTP_USER || 'no_reply@myacc.co.za';
  const pass = process.env.SMTP_PASS || 'MikeOxlong10$';

  const transporter = nodemailer.createTransport({
    host: resolvedHost,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false, servername: host }
  });

  const subject = `[Master Inbox Briefing] ${pendingCount} Action(s) Pending Your Review`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; color: #1e293b;">
      <div style="background: #0f172a; padding: 20px; border-radius: 8px 8px 0 0; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px;">📬 My Accountant — Master Inbox Briefing</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">${new Date().toLocaleString('en-ZA')}</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; background: #ffffff; border-radius: 0 0 8px 8px;">
        <p style="font-size: 15px; line-height: 1.5;">You have <strong>${pendingCount} item(s)</strong> awaiting your 1-click approval in Antigravity:</p>
        <pre style="background: #f8fafc; padding: 16px; border-radius: 6px; font-size: 13px; overflow-x: auto; border: 1px solid #cbd5e1; white-space: pre-wrap;">${markdownContent}</pre>
        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">Open Antigravity to execute 1-click approvals, or reply with the command.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"My Accountant Master Agent" <${user}>`,
    to: KEVIN_EMAIL,
    subject,
    html,
    text: markdownContent
  });
  console.log(`[master-inbox] Executive briefing email dispatched to ${KEVIN_EMAIL}`);
}

// ----------------- Sent Mailbox Context Checker -----------------

export interface SentEmailSummary {
  to: string;
  subject: string;
  date: Date;
  snippet: string;
}

export async function fetchRecentSentContext(connection: any): Promise<SentEmailSummary[]> {
  const sentSummaries: SentEmailSummary[] = [];
  try {
    await connection.openBox('INBOX.Sent');
    const allMsgs = await connection.search(['ALL'], { bodies: ['HEADER'], markSeen: false });
    const recentMsgs = allMsgs.slice(-150);

    for (const msg of recentMsgs) {
      const rawPart = msg.parts.find((p: any) => p.which === 'HEADER' || p.which === '');
      if (!rawPart || !rawPart.body) continue;
      try {
        const b = rawPart.body;
        const toAddr = (Array.isArray(b.to) ? b.to.join(' ') : (b.to || '')).toLowerCase();
        const subject = (Array.isArray(b.subject) ? b.subject[0] : (b.subject || '')).toString();
        const dateStr = Array.isArray(b.date) ? b.date[0] : (b.date || '');
        const date = dateStr ? new Date(dateStr) : new Date();

        sentSummaries.push({
          to: toAddr,
          subject,
          date,
          snippet: subject.slice(0, 100)
        });
      } catch {}
    }
    console.log(`   [Sent Context] Loaded ${sentSummaries.length} recent sent email(s) for cross-referencing.`);
  } catch (err: any) {
    console.warn(`   [Sent Context] Could not read INBOX.Sent: ${err.message}`);
  }
  return sentSummaries;
}

// ----------------- Main Orchestration Runner -----------------

export async function runMasterTriage(options: { dryRun?: boolean; limit?: number } = {}) {
  const { dryRun = false, limit = 25 } = options;
  console.log(`\n=============================================================`);
  console.log(`🚀 RUNNING MASTER INBOX ORCHESTRATION CYCLE (Dry-Run: ${dryRun})`);
  console.log(`=============================================================\n`);

  const state = loadMasterState();

  // info@myacc.co.za is owned by the 24/7 cloud quote agent (/api/cron/quote-agent). Polling it here
  // would race that agent and could double-reply, so only the executive inbox is handled locally.
  const mailboxes = [
    {
      name: 'Executive Intake',
      email: 'kev@thinkestry.co.za',
      pass: process.env.KEVIN_IMAP_PASS || '7In~K;EF}?7E_7p4',
      host: 'mail.thinkestry.co.za',
      port: 993,
      isExecutiveInbox: true
    }
  ];

  const processedNow: Array<{ category: TriageCategory; summary: string }> = [];
  const pendingAdded: PendingItem[] = [];

  for (const mbox of mailboxes) {
    if (!mbox.pass) {
      if (mbox.isExecutiveInbox) {
        console.log(`ℹ️ [master-inbox] Password for ${mbox.email} not configured (set KEVIN_IMAP_PASS in .env). Skipping executive inbox intake.`);
      }
      continue;
    }

    if (!state.processedUids[mbox.email]) {
      state.processedUids[mbox.email] = [];
    }

    console.log(`\n📬 Connecting to ${mbox.name} (${mbox.email})...`);
    const resolvedHost = await resolveHostWithFallback(mbox.host);

    const config = {
      imap: {
        user: mbox.email,
        password: mbox.pass,
        host: resolvedHost,
        port: mbox.port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false, servername: mbox.host },
        authTimeout: 15000
      }
    };

    let connection;
    let recentSent: SentEmailSummary[] = [];
    try {
      connection = await imapSimple.connect(config);
      recentSent = await fetchRecentSentContext(connection);
      await connection.openBox('INBOX');
    } catch (err: any) {
      console.warn(`[master-inbox] Could not connect to ${mbox.email}: ${err.message}`);
      continue;
    }

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: [''], markSeen: false, struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    console.log(`[master-inbox] Found ${messages.length} unread message(s) in ${mbox.email}.`);

    for (const msg of messages.slice(0, limit)) {
      const uid = msg.attributes.uid;
      const rawPart = msg.parts.find(p => p.which === '');
      if (!rawPart || !rawPart.body) continue;

      let parsed: ParsedMail;
      try {
        parsed = await simpleParser(rawPart.body);
      } catch {
        continue;
      }

      const messageId = parsed.messageId || '';
      if (state.processedUids[mbox.email].includes(String(uid)) || (messageId && state.processedMessageIds.includes(messageId))) {
        continue;
      }

      const classification = classifyEmail(parsed, mbox.isExecutiveInbox);
      const subject = parsed.subject || '(No Subject)';
      const sender = parsed.from?.value?.[0]?.address || 'unknown';
      const msgDate = parsed.date || new Date();

      // Check Sent email context for this sender or order
      const matchingSent = recentSent.filter(s =>
        (sender && s.to.includes(sender.toLowerCase())) ||
        (classification.orderId && s.subject.includes(classification.orderId))
      );
      const latestSent = matchingSent.length > 0 ? matchingSent[matchingSent.length - 1] : null;
      const alreadyReplied = latestSent && latestSent.date > msgDate;

      if (alreadyReplied && mbox.isExecutiveInbox) {
        processedNow.push({
          category: 'SYSTEM_RECEIPT',
          summary: `[REPLIED] ${sender} — "${subject}" (You already replied on ${latestSent.date.toLocaleDateString()})`
        });
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
        }
        continue;
      }

      console.log(`📧 [${mbox.email}] [UID ${uid}] [${classification.category}] From: ${sender} | Subject: "${subject}"${latestSent ? ` (Sent Context: Prior reply on ${latestSent.date.toLocaleDateString()})` : ''}`);

      // Handle by category
      if (classification.category === 'PERSONAL_PRIVATE') {
        processedNow.push({
          category: 'PERSONAL_PRIVATE',
          summary: `[PERSONAL] ${sender} — "${subject}" (Untouched in INBOX)`
        });
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
        }
      } else if (classification.category === 'SYSTEM_RECEIPT') {
        processedNow.push({
          category: 'SYSTEM_RECEIPT',
          summary: `[SYSTEM] ${sender} — "${subject}" (${mbox.isExecutiveInbox ? 'Ignored loop' : 'Silently archived'})`
        });
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
          if (!mbox.isExecutiveInbox) {
            try {
              await connection.moveMessage(uid, 'INBOX.Archive');
            } catch {}
          }
        }
      } else if (classification.category === 'SPAM_SOLICITATION') {
        processedNow.push({
          category: 'SPAM_SOLICITATION',
          summary: `[SPAM] ${sender} — "${subject}" (Archived)`
        });
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
          try {
            await connection.moveMessage(uid, 'INBOX.Archive');
          } catch {}
        }
      } else if (classification.category === 'ACTIVE_ORDER_UPDATE' && classification.orderId) {
        const orderId = classification.orderId;

        // Verify Order status in Firestore before creating review item
        let isOrderCompleted = false;
        let orderServiceName = '';
        try {
          const db = getAdminDb();
          const orderSnap = await db.collection('orders').doc(orderId).get();
          if (orderSnap.exists) {
            const orderData = orderSnap.data();
            const status = (orderData?.status || '').toLowerCase();
            const fulfillment = (orderData?.fulfillmentStatus || '').toLowerCase();
            orderServiceName = orderData?.items?.[0]?.name || orderData?.serviceName || '';

            if (status === 'completed' || status === 'cancelled' || fulfillment === 'completed') {
              isOrderCompleted = true;
              console.log(`ℹ️ [master-inbox] Order #${orderId} is already marked ${orderData?.status || orderData?.fulfillmentStatus}. Silently archiving.`);
            }
          }
        } catch (e: any) {
          console.warn(`[master-inbox] Could not check order status in Firestore: ${e.message}`);
        }

        if (isOrderCompleted) {
          processedNow.push({
            category: 'SYSTEM_RECEIPT',
            summary: `[COMPLETED ORDER] Order #${orderId} notification (${sender}) — Order already completed.`
          });
          if (!dryRun) {
            state.processedUids[mbox.email].push(String(uid));
            if (messageId) state.processedMessageIds.push(messageId);
            try {
              await connection.moveMessage(uid, 'INBOX.Archive');
            } catch {}
          }
          continue;
        }

        const pending: PendingItem = {
          id: `order_${orderId}_${Date.now()}`,
          mailbox: mbox.email,
          category: 'ACTIVE_ORDER_UPDATE',
          subject,
          sender,
          orderId,
          proposedAction: orderServiceName
            ? `Execute statutory audit & compile PDF deliverables for ${orderServiceName} (Order #${orderId})`
            : `Execute statutory audit & compile PDF deliverables for Order #${orderId}`,
          approvalCommand: `approve-order ${orderId}`,
          details: `Arrived at ${mbox.email}. Client update for Order #${orderId}${orderServiceName ? ` (${orderServiceName})` : ''}.`,
          createdAt: new Date().toISOString(),
          status: 'PENDING'
        };
        pendingAdded.push(pending);
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
          state.pendingApprovals.push(pending);
        }
      } else if (classification.category === 'REGULATOR_NOTICE') {
        const pending: PendingItem = {
          id: `regulator_${Date.now()}`,
          mailbox: mbox.email,
          category: 'REGULATOR_NOTICE',
          subject,
          sender,
          orderId: classification.orderId,
          proposedAction: `Inspect regulator notice from ${sender} (0 auto-reply)`,
          approvalCommand: `review-regulator ${sender}`,
          details: `Statutory notice from ${sender} received at ${mbox.email}. Cross-check against active filings.`,
          createdAt: new Date().toISOString(),
          status: 'PENDING'
        };
        pendingAdded.push(pending);
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
          state.pendingApprovals.push(pending);
        }
      } else if (classification.category === 'RETAINER_INQUIRY') {
        const pending: PendingItem = {
          id: `retainer_${Date.now()}`,
          mailbox: mbox.email,
          category: 'RETAINER_INQUIRY',
          subject,
          sender,
          proposedAction: `Prepare Retainer Scoping Questionnaire and set monthly quote fee`,
          approvalCommand: `scope-retainer ${sender}`,
          details: `Client inquiring about monthly accounting/payroll retainers. Scoping questionnaire drafted.`,
          createdAt: new Date().toISOString(),
          status: 'PENDING'
        };
        pendingAdded.push(pending);
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
          state.pendingApprovals.push(pending);
        }
      } else if (classification.category === 'CATALOG_INQUIRY' && !mbox.isExecutiveInbox) {
        processedNow.push({
          category: 'CATALOG_INQUIRY',
          summary: `[CATALOG] ${sender} — "${subject}" (Standard catalog auto-quote prepared)`
        });
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
        }
      } else {
        const pending: PendingItem = {
          id: `consult_${Date.now()}`,
          mailbox: mbox.email,
          category: 'GENERAL_CONSULTATION',
          subject,
          sender,
          proposedAction: `Review non-standard inquiry / advisory scope`,
          approvalCommand: `review-consultation ${sender}`,
          details: `Client inquiry received at ${mbox.email}. Requires Kevin's evaluation.`,
          createdAt: new Date().toISOString(),
          status: 'PENDING'
        };
        pendingAdded.push(pending);
        if (!dryRun) {
          state.processedUids[mbox.email].push(String(uid));
          if (messageId) state.processedMessageIds.push(messageId);
          state.pendingApprovals.push(pending);
        }
      }
    }

    try {
      await connection.end();
    } catch {}
  }

  if (!dryRun) {
    state.lastChecked = new Date().toISOString();
    saveMasterState(state);
    try {
      const { writeDashboardFiles } = require('./generate_dashboard');
      writeDashboardFiles();
    } catch {}
  }

  // ----------------- Generate Master Briefing Artifact -----------------
  console.log(`\n=============================================================`);
  console.log(`📊 MASTER INBOX BRIEFING SUMMARY`);
  console.log(`=============================================================\n`);

  let briefingMd = `# 📬 Master Inbox Briefing — ${new Date().toLocaleString('en-ZA')}\n\n`;

  briefingMd += `### 🟢 Processed Autonomously (${processedNow.length})\n`;
  if (processedNow.length === 0) {
    briefingMd += `*No autonomous actions taken during this cycle.*\n\n`;
  } else {
    for (const item of processedNow) {
      briefingMd += `- ${item.summary}\n`;
    }
    briefingMd += `\n`;
  }

  const activePending = state.pendingApprovals.filter(p => p.status === 'PENDING');
  briefingMd += `### 🟡 Pending Your Approval (${activePending.length})\n`;
  if (activePending.length === 0) {
    briefingMd += `*All queues clear. No pending items requiring approval.*\n\n`;
  } else {
    activePending.forEach((item, idx) => {
      briefingMd += `${idx + 1}. **[${item.category}] ${item.subject}**\n`;
      briefingMd += `   - *Sender*: \`${item.sender}\`${item.orderId ? ` | *Order*: #${item.orderId}` : ''}\n`;
      briefingMd += `   - *Proposed Action*: ${item.proposedAction}\n`;
      briefingMd += `   - *1-Click Command*: \`npx tsx .agents/skills/master-inbox-agent/scripts/master_orchestrator.ts --${item.approvalCommand}\`\n\n`;
    });
  }

  console.log(briefingMd);

  // If there are newly added pending items, dispatch executive review email to Kevin
  if (!dryRun && pendingAdded.length > 0) {
    try {
      await sendExecutiveBriefingEmail(activePending.length, briefingMd);
    } catch (e: any) {
      console.error(`[master-inbox] Failed to dispatch review email: ${e.message}`);
    }
  }
}

// ----------------- Command Line Interface -----------------

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--dry-run')) {
    await runMasterTriage({ dryRun: true });
    return;
  }

  if (args.includes('--run')) {
    await runMasterTriage({ dryRun: false });
    return;
  }

  if (args.includes('--summary')) {
    const state = loadMasterState();
    const pending = state.pendingApprovals.filter(p => p.status === 'PENDING');
    console.log(`\n📋 Current Pending Approvals: ${pending.length}`);
    pending.forEach((p, i) => {
      console.log(`${i + 1}. [${p.category}] ${p.subject} (Order: ${p.orderId || 'N/A'}) -> Command: ${p.approvalCommand}`);
    });
    return;
  }

  const approveOrderIdx = args.indexOf('--approve-order');
  if (approveOrderIdx !== -1 && args[approveOrderIdx + 1]) {
    const orderId = args[approveOrderIdx + 1];
    console.log(`[master-inbox] Approving Order #${orderId}...`);
    try {
      execSync(`npx tsx src/lib/agent/order-audit-pipeline.ts --order-id ${orderId} --approve-and-post`, { stdio: 'inherit' });
      const state = loadMasterState();
      for (const item of state.pendingApprovals) {
        if (item.orderId === orderId) item.status = 'APPROVED';
      }
      saveMasterState(state);
      try {
        const { writeDashboardFiles } = require('./generate_dashboard');
        writeDashboardFiles();
      } catch {}
      console.log(`✅ Order #${orderId} approved and deliverables committed to portal!`);
    } catch (e: any) {
      console.error(`❌ Failed to approve order #${orderId}: ${e.message}`);
    }
    return;
  }

  console.log(`
Usage:
  npx tsx master_orchestrator.ts --run            Run complete master triage cycle
  npx tsx master_orchestrator.ts --dry-run        Safe preview without modifying state
  npx tsx master_orchestrator.ts --summary        Print current pending approvals
  npx tsx master_orchestrator.ts --approve-order <ID>  Approve & commit order deliverables
  `);
}

if (require.main === module) {
  main().catch(err => {
    console.error('[master-inbox] Unhandled fatal error:', err);
    process.exit(1);
  });
}
