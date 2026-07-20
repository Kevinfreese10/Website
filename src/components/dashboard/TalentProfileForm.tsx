'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Briefcase, UploadCloud } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const talentProfileSchema = z.object({
  isLookingForWork: z.boolean(),
  experience: z.string().optional(),
  workType: z.enum(['Full Time', 'Part Time', 'Contract', 'Freelance']).optional(),
  locationPreference: z.enum(['Remote', 'On-site', 'Hybrid']).optional(),
  cvUrl: z.string().optional(),
});

export default function TalentProfileForm() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof talentProfileSchema>>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      isLookingForWork: user?.talentProfile?.isLookingForWork || false,
      experience: user?.talentProfile?.experience || '',
      workType: user?.talentProfile?.workType || 'Full Time',
      locationPreference: user?.talentProfile?.locationPreference || 'Remote',
      cvUrl: user?.talentProfile?.cvUrl || '',
    },
  });

  if (!user) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must be less than 5MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `uploads/${user.uid}/talent/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {},
        (error) => {
          console.error("Upload error:", error);
          toast({ title: 'Upload Failed', description: 'Could not upload CV.', variant: 'destructive' });
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          form.setValue('cvUrl', downloadURL, { shouldDirty: true });
          toast({ title: 'Upload Successful', description: 'Your CV has been uploaded.' });
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: 'Upload Failed', description: 'Could not upload CV.', variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof talentProfileSchema>) => {
    setIsSaving(true);
    try {
      const fullProfile = {
        isLookingForWork: values.isLookingForWork,
        experience: values.experience || '',
        preferences: user?.talentProfile?.preferences || [],
        workType: values.workType,
        locationPreference: values.locationPreference,
        cvUrl: values.cvUrl,
        supportingDocsUrls: user?.talentProfile?.supportingDocsUrls || [],
      };

      const collectionsToTry = ['users', 'aiAccountantClients', 'adminClients', 'partnerClients'];
      let userRef = null;

      for (const col of collectionsToTry) {
        try {
          const tempRef = doc(db, col, user.uid);
          await updateDoc(tempRef, {
            talentProfile: fullProfile
          });
          userRef = tempRef;
          break; 
        } catch(e) {
        }
      }

      if (!userRef) {
        throw new Error('User document not found or could not be updated');
      }

      updateUser({ ...user, talentProfile: fullProfile });
      toast({ title: 'Profile Updated', description: 'Your talent profile has been saved successfully.' });
    } catch (error) {
      console.error("Error updating talent profile:", error);
      toast({ title: 'Update Failed', description: 'Could not save your profile changes.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-muted/40 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
          <Briefcase className="h-5 w-5 text-purple-500" />
          Talent Profile
        </CardTitle>
        <CardDescription>Let other partners know you are looking for work, or upload your CV.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="isLookingForWork"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Looking for Work</FormLabel>
                    <FormDescription>
                      Turn this on to show your profile in the Jobs Board Talent Directory.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('isLookingForWork') && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Work Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select work type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Full Time">Full Time</SelectItem>
                            <SelectItem value="Part Time">Part Time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Freelance">Freelance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="locationPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="On-site">On-site</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Experience Summary</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Briefly describe your experience, skills, and what you are looking for..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>CV / Resume</FormLabel>
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" className="relative cursor-pointer overflow-hidden">
                      {isUploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><UploadCloud className="mr-2 h-4 w-4" /> Upload CV</>
                      )}
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </Button>
                    {form.watch('cvUrl') && (
                      <span className="text-sm text-green-600 flex items-center">
                        CV Uploaded <a href={form.watch('cvUrl')} target="_blank" rel="noreferrer" className="ml-2 underline text-blue-600">View</a>
                      </span>
                    )}
                  </div>
                  <FormDescription>Upload your CV in PDF or DOCX format (Max 5MB).</FormDescription>
                </FormItem>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSaving || isUploading} className="bg-purple-600 hover:bg-purple-700 text-white">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Talent Profile
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
