'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { answerQuestion } from '@/app/actions/community';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Reply } from 'lucide-react';

interface AnswerInputProps {
  questionId: string;
}

export default function AnswerInput({ questionId }: AnswerInputProps) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to answer.',
      });
      return;
    }

    if (!content.trim()) return;

    startTransition(async () => {
      try {
        const res = await answerQuestion({
          questionId,
          content,
          author: {
            uid: user.uid,
            name: user.name,
            role: user.role,
          },
        });

        if (res.success) {
          setContent('');
          toast({
            title: 'Reply posted',
            description: 'Your response has been added to the thread. Earned +2 reputation points!',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: res.error || 'Failed to post reply.',
          });
        }
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.message || 'An unexpected error occurred.',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="reply-input" className="text-sm font-semibold text-foreground">
          Your Answer
        </label>
        <Textarea
          id="reply-input"
          placeholder="Share your expertise to help resolve this question..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          rows={5}
          className="rounded-xl border-input focus:ring-2 focus:ring-primary focus-visible:ring-primary bg-background/50 resize-none"
          required
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending || !content.trim()}
          className="rounded-xl bg-primary text-white hover:bg-primary/90 min-w-[130px] flex items-center gap-1.5"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Reply className="h-4 w-4" />
              Post Answer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
