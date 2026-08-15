import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function runTests() {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  // Initialize the test environment using the Firestore Emulator
  const testEnv = await initializeTestEnvironment({
    projectId: 'my-accountant-test',
    firestore: {
      rules: rulesContent,
      host: '127.0.0.1',
      port: 8080
    }
  });

  console.log("\n=========================================");
  console.log("RUNNING FIRESTORE SECURITY RULES TESTS");
  console.log("=========================================\n");

  // Create simulated user contexts
  const guestDb = testEnv.unauthenticatedContext().firestore();
  const clientDb = testEnv.authenticatedContext('client_user_123', { email: 'client@myacc.co.za' }).firestore();
  
  // Admin requires checking a user document. Seed database to enable helper functions.
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    // Seed admin profile
    await setDoc(doc(db, 'users', 'admin_user_456'), {
      role: 'admin',
      email: 'admin@myacc.co.za'
    });
    // Seed partner profile
    await setDoc(doc(db, 'users', 'partner_user_789'), {
      role: 'partner',
      email: 'partner@myacc.co.za',
      partnerId: 'partner_user_789',
      isActive: true
    });
  });

  const adminDb = testEnv.authenticatedContext('admin_user_456', { email: 'admin@myacc.co.za' }).firestore();
  const partnerDb = testEnv.authenticatedContext('partner_user_789', { email: 'partner@myacc.co.za' }).firestore();

  let passed = 0;
  let failed = 0;

  async function assertRule(name: string, promise: Promise<any>, shouldSucceed: boolean) {
    try {
      if (shouldSucceed) {
        await assertSucceeds(promise);
      } else {
        await assertFails(promise);
      }
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`[FAIL] ${name}`);
      console.error(`       Error: ${e.message || e}`);
      failed++;
    }
  }

  // --- Collection: users ---
  await assertRule(
    "Guest cannot read users collection",
    getDoc(doc(guestDb, 'users', 'client_user_123')),
    false
  );

  await assertRule(
    "Guest cannot write to users collection",
    setDoc(doc(guestDb, 'users', 'new_user'), { email: 'guest@myacc.co.za' }),
    false
  );

  await assertRule(
    "Authenticated client can read their own user profile",
    getDoc(doc(clientDb, 'users', 'client_user_123')),
    true
  );

  await assertRule(
    "Authenticated client cannot read an unrelated user's profile",
    getDoc(doc(clientDb, 'users', 'partner_user_789')),
    false
  );

  await assertRule(
    "Authenticated client can write their own user profile",
    setDoc(doc(clientDb, 'users', 'client_user_123'), { name: 'Test Client', email: 'client@myacc.co.za' }),
    true
  );

  await assertRule(
    "Authenticated client cannot write another user's profile",
    setDoc(doc(clientDb, 'users', 'partner_user_789'), { name: 'Hacked Partner' }),
    false
  );

  await assertRule(
    "Authenticated client CANNOT self-escalate role to admin",
    setDoc(doc(clientDb, 'users', 'client_user_123'), { role: 'admin' }, { merge: true }),
    false
  );

  await assertRule(
    "Authenticated client CANNOT self-escalate role to partner directly",
    setDoc(doc(clientDb, 'users', 'client_user_123'), { role: 'partner' }, { merge: true }),
    false
  );

  await assertRule(
    "Authenticated client CAN self-set role to 'client' (normal signup)",
    setDoc(doc(clientDb, 'users', 'client_user_123'), { role: 'client', name: 'Test Client' }, { merge: true }),
    true
  );

  await assertRule(
    "Authenticated client cannot self-write privileged fields (permissions/creditBalance/etc.)",
    setDoc(doc(clientDb, 'users', 'client_user_123'), { creditBalance: 999999 }, { merge: true }),
    false
  );

  // --- Collection: orders ---
  await assertRule(
    "Guest cannot read orders",
    getDoc(doc(guestDb, 'orders', 'order_abc')),
    false
  );

  await assertRule(
    "Guest cannot create orders (even with status Pending Payment)",
    setDoc(doc(guestDb, 'orders', 'order_abc'), { status: 'Pending Payment', total: 100 }),
    false
  );

  // Order creation is deliberately restricted to Admin/Staff (or a caller with the
  // "Manage Orders" module) — regular checkout creates orders server-side via the Admin SDK,
  // which bypasses these rules entirely. A plain authenticated client should NOT be able to
  // create an order directly through the client SDK.
  await assertRule(
    "Authenticated client (no admin role) cannot create an order directly",
    setDoc(doc(clientDb, 'orders', 'order_abc'), { status: 'Pending Payment', userId: 'client_user_123', total: 100 }),
    false
  );

  await assertRule(
    "Admin can create an order with status 'Pending Payment'",
    setDoc(doc(adminDb, 'orders', 'order_admin_abc'), { status: 'Pending Payment', userId: 'client_user_123', total: 100 }),
    true
  );

  await assertRule(
    "Authenticated client cannot create an order with status 'Completed'",
    setDoc(doc(clientDb, 'orders', 'order_abc'), { status: 'Completed', userId: 'client_user_123', total: 100 }),
    false
  );

  // --- Collection: sequences ---
  await assertRule(
    "Guest cannot read or write sequences (order ID counter)",
    setDoc(doc(guestDb, 'sequences', 'orders'), { current: 9500 }),
    false
  );

  // --- Collection: leads (demoLeads & cvLeads) ---
  await assertRule(
    "Guest can write to demoLeads",
    setDoc(doc(guestDb, 'demoLeads', 'lead_abc'), { email: 'test@myacc.co.za', name: 'John' }),
    true
  );

  await assertRule(
    "Guest can write to cvLeads",
    setDoc(doc(guestDb, 'cvLeads', 'lead_abc'), { email: 'test@myacc.co.za', name: 'John' }),
    true
  );

  // --- Collection: chatbotConversations ---
  await assertRule(
    "Guest can read, create, and update chatbot conversations",
    setDoc(doc(guestDb, 'chatbotConversations', 'chat_abc'), { messages: [], mode: 'ai' }),
    true
  );

  console.log("\n=========================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("=========================================\n");

  await testEnv.cleanup();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
