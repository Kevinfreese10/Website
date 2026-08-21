import * as fs from 'fs';
import * as path from 'path';

async function downloadPdfs() {
  const outDir = path.resolve('c:/myacc/scratch/order_10138_audit');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. COR14.3
  const corUrl = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FhCTT7dPOdbX3Y0ExvLWRwL6sujM2%2Forders%2F10138%2F1787237824919_0_DISCLOSR__014_.pdf?alt=media&token=be832cbc-c62c-458a-95b8-7bd964bc97ff";
  const corRes = await fetch(corUrl);
  fs.writeFileSync(path.join(outDir, 'DISCLOSR_014.pdf'), Buffer.from(await corRes.arrayBuffer()));
  console.log('Downloaded DISCLOSR_014.pdf');

  // 2. Draft Accounting Officer Consent
  const aoUrl = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10138%2Fgenerated_drafts%2FAccounting_Officer_Consent_10138.pdf?alt=media&token=302e367878656f673164736f656d74316e726a7762";
  const aoRes = await fetch(aoUrl);
  fs.writeFileSync(path.join(outDir, 'Accounting_Officer_Consent_10138.pdf'), Buffer.from(await aoRes.arrayBuffer()));
  console.log('Downloaded Accounting_Officer_Consent_10138.pdf');
}

downloadPdfs().catch(console.error);
