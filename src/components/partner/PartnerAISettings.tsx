'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Key, CheckCircle2 } from 'lucide-react';
import { saveGeminiKey } from '@/app/actions/partner-settings';
import { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

export default function PartnerAISettings({ partner }: { partner: User }) {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const hasExistingKey = !!partner.geminiApiKey;

    const handleSave = async () => {
        if (!partner?.uid) return;
        setIsSaving(true);
        try {
            const auth = getAuth(firebaseApp);
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Authentication required");
            
            const res = await saveGeminiKey(idToken, apiKey);
            if (res.success) {
                toast({ title: 'AI Key Saved', description: 'Your Gemini API key has been securely encrypted and stored.' });
                setApiKey(''); // Clear the input field for security
            }
        } catch (error: any) {
            toast({ title: 'Save Failed', description: error.message || 'Failed to save the API key.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border-2 mt-8 border-primary/20 bg-primary/5">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" /> AI Integrations
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Bring Your Own Key (BYOK) for Gemini AI features.
                        </CardDescription>
                    </div>
                    {hasExistingKey && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Key Configured
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="geminiApiKey" className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" /> Google Gemini API Key
                    </Label>
                    <Input 
                        id="geminiApiKey" 
                        type="password" 
                        placeholder={hasExistingKey ? "•••••••••••••••••••••••• (Key Configured)" : "AIzaSy..."}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Your API key will be securely encrypted using AES-256 before being stored in the database. 
                        We never store your raw API key in plain text. Leave this field blank to use the system default key.
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()} className="font-bold">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Custom API Key
                </Button>
            </CardFooter>
        </Card>
    );
}
