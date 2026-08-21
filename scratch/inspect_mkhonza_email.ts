const { ImapFlow } = require('C:/Users/kev/.gemini/antigravity/scratch/node_modules/imapflow');
const { simpleParser } = require('C:/Users/kev/.gemini/antigravity/scratch/node_modules/mailparser');

async function fetchMkhonzaEmail() {
  const client = new ImapFlow({
    host: 'mail.myacc.co.za',
    port: 993,
    secure: true,
    auth: {
      user: 'kev@thinkestry.co.za',
      pass: '7In~K;EF}?7E_7p4',
    },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  try {
    // Search for mkhonzacashloans
    const searchResults = await client.search({ from: 'mkhonzacashloans@gmail.com' });
    console.log('Search matches for Mkhonza:', searchResults);

    for (const seq of searchResults.slice(-3)) {
      const msg = await client.download(seq);
      const parsed = await simpleParser(msg.content);
      console.log('\n=============================================');
      console.log(`SUBJECT: ${parsed.subject}`);
      console.log(`FROM: ${parsed.from?.text}`);
      console.log(`DATE: ${parsed.date}`);
      console.log(`ATTACHMENTS: ${parsed.attachments.length}`);
      parsed.attachments.forEach(a => console.log(`  - ${a.filename} (${a.size} bytes)`));
      console.log('\n--- BODY ---');
      console.log(parsed.text || parsed.html);
      console.log('=============================================\n');
    }
  } finally {
    lock.release();
    await client.logout();
  }
}

fetchMkhonzaEmail().catch(console.error);
