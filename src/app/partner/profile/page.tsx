
import PartnerProfile from "@/components/partner/PartnerProfile";
import PartnerAISettings from "@/components/partner/PartnerAISettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { User } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User as UserIcon, Briefcase } from 'lucide-react';
import TalentProfileForm from '@/components/dashboard/TalentProfileForm';
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
    <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Company Profile</h1>
        
        <Tabs defaultValue="company" className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 w-full lg:max-w-md bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="company" className="rounded-lg transition-all"><UserIcon className="h-4 w-4 mr-2" />Company Profile</TabsTrigger>
            <TabsTrigger value="talent" className="rounded-lg transition-all"><Briefcase className="h-4 w-4 mr-2" />Career & Talent</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6 outline-none">
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
          </TabsContent>

          <TabsContent value="talent" className="space-y-6 outline-none">
            <TalentProfileForm />
          </TabsContent>
        </Tabs>
    </div>
  );
}
