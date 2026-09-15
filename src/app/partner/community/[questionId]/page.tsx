'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCommunityQuestion,
  getCommunityAnswers,
  toggleLikeQuestion,
  toggleLikeAnswer,
} from '@/app/actions/community';
import { CommunityQuestion, CommunityAnswer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import LikeButton from '@/components/partner/community/LikeButton';
import AnswerInput from '@/components/partner/community/AnswerInput';
import MarkSolvedButton from '@/components/partner/community/MarkSolvedButton';

export default function ThreadDetailPage() {
  const params = useParams();
  const questionId = params.questionId as string;

  const [question, setQuestion] = useState<CommunityQuestion | null>(null);
  const [answers, setAnswers] = useState<CommunityAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        getCommunityQuestion(questionId),
        getCommunityAnswers(questionId),
      ]);

      if (qRes.success && qRes.question) {
        setQuestion(qRes.question);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: qRes.error || 'Failed to load question details.',
        });
        router.push('/partner/community');
      }

      if (aRes.success) {
        setAnswers(aRes.answers);
      }
    } catch (err: any) {
      console.error('Error fetching thread details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      fetchData();
    }
  }, [questionId]);

  const handleLikeQuestion = async () => {
    if (!user) return { success: false };
    const res = await toggleLikeQuestion({ questionId, userId: user.uid });
    if (res.success) {
      fetchData();
    }
    return res;
  };

  const handleLikeAnswer = async (answerId: string) => {
    if (!user) return { success: false };
    const res = await toggleLikeAnswer({ questionId, answerId, userId: user.uid });
    if (res.success) {
      fetchData();
    }
    return res;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </Card>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-5 w-32" />
          <Card className="p-6">
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const isAuthor = user?.uid === question.authorId;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back Button / Navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
          <Link href="/partner/community" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Q&A Board</span>
          </Link>
        </Button>
      </div>

      {/* Main Question Thread Card */}
      <Card className={`border-border bg-card/75 backdrop-blur-md rounded-xl shadow-md overflow-hidden ${
        question.isSolved ? 'border-l-4 border-l-emerald-500' : ''
      }`}>
        <CardContent className="p-6 md:p-8 space-y-5">
          {/* Metadata Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center uppercase">
                {question.authorName[0]}
              </div>
              <div>
                <p className="font-semibold text-foreground">{question.authorName}</p>
                <p className="text-[10px] text-muted-foreground capitalize font-bold">
                  {question.authorRole.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Title & Tags */}
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
              {question.title}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {question.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] bg-muted border font-semibold">
                  #{t}
                </Badge>
              ))}
            </div>
          </div>

          {/* Question Body */}
          <div className="text-sm md:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed border-t border-border/40 pt-4">
            {question.content}
          </div>

          {/* Reactions bar */}
          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <div className="flex items-center gap-2">
              <LikeButton
                initialLikesCount={question.likesCount}
                initialIsLiked={user ? question.likedBy?.includes(user.uid) : false}
                onLikeToggle={handleLikeQuestion}
                disabled={!user}
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {question.isSolved && (
                <span className="flex items-center gap-1 text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">
                  <CheckCircle2 className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                  <span>Solved</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{question.answersCount} answers</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers / Replies List */}
      <div className="space-y-4 pt-2">
        <h3 className="text-base font-bold flex items-center gap-2 text-foreground px-1">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>Answers ({answers.length})</span>
        </h3>

        {answers.length === 0 ? (
          <div className="bg-card/50 border border-border/60 backdrop-blur-md rounded-xl p-8 text-center text-sm text-muted-foreground">
            No answers posted yet. Share your thoughts below!
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => {
              const isAccepted = question.isSolved && question.solvedAnswerId === answer.id;
              
              return (
                <Card
                  key={answer.id}
                  className={`border-border bg-card/70 backdrop-blur-md rounded-xl shadow-sm transition-all duration-300 overflow-hidden ${
                    isAccepted ? 'border-2 border-emerald-500/40 bg-emerald-500/[0.03]' : ''
                  }`}
                >
                  <CardContent className="p-5 md:p-6 space-y-4">
                    {/* Metadata: Author */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center uppercase">
                          {answer.authorName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{answer.authorName}</span>
                            {answer.authorId === question.authorId && (
                              <Badge variant="outline" className="text-[8px] bg-primary/5 text-primary border-primary/20 py-0 px-1">
                                Author
                              </Badge>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {answer.authorRole.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono">
                        {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Solution tag header */}
                    {isAccepted && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl w-fit">
                        <CheckCircle2 className="h-4 w-4 fill-emerald-600 text-emerald-600 animate-pulse" />
                        <span>Accepted Solution</span>
                      </div>
                    )}

                    {/* Answer content */}
                    <div className="text-sm md:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {answer.content}
                    </div>

                    {/* Footer buttons (Likes / Mark Solved) */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <LikeButton
                        initialLikesCount={answer.likesCount}
                        initialIsLiked={user ? answer.likedBy?.includes(user.uid) : false}
                        onLikeToggle={() => handleLikeAnswer(answer.id)}
                        disabled={!user}
                      />

                      {/* Solutions control - shown only to question author when thread is unsolved */}
                      {isAuthor && !question.isSolved && (
                        <MarkSolvedButton questionId={question.id} answerId={answer.id} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Answer Submission Input */}
      <Card className="border-border bg-card/75 backdrop-blur-md rounded-xl shadow-md p-6 mt-6">
        {question.isSolved ? (
          <div className="text-center py-4 text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            <span>This thread has been resolved. You can still post answers for further details.</span>
          </div>
        ) : null}
        <AnswerInput questionId={question.id} />
      </Card>
    </div>
  );
}
