'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Trash, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

type UnansweredQuestion = {
  id: string;
  question: string;
  timestamp: Date;
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

    useEffect(() => {
        form.reset({
            id: item?.id || '',
            question: item?.question || '',
            answer: item?.answer || '',
            sourceType: item?.sourceType || 'qa',
            linkUrl: item?.linkUrl || '',
        });
    }, [item, form]);

    const sourceType = form.watch('sourceType');

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        if (values.sourceType === 'link' && !values.linkUrl) {
            form.setError('linkUrl', { message: 'URL is required when source type is Link.' });
            return;
        }
        onSubmit(values);
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

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Resource</Button>
                </div>
            </form>
        </Form>
    );
}

export default function AdminKnowledgeBasePage() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
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
        const fetchedUnanswered = unansweredSnapshot.docs.map(doc => ({
          id: doc.id,
          question: doc.data().question,
          timestamp: doc.data().timestamp.toDate(),
        }));
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
    setSelectedItem({ id: question.id, question: question.question, answer: '' });
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
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <span/>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
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
            <Button onClick={handleAddKB}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add to Knowledge Base
            </Button>
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
                            <TableCell className="font-medium max-w-2xl">{q.question}</TableCell>
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
