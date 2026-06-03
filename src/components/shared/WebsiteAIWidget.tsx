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
import { Loader2, MessageCircle, Send, X, Bot, User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

const formSchema = z.object({
  question: z.string().min(1, 'Cannot send an empty message.'),
});

type ChatMessage = {
  role: 'user' | 'bot';
  text: string;
  serviceUrl?: string;
  orderId?: string;
}

export default function WebsiteAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    const welcomeMessage: ChatMessage = {
      role: 'bot',
      text: "Hello! I'm Khai, a Support Consultant at **My Accountant**.\n\nHow can I assist you today? I'm here to help with any questions you may have about our services, products, pricing, processes, or the company.",
    };
    setChatHistory([welcomeMessage]);
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userMessage: ChatMessage = { role: 'user', text: values.question };
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    form.reset();

    try {
      const response = await websiteQAndA({ 
        question: values.question,
        history: chatHistory.map(m => ({ role: m.role, content: m.text }))
       });
      const botMessage: ChatMessage = { 
        role: 'bot', 
        text: response.answer, 
        serviceUrl: response.serviceUrl,
        orderId: response.orderId 
      };
      setChatHistory(prev => [...prev, botMessage]);
    } catch (e) {
      const errorMessage: ChatMessage = { role: 'bot', text: 'Sorry, I am having trouble connecting. Please try again later.' };
      setChatHistory(prev => [...prev, errorMessage]);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Bottom-left Launcher Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button 
          onClick={() => setIsOpen(!isOpen)} 
          size="icon" 
          className="w-14 h-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 duration-200 group flex items-center justify-center"
        >
           {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-200" />}
        </Button>
      </div>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 right-4 z-50 sm:right-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Card className="flex flex-col h-[65vh] sm:h-[600px] shadow-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden">
            
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex flex-row items-center justify-between space-y-0 border-b border-blue-700">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white leading-tight">My Accountant AI</CardTitle>
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
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'bot' && (
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
                      <Bot className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-3.5 rounded-2xl max-w-[85%] shadow-sm border",
                    message.role === 'user' 
                      ? "bg-blue-600 text-white border-blue-600 rounded-br-none" 
                      : "bg-white border-slate-100 text-slate-800 rounded-bl-none"
                  )}>
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => (
                          <p 
                            className={cn(
                              "text-sm my-0 leading-relaxed font-medium whitespace-pre-line", 
                              message.role === 'user' ? "text-white" : "text-slate-800"
                            )} 
                            {...props} 
                          />
                        ),
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 text-sm space-y-1 font-medium" {...props} />,
                        li: ({node, ...props}) => <li className="my-0.5" {...props} />,
                        strong: ({node, ...props}) => (
                          <strong 
                            className={cn(
                              "font-bold", 
                              message.role === 'user' ? "text-white" : "text-slate-900"
                            )} 
                            {...props} 
                          />
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>

                    {message.role === 'bot' && message.serviceUrl && !message.orderId && (
                       <Button 
                         asChild 
                         variant="link" 
                         className="p-0 h-auto mt-3 text-blue-600 hover:text-blue-700 font-semibold flex items-center justify-start text-xs group"
                       >
                         <Link href={message.serviceUrl}>
                           View Service Details <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                         </Link>
                       </Button>
                    )}

                    {message.role === 'bot' && message.orderId && (
                       <Button 
                         asChild 
                         className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 flex items-center justify-center rounded-xl h-10 shadow-md text-sm border-none transition-all active:scale-95 duration-150"
                       >
                         <Link href={`/order-confirmation/${message.orderId}`}>
                           Complete Payment <ArrowRight className="h-4 w-4 text-white" />
                         </Link>
                       </Button>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-300 shadow-sm">
                      <User className="h-4.5 w-4.5 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}

              {/* Bot typing loader */}
              {isLoading && (
                 <div className="flex items-end gap-2 justify-start animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
                      <Bot className="h-4.5 w-4.5 text-blue-600" />
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

          </Card>
        </div>
      )}
    </>
  );
}
