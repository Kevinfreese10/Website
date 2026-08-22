'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Job } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase, Building, Calendar, PlusCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import PostJobDialog from '@/components/jobs/PostJobDialog';
import Link from 'next/link';

const db = getFirestore(firebaseApp);

export default function PartnerJobsPage() {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyJobs = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'jobs'), 
        where('postedBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const jobsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setMyJobs(jobsData);
    } catch (error) {
      console.error("Error fetching my jobs:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyJobs().finally(() => setIsLoading(false));
    }
  }, [user]);

  if (!user) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Job Postings</h1>
          <p className="text-muted-foreground">Manage the jobs you've posted to the partner network.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/jobs" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" /> View Public Board
            </Link>
          </Button>
          <PostJobDialog onSuccess={fetchMyJobs} />
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
        ) : myJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="text-lg font-bold mb-2">No Jobs Posted</h3>
              <p className="mb-6">You haven't posted any jobs to the network yet.</p>
              <PostJobDialog onSuccess={fetchMyJobs} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myJobs.map(job => (
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
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">Active</Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
