'use client';

import { useState, useEffect, useRef } from 'react';
import { websiteQAndA } from '@/ai/flows/website-q-and-a';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, Send, Trash2, Loader2, Bot, User, Sparkles, 
  ShieldCheck, HelpCircle, AlertTriangle, ExternalLink, RefreshCw, ChevronRight, ShoppingCart
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type TestMessage = {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  confidence?: number;
  serviceUrl?: string;
  orderTrigger?: any;
  orderId?: string;
};

interface AiChatTesterProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUESTIONS = [
  "How much is VAT registration?",
  "What is your refund policy?",
  "Tell me about the Partner program",
  "How do I request a Tax Clearance?",
  "Where are you located?"
];

export default function AiChatTester({ isOpen, onClose }: AiChatTesterProps) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDiagnostics, setExpandedDiagnostics] = useState<{ [key: number]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Training comment feature state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedBotMessage, setSelectedBotMessage] = useState<TestMessage | null>(null);
  const [precedingQuestion, setPrecedingQuestion] = useState<string>('');
  const [commentText, setCommentText] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const { toast } = useToast();
  const db = getFirestore(firebaseApp);

  const getPrecedingUserMessage = (idx: number): string | null => {
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i].content;
      }
    }
    return null;
  };

  const handleOpenCommentDialog = (message: TestMessage, idx: number) => {
    const question = getPrecedingUserMessage(idx);
    if (!question) return; // Skip if no preceding question

    setSelectedBotMessage(message);
    setPrecedingQuestion(question);
    setCommentText('');
    setCommentDialogOpen(true);
  };

  const handleSaveComment = async () => {
    if (!commentText.trim() || !precedingQuestion || !selectedBotMessage) return;

    setIsSavingComment(true);
    try {
      await addDoc(collection(db, 'unansweredQuestions'), {
        question: precedingQuestion,
        aiResponse: selectedBotMessage.content,
        comment: commentText.trim(),
        timestamp: new Date()
      });

      toast({
        title: "Comment Saved",
        description: "Your comment has been logged to train the AI.",
      });
      setCommentDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving training comment:", error);
      toast({
        title: "Error",
        description: "Failed to save training comment: " + (error.message || error),
        variant: "destructive",
      });
    } finally {
      setIsSavingComment(false);
    }
  };

  // Initialize with welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'bot',
          content: "Hello! I'm Khai, a Support Specialist at **My Accountant**.\n\nHow can I assist you today?\n\nI'm here to help with any questions you may have about our services, pricing, processes, products, or our company. I can also assist you with placing a new order or tracking an existing order.",
          timestamp: new Date(),
          confidence: 100
        }
      ]);
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    const userMsg: TestMessage = {
      role: 'user',
      content: questionText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      // Build history excluding diagnostics
      const history = messages
        .filter(m => m.content !== '') // Skip empty fallback messages
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Invoke the website Q&A flow. 
      // We explicitly DO NOT pass conversationId so it won't pollute production chat histories.
      const response = await websiteQAndA({
        question: questionText,
        history: history
      });

      const botMsg: TestMessage = {
        role: 'bot',
        content: response.answer || "*(Empty response)*",
        timestamp: new Date(),
        confidence: response.confidence,
        serviceUrl: response.serviceUrl,
        orderTrigger: response.orderTrigger,
        orderId: response.orderId
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Error in AI Q&A flow:", error);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: `❌ **Error running AI Chat Flow:** ${error.message || 'An unexpected error occurred.'}`,
          timestamp: new Date(),
          confidence: 0
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'bot',
        content: "Hello! I'm Khai, a Support Specialist at **My Accountant**.\n\nHow can I assist you today?\n\nI'm here to help with any questions you may have about our services, pricing, processes, products, or our company. I can also assist you with placing a new order or tracking an existing order.",
        timestamp: new Date(),
        confidence: 100
      }
    ]);
    setExpandedDiagnostics({});
  };

  const getConfidenceBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
  };

  const toggleDiagnostics = (index: number) => {
    setExpandedDiagnostics(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full bg-slate-50 border-slate-200 text-slate-900 shadow-2xl z-50">
        
        {/* Header */}
        <SheetHeader className="p-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center border border-violet-100">
                <Bot className="h-5 w-5 text-violet-600 animate-pulse" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  AI Chat Tester <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-violet-700 border-violet-200 bg-violet-50/50 font-black">Sandbox</Badge>
                </SheetTitle>
                <SheetDescription className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                  Verify how Khai responds using the latest training data.
                </SheetDescription>
              </div>
            </div>
            
            <Button aria-label="Delete"
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              title="Clear sandbox history"
              className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Preset suggestions & diagnostics context banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-col gap-1.5 select-none shrink-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-violet-500 animate-pulse" />
            Click preset to test:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="text-[10px] bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-semibold px-2.5 py-1 rounded-lg transition-colors border border-slate-200 shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Message Log */}
        <ScrollArea className="flex-grow p-4 space-y-4 bg-slate-50/50">
          <div className="space-y-4 pr-3.5">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-2.5 animate-in fade-in duration-200",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'bot' && (
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                    <Bot className="h-4.5 w-4.5 text-violet-600" />
                  </div>
                )}
                
                <div className="flex flex-col space-y-1.5 max-w-[85%]">
                  {(() => {
                    const precedingQuestionText = getPrecedingUserMessage(idx);
                    const hasPrecedingQuestion = message.role === 'bot' && !!precedingQuestionText;
                    return (
                      <div
                        onClick={() => hasPrecedingQuestion && handleOpenCommentDialog(message, idx)}
                        className={cn(
                          "rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-sm transition-all duration-200 relative group",
                          message.role === 'user'
                            ? "bg-violet-600 text-white rounded-tr-none"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none",
                          hasPrecedingQuestion && "hover:border-violet-300 hover:shadow-md cursor-pointer hover:bg-violet-50/10"
                        )}
                        title={hasPrecedingQuestion ? "Click to add a training comment" : undefined}
                      >
                        {hasPrecedingQuestion && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 shadow-sm">
                            <MessageSquare className="h-2.5 w-2.5" />
                            Comment
                          </div>
                        )}
                        <div className={cn(
                          "prose prose-sm max-w-none text-xs",
                          message.role === 'user' ? "prose-invert text-white" : "prose-slate text-slate-800"
                        )}>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Diagnostic Panel for AI Responses */}
                  {message.role === 'bot' && typeof message.confidence === 'number' && (
                    <div className="bg-slate-100/60 border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                      {/* Diagnostic Header */}
                      <button
                        onClick={() => toggleDiagnostics(idx)}
                        className="w-full px-3 py-1.5 flex items-center justify-between text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3 text-violet-600" />
                          <span className="font-bold">Diagnostics</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[9px] py-0 px-1 font-semibold", getConfidenceBadgeColor(message.confidence))}>
                            Conf: {message.confidence}%
                          </Badge>
                          <ChevronRight className={cn("h-3 w-3 transition-transform text-slate-400", expandedDiagnostics[idx] ? "rotate-90" : "")} />
                        </div>
                      </button>

                      {/* Diagnostic Details */}
                      {expandedDiagnostics[idx] && (
                        <div className="px-3 pb-2.5 pt-1 border-t border-slate-200/80 space-y-2 text-slate-700 font-mono bg-white animate-in slide-in-from-top-1 duration-150">
                          {/* Service URL info */}
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Service Referral URL:</span>
                            {message.serviceUrl ? (
                              <div className="flex items-center gap-1 text-blue-600">
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                <span className="break-all">{message.serviceUrl}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">None triggered</span>
                            )}
                          </div>

                          {/* Order Trigger Payload info */}
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Order Trigger Payload:</span>
                            {message.orderTrigger ? (
                              <pre className="text-[9px] p-2 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto text-emerald-700 max-w-full">
                                {JSON.stringify(message.orderTrigger, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-slate-400 italic">None triggered</span>
                            )}
                          </div>

                          {/* Order ID info */}
                          {message.orderId && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 p-1.5 rounded-lg font-bold">
                              <ShoppingCart className="h-3 w-3" />
                              <span>Order Generated: #{message.orderId}</span>
                            </div>
                          )}

                          {/* Training Match Status */}
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Confidence Analysis:</span>
                            <span className="text-slate-600 leading-relaxed font-sans">
                              {message.confidence >= 90 
                                ? "Directly matched knowledge base item / context details."
                                : message.confidence >= 60
                                ? "Inferred answer by combining context details."
                                : "Using general knowledge support fallback rules."}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <span className={cn(
                    "text-[8px] text-slate-500 px-1 font-semibold",
                    message.role === 'user' ? "text-right" : "text-left"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                    <User className="h-4.5 w-4.5 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                  <Bot className="h-4.5 w-4.5 text-violet-600" />
                </div>
                <div role="status" aria-live="polite" aria-busy="true" className="p-3.5 rounded-2xl rounded-tl-none bg-white border border-slate-200/80 shadow-sm flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-violet-600" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Footer */}
        <div className="p-3 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuestion);
            }}
            className="w-full flex items-center gap-2"
          >
            <Input
              placeholder="Ask a question to test the model..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={isLoading}
              className="bg-slate-50 border-slate-200 focus-visible:bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 rounded-xl h-10 shadow-inner focus-visible:ring-violet-600"
            />
            <Button aria-label="Send"
              type="submit"
              size="icon"
              disabled={isLoading || !inputQuestion.trim()}
              className="rounded-xl h-10 w-10 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md bg-violet-600 hover:bg-violet-700 text-white disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

      </SheetContent>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-900 dark:text-violet-200">
              <MessageSquare className="h-5 w-5 text-violet-600" />
              Add Training Comment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide correct information or corrections for this AI response. This will be used to train the AI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Question</span>
              <p className="text-xs font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                {precedingQuestion}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Response</span>
              <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 max-h-32 overflow-y-auto font-mono">
                {selectedBotMessage?.content}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Correct Answer / Comment</span>
              <Textarea
                placeholder="Type the correct response or comments to update the knowledge base..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="text-xs font-semibold focus-visible:ring-violet-600"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCommentDialogOpen(false)}
              disabled={isSavingComment}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveComment}
              disabled={isSavingComment || !commentText.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSavingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Comment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
