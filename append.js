const fs = require('fs');
const data = `
export async function updateGlobalMerchantDb({ merchantKey, accountId, accountType, vatType, requestorId }: { merchantKey: string, accountId: string, accountType: string, vatType: string, requestorId?: string }) {
    const authCtx = await getAuthContext(requestorId as string);
    if (!authCtx) throw new Error('Unauthorized');
    if (!authCtx.isAdmin && !authCtx.isPartner) throw new Error('Unauthorized');

    if (!merchantKey) return;
    
    const adminDb = getAdminDb();
    await adminDb.collection('globalMerchantDb').doc(merchantKey).set({
        merchantKey,
        accountId,
        accountType,
        vatType,
        updatedAt: FieldValue.serverTimestamp(),
        learningSource: 'human_review'
    }, { merge: true });
}
`;
// find the dummy updateGlobalMerchantDb and replace it
let content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');
content = content.replace(/export async function updateGlobalMerchantDb\(data: any\) {\s*console\.log\("Global DB Update:", data\);\s*}/g, data);
fs.writeFileSync('src/app/actions/ai-recon.ts', content);
