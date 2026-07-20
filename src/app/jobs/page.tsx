'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Job, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Briefcase, MapPin, Building, Calendar, UserIcon, FileText, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
// PostJobDialog moved to partner dashboard
// Removed duplicate header and footer imports
import Link from 'next/link';

const db = getFirestore(firebaseApp);

export default function JobsBoardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [talent, setTalent] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const jobsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const fetchTalent = async () => {
    if (!user) return; // Only fetch if authenticated
    try {
      const q = query(collection(db, 'users'), where('talentProfile.isLookingForWork', '==', true));
      const snap = await getDocs(q);
      const talentData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setTalent(talentData);
    } catch (error) {
      console.error("Error fetching talent:", error);
    }
  };

  // Fetch jobs immediately (public)
  useEffect(() => {
    fetchJobs().finally(() => setIsLoading(false));
  }, []);

  // Fetch talent only when user is authenticated
  useEffect(() => {
    if (user) {
      fetchTalent();
    }
  }, [user]);

  return (
    <div className="bg-slate-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Partner Jobs Board</h1>
            <p className="text-lg text-slate-600">Find talent or your next opportunity within the network.</p>
          </div>
          {user?.role === 'partner' || user?.role === 'admin' ? (
            <Button asChild>
              <Link href="/partner/jobs">Manage Jobs</Link>
            </Button>
          ) : !user ? (
            <Button asChild variant="outline">
              <Link href="/login">Login to Post a Job</Link>
            </Button>
          ) : null}
        </div>

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="mb-6 h-12">
            <TabsTrigger value="jobs" className="text-base px-6 h-10"><Briefcase className="mr-2 h-4 w-4" /> Open Jobs</TabsTrigger>
            <TabsTrigger value="talent" className="text-base px-6 h-10"><UserIcon className="mr-2 h-4 w-4" /> Talent Directory</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                  <p>No jobs posted yet. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary">{job.type}</Badge>
                        <Badge variant={job.locationPreference === 'Remote' ? 'default' : 'outline'} className="bg-emerald-500 text-white hover:bg-emerald-600">
                          {job.locationPreference}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">{job.title}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <Building className="h-4 w-4 mr-1" /> {job.companyName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-slate-600 line-clamp-3 mb-4">{job.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                      <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {job.createdAt ? formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</span>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`mailto:?subject=Application for ${job.title}`}>Apply Now</a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="talent" className="space-y-6">
            {(!user || (user.role !== 'partner' && user.role !== 'admin')) ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <Lock className="h-12 w-12 mb-4 text-slate-300" />
                  <h3 className="text-xl font-bold mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground mb-6">The talent directory is only visible to registered partners and admins.</p>
                  {!user && <Button asChild><Link href="/login">Login to View Talent</Link></Button>}
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : talent.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <UserIcon className="h-12 w-12 mb-4 opacity-20" />
                  <p>No candidates are currently looking for work.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {talent.map(t => (
                  <Card key={t.id} className="hover:shadow-md transition-shadow flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary">{t.talentProfile?.workType || 'Any'}</Badge>
                        <Badge variant="outline">{t.talentProfile?.locationPreference || 'Any'}</Badge>
                      </div>
                      <CardTitle className="text-lg">{t.name} {t.surname}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <MapPin className="h-4 w-4 mr-1" /> {t.address?.city || t.address?.province || 'South Africa'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                        {t.talentProfile?.experience || 'No experience summary provided.'}
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t pt-4">
                      {t.talentProfile?.cvUrl ? (
                        <Button size="sm" variant="default" className="w-full flex-1" asChild>
                          <a href={t.talentProfile.cvUrl} target="_blank" rel="noreferrer"><FileText className="h-4 w-4 mr-2" /> View CV</a>
                        </Button>
                      ) : (
                         <Button size="sm" variant="secondary" className="w-full flex-1" disabled>No CV Uploaded</Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${t.email}`}>Contact</a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
