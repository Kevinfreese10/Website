'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Search, Calendar, User, Trash, ExternalLink, ShieldCheck, ShieldAlert, Send, Bot, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { collection, deleteDoc, doc, query, orderBy, getFirestore, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow, format } from 'date-fns';
import { sendChatNotificationEmail, sendChatInviteEmail, generateFollowUpEmailDraft, sendFollowUpEmail } from '@/app/actions/chat-actions';
import { cn } from '@/lib/utils';

type ChatMessage = {
  role: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: string;
  serviceUrl?: string | null;
  orderId?: string | null;
};

type Conversation = {
  id: string;
  userName: string;
  userEmail: string;
  startedAt: any;
  updatedAt: any;
  messages: ChatMessage[];
  mode?: 'ai' | 'agent';
  status?: 'online' | 'offline';
  lastActiveAt?: any;
  closed?: boolean;
};

const db = getFirestore(firebaseApp);

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [shouldNotifyEmail, setShouldNotifyEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [isInviting, setIsInviting] = useState(false);
  const [cooldowns, setCooldowns] = useState<{ [chatId: string]: number }>({});
  const [filterTab, setFilterTab] = useState<'all' | 'ai' | 'agent' | 'online' | 'archived'>('all');
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [followUpSubject, setFollowUpSubject] = useState('');
  const [followUpBody, setFollowUpBody] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Trigger a re-render every 10 seconds to keep online/offline presence status accurate in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const isUserActive = (chat: Conversation) => {
    if (!chat.lastActiveAt) return false;
    try {
      const lastActive = chat.lastActiveAt.toDate ? chat.lastActiveAt.toDate() : new Date(chat.lastActiveAt);
      const diffInSeconds = (new Date().getTime() - lastActive.getTime()) / 1000;
      return chat.status === 'online' && diffInSeconds < 40;
    } catch {
      return false;
    }
  };

  // Set up real-time listener for the chatbot conversations collection
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "chatbotConversations"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Conversation[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userName: data.userName || 'Guest',
          userEmail: data.userEmail || 'Anonymous',
          startedAt: data.startedAt,
          updatedAt: data.updatedAt,
          messages: data.messages || [],
          mode: data.mode || 'ai',
          status: data.status || 'offline',
          lastActiveAt: data.lastActiveAt || null,
          closed: data.closed || false,
        };
      });
      setConversations(fetched);
      setIsLoading(false);
    }, (error) => {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Could not load chatbot conversations in real-time.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // Find the currently active chat from the real-time list
  const activeChat = conversations.find(c => c.id === selectedChatId) || null;

  // Auto-scroll to bottom of chat transcript when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages]);

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'chatbotConversations', id));
      if (selectedChatId === id) {
        setSelectedChatId(null);
      }
      toast({
        title: "Conversation Deleted",
        description: "The chat history has been permanently deleted.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Could not delete conversation.",
        variant: "destructive",
      });
    }
  };

  const handleTakeover = async () => {
    if (!selectedChatId) return;
    try {
      const docRef = doc(db, 'chatbotConversations', selectedChatId);
      await updateDoc(docRef, { mode: 'agent' });
      toast({
        title: "Takeover Active",
        description: "You have taken control of this conversation. Khai (AI) is now paused.",
      });
    } catch (error) {
      console.error("Error taking over chat:", error);
      toast({
        title: "Error",
        description: "Failed to take over conversation.",
        variant: "destructive",
      });
    }
  };

  const handleRelease = async () => {
    if (!selectedChatId) return;
    try {
      const docRef = doc(db, 'chatbotConversations', selectedChatId);
      await updateDoc(docRef, { mode: 'ai' });
      toast({
        title: "Released to AI",
        description: "AI assistant (Khai) has resumed control of this conversation.",
      });
    } catch (error) {
      console.error("Error releasing chat:", error);
      toast({
        title: "Error",
        description: "Failed to release conversation control.",
        variant: "destructive",
      });
    }
  };

  const handleInviteToChat = async () => {
    if (!selectedChatId || !activeChat || isInviting) return;
    
    const email = activeChat.userEmail;
    if (!email || email === 'Anonymous' || !email.includes('@')) {
      toast({
        title: "Cannot Send Invite",
        description: "This client does not have a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsInviting(true);
    try {
      const docRef = doc(db, 'chatbotConversations', selectedChatId);
      
      const systemMsg = {
        role: 'agent',
        content: 'Kevin Freese is ready to chat - sent an email invitation to join this chat.',
        timestamp: new Date().toISOString()
      };

      await updateDoc(docRef, {
        mode: 'agent',
        messages: arrayUnion(systemMsg),
        updatedAt: serverTimestamp()
      });

      const res = await sendChatInviteEmail(
        selectedChatId,
        email,
        activeChat.userName,
        'Kevin Freese'
      );

      if (res.success) {
        setCooldowns(prev => ({ ...prev, [selectedChatId]: 30 }));
        const interval = setInterval(() => {
          setCooldowns(prev => {
            const current = prev[selectedChatId] || 0;
            if (current <= 1) {
              clearInterval(interval);
              const updated = { ...prev };
              delete updated[selectedChatId];
              return updated;
            }
            return { ...prev, [selectedChatId]: current - 1 };
          });
        }, 1000);
        
        toast({
          title: "Invitation Sent",
          description: `An email invitation has been sent to ${email}.`,
        });
      } else {
        toast({
          title: "Invite Failed",
          description: res.error || "Could not send invitation email.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error in handleInviteToChat:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate chat invitation.",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleOpenFollowUp = async () => {
    if (!selectedChatId || !activeChat || isGeneratingFollowUp) return;
    setIsGeneratingFollowUp(true);
    setIsFollowUpDialogOpen(true);
    setFollowUpSubject('');
    setFollowUpBody('');

    try {
      const history = activeChat.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const res = await generateFollowUpEmailDraft(history, activeChat.userName);
      if (res.success && res.draft) {
        setFollowUpSubject(res.draft.subject);
        setFollowUpBody(res.draft.body);
      } else {
        toast({ title: 'Error', description: 'Failed to generate email draft', variant: 'destructive' });
        setIsFollowUpDialogOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to generate email draft', variant: 'destructive' });
      setIsFollowUpDialogOpen(false);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!selectedChatId || !activeChat || !activeChat.userEmail) return;
    setIsSendingFollowUp(true);
    try {
      const res = await sendFollowUpEmail(selectedChatId, activeChat.userEmail, followUpSubject, followUpBody);
      if (res.success) {
        toast({ title: 'Success', description: 'Follow-up email sent successfully.' });
        setIsFollowUpDialogOpen(false);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to send email', variant: 'destructive' });
      }
    } catch (error) {
       console.error(error);
       toast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' });
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId) return;

    const textToSend = replyText;
    setReplyText(''); // Clear input optimistically

    const newMsg = {
      role: 'agent',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    try {
      const docRef = doc(db, 'chatbotConversations', selectedChatId);
      await updateDoc(docRef, {
        messages: arrayUnion(newMsg),
        updatedAt: serverTimestamp()
      });

      // Deliver background email notification if client is offline/anonymous
      if (shouldNotifyEmail && activeChat && activeChat.userEmail && activeChat.userEmail !== 'Anonymous' && activeChat.userEmail.includes('@')) {
        sendChatNotificationEmail(selectedChatId, activeChat.userEmail, activeChat.userName, textToSend)
          .then((res) => {
            if (res.success) {
              console.log("Chat email notification sent successfully.");
            } else {
              console.error("Chat email notification failed:", res.error);
            }
          })
          .catch((err) => console.error("Error in email dispatch:", err));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Send Failed",
        description: "Could not deliver your message.",
        variant: "destructive",
      });
      setReplyText(textToSend); // Restore text on failure
    }
  };

  const filteredConversations = conversations.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      c.userName.toLowerCase().includes(term) ||
      c.userEmail.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term)
    );
    if (!matchesSearch) return false;

    if (filterTab === 'archived') return c.closed === true;
    
    // Hide archived chats from all other tabs
    if (c.closed) return false;

    if (filterTab === 'ai') return c.mode === 'ai';
    if (filterTab === 'agent') return c.mode === 'agent';
    if (filterTab === 'online') return isUserActive(c);
    return true;
  });

  const getInitials = (name: string) => {
    if (!name) return 'GU';
    return name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDateSafely = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'dd MMM yyyy, HH:mm');
      }
      return format(new Date(timestamp), 'dd MMM yyyy, HH:mm');
    } catch {
      return 'Recent';
    }
  };

  const formatDistanceSafely = (timestamp: any) => {
    if (!timestamp) return 'just now';
    try {
      if (timestamp.toDate) {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
      }
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-indigo-600" />
          Conversations Hub
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review prospect inquiries and live chats. Take over control from the AI or invite prospects to join a human advisor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Master List Section */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col h-[750px]">
          <Card className="flex flex-col h-full border border-slate-200/80 shadow-md bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-2 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800">Session Explorer</CardTitle>
                <Badge variant="outline" className="bg-slate-50 text-slate-600 font-bold border-slate-200 text-[10px]">
                  {conversations.length} total
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search name, email, session ID..."
                  className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-indigo-600 text-slate-900 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>

            {/* Filter Tabs */}
            <div className="px-4 pb-2 flex border-b border-slate-100 gap-1 shrink-0 select-none">
              {(['all', 'ai', 'agent', 'online', 'archived'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "flex-1 text-[10px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-all text-center border",
                    filterTab === tab
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-100/50"
                  )}
                >
                  {tab === 'all' && 'All'}
                  {tab === 'ai' && 'AI'}
                  {tab === 'agent' && 'Human'}
                  {tab === 'online' && 'Online'}
                  {tab === 'archived' && 'Archived'}
                </button>
              ))}
            </div>

            <CardContent className="flex-grow overflow-y-auto p-2 space-y-1 bg-slate-50/20">
              {isLoading && conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                  <p className="text-xs font-semibold">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 p-4">
                  <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold">No sessions found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Try altering your search or filters.</p>
                </div>
              ) : (
                filteredConversations.map((chat) => {
                  const isSelected = selectedChatId === chat.id;
                  const isOnline = isUserActive(chat);
                  return (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl cursor-pointer transition-all border flex flex-col gap-1.5",
                        isSelected
                          ? 'bg-indigo-50/60 border-indigo-200 text-slate-900 shadow-sm shadow-indigo-50/40'
                          : 'bg-white border-slate-100 hover:bg-slate-50/80 hover:border-slate-200 text-slate-800 shadow-sm'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 truncate font-bold text-sm text-slate-800">
                          {/* Pulsing indicator */}
                          <div className="relative flex h-2 w-2 shrink-0 select-none">
                            {isOnline && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span className={cn("relative inline-flex rounded-full h-2 w-2 border border-white", isOnline ? "bg-emerald-500" : "bg-slate-300")} />
                          </div>
                          <span className="truncate">{chat.userName}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {chat.mode === 'agent' ? (
                            <Badge className="bg-indigo-100 text-indigo-700 text-[9px] font-black border-indigo-200 hover:bg-indigo-100 py-0 px-1.5">
                              HUMAN
                            </Badge>
                          ) : (
                            <Badge className="bg-violet-50 text-violet-700 text-[9px] font-black border-violet-100 hover:bg-violet-50 py-0 px-1.5">
                              AI AGENT
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 truncate font-medium">{chat.userEmail}</div>
                      
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100">
                        <div className="flex items-center gap-1 font-semibold">
                          <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{formatDistanceSafely(chat.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold hover:bg-slate-100 text-[9px] py-0 px-1">
                            {chat.messages.length} messages
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleDeleteConversation(e, chat.id)}
                            className="h-5 w-5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md shrink-0"
                            title="Delete Conversation"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Transcript Panel */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col h-[750px]">
          {activeChat ? (
            <Card className="flex flex-col h-full shadow-md border border-slate-200/80 bg-white rounded-2xl overflow-hidden">
              
              {/* Header */}
              <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 p-4 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center border border-indigo-200 text-sm shadow-inner shrink-0 select-none">
                    {getInitials(activeChat.userName)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base font-extrabold text-slate-800">{activeChat.userName}</CardTitle>
                      
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-bold select-none text-slate-600">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isUserActive(activeChat) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
                        {isUserActive(activeChat) ? 'Active' : 'Offline'}
                      </div>

                      {activeChat.mode === 'agent' ? (
                        <Badge className="bg-indigo-600 text-white hover:bg-indigo-600 text-[9px] py-0.5 px-2 font-black border-none">
                          Human Takeover
                        </Badge>
                      ) : (
                        <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-50 border border-violet-200 text-[9px] py-0.5 px-2 font-black">
                          AI Agent Active
                        </Badge>
                      )}
                    </div>
                    
                    <CardDescription className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span>Email: <span className="text-slate-700 font-bold">{activeChat.userEmail}</span></span>
                      <span className="text-slate-300">|</span>
                      <span>Started: <span className="text-slate-700">{formatDateSafely(activeChat.startedAt)}</span></span>
                    </CardDescription>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2">
                  {activeChat.userEmail && activeChat.userEmail !== 'Anonymous' && activeChat.userEmail.includes('@') && (
                    <Button
                      onClick={handleInviteToChat}
                      disabled={isInviting || !!cooldowns[selectedChatId || '']}
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-8 font-black uppercase tracking-wider text-blue-700 border-blue-200 hover:bg-blue-50 bg-white"
                    >
                      {isInviting ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Mail className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                      )}
                      {isInviting 
                        ? 'Inviting...' 
                        : selectedChatId && cooldowns[selectedChatId] 
                          ? `Invite Sent (${cooldowns[selectedChatId]}s)` 
                          : 'Invite to Chat'}
                    </Button>
                  )}

                  {activeChat.userEmail && activeChat.userEmail !== 'Anonymous' && activeChat.userEmail.includes('@') && (
                    <Button
                      onClick={handleOpenFollowUp}
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-8 font-black uppercase tracking-wider text-purple-700 border-purple-200 hover:bg-purple-50 bg-white"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
                      Follow-up
                    </Button>
                  )}

                  {activeChat.mode === 'agent' ? (
                    <Button 
                      onClick={handleRelease} 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] h-8 font-black uppercase tracking-wider text-emerald-700 border-emerald-200 bg-white hover:bg-emerald-50"
                    >
                      Release to AI
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleTakeover} 
                      size="sm" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-8 font-black uppercase tracking-wider shadow-md shadow-indigo-100 transition-all active:scale-95"
                    >
                      Take Over Chat
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-600 rounded-full h-8 w-8 text-slate-400">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Conversation Log?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete this chat transcript from training history? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => handleDeleteConversation(e, activeChat.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>

              {/* Chat Bubble Area */}
              <CardContent className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {activeChat.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <MessageSquare className="h-8 w-8 text-slate-300 mb-2 animate-bounce" />
                    <p className="text-xs font-bold">No messages in this session.</p>
                  </div>
                ) : (
                  activeChat.messages.map((msg, index) => {
                    const isSystem = msg.content.includes('sent an email invitation') || msg.content.startsWith('System:');
                    if (isSystem) {
                      return (
                        <div key={index} className="flex justify-center my-4 animate-in fade-in duration-200">
                          <div className="bg-indigo-50/60 text-indigo-700 border border-indigo-100/50 text-[10px] font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                            <Mail className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                            <span>{msg.content}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200",
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {msg.role === 'bot' && (
                          <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm select-none">
                            <Bot className="h-4 w-4 text-violet-600" />
                          </div>
                        )}
                        
                        {msg.role === 'agent' && (
                          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 shrink-0 overflow-hidden shadow-sm select-none">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                        )}
                        
                        <div className="flex flex-col space-y-1 max-w-[75%]">
                          <div
                            className={cn(
                              "rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm font-medium",
                              msg.role === 'user'
                                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-indigo-100/60 shadow-md'
                                : msg.role === 'agent'
                                  ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-tl-none border border-indigo-700 shadow-indigo-100 shadow-md'
                                  : 'bg-violet-50/20 text-slate-800 border border-violet-100/60 rounded-tl-none'
                            )}
                          >
                            {msg.role === 'agent' && (
                              <div className="text-[8px] text-indigo-200 font-extrabold uppercase tracking-widest mb-1 select-none flex items-center gap-1">
                                <ShieldCheck className="h-2.5 w-2.5 text-indigo-200" /> Human Advisor
                              </div>
                            )}
                            {msg.role === 'bot' && (
                              <div className="text-[8px] text-violet-600 font-extrabold uppercase tracking-widest mb-1 select-none flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5 text-violet-500 animate-pulse" /> AI Assistant (Khai)
                              </div>
                            )}
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            
                            {/* Render triggered tags/actions */}
                            {msg.serviceUrl && (
                              <div className={cn(
                                "mt-3 border-t pt-2 flex items-center gap-1.5 text-[10px] font-bold",
                                msg.role === 'agent' ? 'text-indigo-200 border-indigo-500' : 'text-blue-600 border-slate-100'
                              )}>
                                <ExternalLink className="h-3 w-3" />
                                <span>Referred Page: <a href={msg.serviceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold">{msg.serviceUrl}</a></span>
                              </div>
                            )}
                            {msg.orderId && (
                              <div className="mt-2.5 text-[10px] bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100 font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-50/50">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>Order Generated: <a href={`/admin/orders?search=${msg.orderId}`} className="underline font-bold text-emerald-950">#{msg.orderId}</a></span>
                              </div>
                            )}
                          </div>
                          <span className={cn(
                            "text-[8px] text-slate-400 font-semibold px-1",
                            msg.role === 'user' ? 'text-right' : 'text-left'
                          )}>
                            {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : 'Recent'}
                          </span>
                        </div>
  
                        {msg.role === 'user' && (
                          <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm select-none">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </CardContent>

              {/* Chat Send Input Box / Banner */}
              {activeChat.mode === 'agent' ? (
                <CardFooter className="p-3.5 border-t border-slate-200 bg-white flex flex-col items-stretch gap-2.5 shrink-0 shadow-inner">
                  <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                    <Input
                      placeholder="Type your message to the client..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-indigo-600 text-xs font-semibold text-slate-800 placeholder-slate-400 rounded-xl h-10 shadow-inner"
                      autoFocus
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!replyText.trim()}
                      className="rounded-xl h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md shadow-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  {activeChat.userEmail && activeChat.userEmail !== 'Anonymous' && activeChat.userEmail.includes('@') ? (
                    <div className="flex items-center gap-2 px-1 select-none text-[10px] text-slate-500 font-semibold">
                      <input 
                        type="checkbox" 
                        id="notify-email"
                        checked={shouldNotifyEmail}
                        onChange={(e) => setShouldNotifyEmail(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 accent-indigo-600 cursor-pointer"
                      />
                      <label htmlFor="notify-email" className="cursor-pointer">
                        Send email notification on reply ({activeChat.userEmail})
                      </label>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-600 font-bold px-1 select-none flex items-center gap-1.5 animate-pulse">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Client is anonymous. Waiting for them to provide their email address.
                    </div>
                  )}
                </CardFooter>
              ) : (
                <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-violet-50/50 via-indigo-50/20 to-violet-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 select-none animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200/50 shadow-inner shrink-0">
                      <Bot className="h-4.5 w-4.5 text-violet-600 animate-bounce" />
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 leading-none">
                        AI Accountant (Khai) is Active
                      </h4>
                      <p className="text-[9px] text-slate-500 font-bold mt-1 leading-none">
                        Monitoring conversation and answering questions automatically.
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleTakeover} 
                    className="w-full sm:w-auto h-8 text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all active:scale-95 border-none"
                  >
                    Take Over Chat
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex flex-col h-full items-center justify-center border border-slate-200/80 shadow-md bg-white rounded-2xl p-6 text-center select-none">
              <div className="h-16 w-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-sm animate-pulse">
                <MessageSquare className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-800">No Session Selected</CardTitle>
              <CardDescription className="max-w-xs mt-2 text-sm text-slate-500">
                Select a client conversation from the Explorer panel on the left to review its transcript and insights.
              </CardDescription>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Follow-up Email</DialogTitle>
            <DialogDescription>
              Review and edit the AI-generated follow-up email before sending. This will be sent to <strong>{activeChat?.userEmail}</strong> and CC'd to kev@thinkestry.co.za.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isGeneratingFollowUp ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm font-medium">Generating draft using AI...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Subject</label>
                  <Input 
                    value={followUpSubject} 
                    onChange={(e) => setFollowUpSubject(e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Body</label>
                  <Textarea 
                    value={followUpBody}
                    onChange={(e) => setFollowUpBody(e.target.value)}
                    rows={8}
                    placeholder="Email body..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFollowUpDialogOpen(false)} disabled={isSendingFollowUp || isGeneratingFollowUp}>
              Cancel
            </Button>
            <Button onClick={handleSendFollowUp} disabled={isSendingFollowUp || isGeneratingFollowUp || !followUpSubject || !followUpBody} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSendingFollowUp ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Send Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

