import { getAdminDb } from '@/lib/firebase-admin';
import AcceptInviteForm from './AcceptInviteForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function PartnerInvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const db = getAdminDb();
    
    const inviteDoc = await db.collection('partnerInvites').doc(token).get();
    
    let isValid = false;
    let inviteData = null;
    
    if (inviteDoc.exists) {
        inviteData = inviteDoc.data();
        const expiresAt = inviteData?.expiresAt?.toDate?.() || new Date(inviteData?.expiresAt);
        if (inviteData?.status === 'pending' && expiresAt > new Date()) {
            isValid = true;
        }
    }

    if (!isValid || !inviteData) {
        return (
            <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-destructive/20 shadow-xl">
                    <CardHeader className="bg-destructive/5 border-b border-destructive/10 rounded-t-lg text-center">
                        <Badge variant="destructive" className="w-fit mx-auto mb-2 uppercase font-black text-[10px] tracking-widest">Invalid</Badge>
                        <CardTitle className="text-destructive font-black text-2xl">Invite Expired or Invalid</CardTitle>
                    </CardHeader>
                    <CardContent className="py-8 space-y-6 text-center">
                        <div className="flex justify-center text-destructive">
                            <AlertCircle className="h-16 w-16" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            This invitation link is invalid, has already been accepted, or has expired after the 72-hour limit.
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                            Please contact your practice owner to request a new invitation.
                        </p>
                        <div className="pt-4">
                            <Button className="w-full" asChild>
                                <Link href="/login">Go to Login</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Serialize invite data for the client component
    const serializedInvite = {
        id: inviteDoc.id,
        partnerId: inviteData.partnerId,
        partnerName: inviteData.partnerName,
        partnerCompanyName: inviteData.partnerCompanyName,
        invitedEmail: inviteData.invitedEmail,
        staffRole: inviteData.staffRole,
        permissions: inviteData.permissions,
        token: inviteData.token,
        status: inviteData.status,
    };

    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
            <AcceptInviteForm invite={serializedInvite as any} />
        </div>
    );
}
