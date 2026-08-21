import {
  generateNcrForm2Draft,
  generateNcrDirectorResolutionDraft,
  generateNcrAnnexureFeesDraft,
  generateShareCertificateDraft,
  generatePowerOfAttorneyResolutionDraft,
} from '../src/lib/pdf/template-generators';
import * as fs from 'fs';
import * as path from 'path';

async function testGeneration() {
  const sampleOrder = {
    id: '9854',
    customerName: 'Christopher Selolo',
    customerEmail: 'chrisselolo@gmail.com',
    customerPhone: '078 082 2247',
    items: [{ id: 'ncr_reg', title: 'NCR Registration', price: 1400, quantity: 1 }],
    status: 'Processing',
    date: new Date('2026-08-19'),
    documentUploads: [
      { requirementLabel: 'Company Name', textValue: 'LESIBA FINANCIAL SERVICES (PTY) LTD' },
      { requirementLabel: 'Registration Number', textValue: '2026/022212/07' },
      { requirementLabel: 'ID Number', textValue: '8504125289081' },
      { requirementLabel: 'Address', textValue: 'Stand No 412, Zone 1, Seshego, Polokwane, Limpopo, 0742' },
      { requirementLabel: 'Tax Number', textValue: '9329460225' },
    ],
  };

  const outputDir = path.resolve('./scratch/test_generated_templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating NCR Form 2...');
  const f2 = await generateNcrForm2Draft(sampleOrder as any);
  fs.writeFileSync(path.join(outputDir, f2.fileName), f2.buffer);

  console.log('Generating Director Resolution...');
  const res = await generateNcrDirectorResolutionDraft(sampleOrder as any);
  fs.writeFileSync(path.join(outputDir, res.fileName), res.buffer);

  console.log('Generating Annexure of Fees...');
  const fee = await generateNcrAnnexureFeesDraft(sampleOrder as any);
  fs.writeFileSync(path.join(outputDir, fee.fileName), fee.buffer);

  console.log('Generating Share Certificate...');
  const sc = await generateShareCertificateDraft(sampleOrder as any);
  fs.writeFileSync(path.join(outputDir, sc.fileName), sc.buffer);

  console.log('Generating Power of Attorney...');
  const poa = await generatePowerOfAttorneyResolutionDraft(sampleOrder as any);
  fs.writeFileSync(path.join(outputDir, poa.fileName), poa.buffer);

  console.log('All 5 templates generated successfully in:', outputDir);
}

testGeneration().catch(console.error);
