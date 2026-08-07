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
import { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Briefcase, UploadCloud, MapPin, Eye, ExternalLink, CheckCircle2, Award, Clock, DollarSign, FileText, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getGlobalSkillsAction, addCustomSkillAction } from '@/app/actions/jobs-actions';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const DEFAULT_SKILLS = [
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

const PROFESSIONAL_BODIES = [
  {
    id: 'SAICA',
    name: 'South African Institute of Chartered Accountants (SAICA)',
    designations: 'CA(SA), AGA(SA), AT(SA)',
    focus: 'Chartered Accountants, auditing, financial reporting, taxation, advisory'
  },
  {
    id: 'SAIPA',
    name: 'South African Institute of Professional Accountants (SAIPA)',
    designations: 'Professional Accountant (SA), Professional Tax Practitioner (SA)',
    focus: 'Accounting, taxation, SMEs, independent practice'
  },
  {
    id: 'CIBA',
    name: 'Chartered Institute for Business Accountants (CIBA)',
    designations: 'CBAP®, CBA®, BAP(SA), FP(SA)',
    focus: 'Business accountants, accountants in practice, financial professionals'
  },
  {
    id: 'SAIT',
    name: 'South African Institute of Taxation (SAIT)',
    designations: 'Master Tax Practitioner (SA), Tax Practitioner (SA)',
    focus: 'Tax practitioners, tax consultants, tax specialists'
  },
  {
    id: 'IAC',
    name: 'Institute of Accounting and Commerce (IAC)',
    designations: 'Independent Accounting Professional (IAP), Financial Accountant (FAP), CTP',
    focus: 'Accounting and taxation'
  },
  {
    id: 'ACCA',
    name: 'Association of Chartered Certified Accountants (ACCA South Africa)',
    designations: 'ACCA',
    focus: 'International accounting qualification'
  },
  {
    id: 'CIMA',
    name: 'Chartered Institute of Management Accountants (CIMA)',
    designations: 'CGMA',
    focus: 'Management accounting, finance, strategy'
  },
  {
    id: 'ICBA',
    name: 'Institute of Certified Bookkeepers and Accountants (ICBA)',
    designations: 'Certified Bookkeeper, Certified Accountant',
    focus: 'Bookkeeping and accounting'
  },
  {
    id: 'IRBA',
    name: 'Independent Regulatory Board for Auditors (IRBA)',
    designations: 'Registered Auditor (RA)',
    focus: 'Regulation of auditors and audit firms'
  },
  {
    id: 'CGISA',
    name: 'Chartered Governance Institute of Southern Africa (CGISA)',
    designations: 'Chartered Secretary (CGP)',
    focus: 'Corporate governance, company secretarial'
  },
  {
    id: 'FPI',
    name: 'Financial Planning Institute of Southern Africa (FPI)',
    designations: 'CFP®',
    focus: 'Financial planning and wealth management'
  },
  {
    id: 'LPC',
    name: 'Legal Practice Council (LPC)',
    designations: 'Attorney, Advocate',
    focus: 'Recognised by SARS for tax practitioners where applicable'
  }
];

const talentProfileSchema = z.object({
  isLookingForWork: z.boolean(),
  experience: z.string().optional(),
  workType: z.enum(['Full Time', 'Part Time', 'Contract', 'Freelance']).optional(),
  locationPreference: z.enum(['Remote', 'On-site', 'Hybrid']).optional(),
  expectedRate: z.string().optional(),
  availabilityHours: z.string().optional(),
  yearsExperience: z.string().optional(),
  cvUrl: z.string().optional(),
});

export default function TalentProfileForm() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>(DEFAULT_SKILLS);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.talentProfile?.skills || []
  );

  const initialBodies = user?.talentProfile?.professionalBodies || 
    (user?.talentProfile?.professionalBody ? [user.talentProfile.professionalBody] : []);
  const [selectedBodies, setSelectedBodies] = useState<string[]>(initialBodies);

  // Fetch global custom skills from Server Action on mount
  useEffect(() => {
    const fetchGlobalSkills = async () => {
      try {
        const globalSkills = await getGlobalSkillsAction();
        if (globalSkills && globalSkills.length > 0) {
          const merged = Array.from(new Set([...DEFAULT_SKILLS, ...globalSkills]));
          setAvailableSkills(merged);
        }
      } catch (err) {
        console.error("Error fetching global talent skills:", err);
      }
    };
    fetchGlobalSkills();
  }, []);

  const handleAddCustomSkill = async () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;

    // Check if skill already exists case-insensitively
    const existing = availableSkills.find(s => s.toLowerCase() === trimmed.toLowerCase());
    const skillToAdd = existing || trimmed;

    // 1. Add to user's selected skills if not already selected
    if (!selectedSkills.includes(skillToAdd)) {
      setSelectedSkills(prev => [...prev, skillToAdd]);
    }

    // 2. If completely new, add to available skills list & persist globally via Server Action
    if (!availableSkills.includes(skillToAdd)) {
      const newAvailable = [...availableSkills, skillToAdd];
      setAvailableSkills(newAvailable);
      addCustomSkillAction(skillToAdd).catch(err => {
        console.error("Error saving global skill:", err);
      });
    }

    setCustomSkillInput('');
    toast({ title: 'Skill Added', description: `"${skillToAdd}" added to profile and saved for future candidates!` });
  };

  const form = useForm<z.infer<typeof talentProfileSchema>>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      isLookingForWork: user?.talentProfile?.isLookingForWork || false,
      experience: user?.talentProfile?.experience || '',
      workType: user?.talentProfile?.workType || 'Full Time',
      locationPreference: user?.talentProfile?.locationPreference || 'Remote',
      expectedRate: user?.talentProfile?.expectedRate || '',
      availabilityHours: user?.talentProfile?.availabilityHours || '',
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

  const toggleBody = (bodyId: string) => {
    setSelectedBodies(prev =>
      prev.includes(bodyId) ? prev.filter(b => b !== bodyId) : [...prev, bodyId]
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
        professionalBodies: selectedBodies,
        professionalBody: selectedBodies.join(', '),
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
  const watchYearsExp = form.watch('yearsExperience');

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
            <CardDescription className="flex items-center justify-between mt-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" /> {user.address?.city || user.address?.province || 'South Africa'}</span>
              {watchYearsExp && <span className="text-indigo-600 font-bold text-[11px] bg-indigo-50 px-2 py-0.5 rounded">{watchYearsExp} Exp</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
              {watchExp || 'Your professional experience summary will be shown here...'}
            </p>
            {selectedBodies.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedBodies.map(body => (
                  <Badge key={body} variant="secondary" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 font-bold">
                    <Award className="h-2.5 w-2.5 mr-1" /> {body}
                  </Badge>
                ))}
              </div>
            )}
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
          <CardDescription>Configure your candidate visibility, professional affiliations, skills, rates, and CV file.</CardDescription>
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
                  {/* Work Type, Location & Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="workType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 h-5">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Preferred Work Type
                          </FormLabel>
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
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 h-5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" /> Location Preference
                          </FormLabel>
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
                    <FormField
                      control={form.control}
                      name="yearsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 h-5">
                            <Award className="h-3.5 w-3.5 text-slate-400" /> Years of Experience
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

                  {/* Expected Rate & Availability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expectedRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 h-5">
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
                          <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 h-5">
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

                  {/* Multi-Select Professional Bodies */}
                  <div className="space-y-3 pt-2 border-t">
                    <div>
                      <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-purple-600" /> Professional Bodies & Affiliations (Select all that apply)
                      </FormLabel>
                      <FormDescription className="text-xs text-slate-500 mt-0.5">
                        Choose your registered SA accounting, auditing, and tax professional bodies.
                      </FormDescription>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PROFESSIONAL_BODIES.map(body => {
                        const isSelected = selectedBodies.includes(body.id);
                        return (
                          <div
                            key={body.id}
                            onClick={() => toggleBody(body.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600/30'
                                : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected ? 'bg-purple-600 text-white' : 'border border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>
                            <div className="space-y-1 flex-1">
                              <p className="font-bold text-xs text-slate-900 leading-snug">{body.name}</p>
                              <Badge variant="outline" className="text-[10px] bg-white font-semibold text-purple-700 border-purple-200">
                                {body.designations}
                              </Badge>
                              <p className="text-[11px] text-slate-500 leading-tight pt-0.5">{body.focus}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Core Competencies Tag Selector */}
                  <div className="space-y-3 pt-2 border-t">
                    <div>
                      <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600">Core Competencies & Software Skills</FormLabel>
                      <FormDescription className="text-xs text-slate-500 mt-0.5">
                        Select from existing skill badges or type a new custom skill below to add it globally for all candidates.
                      </FormDescription>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableSkills.map(skill => {
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

                    {/* Add Custom Skill Input Box */}
                    <div className="flex gap-2 items-center pt-2 max-w-md">
                      <Input
                        placeholder="Add custom skill (e.g. Sage 50, CaseWare Cloud...)"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSkill();
                          }
                        }}
                        className="h-9 text-xs border-purple-200 focus-visible:ring-purple-500 bg-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAddCustomSkill}
                        className="font-bold text-xs shrink-0 bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        + Add Skill
                      </Button>
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
