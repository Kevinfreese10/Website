import { PayrollService } from './src/services/PayrollService';

const targetNet = 25000;
const gross = PayrollService.calculateGrossFromNet(targetNet, 'March 2026', 12, undefined, '8001015009087');
const paye = PayrollService.calculatePaye(gross, 'March 2026', 12, undefined, '8001015009087');
const uif = PayrollService.calculateUif(gross, 'March 2026', 12);

const actualNet = gross - paye - uif;

console.log(`Target Net: ${targetNet}`);
console.log(`Gross: ${gross}`);
console.log(`PAYE: ${paye}`);
console.log(`UIF: ${uif}`);
console.log(`Actual Net: ${actualNet}`);
console.log(`Difference: ${Math.abs(targetNet - actualNet)}`);
