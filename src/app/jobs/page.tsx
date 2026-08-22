'use client';

import { useState, useEffect } from 'react';
import { Job, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase, MapPin, Building, Calendar, UserIcon, FileText, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

import { getPublicJobsAction, getPublicTalentAction } from '@/app/actions/jobs-actions';

function ExpandableText({ text, maxChars = 110 }: { text: string; maxChars?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;
  if (text.length <= maxChars) {
    return <p className="text-xs text-slate-600 leading-relaxed">{text}</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-600 leading-relaxed">
        {isExpanded ? text : `${text.slice(0, maxChars).trim()}...`}
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-[11px] font-extrabold text-primary hover:underline focus:outline-none flex items-center gap-0.5"
      >
        {isExpanded ? 'Show less' : 'View more'}
      </button>
    </div>
  );
}

export default function JobsBoardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [talent, setTalent] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [showAllTalent, setShowAllTalent] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jobsData, talentData] = await Promise.all([
        getPublicJobsAction(),
        getPublicTalentAction()
      ]);
      setJobs(jobsData);
      setTalent(talentData);
    } catch (err) {
      console.error("Error loading jobs and talent:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="bg-slate-50/60 min-h-screen py-8">
      <main className="container mx-auto px-4 max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Partner Jobs & Talent Board</h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">Explore open career opportunities and certified network talent.</p>
          </div>
          {user?.role === 'partner' || user?.role === 'admin' ? (
            <Button asChild className="font-extrabold">
              <Link href="/partner/jobs">Manage Jobs</Link>
            </Button>
          ) : !user ? (
            <Button asChild variant="outline" className="font-extrabold border-slate-300">
              <Link href="/login">Login to Post a Job</Link>
            </Button>
          ) : null}
        </div>

        {/* SECTION 1: OPEN JOBS CARD */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 p-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-slate-850 flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" /> Open Jobs
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 font-medium">
                Active opportunities posted by firms within the network ({jobs.length} total)
              </CardDescription>
            </div>
            {user?.role === 'partner' || user?.role === 'admin' ? (
              <Button asChild size="sm" variant="outline" className="font-bold">
                <Link href="/partner/jobs">+ Post Job</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-semibold text-slate-600">No jobs posted yet. Check back soon!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(showAllJobs ? jobs : jobs.slice(0, 6)).map(job => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow flex flex-col border-slate-200">
                      <CardHeader className="p-5">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <Badge variant="secondary" className="font-bold text-xs">{job.type}</Badge>
                          <Badge variant={job.locationPreference === 'Remote' ? 'default' : 'outline'} className="bg-emerald-600 text-white font-bold text-xs">
                            {job.locationPreference}
                          </Badge>
                        </div>
                        <CardTitle className="line-clamp-2 text-base font-extrabold text-slate-850">{job.title}</CardTitle>
                        <CardDescription className="flex items-center mt-2 text-xs font-semibold text-slate-500">
                          <Building className="h-3.5 w-3.5 mr-1 text-slate-400" /> {job.companyName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-5 pb-4 flex-1">
                        <ExpandableText text={job.description} maxChars={110} />
                      </CardContent>
                      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t p-4 bg-slate-50/50">
                        <span className="flex items-center text-[11px] font-medium text-slate-400">
                          <Calendar className="h-3 w-3 mr-1" /> {job.createdAt ? formatDistanceToNow(job.createdAt.toDate ? job.createdAt.toDate() : new Date(job.createdAt), { addSuffix: true }) : 'Just now'}
                        </span>
                        <Button size="sm" variant="ghost" className="font-bold text-xs text-primary hover:text-primary hover:bg-primary/5" asChild>
                          <a href={`mailto:?subject=Application for ${job.title}`}>Apply Now</a>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {jobs.length > 6 && (
                  <div className="flex justify-center mt-8 pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAllJobs(!showAllJobs)}
                      className="font-extrabold text-slate-700 hover:bg-slate-100 px-8"
                    >
                      {showAllJobs ? 'Show Less Jobs' : `View More Jobs (${jobs.length - 6} more)`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: TALENT DIRECTORY CARD */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 p-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-slate-850 flex items-center gap-2">
                <UserIcon className="h-6 w-6 text-indigo-600" /> Talent Directory
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 font-medium">
                Certified accounting & tax professionals available for hire ({talent.length} registered)
              </CardDescription>
            </div>
            {!user && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold px-3 py-1">
                🔒 Login required for full CV & Contact details
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
            ) : talent.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <UserIcon className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-semibold text-slate-600">No candidates are currently listed in the directory.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(showAllTalent ? talent : talent.slice(0, 6)).map(t => {
                    const isFullyAuthorized = user && (user.role === 'partner' || user.role === 'admin');
                    return (
                      <Card key={t.id} className="hover:shadow-md transition-shadow flex flex-col border-slate-200">
                        <CardHeader className="p-5">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <Badge variant="secondary" className="font-bold text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              {t.talentProfile?.workType || 'Accounting Professional'}
                            </Badge>
                            <Badge variant="outline" className="font-bold text-xs">
                              {t.talentProfile?.locationPreference || 'South Africa'}
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-extrabold text-slate-850">
                            {t.name} {t.surname ? t.surname[0] + '.' : ''}
                          </CardTitle>
                          <CardDescription className="flex items-center mt-2 text-xs font-semibold text-slate-500">
                            <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" /> {t.address?.city || t.address?.province || 'South Africa'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-5 pb-4 flex-1 space-y-3">
                          <ExpandableText text={t.talentProfile?.experience || 'Professional experienced in accounting, SARS tax compliance, and financial administration.'} maxChars={110} />
                          {t.talentProfile?.skills && t.talentProfile.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {t.talentProfile.skills.slice(0, 3).map(skill => (
                                <Badge key={skill} variant="outline" className="text-[10px] bg-slate-50 font-semibold text-slate-700">
                                  {skill}
                                </Badge>
                              ))}
                              {t.talentProfile.skills.length > 3 && (
                                <Badge variant="outline" className="text-[10px] bg-slate-50 font-semibold text-slate-400">
                                  +{t.talentProfile.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex gap-2 border-t p-4 bg-slate-50/50">
                          {isFullyAuthorized ? (
                            <>
                              {t.talentProfile?.cvUrl ? (
                                <Button size="sm" variant="default" className="w-full flex-1 font-bold text-xs" asChild>
                                  <a href={t.talentProfile.cvUrl} target="_blank" rel="noreferrer"><FileText className="h-3.5 w-3.5 mr-1.5" /> View CV</a>
                                </Button>
                              ) : (
                                <Button size="sm" variant="secondary" className="w-full flex-1 font-bold text-xs" disabled>No CV Uploaded</Button>
                              )}
                              <Button size="sm" variant="outline" className="font-bold text-xs" asChild>
                                <a href={`mailto:${t.email}`}>Contact</a>
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" className="w-full font-extrabold text-xs text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100" asChild>
                              <Link href="/login"><Lock className="h-3.5 w-3.5 mr-1.5 text-indigo-600" /> Login to View CV & Contact</Link>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>

                {talent.length > 6 && (
                  <div className="flex justify-center mt-8 pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAllTalent(!showAllTalent)}
                      className="font-extrabold text-slate-700 hover:bg-slate-100 px-8"
                    >
                      {showAllTalent ? 'Show Less Talent' : `View More Talent (${talent.length - 6} more)`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
