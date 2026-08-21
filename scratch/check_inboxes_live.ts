import * as dotenv from 'dotenv';
import * as path from 'path';
const { ImapFlow } = require('C:/Users/kev/.gemini/antigravity/scratch/node_modules/imapflow');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const accounts = [
  {
    name: 'Kevin (Thinkestry)',
    host: 'mail.myacc.co.za',
    port: 993,
    user: 'kev@thinkestry.co.za',
    pass: '7In~K;EF}?7E_7p4',
  },
  {
    name: 'My Accountant Info',
    host: process.env.IMAP_HOST || 'mail.myacc.co.za',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    user: process.env.IMAP_USER || 'no_reply@myacc.co.za',
    pass: (process.env.IMAP_PASS || process.env.SMTP_PASS || '').trim().replace(/^["']|["']$/g, ''),
  }
];

async function checkAccount(acc: typeof accounts[0]) {
  console.log(`\n======================================================`);
  console.log(`Connecting to ${acc.name} (${acc.user}@${acc.host})...`);
  console.log(`======================================================`);

  const client = new ImapFlow({
    host: acc.host,
    port: acc.port,
    secure: true,
    auth: {
      user: acc.user,
      pass: acc.pass,
    },
    logger: false,
  });

  try {
    await client.connect();
    console.log(`✓ Successfully authenticated to ${acc.user}`);

    const lock = await client.getMailboxLock('INBOX');
    try {
      const status = await client.status('INBOX', { messages: true, unseen: true });
      console.log(`INBOX Status: ${status.messages} total message(s), ${status.unseen} unread.\n`);

      // Fetch 10 most recent messages
      const messages: any[] = [];
      for await (const message of client.fetch('1:*', {
        envelope: true,
        flags: true,
        internalDate: true,
        source: false,
      })) {
        messages.push(message);
      }

      const recent = messages.slice(-10).reverse();
      console.log(`--- 10 Most Recent Emails in ${acc.user} ---`);
      for (const msg of recent) {
        const from = msg.envelope?.from?.[0]?.address || msg.envelope?.from?.[0]?.name || 'Unknown';
        const subj = msg.envelope?.subject || '(No Subject)';
        const date = msg.envelope?.date ? new Date(msg.envelope.date).toLocaleString() : 'Unknown Date';
        const isSeen = msg.flags.has('\\Seen') ? 'READ' : 'UNREAD';
        console.log(`• [${isSeen}] [${date}] From: ${from} | Subject: "${subj}"`);
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err: any) {
    console.error(`✗ Error checking ${acc.user}:`, err.message);
  }
}

async function main() {
  for (const acc of accounts) {
    if (!acc.pass) {
      console.log(`Skipping ${acc.name} (no password configured)`);
      continue;
    }
    await checkAccount(acc);
  }
}

main().catch(console.error);
