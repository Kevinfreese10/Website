'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MapPin, Building, Landmark } from 'lucide-react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User } from '@/lib/types';

const db = getFirestore(firebaseApp);

const formSchema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  name: z.string().min(2, 'Contact name is required.'),
  surname: z.string().min(2, 'Contact surname is required.'),
  email: z.string().email('Please enter a valid email.'),
  contactNumber: z.string().min(10, 'A valid contact number is required.'),
  address: z
    .object({
      street: z.string().optional(),
      suburb: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  bankingDetails: z
    .object({
      bankName: z.string().optional(),
      accountHolder: z.string().optional(),
      accountNumber: z.string().optional(),
      branchCode: z.string().optional(),
    })
    .optional(),
});

export default function PartnerProfile({ partner: propPartner }: { partner?: User }) {
  const { user: authUser, updateUser } = useAuth();
  const targetUser = propPartner || authUser;
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: targetUser?.companyName || '',
      name: targetUser?.name?.split(' ')[0] || targetUser?.contactPerson?.split(' ')[0] || '',
      surname:
        targetUser?.name?.split(' ').slice(1).join(' ') ||
        targetUser?.contactPerson?.split(' ').slice(1).join(' ') ||
        '',
      email: targetUser?.email || '',
      contactNumber: targetUser?.contactNumber || '',
      address: {
        street: targetUser?.address?.street || '',
        suburb: targetUser?.address?.suburb || '',
        city: targetUser?.address?.city || '',
        province: targetUser?.address?.province || '',
        zip: targetUser?.address?.zip || '',
      },
      bankingDetails: {
        bankName: targetUser?.bankingDetails?.bankName || '',
        accountHolder: targetUser?.bankingDetails?.accountHolder || '',
        accountNumber: targetUser?.bankingDetails?.accountNumber || '',
        branchCode: targetUser?.bankingDetails?.branchCode || '',
      },
    },
  });

  const { reset } = form;

  useEffect(() => {
    const activePartner = propPartner || authUser;
    if (activePartner && activePartner.email) {
      reset({
        companyName: activePartner.companyName || '',
        name: activePartner.name?.split(' ')[0] || activePartner.contactPerson?.split(' ')[0] || '',
        surname:
          activePartner.name?.split(' ').slice(1).join(' ') ||
          activePartner.contactPerson?.split(' ').slice(1).join(' ') ||
          '',
        email: activePartner.email || '',
        contactNumber: activePartner.contactNumber || '',
        address: {
          street: activePartner.address?.street || '',
          suburb: activePartner.address?.suburb || '',
          city: activePartner.address?.city || '',
          province: activePartner.address?.province || '',
          zip: activePartner.address?.zip || '',
        },
        bankingDetails: {
          bankName: activePartner.bankingDetails?.bankName || '',
          accountHolder: activePartner.bankingDetails?.accountHolder || '',
          accountNumber: activePartner.bankingDetails?.accountNumber || '',
          branchCode: activePartner.bankingDetails?.branchCode || '',
        },
      });
    }
  }, [propPartner, authUser, reset]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!targetUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      const updateData = {
        companyName: values.companyName,
        contactNumber: values.contactNumber,
        address: values.address,
        bankingDetails: values.bankingDetails,
        name: `${values.name} ${values.surname}`.trim(),
        contactPerson: `${values.name} ${values.surname}`.trim(),
      };
      await updateDoc(userRef, updateData);

      if (!propPartner && authUser?.uid === targetUser.uid) {
        updateUser({ ...authUser, ...updateData });
      }

      toast({
        title: 'Practice Profile Updated!',
        description: 'Your practice details and banking information have been saved.',
      });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast({
        title: 'Update Failed',
        description: error?.message || 'There was a problem saving the profile settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error('Partner profile validation failed:', errors);
            toast({
              title: 'Validation Failed',
              description: 'Please check all required fields and correct any errors before saving.',
              variant: 'destructive',
            });
          })}
          className="space-y-8"
        >
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Practice Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practice / Firm Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Contact Surname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly disabled className="bg-muted/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                <MapPin className="h-4 w-4" /> Physical Address
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs">Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.suburb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Suburb</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Province</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">ZIP / Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                Practice Banking Details
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Used for subcontractor payouts if your practice fulfills overflow network orders.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="bankingDetails.bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />
          <Button type="submit" disabled={isSaving} className="w-full h-12 text-base font-bold">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving Changes...' : propPartner ? 'Update Partner Practice' : 'Save Practice Settings'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
