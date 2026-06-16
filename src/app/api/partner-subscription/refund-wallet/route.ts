import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        const callerId = decodedToken.uid;

        const db = getAdminDb();
        const callerSnap = await db.collection('users').doc(callerId).get();
        if (!callerSnap.exists || callerSnap.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { partnerId } = body;
        if (!partnerId) {
            return NextResponse.json({ error: 'Missing partnerId' }, { status: 400 });
        }

        const partnerRef = db.collection('users').doc(partnerId);
        const partnerSnap = await partnerRef.get();
        if (!partnerSnap.exists) {
            return NextResponse.json({ error: 'Partner user not found' }, { status: 404 });
        }

        const partnerData = partnerSnap.data() || {};
        const creditBalance = partnerData.creditBalance || 0;
        if (creditBalance <= 0) {
            return NextResponse.json({ error: 'Partner has no credit balance to refund' }, { status: 400 });
        }

        // 1. Create a refund document in Firestore
        const refundId = db.collection('partnerRefunds').doc().id;
        await db.collection('partnerRefunds').doc(refundId).set({
            id: refundId,
            partnerId,
            partnerName: partnerData.name || '',
            partnerCompanyName: partnerData.companyName || '',
            partnerEmail: partnerData.email || '',
            refundAmount: creditBalance,
            status: 'Processed',
            createdAt: new Date(),
            processedBy: callerId,
        });

        // 2. Zero the credit balance
        await partnerRef.update({
            creditBalance: 0
        });

        // 2.5 Create a log in walletLogs subcollection
        const walletLogRef = partnerRef.collection('walletLogs').doc();
        await walletLogRef.set({
            amount: -creditBalance,
            type: 'refund',
            description: `Practice wallet refund processed (Ref: ${refundId})`,
            date: new Date()
        });

        // 3. Send confirmation email
        try {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Practice Wallet Refund Confirmed</h2>
                    <p>Hi ${partnerData.name || 'Partner'},</p>
                    <p>This email confirms that your My Accountant practice wallet refund has been processed.</p>
                    <p><strong>Refund Details:</strong></p>
                    <ul>
                        <li><strong>Refund Amount:</strong> R${creditBalance.toFixed(2)}</li>
                        <li><strong>Reference ID:</strong> ${refundId}</li>
                        <li><strong>Status:</strong> Processed (Funds will be returned to your original payment card or bank account)</li>
                    </ul>
                    <p>Your practice wallet credit balance has been reset to zero. If you did not request this or have any questions, please contact support.</p>
                    <br/>
                    <p>Regards,</p>
                    <p>The My Accountant Team</p>
                </div>
            `;

            await sendEmail({
                to: partnerData.email,
                subject: 'Refund Confirmation: My Accountant Practice Wallet',
                html: emailHtml,
            });
        } catch (emailErr) {
            console.error('Failed to send refund confirmation email:', emailErr);
        }

        return NextResponse.json({ success: true, refundAmount: creditBalance });
    } catch (e: any) {
        console.error('Error processing refund:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
