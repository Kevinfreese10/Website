
'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '../ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { sendAdminEmail } from '@/app/actions/email-gateway';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { Switch } from '../ui/switch';

const db = getFirestore(firebaseApp);

async function getIdToken(): Promise<string> {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!token) throw new Error('You must be signed in to do this.');
    return token;
}

const formSchema = z.object({
  smtpDetails: z.object({
      host: z.string().min(1, "Host is required."),
      port: z.string().min(1, "Port is required."),
      user: z.string().min(1, "Username is required."),
      pass: z.string().min(1, "Password is required."),
  }),
});

export default function EmailSettingsForm() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtpDetails: { 
          host: user?.smtpDetails?.host || '', 
          port: user?.smtpDetails?.port || '465', 
          user: user?.smtpDetails?.user || user?.email || '', 
          pass: user?.smtpDetails?.pass || ''
      },
    },
  });
  
  async function onSave(values: z.infer<typeof formSchema>) {
      if (!user) return;
      setIsSaving(true);
      try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { 
              smtpDetails: values.smtpDetails,
          });
          updateUser({ ...user, smtpDetails: values.smtpDetails });
          toast({ title: 'Settings Saved', description: 'Your email settings have been updated.' });
      } catch (e) {
          console.error(e);
          toast({ title: 'Save Failed', description: 'Could not save your email settings.', variant: 'destructive'});
      } finally {
          setIsSaving(false);
      }
  }

  async function onTestEmail() {
    const values = form.getValues();
     if (!values.smtpDetails.user) {
      toast({ title: 'Cannot Send Test', description: 'Please enter and save your email settings first.', variant: 'destructive'});
      return;
    }
    
    setIsTesting(true);
    toast({
        title: 'Sending Test Email...',
        description: 'Please wait a moment.'
    });

    try {
        const idToken = await getIdToken();
        const res = await sendAdminEmail({
            idToken,
            to: values.smtpDetails.user,
            subject: 'SMTP Settings Test from My Accountant',
            html: `
                <p>Hello,</p>
                <p>This is a test email sent from your application to verify that your personal SMTP settings are configured correctly.</p>
                <p>If you are receiving this, your email configuration is working as expected.</p>
                <p>Sent at: ${new Date().toLocaleString()}</p>
            `,
            smtpOverride: {
                host: values.smtpDetails.host,
                port: values.smtpDetails.port,
                user: values.smtpDetails.user,
                pass: values.smtpDetails.pass,
            },
        });

        if (res.success) {
            toast({
                title: 'Test Email Sent',
                description: `An email has been sent to ${values.smtpDetails.user}. Please check your inbox.`,
            });
        } else {
            toast({
                title: 'Test Email Failed',
                description: res.error || 'Failed to send test email. Please check your credentials.',
                variant: 'destructive',
            });
        }
    } catch (e: any) {
        toast({
            title: 'Test Email Failed',
            description: e.message || 'An error occurred while sending the test email.',
            variant: 'destructive',
        });
    } finally {
        setIsTesting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">SMTP Details (Sending Emails)</h3>
            <p className="text-sm text-muted-foreground">These are your email sending credentials. They are stored securely and used for sending outgoing emails on your behalf from within the application.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="smtpDetails.host" render={({ field }) => ( <FormItem><FormLabel>SMTP Host</FormLabel><FormControl><Input {...field} placeholder="e.g., smtp.gmail.com" /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="smtpDetails.port" render={({ field }) => ( <FormItem><FormLabel>SMTP Port</FormLabel><FormControl><Input {...field} placeholder="e.g., 465 or 587" /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="smtpDetails.user" render={({ field }) => ( <FormItem><FormLabel>Username (Your Email)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="smtpDetails.pass" render={({ field }) => ( <FormItem><FormLabel>Password / App Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
        
        <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
            </Button>
            <Button type="button" variant="outline" onClick={onTestEmail} disabled={isTesting}>
                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Test Email (SMTP)
            </Button>
        </div>
      </form>
    </Form>
  );
}
