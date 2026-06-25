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
import { Loader2, MessageCircle, Send, X, Bot, User, ArrowRight, ShieldCheck, Info, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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
  const [chatEmail, setChatEmail] = useState<string>('');
  const [emailInput, setEmailInput] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [services, setServices] = useState<any[]>([]);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const userMessagesCount = chatHistory.filter(m => m.role === 'user').length;
  const isEmailRequired = (!chatEmail || chatEmail === 'Anonymous' || chatEmail === '') && userMessagesCount >= 2;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snap = await getDocs(query(collection(db, "services"), orderBy("title")));
        setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching services in Widget:", err);
      }
    };
    fetchServices();
  }, []);

  const getMatchedService = (url: string | undefined) => {
    if (!url) return null;
    const parts = url.split('/');
    const slug = parts[parts.length - 1];
    return services.find(s => s.slug === slug);
  };

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

  // Heartbeat tracking to update visitor presence in Firestore while widget is open
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const updatePresence = async (statusVal: 'online' | 'offline') => {
      try {
        const docRef = doc(db, 'chatbotConversations', conversationId);
        await setDoc(docRef, {
          status: statusVal,
          lastActiveAt: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };

    updatePresence('online');

    const interval = setInterval(() => {
      updatePresence('online');
    }, 15000);

    const handleUnload = () => {
      updatePresence('offline');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('offline');
      } else {
        updatePresence('online');
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updatePresence('offline');
    };
  }, [isOpen, conversationId]);
  
  useEffect(() => {
    // 1. Check for resumeChat parameter in URL
    let cid = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const resumeId = params.get('resumeChat');
      if (resumeId) {
        cid = resumeId;
        localStorage.setItem('myacc_chat_id', cid);
        setIsOpen(true);
        setIsModal(false);
        // Clean query parameter from URL
        const newUrl = window.location.pathname + window.location.search.replace(/[\?&]resumeChat=[^&]+/, '').replace(/^&/, '?');
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    // 2. Fetch or create conversationId
    if (!cid) {
      cid = localStorage.getItem('myacc_chat_id') || '';
    }
    if (!cid) {
      cid = 'chat_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('myacc_chat_id', cid);
    }
    setConversationId(cid);

    const welcomeMessage: ChatMessage = {
      role: 'bot',
      text: "Hello! I'm Khai, a Support Specialist at **My Accountant**.\n\nHow can I assist you today?\n\nI'm here to help with any questions you may have about our services, pricing, processes, products, or our company. I can also assist you with placing a new order or tracking an existing order.",
    };

    // 3. Listen to conversation real-time
    const docRef = doc(db, 'chatbotConversations', cid);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setChatMode(data.mode || 'ai');
        setChatEmail(data.userEmail || '');
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

    // Automatically open the widget as a popup in modal mode after a short delay of 1.5 seconds (only once ever per user)
    const hasOpenedBefore = localStorage.getItem('myacc_chat_opened');
    const timer = setTimeout(() => {
      if (!hasOpenedBefore) {
        setIsModal(true);
        setIsOpen(true);
        localStorage.setItem('myacc_chat_opened', 'true');
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

  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = emailInput.trim();
    if (!emailClean) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      alert("Please enter a valid email address.");
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const docRef = doc(db, 'chatbotConversations', conversationId);
      await setDoc(docRef, { 
        userEmail: emailClean,
        mode: chatMode || 'ai',
        userName: 'Guest',
        updatedAt: serverTimestamp(),
        startedAt: serverTimestamp()
      }, { merge: true });
      setChatEmail(emailClean);
    } catch (err) {
      console.error("Error setting email:", err);
    } finally {
      setIsSubmittingEmail(false);
    }
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
      <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between space-y-0 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/15 flex items-center justify-center border border-primary-foreground/20">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-primary-foreground leading-tight">Khai</CardTitle>
            <CardDescription className="text-[10px] text-primary-foreground/80 font-medium leading-none mt-0.5">Support Consultant</CardDescription>
          </div>
        </div>
        <Button 
          onClick={() => setIsOpen(false)} 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 rounded-full hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>

      {/* Agent Takeover Banner */}
      {chatMode === 'agent' && (
        <div className="bg-indigo-950/45 border-b border-indigo-500/20 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-indigo-300 select-none animate-in slide-in-from-top duration-200">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Human Advisor connected
          </span>
          <span className="text-[10px] text-indigo-400 uppercase font-black tracking-wider">Live Support</span>
        </div>
      )}

      {/* Messages Body */}
      <CardContent 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/40 border-t border-b border"
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
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border shrink-0 shadow-sm">
                <Bot className="h-4.5 w-4.5 text-primary animate-pulse" />
              </div>
            )}
            {message.role === 'agent' && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 overflow-hidden shadow-sm">
                <User className="h-4.5 w-4.5 text-primary" />
              </div>
            )}
            <div 
              className={cn(
                "max-w-[85%] rounded-2xl p-3.5 text-sm font-medium leading-relaxed shadow-sm",
                message.role === 'user' 
                  ? "bg-gradient text-white rounded-br-none" 
                  : message.role === 'agent'
                    ? "bg-primary text-primary-foreground rounded-bl-none border border-primary"
                    : "bg-card text-foreground border rounded-bl-none backdrop-blur-sm"
              )}
            >
              {message.role === 'agent' && (
                <div className="text-[9px] text-primary-foreground/80 font-extrabold uppercase tracking-widest mb-1.5 select-none flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-primary-foreground" /> Human Advisor
                </div>
              )}
              <div className={cn(
                "prose prose-sm max-w-none",
                message.role === 'user' || message.role === 'agent' ? "prose-invert text-white" : "prose-invert text-foreground"
              )}>
                 <ReactMarkdown
                   components={{
                     a: ({ href, children }) => (
                       <a
                         href={href}
                         target="_blank"
                         rel="noopener noreferrer"
                         className={cn(
                           "underline underline-offset-2 font-semibold break-all hover:opacity-80 transition-opacity",
                           message.role === 'user' || message.role === 'agent'
                             ? "text-white/90 hover:text-white"
                             : "text-primary hover:opacity-90"
                         )}
                       >
                         {children}
                       </a>
                     )
                   }}
                 >{makeLinksClickable(message.text)}</ReactMarkdown>
              </div>
              
              {message.serviceUrl && (() => {
                const matchedService = getMatchedService(message.serviceUrl);
                if (matchedService) {
                  return (
                    <div className="mt-3 p-3 border border-white/10 rounded-xl bg-white/[0.02] backdrop-blur-md flex flex-col gap-2 shadow-sm animate-in fade-in duration-300 max-w-sm">
                      <div className="flex items-start gap-2.5">
                        {matchedService.imageUrl && (
                          <img 
                            src={matchedService.imageUrl} 
                            alt={matchedService.title} 
                            className="w-12 h-12 rounded-lg object-cover border border-white/10"
                          />
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-extrabold text-foreground truncate">
                            {matchedService.title}
                          </p>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tight px-1 py-0 h-4 border-white/10 text-foreground bg-white/[0.04] mt-0.5">
                            {matchedService.category || 'Accounting'}
                          </Badge>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-mono font-black text-primary">
                            {matchedService.price ? `R${matchedService.price}` : 'TBC'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          size="sm"
                          type="button"
                          className="h-8 font-black text-[10px] uppercase bg-gradient text-white flex-grow flex items-center justify-center gap-1 hover:opacity-90"
                          onClick={() => {
                            addToCart(matchedService);
                            toast({
                              title: "Added to Cart!",
                              description: `${matchedService.title} has been added to your cart.`,
                            });
                          }}
                        >
                          Add to Cart
                        </Button>
                        <Link 
                          href={message.serviceUrl} 
                          onClick={() => setIsOpen(false)}
                          className="h-8 font-bold text-[10px] uppercase border px-3 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-foreground border-white/10 transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                }

                // Fallback to text link if no database match
                return (
                  <div className="mt-3">
                    <Link 
                      href={message.serviceUrl} 
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                        message.role === 'user' || message.role === 'agent'
                          ? "bg-white/20 hover:bg-white/35 text-white" 
                          : "bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-primary"
                      )}
                    >
                      View Service Details
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })()}

              {message.orderId && (
                <div className="mt-3 border-t border-white/10 pt-3">
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
              <div className="h-8 w-8 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/10 shrink-0">
                <User className="h-5 w-5 text-foreground/80" />
              </div>
            )}
          </div>
        ))}
        
        {chatHistory.length <= 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 px-2 select-none animate-in fade-in duration-500">
            {[
              { label: "🤝 Why Trust Us", text: "Why should I trust My Accountant?" },
              { label: "🛍️ View All Services", text: "How can I view all your services?" },
              { label: "📦 Track My Order Status", text: "How do I track my order status?" },
              { label: "📑 SARS Compliance Check", text: "How can I request a free tax compliance check?" }
            ].map((chip, idx) => (
              <Button
                key={idx}
                variant="outline"
                type="button"
                className="h-auto text-left justify-start p-2.5 rounded-xl border-white/10 hover:border-primary/40 hover:bg-white/[0.08] bg-white/[0.03] text-[11px] font-bold leading-snug flex flex-col gap-1 shadow-sm transition-all text-foreground"
                onClick={() => {
                  form.setValue('question', chip.text);
                  form.handleSubmit(onSubmit)();
                }}
              >
                <span className="text-primary font-extrabold">{chip.label}</span>
                <span className="text-[10px] text-muted-foreground font-medium truncate w-full">{chip.text}</span>
              </Button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-end gap-2 justify-start animate-pulse">
              <div className="h-8 w-8 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/10 shrink-0 shadow-sm">
                 <Bot className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-bl-none bg-white/[0.04] border border-white/10 shadow-sm flex items-center justify-center">
                 <div className="flex items-center gap-1 py-1 px-1">
                   <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <span className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                 </div>
              </div>
          </div>
        )}
      </CardContent>

      {/* Input Form Footer or Email Capture */}
      {isEmailRequired ? (
        chatMode === 'agent' ? (
          <CardFooter className="p-4 border-t bg-muted/10 flex flex-col items-stretch gap-3 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1 select-none">
                <ShieldCheck className="h-3.5 w-3.5 text-primary animate-pulse" />
                Advisor Connecting...
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed select-none">
                Please enter your email so we can notify you when the advisor replies.
              </p>
            </div>
            <form onSubmit={handleRegisterEmail} className="flex gap-2 w-full">
              <Input 
                placeholder="yourname@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isSubmittingEmail}
                className="flex-grow h-9 text-xs border focus-visible:ring-primary bg-muted text-foreground"
                required
                type="email"
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmittingEmail}
                className="bg-primary hover:bg-primary/90 text-xs font-bold shrink-0 text-primary-foreground"
              >
                {isSubmittingEmail ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : "Connect"}
              </Button>
            </form>
          </CardFooter>
        ) : (
          <CardFooter className="p-4 border-t bg-muted/10 flex flex-col items-stretch gap-3 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1 select-none">
                <ShieldCheck className="h-3.5 w-3.5 text-primary animate-pulse" />
                Enter Email to Continue
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed select-none">
                You have reached the limit of anonymous questions. Please enter your email address to continue chatting.
              </p>
            </div>
            <form onSubmit={handleRegisterEmail} className="flex gap-2 w-full">
              <Input 
                placeholder="yourname@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isSubmittingEmail}
                className="flex-grow h-9 text-xs border focus-visible:ring-primary bg-muted text-foreground"
                required
                type="email"
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmittingEmail}
                className="bg-gradient hover:opacity-90 text-xs font-bold shrink-0 text-white"
              >
                {isSubmittingEmail ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Submit"}
              </Button>
            </form>
          </CardFooter>
        )
      ) : (
        <CardFooter className="p-3 border-t bg-background flex flex-col items-stretch gap-2 animate-in fade-in duration-300">
          {(!chatEmail || chatEmail === 'Anonymous' || chatEmail === '') && (
            <div className="text-[10px] text-muted-foreground text-center font-semibold mb-1 flex items-center justify-center gap-1 select-none">
              <Info className="h-3 w-3 text-primary shrink-0" />
              Guest Session: {userMessagesCount}/2 anonymous messages used.
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex items-center gap-2">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input 
                        placeholder={chatMode === 'agent' ? "Type your message to the advisor..." : "Ask about compliance, registration, bookkeeping..."}
                        {...field} 
                        autoComplete="off" 
                        disabled={isLoading}
                        className={cn(
                          "bg-muted border focus-visible:bg-muted/80 text-sm font-medium text-foreground placeholder-muted-foreground rounded-xl h-10 shadow-inner focus-visible:ring-primary"
                        )}
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
                className={cn(
                  "rounded-xl h-10 w-10 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md",
                  chatMode === 'agent' ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-gradient hover:opacity-90 text-white"
                )}
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </form>
          </Form>
        </CardFooter>
      )}
    </>
  );

  return (
    <>
      {/* Bottom-right Launcher Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={toggleChat} 
          size="icon" 
          className="w-14 h-14 rounded-full shadow-2xl bg-gradient hover:scale-105 active:scale-95 duration-200 group flex items-center justify-center neon-glow"
        >
           {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-200" />}
        </Button>
      </div>

      {/* Chat panel */}
      {isOpen && (
        isModal ? (
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg animate-in zoom-in-95 duration-200"
            >
              <Card className="flex flex-col h-[80vh] max-h-[700px] shadow-2xl bg-card border rounded-2xl overflow-hidden neon-glow">
                {cardInner}
              </Card>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
            <Card className="flex flex-col h-[65vh] sm:h-[600px] shadow-2xl bg-card border rounded-2xl overflow-hidden neon-glow">
              {cardInner}
            </Card>
          </div>
        )
      )}
    </>
  );
}

const makeLinksClickable = (text: string): string => {
  if (!text) return "";
  // Match standard URLs (http:// or https://) not preceded by ](
  const urlPattern = /(?<!\]\()(https?:\/\/[^\s)]+)/g;
  
  return text.replace(urlPattern, (url) => {
    let cleanUrl = url;
    let trailing = "";
    const match = url.match(/([.,;:?!]+)$/);
    if (match) {
      trailing = match[1];
      cleanUrl = url.substring(0, url.length - trailing.length);
    }
    return `[${cleanUrl}](${cleanUrl})${trailing}`;
  });
};
