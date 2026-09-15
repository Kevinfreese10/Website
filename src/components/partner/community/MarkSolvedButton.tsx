'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { markAnswerSolved } from '@/app/actions/community';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface MarkSolvedButtonProps {
  questionId: string;
  answerId: string;
}

export default function MarkSolvedButton({ questionId, answerId }: MarkSolvedButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMarkSolved = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    startTransition(async () => {
      try {
        const res = await markAnswerSolved({
          questionId,
          answerId,
          userId: user.uid,
        });

        if (res.success) {
          toast({
            title: 'Solved!',
            description: 'Answer marked as the correct solution. Author rewarded +15 points.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: res.error || 'Failed to mark as correct solution.',
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
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleMarkSolved}
      className="rounded-md text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 flex items-center gap-1.5 transition-all"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
          Marking...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mark as Solution
        </>
      )}
    </Button>
  );
}
