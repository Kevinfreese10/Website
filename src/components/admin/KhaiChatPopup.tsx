'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Bot,
  X,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { analyzeSpreadsheetAllocationsAction, applySpreadsheetAllocationsAction } from '@/app/actions';
import { cn } from '@/lib/utils';

const db = getFirestore(firebaseApp);

type Message = {
  role: 'bot' | 'user';
  content: string;
  isMatchCard?: boolean;
  matches?: any[];
  timestamp: Date;
};

export default function KhaiChatPopup({ clientId, client }: { clientId: string, client: any }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: "Hello! I'm Khai, your AI Accountant. How can I help you today?\n\nIf you have a spreadsheet (.xlsx, .xls, or .csv) containing transaction allocations, you can upload it here. I'll analyze it and help you allocate your bank records in bulk!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Reference data loaded from Firestore
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [allTxs, setAllTxs] = useState<any[]>([]);

  // Checklist state for matches
  const [selectedMatches, setSelectedMatches] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!clientId) return;

    // Fetch reference customers and suppliers for displaying names
    const fetchRefData = async () => {
      try {
        const custSnap = await getDocs(collection(db, 'aiAccountantClients', clientId, 'customers'));
        setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const supSnap = await getDocs(collection(db, 'aiAccountantClients', clientId, 'suppliers'));
        setSuppliers(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Failed to load reference data in Chat Popup:", e);
      }
    };
    fetchRefData();

    // Listen to all transactions for reference
    const txsQuery = query(collection(db, 'aiAccountantClients', clientId, 'transactions'));
    const unsubscribe = onSnapshot(txsQuery, (snap) => {
      setAllTxs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("Failed to sync transactions in Chat Popup:", err);
    });

    return () => unsubscribe();
  }, [clientId]);

  // Translate accountId/Type to human readable description
  const getAllocationLabel = (accountId: string, accountType: string) => {
    if (accountType === 'customer') {
      return customers.find(c => c.id === accountId)?.name || `Customer: ${accountId}`;
    }
    if (accountType === 'supplier') {
      return suppliers.find(s => s.id === accountId)?.name || `Supplier: ${accountId}`;
    }
    return client?.chartOfAccounts?.find((a: any) => a.id === accountId)?.description || `Account: ${accountId}`;
  };

  const getTxDescription = (txId: string) => {
    const tx = allTxs.find(t => t.id === txId);
    if (!tx) return "Unknown Transaction";
    return `${tx.cleanDescription || tx.description} (${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Math.abs(tx.amount))})`;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      // Direct general chat response from Khai
      // Let's call client-allocation-chat or simple model generation
      const { processClientAllocationChat } = await import('@/ai/flows/client-allocation-chat');
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: userText });

      // Fetch pending transactions for current client to provide context
      const pendingTxs = allTxs.filter(t => ['new', 'ai_review', 'ai_processing'].includes(t.status)).slice(0, 5);

      const res = await processClientAllocationChat({
        history: chatHistory,
        pendingTransactions: pendingTxs,
        chartOfAccounts: client?.chartOfAccounts || [],
        isVatRegistered: !!client?.isVatRegistered
      });

      setMessages(prev => [...prev, { role: 'bot', content: res.answer, timestamp: new Date() }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "I'm having a bit of trouble understanding right now. You can try uploading a spreadsheet, or ask me something else!",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so it triggers again on same file
    e.target.value = '';

    setMessages(prev => [...prev, { role: 'user', content: `Uploaded file: ${file.name}`, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet);

          if (!rows || rows.length === 0) {
            setMessages(prev => [...prev, {
              role: 'bot',
              content: "I processed the spreadsheet, but it appears to be empty. Please ensure it has columns like Date, Description, Amount, and Category/Account.",
              timestamp: new Date()
            }]);
            setIsLoading(false);
            return;
          }

          setMessages(prev => [...prev, {
            role: 'bot',
            content: `I'm analyzing the ${rows.length} rows in "${file.name}" and matching them against your unallocated bank transactions. Please wait...`,
            timestamp: new Date()
          }]);

          const res = await analyzeSpreadsheetAllocationsAction({
            clientId,
            spreadsheetData: JSON.stringify(rows)
          }) as any;

          if (!res.success) {
            setMessages(prev => [...prev, {
              role: 'bot',
              content: `Error analyzing spreadsheet: ${res.error}`,
              timestamp: new Date()
            }]);
          } else if (res.matches && res.matches.length > 0) {
            // Set all matches as selected by default
            const defaultSelected: Record<string, boolean> = {};
            res.matches.forEach((m: any) => {
              defaultSelected[m.transactionId] = true;
            });
            setSelectedMatches(prev => ({ ...prev, ...defaultSelected }));

            setMessages(prev => [...prev, {
              role: 'bot',
              content: res.summary || `I matched ${res.matches.length} transactions!`,
              isMatchCard: true,
              matches: res.matches,
              timestamp: new Date()
            }]);
          } else {
            setMessages(prev => [...prev, {
              role: 'bot',
              content: res.summary || "I processed the file but couldn't find any matches with high confidence. Please ensure descriptions or amounts match your bank records.",
              timestamp: new Date()
            }]);
          }
        } catch (err: any) {
          console.error(err);
          setMessages(prev => [...prev, {
            role: 'bot',
            content: `Failed to parse Excel file: ${err.message}`,
            timestamp: new Date()
          }]);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `Error reading file: ${err.message}`,
        timestamp: new Date()
      }]);
      setIsLoading(false);
    }
  };

  const handleApplyAllocations = async (matches: any[]) => {
    const activeAllocations = matches.filter(m => selectedMatches[m.transactionId]);
    if (activeAllocations.length === 0) {
      toast({
        title: "No selections",
        description: "Please check at least one transaction to allocate.",
        variant: "destructive"
      });
      return;
    }

    setIsApplying(true);
    try {
      const res = await applySpreadsheetAllocationsAction({
        clientId,
        allocations: activeAllocations.map(m => ({
          transactionId: m.transactionId,
          accountId: m.accountId,
          accountType: m.accountType,
          vatType: m.vatType,
          explanation: m.explanation
        }))
      });

      if (res.success) {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: `🎉 Successfully allocated ${res.count} matched transactions in your records!`,
          timestamp: new Date()
        }]);
        toast({
          title: "Allocations Applied",
          description: `Successfully allocated ${res.count} transactions.`,
        });
      } else {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: `Failed to apply allocations: ${res.error}`,
          timestamp: new Date()
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `Failed to apply allocations: ${err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-ring group"
        aria-label="Toggle chat with Khai"
      >
        {isOpen ? (
          <X className="h-6 w-6 transform rotate-90 duration-300 transition-transform" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] flex flex-col shadow-2xl border bg-card backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground py-4 px-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center shadow-sm">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  Chat with Khai
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 text-[10px] font-medium tracking-wide">AI Accountant (He/Him)</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-grow p-4 overflow-hidden relative">
            <ScrollArea className="h-full pr-3" ref={scrollRef}>
              <div className="space-y-4 pb-2">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                    {m.role === 'bot' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 border shadow-sm flex-shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed",
                      m.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted border rounded-bl-none text-foreground"
                    )}>
                      {m.isMatchCard && m.matches ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-primary font-bold border-b pb-1.5 mb-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>Matched spreadsheet results:</span>
                          </div>
                          <p className="text-xs mb-3 text-muted-foreground font-medium">{m.content}</p>
                          
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {m.matches.map((match: any, index: number) => {
                              const isSelected = selectedMatches[match.transactionId] ?? false;
                              return (
                                <div key={index} className="p-2 border rounded-lg bg-card text-xs shadow-sm flex items-start gap-2.5">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => setSelectedMatches(prev => ({
                                      ...prev,
                                      [match.transactionId]: !!checked
                                    }))}
                                    id={`chk-${match.transactionId}`}
                                    className="mt-0.5"
                                  />
                                  <div className="space-y-1 flex-grow">
                                    <p className="font-bold text-foreground">
                                      {getTxDescription(match.transactionId)}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-muted-foreground">Allocate:</span>
                                      <Badge variant="outline" className="text-[10px] font-bold py-0 h-4 border-primary/20 text-primary bg-primary/5">
                                        {getAllocationLabel(match.accountId, match.accountType)}
                                      </Badge>
                                      <Badge className={cn(
                                        "text-[9px] py-0 h-4",
                                        match.confidence >= 80 ? "bg-green-600 text-white hover:bg-green-600" : "bg-yellow-500 text-white hover:bg-yellow-500"
                                      )}>
                                        {match.confidence}% match
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic leading-tight">
                                      "{match.explanation}"
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 border-t flex gap-2 justify-end">
                            <Button
                              size="sm"
                              className="bg-primary text-primary-foreground font-bold h-8 text-xs hover:bg-primary/90 gap-1.5"
                              onClick={() => handleApplyAllocations(m.matches || [])}
                              disabled={isApplying}
                            >
                              {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Apply {m.matches.filter(match => selectedMatches[match.transactionId]).length} Allocations
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap font-medium">{m.content}</p>
                      )}
                      <p className="text-[9px] text-right mt-1 opacity-70">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 border shadow-sm flex-shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs font-bold text-primary italic">Khai is working...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t bg-muted/30">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2 items-center">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0 rounded-full border-slate-200 text-slate-500 hover:text-primary hover:bg-primary/10"
                onClick={handleFileClick}
                disabled={isLoading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-grow bg-background text-xs font-bold h-10 border-slate-200 focus-visible:ring-primary"
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !inputValue.trim()}
                className="h-10 w-10 rounded-full flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
