'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { CommunityQuestion } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Heart, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';

const db = getFirestore(firebaseApp);

export default function CommunityCarouselWidget() {
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 5000, stopOnInteraction: true })]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(
          collection(db, 'communityQuestions'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityQuestion));
        setQuestions(fetched);
      } catch (error) {
        console.error('Error fetching community carousel questions:', error);
      }
    };
    fetchQuestions();
  }, []);

  if (questions.length === 0) return null;

  return (
    <div className="w-full relative mt-8 mb-24">
      <div className="text-center mb-16 space-y-4 px-4">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">Community</Badge>
        <h2 className="text-4xl font-bold tracking-tight text-foreground">
          Active Partner Discussions
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-lg">
          Join a thriving network of professionals. See what our partners are discussing and solving right now.
        </p>
      </div>

      <div className="overflow-hidden px-4 md:px-12 relative z-10" ref={emblaRef}>
        <div className="flex gap-6 py-4">
          {questions.map((q, idx) => {
            const colors = [
              { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
              { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
              { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
              { bar: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
              { bar: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
              { bar: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { bar: 'bg-pink-500', badge: 'bg-pink-50 text-pink-700 border-pink-200' }
            ];
            const colorTheme = colors[idx % colors.length];
            return (
              <div key={q.id} className="flex-[0_0_100%] sm:flex-[0_0_80%] md:flex-[0_0_40%] lg:flex-[0_0_30%] min-w-0">
                <Card className="h-full relative overflow-hidden border border-slate-200 hover:border-slate-300 shadow-sm bg-slate-50 hover:bg-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                  <div className={`h-1.5 w-full absolute top-0 left-0 ${colorTheme.bar} opacity-80 transition-all group-hover:opacity-100`} />
                  <CardContent className="p-6 flex flex-col h-full justify-between pt-8">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold uppercase border border-slate-300 shrink-0">
                        A
                      </div>
                      <span className="font-semibold text-slate-700 truncate">Anonymous</span>
                      {q.tags && q.tags.length > 0 && (
                        <Badge variant="outline" className={`ml-auto shrink-0 text-[9px] uppercase font-bold tracking-wider ${colorTheme.badge}`}>
                          {q.tags[0]}
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-foreground transition-colors line-clamp-2 leading-snug mb-2 group-hover:text-primary">
                      {q.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                      {q.content}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                          <Heart className="w-4 h-4 fill-rose-50 stroke-rose-500" />
                          <span>{q.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-500 font-medium">
                          <MessageSquare className="w-4 h-4 fill-blue-50 stroke-blue-500" />
                          <span>{q.answersCount || 0}</span>
                        </div>
                      </div>
                      {q.isSolved && (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Solved
                        </span>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full bg-slate-50 hover:bg-slate-100 hover:text-primary transition-colors border-slate-200 shadow-sm">
                          View Answers
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Join the Partner Community</DialogTitle>
                          <DialogDescription className="pt-2">
                            To view answers, participate in discussions, and connect with other professionals, please log in to your partner account.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-between gap-3 sm:gap-0 mt-4 flex-col sm:flex-row">
                          <Button variant="ghost" asChild className="w-full sm:w-auto">
                            <Link href="/login">Sign In</Link>
                          </Button>
                          <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                            <Link href="/become-a-partner#pricing">Become a Partner</Link>
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
            );
          })}
        </div>
      </div>

      <div className="absolute top-[60%] -translate-y-1/2 left-0 z-20 hidden sm:block">
        <Button aria-label="Previous" variant="outline" size="icon" className="rounded-full shadow-md border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 w-10 transition-all" onClick={() => emblaApi?.scrollPrev()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute top-[60%] -translate-y-1/2 right-0 z-20 hidden sm:block">
        <Button aria-label="Next" variant="outline" size="icon" className="rounded-full shadow-md border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 w-10 transition-all" onClick={() => emblaApi?.scrollNext()}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
