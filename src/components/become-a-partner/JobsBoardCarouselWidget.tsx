'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Job } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Building, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const db = getFirestore(firebaseApp);

export default function JobsBoardCarouselWidget() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(6));
        const snap = await getDocs(q);
        setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (isLoading) {
    return <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>;
  }

  // Removed if (jobs.length === 0) return null; so that the header always renders

  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200/60 overflow-hidden relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12 space-y-4">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">Partner Network</Badge>
          <h2 className="text-4xl md:text-5xl font-black leading-tight text-slate-900">
            Exclusive Jobs Board
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Connect with other partners to find work or hire talent for your own practice.
          </p>
          <Button asChild variant="outline" className="group mt-4">
            <Link href="/jobs">
              View All Jobs
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-2xl bg-white shadow-sm">
            <Briefcase className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No jobs posted yet</h3>
            <p className="text-slate-500 mt-2 max-w-sm">Be the first to post a job on the Partner Jobs Board!</p>
          </div>
        ) : (
          <div className="relative flex overflow-x-hidden group">
            <div className="flex gap-6 animate-marquee group-hover:[animation-play-state:paused]">
              {[...jobs, ...jobs].map((job, idx) => (
                <Card key={`${job.id}-${idx}`} className="w-[350px] shrink-0 border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-slate-100">{job.type}</Badge>
                      <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">{job.locationPreference}</Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{job.title}</CardTitle>
                    <CardDescription className="flex items-center text-sm">
                      <Building className="h-3 w-3 mr-1" /> {job.companyName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Tailwind config for marquee animation (if not already present, we can just use overflow-auto as fallback, but let's try a simpler approach if we don't have custom tailwind classes) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}} />
    </section>
  );
}
