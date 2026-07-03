
import PartnerProfile from "@/components/partner/PartnerProfile";
import PartnerAISettings from "@/components/partner/PartnerAISettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { User } from "@/lib/types";

export default async function PartnerProfilePage() {
    let partner: User | null = null;
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;
        if (sessionCookie) {
            const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
            const userDoc = await getAdminDb().collection('users').doc(decodedClaims.uid).get();
            if (userDoc.exists) {
                partner = { uid: userDoc.id, ...userDoc.data() } as User;
            }
        }
    } catch (e) {
        console.error("Failed to load partner session for profile page", e);
    }

  return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8">My Company Profile</h1>
        <Card>
            <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Review your company information below.</CardDescription>
            </CardHeader>
            <CardContent>
                <PartnerProfile partner={partner || undefined} />
            </CardContent>
        </Card>
        
        {partner && <PartnerAISettings partner={partner} />}
    </div>
  );
}
