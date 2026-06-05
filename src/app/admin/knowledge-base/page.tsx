'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Trash, Loader2, Sparkles, BrainCircuit, CheckCircle2, HelpCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { analyzeKbContent, integrateKbClarifications, AnalyzeKbContentOutput } from '@/ai/flows/analyze-kb-content';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { KnowledgeBaseItem } from '@/lib/types';
import { fetchKnowledgeBase } from '@/lib/knowledge-base';
import { collection, getDocs, deleteDoc, doc, query, orderBy, getFirestore, addDoc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import AiChatTester from '@/components/dashboard/AiChatTester';

type UnansweredQuestion = {
  id: string;
  question: string;
  timestamp: Date;
  comment?: string;
  aiResponse?: string;
};

type KBItem = KnowledgeBaseItem;
const db = getFirestore(firebaseApp);

const formSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, 'Question or topic title must be at least 5 characters.'),
  answer: z.string().min(10, 'Answer or content details must be at least 10 characters.'),
  sourceType: z.enum(['qa', 'text', 'link']).default('qa'),
  linkUrl: z.string().url('Please enter a valid URL (including https://).').or(z.literal('')).optional(),
});

function KnowledgeBaseForm({ item, onSubmit, onCancel }: { item: Partial<KBItem> | null, onSubmit: (data: any) => void, onCancel: () => void }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: item?.id || '',
            question: item?.question || '',
            answer: item?.answer || '',
            sourceType: item?.sourceType || 'qa',
            linkUrl: item?.linkUrl || '',
        },
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalyzeKbContentOutput | null>(null);
    const [clarifications, setClarifications] = useState<{ [question: string]: string }>({});
    const [isIntegrating, setIsIntegrating] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        form.reset({
            id: item?.id || '',
            question: item?.question || '',
            answer: item?.answer || '',
            sourceType: item?.sourceType || 'qa',
            linkUrl: item?.linkUrl || '',
        });
        setAnalysisResult(null);
        setClarifications({});
        setAnalysisError(null);
    }, [item, form]);

    const sourceType = form.watch('sourceType');
    const watchedQuestion = form.watch('question');
    const watchedAnswer = form.watch('answer');
    const watchedLinkUrl = form.watch('linkUrl');

    // Reset analysis result if inputs change, to keep it fresh
    useEffect(() => {
        setAnalysisResult(null);
        setClarifications({});
        setAnalysisError(null);
    }, [watchedQuestion, watchedAnswer, sourceType, watchedLinkUrl]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        if (values.sourceType === 'link' && !values.linkUrl) {
            form.setError('linkUrl', { message: 'URL is required when source type is Link.' });
            return;
        }
        onSubmit(values);
    };

    const handleAnalyze = async () => {
        setAnalysisError(null);
        const isValid = await form.trigger(['question', 'answer', 'linkUrl']);
        if (!isValid) return;

        const values = form.getValues();
        setIsAnalyzing(true);
        try {
            const res = await analyzeKbContent({
                question: values.question,
                answer: values.answer,
                sourceType: values.sourceType,
            });

            if (res.success && res.data) {
                setAnalysisResult(res.data);
                const initialClarifications: { [q: string]: string } = {};
                res.data.questions.forEach(q => {
                    initialClarifications[q] = '';
                });
                setClarifications(initialClarifications);
            } else {
                setAnalysisError(res.error || 'Failed to analyze content.');
            }
        } catch (err: any) {
            setAnalysisError(err.message || 'An unexpected error occurred during analysis.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleIntegrateClarifications = async () => {
        const values = form.getValues();
        const clarificationList = Object.entries(clarifications)
            .filter(([_, answer]) => answer.trim() !== '')
            .map(([question, answer]) => ({ question, answer }));

        if (clarificationList.length === 0) {
            setAnalysisError('Please provide at least one answer to the clarifying questions.');
            return;
        }

        setIsIntegrating(true);
        setAnalysisError(null);
        try {
            const res = await integrateKbClarifications({
                question: values.question,
                answer: values.answer,
                sourceType: values.sourceType,
                clarifications: clarificationList,
            });

            if (res.success && res.updatedAnswer) {
                form.setValue('answer', res.updatedAnswer, { shouldValidate: true });
                setClarifications({});
                
                // Automatically re-run the analysis
                const nextRes = await analyzeKbContent({
                    question: values.question,
                    answer: res.updatedAnswer,
                    sourceType: values.sourceType,
                });

                if (nextRes.success && nextRes.data) {
                    setAnalysisResult(nextRes.data);
                } else {
                    setAnalysisResult(null);
                }
            } else {
                setAnalysisError(res.error || 'Failed to integrate clarifications.');
            }
        } catch (err: any) {
            setAnalysisError(err.message || 'An unexpected error occurred during integration.');
        } finally {
            setIsIntegrating(false);
        }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="sourceType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Information Source Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="qa">Question & Answer Pair (Standard FAQ)</SelectItem>
                                    <SelectItem value="text">Text Resource (Guidelines, general details)</SelectItem>
                                    <SelectItem value="link">Reference Link (External website / articles)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {sourceType === 'qa' && 'Question / Topic'}
                                {sourceType === 'text' && 'Resource Topic / Title'}
                                {sourceType === 'link' && 'Website Link Title / Topic'}
                            </FormLabel>
                            <FormControl>
                                <Textarea {...field} rows={2} placeholder={
                                    sourceType === 'qa' ? "e.g., What is our refund policy?" :
                                    sourceType === 'text' ? "e.g., VAT Registration Eligibility Rules" :
                                    "e.g., SARS Rules for Dispute Objections"
                                } />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {sourceType === 'link' && (
                    <FormField
                        control={form.control}
                        name="linkUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Resource URL / Link</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="https://www.sars.gov.za/..." />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {sourceType === 'qa' && 'Answer / Information'}
                                {sourceType === 'text' && 'Reference Text / Content'}
                                {sourceType === 'link' && 'Description / Context (What information is at this URL)'}
                            </FormLabel>
                            <FormControl>
                                <Textarea {...field} rows={sourceType === 'text' ? 8 : 5} placeholder={
                                    sourceType === 'qa' ? "Provide a detailed and accurate answer." :
                                    sourceType === 'text' ? "Paste the reference document content here. The AI will learn from this raw text." :
                                    "Describe the context/information available at this link so the AI knows when to reference it."
                                } />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Analysis Loading / Results Panel */}
                {(isAnalyzing || analysisResult || analysisError) && (
                    <div className="rounded-xl border border-violet-100 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-950/10 p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {isAnalyzing && (
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
                                <p className="text-sm font-medium text-violet-800 dark:text-violet-300">Khai is analyzing your content...</p>
                                <p className="text-xs text-muted-foreground">Ensuring I understand the details perfectly.</p>
                            </div>
                        )}

                        {analysisError && (
                            <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Analysis Issue</p>
                                    <p className="text-xs">{analysisError}</p>
                                </div>
                            </div>
                        )}

                        {!isAnalyzing && analysisResult && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <div className="flex items-center gap-2">
                                        <BrainCircuit className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                        <h4 className="font-semibold text-sm text-violet-900 dark:text-violet-200">Khai's Comprehension</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {analysisResult.understood ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                                                <CheckCircle2 className="mr-1 h-3 w-3" /> Fully Understood
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
                                                <HelpCircle className="mr-1 h-3 w-3 animate-pulse" /> Clarifications Needed
                                            </Badge>
                                        )}
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
                                            {analysisResult.comprehensionScore}%
                                        </span>
                                    </div>
                                </div>

                                <div className="text-sm text-violet-800 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-950/20 p-3 rounded-lg">
                                    <p className="font-semibold text-xs text-violet-950 dark:text-violet-200 uppercase tracking-wider mb-1">What I Understand:</p>
                                    <p className="italic text-xs leading-relaxed">{analysisResult.summary}</p>
                                </div>

                                {analysisResult.missingDetails && analysisResult.missingDetails.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identified Gaps:</p>
                                        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                                            {analysisResult.missingDetails.map((detail, idx) => (
                                                <li key={idx}>{detail}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {!analysisResult.understood && analysisResult.questions && analysisResult.questions.length > 0 && (
                                    <div className="space-y-3 pt-2 border-t border-violet-100/50 dark:border-violet-900/30">
                                        <p className="text-xs font-semibold text-violet-950 dark:text-violet-200 uppercase tracking-wider">Help me understand better:</p>
                                        
                                        <div className="space-y-3">
                                            {analysisResult.questions.map((question, index) => (
                                                <div key={index} className="space-y-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-violet-100/80 dark:border-violet-900/40">
                                                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                                                        <span className="text-violet-600 dark:text-violet-400 font-bold">Q{index + 1}:</span>
                                                        {question}
                                                    </label>
                                                    <Textarea
                                                        rows={2}
                                                        value={clarifications[question] || ''}
                                                        onChange={(e) => setClarifications(prev => ({
                                                            ...prev,
                                                            [question]: e.target.value
                                                        }))}
                                                        placeholder="Provide the missing details..."
                                                        className="text-xs min-h-[48px] resize-none focus-visible:ring-violet-500"
                                                        disabled={isIntegrating}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleIntegrateClarifications}
                                            disabled={isIntegrating || !Object.values(clarifications).some(v => v.trim() !== '')}
                                            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs py-2"
                                        >
                                            {isIntegrating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                    Integrating clarifications...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                                                    Integrate &amp; Update Content
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t pt-4">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing || isIntegrating}
                        className="bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800 dark:hover:bg-violet-900/50"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4 text-violet-500" />
                                Analyze with Khai AI
                            </>
                        )}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={isAnalyzing || isIntegrating}>Cancel</Button>
                        <Button type="submit" disabled={isAnalyzing || isIntegrating}>Save Resource</Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}

export default function AdminKnowledgeBasePage() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isChatTesterOpen, setIsChatTesterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Partial<KBItem> | null>(null);
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
      setIsLoading(true);
      try {
        const kbItemsSnapshot = await getDocs(query(collection(db, "knowledgeBase"), orderBy("question")));
        const fetchedKbItems = kbItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeBaseItem));
        setItems(fetchedKbItems);

        const unansweredSnapshot = await getDocs(query(collection(db, 'unansweredQuestions'), orderBy('timestamp', 'desc')));
        const fetchedUnanswered = unansweredSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            question: data.question,
            timestamp: data.timestamp.toDate(),
            comment: data.comment || '',
            aiResponse: data.aiResponse || '',
          };
        });
        setQuestions(fetchedUnanswered);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Could not fetch knowledge base data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    loadData();
  }, [toast]);

  const handleAddToKnowledgeBase = (question: UnansweredQuestion) => {
    setSelectedItem({ 
      id: question.id, 
      question: question.question, 
      answer: question.comment || '',
      sourceType: 'qa'
    });
    setIsFormOpen(true);
  };

  const handleDeleteUnanswered = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent row click
    try {
      await deleteDoc(doc(db, 'unansweredQuestions', id));
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast({
        title: 'Question Deleted',
        description: 'The unanswered question has been removed.',
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: 'Error',
        description: 'Could not delete the question.',
        variant: 'destructive',
      });
    }
  };

  const handleAddKB = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEditKB = (item: KBItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };
  
  const handleDeleteKB = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'knowledgeBase', itemId));
      toast({
        title: 'Item Deleted',
        description: 'The knowledge base item has been removed.',
        variant: 'destructive',
      });
      loadData();
    } catch (error) {
      console.error("Error deleting knowledge base item:", error);
      toast({
        title: 'Error',
        description: 'Could not delete the item.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: Omit<KBItem, 'id'> & { id?: string }) => {
    try {
      const saveData = {
        question: data.question,
        answer: data.answer,
        sourceType: data.sourceType || 'qa',
        linkUrl: data.sourceType === 'link' ? (data.linkUrl || '') : '',
      };

      if (selectedItem && selectedItem.id && items.some(i => i.id === selectedItem.id)) {
        // Editing an existing KB item
        await updateDoc(doc(db, 'knowledgeBase', selectedItem.id), saveData);
        toast({ title: 'Resource Updated', description: 'The knowledge base resource has been updated.' });
      } else { 
        // Adding a new item
        await addDoc(collection(db, 'knowledgeBase'), saveData);
        toast({ title: 'Resource Added', description: 'The new resource has been added to the knowledge base.'});
        
        // If it was from an unanswered question, delete it
        if (selectedItem && selectedItem.id && questions.some(q => q.id === selectedItem.id)) {
             await deleteDoc(doc(db, 'unansweredQuestions', selectedItem.id));
        }
      }
      setIsFormOpen(false);
      setSelectedItem(null);
      loadData(); // Reload all data
    } catch (error) {
       console.error("Error submitting form:", error);
       toast({ title: 'Error', description: 'Could not save the resource.', variant: 'destructive'});
    }
  };

  return (
    <div className="space-y-8">
        <AiChatTester 
            isOpen={isChatTesterOpen} 
            onClose={() => setIsChatTesterOpen(false)} 
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <span/>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{selectedItem?.id && items.some(i => i.id === selectedItem.id) ? 'Edit Resource' : 'Add to Knowledge Base'}</DialogTitle>
                    <DialogDescription>
                        Provide standard Q&As, detailed reference texts, or links for the AI assistant to learn from.
                    </DialogDescription>
                </DialogHeader>
                <KnowledgeBaseForm 
                    item={selectedItem} 
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            </DialogContent>
        </Dialog>

        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Knowledge Base &amp; AI Training</h1>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline"
                    onClick={() => setIsChatTesterOpen(true)}
                    className="border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-300 dark:bg-violet-950/20 dark:hover:bg-violet-900/50"
                >
                    <MessageSquare className="mr-2 h-4 w-4 text-violet-500" />
                    Test AI Chat
                </Button>
                <Button onClick={handleAddKB}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add to Knowledge Base
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
            <CardTitle>Unanswered Questions</CardTitle>
            <CardDescription>
                These are questions users have asked that the AI could not answer. Click a question to add it to the knowledge base.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : questions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No unanswered questions right now. Great job!</p>
            ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Asked</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {questions.map((q) => (
                        <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleAddToKnowledgeBase(q)}>
                            <TableCell className="font-medium max-w-2xl">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span>{q.question}</span>
                                        {q.comment && (
                                            <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] py-0 px-1.5 font-bold">
                                                Feedback Comment
                                            </Badge>
                                        )}
                                    </div>
                                    {q.comment && (
                                        <div className="text-xs text-violet-600 bg-violet-50/50 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-900/50 p-2 rounded mt-1.5 font-medium italic">
                                            <strong className="not-italic text-violet-700 dark:text-violet-400 font-bold block mb-0.5 text-[10px] uppercase tracking-wider">Comment:</strong>
                                            "{q.comment}"
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{formatDistanceToNow(q.timestamp, { addSuffix: true })}</TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this question from the training list.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={(e) => handleDeleteUnanswered(e, q.id)}>
                                                Continue
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            )}
            </CardContent>
        </Card>

        <Separator />
        
        <Card>
            <CardHeader>
            <CardTitle>All Knowledge Base Items</CardTitle>
            <CardDescription>This information is used to help the "Ask Our AI Assistant" answer questions correctly.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Question / Topic</TableHead>
                    <TableHead>Resource Details / Answer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {items.map(item => (
                    <TableRow key={item.id}>
                    <TableCell className="font-medium align-top max-w-xs">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold">{item.question}</span>
                                {item.sourceType === 'link' && (
                                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] py-0 px-1.5">Link</Badge>
                                )}
                                {item.sourceType === 'text' && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] py-0 px-1.5">Text Resource</Badge>
                                )}
                                {(item.sourceType === 'qa' || !item.sourceType) && (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5">Q&A</Badge>
                                )}
                            </div>
                            {item.sourceType === 'link' && item.linkUrl && (
                                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[240px]">
                                    {item.linkUrl}
                                </a>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground align-top max-w-lg truncate">{item.answer}</TableCell>
                    <TableCell className="text-right align-top">
                        <AlertDialog>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditKB(item)}>
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive">
                                        Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this item from the knowledge base.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteKB(item.id)}>
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    </div>
  );
}
