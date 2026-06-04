'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { websiteQAndA } from '@/ai/flows/website-q-and-a';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, MessageCircle, Send, X, Bot, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const formSchema = z.object({
  question: z.string().min(1, 'Cannot send an empty message.'),
});

type ChatMessage = {
  role: 'user' | 'bot' | 'agent';
  text: string;
  serviceUrl?: string;
  orderId?: string;
}

export default function WebsiteAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModal, setIsModal] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [chatMode, setChatMode] = useState<'ai' | 'agent'>('ai');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);
  
  useEffect(() => {
    // 1. Persist or generate conversationId
    let cid = localStorage.getItem('myacc_chat_id');
    if (!cid) {
      cid = 'chat_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('myacc_chat_id', cid);
    }
    setConversationId(cid);

    const welcomeMessage: ChatMessage = {
      role: 'bot',
      text: "Hello! I'm Khai, a Support Consultant at **My Accountant**.\n\nHow can I assist you today? I'm here to help with any questions you may have about our services, products, pricing, processes, or the company.",
    };

    // 2. Listen to conversation real-time
    const docRef = doc(db, 'chatbotConversations', cid);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setChatMode(data.mode || 'ai');
        if (data.messages && data.messages.length > 0) {
          const mapped = data.messages.map((m: any) => ({
            role: m.role || 'bot',
            text: m.content || '',
            serviceUrl: m.serviceUrl,
            orderId: m.orderId
          }));
          setChatHistory(mapped);
        } else {
          setChatHistory([welcomeMessage]);
        }
      } else {
        setChatHistory([welcomeMessage]);
      }
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
    });

    // Automatically open the widget as a popup in modal mode after a short delay of 1.5 seconds (only once per session)
    const hasOpenedBefore = sessionStorage.getItem('myacc_chat_opened');
    const timer = setTimeout(() => {
      if (!hasOpenedBefore) {
        setIsModal(true);
        setIsOpen(true);
        sessionStorage.setItem('myacc_chat_opened', 'true');
      }
    }, 1500);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const toggleChat = () => {
    if (!isOpen) {
      // If opening manually, disable modal mode (use floating panel)
      setIsModal(false);
    }
    setIsOpen(!isOpen);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userMessage: ChatMessage = { role: 'user', text: values.question };
    
    // Optimistically update chat history for instant UI feedback
    setChatHistory(prev => [...prev, userMessage]);
    
    const isAgent = chatMode === 'agent';
    if (!isAgent) {
      setIsLoading(true);
    }
    
    form.reset();

    try {
      await websiteQAndA({ 
        question: values.question,
        history: chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'bot', content: m.text })),
        conversationId: conversationId
      });
      // In AI mode, if the response was successful, the Firestore listener 
      // will update the state with the bot's response.
      // In Agent mode, the Server Action just logs the message and we wait for the human.
    } catch (e) {
      console.error(e);
      if (!isAgent) {
        const errorMessage: ChatMessage = { role: 'bot', text: 'Sorry, I am having trouble connecting. Please try again later.' };
        setChatHistory(prev => [...prev, errorMessage]);
      }
    } finally {
      if (!isAgent) {
        setIsLoading(false);
      }
    }
  }

  const cardInner = (
    <>
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex flex-row items-center justify-between space-y-0 border-b border-blue-700">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-white/20 overflow-hidden">
              <img src="/favicon.ico" alt="AI Mascot" className="h-8 w-8 object-contain scale-[1.8] origin-center" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-white leading-tight">Khai</CardTitle>
            <CardDescription className="text-[10px] text-blue-100 font-medium leading-none mt-0.5">Support Consultant</CardDescription>
          </div>
        </div>
        <Button 
          onClick={() => setIsOpen(false)} 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 rounded-full hover:bg-white/10 text-white hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>

      {/* Agent Takeover Banner */}
      {chatMode === 'agent' && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-indigo-700 select-none animate-in slide-in-from-top duration-200">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Human Advisor connected
          </span>
          <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider">Live Support</span>
        </div>
      )}

      {/* Messages Body */}
      <CardContent 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
      >
        {chatHistory.map((message, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200", 
              message.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {message.role === 'bot' && (
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden shadow-sm">
                <img src="/favicon.ico" alt="AI Mascot" className="h-6 w-6 object-contain scale-[1.8] origin-center" />
              </div>
            )}
            {message.role === 'agent' && (
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 shrink-0 overflow-hidden shadow-sm">
                <User className="h-4.5 w-4.5 text-indigo-600" />
              </div>
            )}
            <div 
              className={cn(
                "max-w-[85%] rounded-2xl p-3.5 text-sm font-medium leading-relaxed shadow-sm",
                message.role === 'user' 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : message.role === 'agent'
                    ? "bg-indigo-600 text-white rounded-bl-none border border-indigo-700"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
              )}
            >
              {message.role === 'agent' && (
                <div className="text-[9px] text-indigo-200 font-extrabold uppercase tracking-widest mb-1.5 select-none flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-indigo-200" /> Human Advisor
                </div>
              )}
              <div className={cn(
                "prose prose-sm max-w-none",
                message.role === 'user' || message.role === 'agent' ? "prose-invert text-white" : "prose-slate text-slate-800"
              )}>
                 <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
              
              {message.serviceUrl && (
                <div className="mt-3">
                  <Link 
                    href={message.serviceUrl} 
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                      message.role === 'user' || message.role === 'agent'
                        ? "bg-white/20 hover:bg-white/35 text-white" 
                        : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                    )}
                  >
                    View Service Details
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {message.orderId && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <Link 
                    href={`/order-confirmation/${message.orderId}`} 
                    onClick={() => setIsOpen(false)}
                    className="inline-flex w-full items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md transition-all animate-bounce"
                  >
                    💳 Complete Secure Payment
                  </Link>
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                <User className="h-5 w-5 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-end gap-2 justify-start animate-pulse">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden shadow-sm">
                 <img src="/favicon.ico" alt="AI Mascot" className="h-6 w-6 object-contain scale-[1.8] origin-center" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-bl-none bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                 <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
          </div>
        )}
      </CardContent>

      {/* Input Form Footer */}
      <CardFooter className="p-3 border-t bg-white">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex items-center gap-2">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input 
                      placeholder="Ask about compliance, registration, bookkeeping..." 
                      {...field} 
                      autoComplete="off" 
                      disabled={isLoading}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-blue-600 focus-visible:bg-white text-sm font-medium text-slate-800 placeholder-slate-400 rounded-xl h-10 shadow-inner"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading} 
              className="rounded-xl h-10 w-10 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md"
            >
              <Send className="h-4.5 w-4.5 text-white" />
            </Button>
          </form>
        </Form>
      </CardFooter>
    </>
  );

  return (
    <>
      {/* Bottom-left Launcher Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button 
          onClick={toggleChat} 
          size="icon" 
          className="w-14 h-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 duration-200 group flex items-center justify-center"
        >
           {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-200" />}
        </Button>
      </div>

      {/* Chat panel */}
      {isOpen && (
        isModal ? (
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg animate-in zoom-in-95 duration-200"
            >
              <Card className="flex flex-col h-[80vh] max-h-[700px] shadow-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {cardInner}
              </Card>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-20 left-4 right-4 z-50 sm:right-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
            <Card className="flex flex-col h-[65vh] sm:h-[600px] shadow-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {cardInner}
            </Card>
          </div>
        )
      )}
    </>
  );
}
