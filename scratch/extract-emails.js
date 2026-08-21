const fs = require('fs');
const files = [
  'src/app/actions/admin-users.ts', 
  'src/app/actions/chat-actions.ts', 
  'src/app/actions/email-actions.ts', 
  'src/app/actions/emailBatchPayslips.ts', 
  'src/app/actions/invite-partner.ts', 
  'src/app/actions/notifications.ts', 
  'src/app/actions/order-actions.ts', 
  'src/app/actions/payroll-portal.ts', 
  'src/app/actions/staff.ts', 
  'src/app/actions/wallet-actions.ts', 
  'src/app/api/contact/route.ts', 
  'src/app/api/webhooks/payfast/route.ts'
]; 

files.forEach(f => { 
  try { 
    const code = fs.readFileSync(f, 'utf8'); 
    const matches = [...code.matchAll(/sendEmail\(\{[\s\S]*?subject:\s*([^\n,]+)/g)]; 
    if(matches.length > 0) { 
      console.log('\n--- ' + f + ' ---'); 
      matches.forEach(m => console.log('SUBJECT:', m[1].trim())); 
    } 
  } catch(e) { console.error(e) } 
});
