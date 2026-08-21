import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { outsourceOrderFromWallet } from '../src/app/actions/wallet-actions';

async function test() {
  const partnerId = 'Fs5UYnpDBFVJfs6j7nMelYDxsnl2';
  const orderId = '10139';

  console.log('Running outsourceOrderFromWallet...');
  try {
    const result = await outsourceOrderFromWallet(orderId, partnerId, 'partner');
    console.log('Result:', result);
  } catch (err) {
    console.error('Caught error during execution:', err);
  }
}

test().catch(console.error);
