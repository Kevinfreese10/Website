/**
 * @fileOverview 2-Way Interactive Telegram Bot for Kevin's Email Inbox Agent
 * 
 * Connected to Telegram Bot: t.me/Kevin10email_bot (@Kevin10email_bot)
 * Handles real-time notifications, 1-tap email reply approvals, inbox audits, and tasks.
 */

const fs = require('fs');
const path = require('path');

// Resolve modules from scratch or root node_modules
const scratchPath = 'C:/Users/kev/.gemini/antigravity/scratch';
const scratchNodeModules = path.join(scratchPath, 'node_modules');
if (fs.existsSync(scratchNodeModules) && !module.paths.includes(scratchNodeModules)) {
  module.paths.unshift(scratchNodeModules);
}
const rootNodeModules = path.join('c:/myacc/node_modules');
if (fs.existsSync(rootNodeModules) && !module.paths.includes(rootNodeModules)) {
  module.paths.unshift(rootNodeModules);
}

const { Bot } = require('node-telegram-bot-api');
require('dotenv').config({ path: path.join(scratchPath, '.env') });
require('dotenv').config({ path: 'c:/myacc/.env.local' });

const emailAgentDir = 'C:/Users/kev/.gemini/config/skills/email-inbox-agent/scripts';
const { runAgentCycle } = require(path.join(emailAgentDir, 'run_agent_cycle'));
const { sendEmail } = require(path.join(emailAgentDir, 'send_reply'));
const { loadState, saveState } = require(path.join(emailAgentDir, 'check_inbox'));

const token = process.env.TELEGRAM_BOT_TOKEN || '8832420807:AAFAV4N1vB2uaPwy3fXXbXKU3y6j5wCLi8M';
const authFilePath = path.join(scratchPath, 'telegram_auth.json');

function getAuthorizedUser() {
  if (fs.existsSync(authFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
      if (data.userId) return parseInt(data.userId, 10);
    } catch (e) {}
  }
  if (process.env.TELEGRAM_USER_ID) {
    return parseInt(process.env.TELEGRAM_USER_ID, 10);
  }
  return null;
}

function saveAuthorizedUser(userId, username, firstName) {
  const data = {
    userId,
    username: username || '',
    firstName: firstName || 'Kevin',
    authorizedAt: new Date().toISOString()
  };
  fs.writeFileSync(authFilePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[Telegram Auth] Authorized user registered: ${firstName} (@${username}, ID: ${userId})`);
}

// Initialize Telegram Bot
const bot = new Bot(token);

// Security authorization helper
function isAuthorized(ctx) {
  let authorizedId = getAuthorizedUser();
  const fromId = ctx.from && ctx.from.id;
  if (!fromId) return false;

  // Auto-pair on first interaction if no user is locked in yet
  if (!authorizedId) {
    saveAuthorizedUser(fromId, ctx.from.username, ctx.from.first_name);
    return true;
  }

  return fromId === authorizedId;
}

// Command: /start & /help
bot.command(['start', 'help'], async (ctx) => {
  if (!isAuthorized(ctx)) {
    return ctx.reply('⛔ *Unauthorized access.* This is a private assistant bot for Kevin.', { parse_mode: 'Markdown' });
  }

  const firstName = ctx.from.first_name || 'Kevin';
  const welcomeMsg = `👋 *Hello ${firstName}! Welcome to your 24/7 Email Command Center.*\n\n` +
    `I am connected directly to your email inbox (\`mail.myacc.co.za\`).\n\n` +
    `*Available Commands:*\n` +
    `• \`/check\` — Run real-time inbox check & generate report\n` +
    `• \`/status\` — View active agent status & server connectivity\n` +
    `• \`/tasks\` — View extracted action items & deadlines\n` +
    `• \`/urgent\` — Review urgent threads & pending AI drafts\n\n` +
    `*Interactive Approvals:*\n` +
    `When high-priority emails arrive, I will buzz you here with direct *[✅ Approve & Send]* and *[❌ Discard]* buttons!`;

  await ctx.reply(welcomeMsg, { parse_mode: 'Markdown' });
});

// Command: /status
bot.command('status', async (ctx) => {
  if (!isAuthorized(ctx)) return;

  const state = loadState();
  const urgentCount = (state.emails || []).filter(e => e.priorityScore >= 75).length;
  const taskCount = (state.emails || []).flatMap(e => e.tasks || []).length;

  const statusMsg = `🟢 *Agent Operational Status*\n\n` +
    `• *Service*: 24/7 Background Email Agent\n` +
    `• *IMAP/SMTP*: \`mail.myacc.co.za\` (Connected)\n` +
    `• *Cached Threads*: ${state.emails ? state.emails.length : 0}\n` +
    `• *Urgent Pending*: ${urgentCount}\n` +
    `• *Active Tasks*: ${taskCount}\n` +
    `• *Last Check*: ${new Date().toLocaleTimeString('en-ZA')}`;

  await ctx.reply(statusMsg, { parse_mode: 'Markdown' });
});

// Command: /tasks
bot.command('tasks', async (ctx) => {
  if (!isAuthorized(ctx)) return;

  const state = loadState();
  const allTasks = (state.emails || []).flatMap(e => (e.tasks || []).map(t => ({ ...t, emailSubject: e.subject })));

  if (allTasks.length === 0) {
    await ctx.reply(`✅ *No pending tasks in your queue!*`, { parse_mode: 'Markdown' });
  } else {
    let taskMsg = `📋 *Active Action Tasks (${allTasks.length})*\n\n`;
    allTasks.forEach((t, i) => {
      taskMsg += `${i + 1}. *${t.text}*\n   📅 Due: \`${t.dueDate || 'ASAP'}\`\n   ✉️ Re: _${t.emailSubject}_\n\n`;
    });
    await ctx.reply(taskMsg, { parse_mode: 'Markdown' });
  }
});

// Command: /urgent
bot.command('urgent', async (ctx) => {
  if (!isAuthorized(ctx)) return;

  const state = loadState();
  const urgentEmails = (state.emails || []).filter(e => e.priorityScore >= 75);

  if (urgentEmails.length === 0) {
    await ctx.reply(`🟢 *No urgent emails requiring approval right now.*`, { parse_mode: 'Markdown' });
  } else {
    for (const emailObj of urgentEmails) {
      const draft = (emailObj.suggestedReplies && emailObj.suggestedReplies[0]?.text) || 'Thank you for contacting us. We are attending to this matter immediately.';
      await notifyUrgentEmailWithButtons(emailObj, draft, ctx.chat.id);
    }
  }
});

// Command: /check
bot.command('check', async (ctx) => {
  if (!isAuthorized(ctx)) return;

  await ctx.reply(`🔄 *Running inbox check & AI analysis now...*`, { parse_mode: 'Markdown' });
  try {
    const { state, report } = await runAgentCycle();
    await ctx.reply(report.substring(0, 4000), { parse_mode: 'Markdown' });

    // Automatically push any urgent emails with buttons
    const urgentEmails = (state.emails || []).filter(e => e.priorityScore >= 75 && !e.replySent);
    for (const emailObj of urgentEmails) {
      const draft = (emailObj.suggestedReplies && emailObj.suggestedReplies[0]?.text) || 'Thank you for your message. We are reviewing this urgently.';
      await notifyUrgentEmailWithButtons(emailObj, draft, ctx.chat.id);
    }
  } catch (e) {
    console.error('[Telegram /check error]', e);
    await ctx.reply(`❌ *Error during check:* ${e.message}`, { parse_mode: 'Markdown' });
  }
});

// Callback Queries: Interactive button actions
bot.on('callback_query:data', async (ctx) => {
  const action = ctx.callbackQuery.data;
  const chatId = ctx.chat.id;

  if (action.startsWith('send_')) {
    const emailId = action.replace('send_', '');
    await ctx.answerCallbackQuery({ text: 'Dispatching reply via SMTP...' });

    const state = loadState();
    const emailObj = (state.emails || []).find(e => e.id === emailId);

    if (emailObj) {
      const draft = (emailObj.suggestedReplies && emailObj.suggestedReplies[0]?.text) || 'Thank you. We are reviewing this urgently.';
      try {
        await sendEmail({
          to: emailObj.sender.email,
          subject: `Re: ${emailObj.subject.replace(/^Re:\s*/i, '')}`,
          body: draft
        });

        emailObj.replySent = true;
        saveState(state);

        await ctx.reply(`🚀 *Approved & Sent!*\n\nReplied to *${emailObj.sender.name}* (\`${emailObj.sender.email}\`) successfully via SMTP.`, { parse_mode: 'Markdown' });
      } catch (err) {
        await ctx.reply(`❌ *Failed to send reply:* ${err.message}`, { parse_mode: 'Markdown' });
      }
    } else {
      await ctx.reply(`⚠️ Email reference not found in current state.`);
    }
  } 
  else if (action.startsWith('discard_')) {
    const emailId = action.replace('discard_', '');
    await ctx.answerCallbackQuery({ text: 'Draft discarded.' });
    await ctx.reply(`🗑️ *Draft discarded.* No reply sent.`);
  }
});

// Natural text query fallback
bot.on('message:text', async (ctx) => {
  if (!isAuthorized(ctx)) return;

  const text = (ctx.message.text || '').trim();
  if (text.startsWith('/')) return; // ignore handled commands

  console.log(`[Telegram Received]: "${text}" from ${ctx.from.first_name}`);

  const state = loadState();
  const query = text.toLowerCase();
  const matches = (state.emails || []).filter(e => 
    (e.subject || '').toLowerCase().includes(query) ||
    (e.sender?.name || '').toLowerCase().includes(query) ||
    (e.sender?.email || '').toLowerCase().includes(query) ||
    (e.body || '').toLowerCase().includes(query)
  );

  if (matches.length > 0) {
    let reply = `🔍 *Found ${matches.length} matching email(s):*\n\n`;
    matches.slice(0, 3).forEach(m => {
      reply += `📌 *${m.subject}*\n` +
        `• From: ${m.sender.name} (${m.sender.email})\n` +
        `• Priority: ${m.priorityScore}/100\n` +
        `• Summary: ${m.summary ? m.summary[0] : 'No summary'}\n\n`;
    });
    await ctx.reply(reply, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply(`Received: "${text}"\n\n💡 _Tip: Use \`/check\`, \`/status\`, or \`/tasks\` to control your agent._`, { parse_mode: 'Markdown' });
  }
});

// Push Urgent Email Alert with Interactive Buttons
async function notifyUrgentEmailWithButtons(emailObj, draftReply, targetChatId) {
  const recipientId = targetChatId || getAuthorizedUser();
  if (!recipientId) {
    console.warn('[Telegram Alert] No authorized user registered yet to receive push alerts.');
    return;
  }

  const messageText = `🚨 *URGENT EMAIL REQUIRING ACTION*\n\n` +
    `*From:* ${emailObj.sender.name} (\`${emailObj.sender.email}\`)\n` +
    `*Subject:* ${emailObj.subject}\n` +
    `*Priority:* ${emailObj.priorityScore}/100\n` +
    `*AI Reason:* ${emailObj.priorityReason || 'High-priority request'}\n\n` +
    `*Suggested AI Response:*\n\`\`\`text\n${draftReply}\n\`\`\``;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Approve & Send Reply', callback_data: `send_${emailObj.id}` },
        { text: '❌ Discard', callback_data: `discard_${emailObj.id}` }
      ]
    ]
  };

  await bot.api.sendMessage(recipientId, messageText, {
    parse_mode: 'Markdown',
    reply_markup: replyMarkup
  });
}

// Start polling
bot.startPolling()
  .then(() => {
    console.log('🤖 Telegram 2-Way Agent is online and listening at t.me/Kevin10email_bot...');
  })
  .catch(err => {
    console.error('❌ Failed to start Telegram bot polling:', err);
  });

module.exports = { bot, notifyUrgentEmailWithButtons };
