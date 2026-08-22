'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { CommunityQuestion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, MessageSquare, CheckCircle, XCircle, Pencil, Trash2, Reply, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { approveQuestion, rejectQuestion, updateQuestion, deleteQuestion, answerQuestion, generateAIAnswer } from '@/app/actions/community';
import { formatDistanceToNow } from 'date-fns';
import AskQuestionDialog from '@/components/partner/community/AskQuestionDialog';
import { useAuth } from '@/contexts/AuthContext';

const db = getFirestore(firebaseApp);

export default function AdminCommunityPage() {
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'pending' | 'history'>('pending');
  const { toast } = useToast();
  const { user } = useAuth();

  // Dialog states
  const [editingQuestion, setEditingQuestion] = useState<CommunityQuestion | null>(null);
  const [answeringQuestion, setAnsweringQuestion] = useState<CommunityQuestion | null>(null);
  
  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editLikes, setEditLikes] = useState(0);

  // Answer Form State
  const [answerContent, setAnswerContent] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    let q;
    if (filterTab === 'pending') {
      q = query(
        collection(db, 'communityQuestions'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'communityQuestions'),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: CommunityQuestion[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as CommunityQuestion;
      });
      setQuestions(fetched);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching questions:', error);
      setIsLoading(false);
      if (error.message.includes('index')) {
        toast({ 
          title: 'Missing Index', 
          description: 'A Firestore index is required. Check the console for the link to create it.', 
          variant: 'destructive',
          duration: 10000 
        });
      }
    });

    return () => unsubscribe();
  }, [toast, filterTab]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const res = await approveQuestion(id);
    if (res.success) {
      toast({ title: 'Question Approved', description: 'It is now visible in the community feed.' });
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to approve', variant: 'destructive' });
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this question?')) return;
    setProcessingId(id);
    const res = await rejectQuestion(id);
    if (res.success) {
      toast({ title: 'Question Rejected', description: 'It has been removed from the pending list.' });
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to reject', variant: 'destructive' });
    }
    setProcessingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to completely delete this question? This action cannot be undone.')) return;
    setProcessingId(id);
    const res = await deleteQuestion(id);
    if (res.success) {
      toast({ title: 'Question Deleted', description: 'The question has been permanently removed.' });
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to delete', variant: 'destructive' });
    }
    setProcessingId(null);
  };

  const openEditDialog = (q: CommunityQuestion) => {
    setEditingQuestion(q);
    setEditTitle(q.title);
    setEditContent(q.content);
    setEditTags(q.tags?.join(', ') || '');
    setEditLikes(q.likesCount || 0);
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setProcessingId(editingQuestion.id);
    
    const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean);
    
    const res = await updateQuestion(editingQuestion.id, {
      title: editTitle,
      content: editContent,
      tags: tagsArray,
      likesCount: editLikes
    });

    if (res.success) {
      toast({ title: 'Question Updated', description: 'Changes have been saved successfully.' });
      setEditingQuestion(null);
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to update', variant: 'destructive' });
    }
    setProcessingId(null);
  };

  const openAnswerDialog = (q: CommunityQuestion) => {
    setAnsweringQuestion(q);
    setAnswerContent('');
  };

  const handleSubmitAnswer = async () => {
    if (!answeringQuestion || !user) {
      toast({ title: 'Error', description: 'You must be logged in to answer.', variant: 'destructive' });
      return;
    }
    
    if (!answerContent.trim()) {
      toast({ title: 'Error', description: 'Answer cannot be empty.', variant: 'destructive' });
      return;
    }

    setProcessingId(answeringQuestion.id);
    
    const res = await answerQuestion({
      questionId: answeringQuestion.id,
      content: answerContent,
      author: {
        uid: user.uid,
        name: user.name || 'Admin',
        role: user.role || 'admin'
      }
    });

    if (res.success) {
      toast({ title: 'Answer Submitted', description: 'Your answer has been posted.' });
      setAnsweringQuestion(null);
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to post answer', variant: 'destructive' });
    }
    setProcessingId(null);
  };

  const handleGenerateAI = async () => {
    if (!answeringQuestion) return;
    setIsGeneratingAI(true);
    toast({ title: 'Generating AI Answer...', description: 'Please wait while the AI crafts a response.' });
    
    const res = await generateAIAnswer(answeringQuestion.title, answeringQuestion.content);
    
    if (res.success && res.text) {
      setAnswerContent(res.text);
      toast({ title: 'AI Answer Ready', description: 'Review the generated answer below before posting.' });
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to generate AI answer.', variant: 'destructive' });
    }
    setIsGeneratingAI(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Moderation</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve pending questions, answer directly, or manage existing questions.
          </p>
        </div>
        <AskQuestionDialog />
      </div>

      <div className="flex border-b mb-6">
        <button
          className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${
            filterTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setFilterTab('pending')}
        >
          Pending Review
        </button>
        <button
          className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${
            filterTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setFilterTab('history')}
        >
          All History
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
        ) : questions.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No Questions</h3>
              <p className="text-muted-foreground mt-1">
                {filterTab === 'pending' ? 'All community questions have been reviewed.' : 'No community questions found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {questions.map((q) => (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{q.title}</CardTitle>
                      <CardDescription className="mt-1.5 flex items-center gap-2">
                        <span className="font-semibold text-foreground">{q.authorName}</span>
                        <span>•</span>
                        <span className="capitalize">{q.authorRole.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</span>
                        <span>•</span>
                        <span>Likes: {q.likesCount || 0}</span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {q.status === 'pending' && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                          Pending Review
                        </Badge>
                      )}
                      {q.status === 'approved' && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                          Approved
                        </Badge>
                      )}
                      {q.status === 'rejected' && (
                        <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200">
                          Rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm text-foreground/90">
                    {q.content}
                  </div>
                  <div className="flex gap-2 mt-4">
                    {q.tags?.map((t) => (
                      <Badge key={t} variant="outline">#{t}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t px-6 py-4 flex flex-wrap justify-between gap-3">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(q)}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-primary hover:text-primary"
                      onClick={() => openAnswerDialog(q)}
                    >
                      <Reply className="mr-2 h-4 w-4" /> Answer
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={processingId === q.id}
                      onClick={() => handleDelete(q.id)}
                    >
                      {processingId === q.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Delete
                    </Button>
                  </div>
                  
                  {q.status === 'pending' && (
                    <div className="flex gap-2 ml-auto">
                      <Button 
                        variant="outline" 
                        className="text-destructive hover:bg-destructive/10"
                        disabled={processingId === q.id}
                        onClick={() => handleReject(q.id)}
                      >
                        {processingId === q.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Reject
                      </Button>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={processingId === q.id}
                        onClick={() => handleApprove(q.id)}
                      >
                        {processingId === q.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Approve
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Make changes to the question content or adjust the like count.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
                className="min-h-[150px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="e.g. TAX, SARS, VAT" />
            </div>
            <div className="space-y-2">
              <Label>Likes Count</Label>
              <Input 
                type="number" 
                value={editLikes} 
                onChange={(e) => setEditLikes(parseInt(e.target.value) || 0)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={processingId === editingQuestion?.id}>
              {processingId === editingQuestion?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Answer Dialog */}
      <Dialog open={!!answeringQuestion} onOpenChange={(open) => !open && setAnsweringQuestion(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Respond to Question</DialogTitle>
            <DialogDescription>
              Submit an official response as an Admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-md text-sm mb-4">
              <p className="font-semibold mb-1">{answeringQuestion?.title}</p>
              <p className="text-muted-foreground line-clamp-3">{answeringQuestion?.content}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Your Answer</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateAI} 
                  disabled={isGeneratingAI}
                  className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                  Auto-Generate with AI
                </Button>
              </div>
              <Textarea 
                value={answerContent} 
                onChange={(e) => setAnswerContent(e.target.value)} 
                placeholder="Type your response here..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnsweringQuestion(null)}>Cancel</Button>
            <Button onClick={handleSubmitAnswer} disabled={processingId === answeringQuestion?.id}>
              {processingId === answeringQuestion?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Answer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
