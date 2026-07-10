'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { askQuestion } from '@/app/actions/community';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MessageSquarePlus, Sparkles, Loader2 } from 'lucide-react';

export default function AskQuestionDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to ask questions.',
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in both the title and question body.',
      });
      return;
    }

    setLoading(true);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const res = await askQuestion({
        title,
        content,
        tags: parsedTags,
        author: {
          uid: user.uid,
          name: user.name,
          role: user.role,
        },
      });

      if (res.success && res.id) {
        toast({
          title: 'Success!',
          description: 'Your question has been posted to the community.',
        });
        setOpen(false);
        setTitle('');
        setContent('');
        setTagsInput('');
        if (user.role === 'admin' || user.role === 'staff') {
          // Stay on the admin community page or go to feed
          router.push('/admin/community');
        } else {
          router.push(`/partner/community/${res.id}`);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: res.error || 'Failed to submit question.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white font-semibold shadow-md py-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
          <MessageSquarePlus className="h-5 w-5" />
          <span>Ask a Question</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] border border-border bg-card/95 backdrop-blur-md text-foreground rounded-2xl shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
            <span>Ask the Partner Community</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Share your question with other accounting and tax partners. Submitting earns you +1 community reputation point.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-semibold">
              Question Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. How do we handle VAT submission on capital goods purchases?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="rounded-xl border-input focus:ring-2 focus:ring-primary focus-visible:ring-primary"
              maxLength={150}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-sm font-semibold">
              Tags <span className="text-xs text-muted-foreground">(Comma-separated)</span>
            </Label>
            <Input
              id="tags"
              placeholder="e.g. VAT, Tax, SARS, Payroll"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={loading}
              className="rounded-xl border-input focus:ring-2 focus:ring-primary focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-sm font-semibold">
              Question details
            </Label>
            <Textarea
              id="content"
              placeholder="Provide background context or details so other community members can answer accurately..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              rows={6}
              className="rounded-xl border-input focus:ring-2 focus:ring-primary focus-visible:ring-primary resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary text-white hover:bg-primary/90 min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Question'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
