'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Briefcase, UploadCloud, MapPin, Eye, ExternalLink, CheckCircle2, Award, Clock, DollarSign, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const AVAILABLE_SKILLS = [
  'SARS Income Tax (ITR12/14)',
  'VAT Submissions (201)',
  'CIPC Annual Returns',
  'Annual Financial Statements (AFS)',
  'Xero Certified',
  'Sage Pastel Accounting',
  'Draftwise / CaseWare',
  'Payroll Admin (EMP201/501)',
  'Management Accounts',
  'Bookkeeping & Reconciliations',
  'SARS Audit Dispute',
  'COIDA Return of Earnings',
];

const talentProfileSchema = z.object({
  isLookingForWork: z.boolean(),
  experience: z.string().optional(),
  workType: z.enum(['Full Time', 'Part Time', 'Contract', 'Freelance']).optional(),
  locationPreference: z.enum(['Remote', 'On-site', 'Hybrid']).optional(),
  expectedRate: z.string().optional(),
  availabilityHours: z.string().optional(),
  professionalBody: z.string().optional(),
  yearsExperience: z.string().optional(),
  cvUrl: z.string().optional(),
});

export default function TalentProfileForm() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.talentProfile?.skills || []
  );

  const form = useForm<z.infer<typeof talentProfileSchema>>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      isLookingForWork: user?.talentProfile?.isLookingForWork || false,
      experience: user?.talentProfile?.experience || '',
      workType: user?.talentProfile?.workType || 'Full Time',
      locationPreference: user?.talentProfile?.locationPreference || 'Remote',
      expectedRate: user?.talentProfile?.expectedRate || '',
      availabilityHours: user?.talentProfile?.availabilityHours || '',
      professionalBody: user?.talentProfile?.professionalBody || 'SARS Tax Practitioner',
      yearsExperience: user?.talentProfile?.yearsExperience || '3 - 5 Years',
      cvUrl: user?.talentProfile?.cvUrl || '',
    },
  });

  if (!user) return null;

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

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
        skills: selectedSkills,
        workType: values.workType,
        locationPreference: values.locationPreference,
        expectedRate: values.expectedRate || '',
        availabilityHours: values.availabilityHours || '',
        professionalBody: values.professionalBody || '',
        yearsExperience: values.yearsExperience || '',
        cvUrl: values.cvUrl,
        preferences: user?.talentProfile?.preferences || [],
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
        } catch(e) {}
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

  const watchIsLooking = form.watch('isLookingForWork');
  const watchWorkType = form.watch('workType');
  const watchLocation = form.watch('locationPreference');
  const watchExp = form.watch('experience');

  return (
    <div className="space-y-8">
      {/* Top Banner with Direct Directory Link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Network Talent Directory</h3>
            <p className="text-xs text-slate-600">Connect with accounting practices looking for qualified professionals.</p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="font-bold border-purple-200 text-purple-700 bg-white hover:bg-purple-100/50">
          <Link href="/jobs" target="_blank">
            <Eye className="mr-2 h-4 w-4 text-purple-600" /> View Directory Listing <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>

      {/* Real-time Candidate Card Preview Widget */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Live Directory Card Preview
          </h3>
          <Badge variant={watchIsLooking ? "default" : "secondary"} className={watchIsLooking ? "bg-emerald-600 text-white font-bold" : "bg-slate-100 text-slate-500 font-bold"}>
            {watchIsLooking ? "🟢 Visible in Public Directory" : "⚪ Hidden from Directory"}
          </Badge>
        </div>

        <Card className="border-slate-200 shadow-sm max-w-md bg-white">
          <CardHeader className="p-5">
            <div className="flex justify-between items-start mb-2 gap-2">
              <Badge variant="secondary" className="font-bold text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                {watchWorkType || 'Full Time'}
              </Badge>
              <Badge variant="outline" className="font-bold text-xs">
                {watchLocation || 'Remote'}
              </Badge>
            </div>
            <CardTitle className="text-base font-extrabold text-slate-850">
              {user.name} {user.surname ? user.surname[0] + '.' : ''}
            </CardTitle>
            <CardDescription className="flex items-center mt-2 text-xs font-semibold text-slate-500">
              <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" /> {user.address?.city || user.address?.province || 'South Africa'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
              {watchExp || 'Your professional experience summary will be shown here...'}
            </p>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedSkills.slice(0, 3).map(skill => (
                  <Badge key={skill} variant="outline" className="text-[10px] bg-slate-50 font-semibold text-slate-700">
                    {skill}
                  </Badge>
                ))}
                {selectedSkills.length > 3 && (
                  <Badge variant="outline" className="text-[10px] bg-slate-50 font-semibold text-slate-400">
                    +{selectedSkills.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 border-t p-3 bg-slate-50/50">
            <Button size="sm" variant="default" className="w-full font-bold text-xs disabled:opacity-50" disabled>
              <FileText className="h-3.5 w-3.5 mr-1.5" /> View CV
            </Button>
            <Button size="sm" variant="outline" className="font-bold text-xs disabled:opacity-50" disabled>
              Contact
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Main Profile Form Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" /> Talent Profile Settings
          </CardTitle>
          <CardDescription>Configure your candidate visibility, skills, rates, and CV file.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Directory Visibility Switch */}
              <FormField
                control={form.control}
                name="isLookingForWork"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-slate-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-bold">Directory Visibility</FormLabel>
                      <FormDescription className="text-xs">
                        Enable to list your card in the Partner & Public Talent Directory.
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
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  {/* Work Type & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="workType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600">Preferred Work Type</FormLabel>
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
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600">Location Preference</FormLabel>
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

                  {/* Expected Rate & Availability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expectedRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Expected Rate / Compensation
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. R250 - R400/hr or R25,000/pm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availabilityHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" /> Weekly Availability / Notice Period
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 15 hrs/week or Available Immediately" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Professional Body Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="professionalBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-slate-400" /> Professional Body
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select body" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SARS Tax Practitioner">SARS Tax Practitioner</SelectItem>
                              <SelectItem value="SAICA">SAICA (CA / AGA)</SelectItem>
                              <SelectItem value="SAIPA">SAIPA (Professional Accountant)</SelectItem>
                              <SelectItem value="CIMA">CIMA / CGMA</SelectItem>
                              <SelectItem value="IAC">IAC</SelectItem>
                              <SelectItem value="AAT">AAT(SA)</SelectItem>
                              <SelectItem value="Other">Other / Unaffiliated</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="yearsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Years of Experience
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select experience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="< 1 Year">&lt; 1 Year (Junior / Graduate)</SelectItem>
                              <SelectItem value="1 - 3 Years">1 - 3 Years</SelectItem>
                              <SelectItem value="3 - 5 Years">3 - 5 Years</SelectItem>
                              <SelectItem value="5 - 10 Years">5 - 10 Years</SelectItem>
                              <SelectItem value="10+ Years">10+ Years (Senior / Director)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Core Competencies Tag Selector */}
                  <div className="space-y-2">
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600">Core Competencies & Software Skills</FormLabel>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {AVAILABLE_SKILLS.map(skill => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <Button
                            key={skill}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className={isSelected ? "bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs" : "text-xs font-semibold hover:bg-purple-50 text-slate-700"}
                            onClick={() => toggleSkill(skill)}
                          >
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                            {skill}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Experience Summary */}
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600">Professional Bio & Experience Summary</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe your experience, software proficiencies, SARS tax knowledge, and what opportunities you are seeking..." 
                            className="min-h-[110px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CV Upload */}
                  <FormItem className="rounded-xl border p-4 bg-slate-50/50 space-y-2">
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600">CV / Resume Document</FormLabel>
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" className="relative cursor-pointer overflow-hidden font-bold">
                        {isUploading ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading CV...</>
                        ) : (
                          <><UploadCloud className="mr-2 h-4 w-4 text-purple-600" /> Upload CV File</>
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
                        <span className="text-xs text-emerald-700 font-bold flex items-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> CV Uploaded 
                          <a href={form.watch('cvUrl')} target="_blank" rel="noreferrer" className="ml-2 underline text-indigo-600 flex items-center">
                            Preview <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </span>
                      )}
                    </div>
                    <FormDescription className="text-xs text-slate-500">Supported formats: PDF or DOCX (Max 5MB).</FormDescription>
                  </FormItem>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSaving || isUploading} className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-8">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Talent Profile
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
