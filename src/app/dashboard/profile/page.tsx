'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, User as UserIcon, Building, MapPin, CreditCard, Lock, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const profileFormSchema = z.object({
  name: z.string().min(2, 'First name is required.'),
  surname: z.string().min(2, 'Surname is required.'),
  contactNumber: z.string().min(10, 'A valid contact number is required.'),
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  address: z.object({
    unit: z.string().optional(),
    complex: z.string().optional(),
    street: z.string().optional(),
    suburb: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
  bankingDetails: z.object({
    bankName: z.string().optional(),
    accountHolder: z.string().optional(),
    accountNumber: z.string().optional(),
    branchCode: z.string().optional(),
  }).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required to change it.'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ['confirmPassword'],
});

export default function ClientProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name?.split(' ')[0] || '',
      surname: user?.surname || user?.name?.split(' ').slice(1).join(' ') || '',
      contactNumber: user?.contactNumber || '',
      companyName: user?.companyName || '',
      registrationNumber: user?.registrationNumber || '',
      vatNumber: user?.vatNumber || '',
      address: {
        unit: user?.address?.unit || '',
        complex: user?.address?.complex || '',
        street: user?.address?.street || '',
        suburb: user?.address?.suburb || '',
        city: user?.address?.city || '',
        province: user?.address?.province || '',
        zip: user?.address?.zip || '',
      },
      bankingDetails: {
        bankName: user?.bankingDetails?.bankName || '',
        accountHolder: user?.bankingDetails?.accountHolder || '',
        accountNumber: user?.bankingDetails?.accountNumber || '',
        branchCode: user?.bankingDetails?.branchCode || '',
      },
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    setIsSaving(true);
    try {
      const collectionsToTry = ['users', 'aiAccountantClients', 'adminClients', 'partnerClients'];
      let userRef = null;

      for (const col of collectionsToTry) {
        const tempRef = doc(db, col, user.uid);
        const snap = await getDoc(tempRef);
        if (snap.exists()) {
          userRef = tempRef;
          break;
        }
      }

      if (!userRef) {
        throw new Error('User document not found in any collection');
      }

      const payload = {
        name: `${values.name} ${values.surname}`,
        surname: values.surname,
        contactNumber: values.contactNumber || '',
        companyName: values.companyName || '',
        registrationNumber: values.registrationNumber || '',
        vatNumber: values.vatNumber || '',
        address: values.address || {},
        bankingDetails: values.bankingDetails || {},
      };

      await updateDoc(userRef, payload);
      updateUser({ ...user, ...payload });
      toast({ title: 'Profile Updated', description: 'Your profile details have been saved successfully.' });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: 'Update Failed', description: 'Could not save your profile changes. Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    setIsPasswordSaving(true);
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      toast({ title: 'Error', description: 'Authentication error. Please log in again.', variant: 'destructive' });
      setIsPasswordSaving(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, values.currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, values.newPassword);
      toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error updating password:", error);
      let description = 'Could not update your password.';
      if (error.code === 'auth/wrong-password') {
        description = 'The current password you entered is incorrect.';
      } else if (error.code === 'auth/requires-recent-login') {
        description = 'This action requires recent authentication. Please log in again.';
      }
      toast({ title: 'Error', description, variant: 'destructive' });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          My Account Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal details, company settings, and login credentials.
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full space-y-6">
        <TabsList className="grid grid-cols-4 w-full lg:max-w-2xl bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="personal" className="rounded-lg transition-all"><UserIcon className="h-4 w-4 mr-2" />Personal</TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg transition-all"><Building className="h-4 w-4 mr-2" />Company</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg transition-all"><CreditCard className="h-4 w-4 mr-2" />Finance & Address</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg transition-all"><Lock className="h-4 w-4 mr-2" />Security</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-6">
            <TabsContent value="personal" className="space-y-6 outline-none">
              <Card className="border-muted/40 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
                    <UserIcon className="h-5 w-5 text-blue-500" />
                    Personal Details
                  </CardTitle>
                  <CardDescription>Update your personal contact information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. John" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Doe" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input value={user.email} disabled className="bg-muted/50 cursor-not-allowed border-muted" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Email address cannot be changed directly.</p>
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cell Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 082 123 4567" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="space-y-6 outline-none">
              <Card className="border-muted/40 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
                    <Building className="h-5 w-5 text-indigo-500" />
                    Company Information
                  </CardTitle>
                  <CardDescription>Manage your registered business details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Acme Holdings" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 2020/123456/07" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 4012345678" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-muted/40 shadow-sm backdrop-blur-sm h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
                      <MapPin className="h-5 w-5 text-red-500" />
                      Physical Address
                    </CardTitle>
                    <CardDescription>Your business or residential address.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Unit 4A" className="focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address.complex"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complex Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Oakridge Estate" className="focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 12 Main Road" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.suburb"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Suburb</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Sandton" className="focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Johannesburg" className="focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Gauteng" className="focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address.zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. 2196" className="focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted/40 shadow-sm backdrop-blur-sm h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
                      <CreditCard className="h-5 w-5 text-emerald-500" />
                      Banking Details
                    </CardTitle>
                    <CardDescription>Your banking details for transactions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="bankingDetails.bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. First National Bank" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankingDetails.accountHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Acme Holdings (Pty) Ltd" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankingDetails.accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 62123456789" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankingDetails.branchCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 250655" className="focus-visible:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Form>

        <TabsContent value="security" className="space-y-6 outline-none">
          <Card className="border-muted/40 shadow-sm backdrop-blur-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
                <Lock className="h-5 w-5 text-yellow-500" />
                Change Password
              </CardTitle>
              <CardDescription>Update your login credentials securely.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} className="focus-visible:ring-blue-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} className="focus-visible:ring-blue-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} className="focus-visible:ring-blue-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isPasswordSaving} className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium shadow-md">
                      {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
