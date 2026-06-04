'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Search, Calendar, User, Trash, ExternalLink, ShieldCheck, ShieldAlert, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { collection, deleteDoc, doc, query, orderBy, getFirestore, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { formatDistanceToNow, format } from 'date-fns';

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
};

const db = getFirestore(firebaseApp);

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    return (
      c.userName.toLowerCase().includes(term) ||
      c.userEmail.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term)
    );
  });

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatbot Conversations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor client interactions in real-time. Take over from the AI whenever personalized support is required.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Master List Section */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold">Session Explorer</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, session..."
                  className="pl-9 h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 max-h-[600px] overflow-y-auto space-y-1">
              {isLoading && conversations.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">No conversations found.</p>
              ) : (
                filteredConversations.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`w-full text-left p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedChatId === chat.id
                        ? 'bg-blue-50 border-blue-200 text-slate-900 shadow-sm'
                        : 'bg-white border-transparent hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm truncate max-w-[140px]">{chat.userName}</div>
                      <div className="flex items-center gap-1 shrink-0">
                        {chat.mode === 'agent' && (
                          <Badge className="bg-indigo-600 text-white text-[9px] hover:bg-indigo-700 font-bold px-1.5 py-0 border-none">
                            AGENT
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                          {chat.messages.length} msg
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{chat.userEmail}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2 font-medium">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{formatDistanceSafely(chat.updatedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Transcript Panel */}
        <div className="lg:col-span-2">
          {activeChat ? (
            <Card className="flex flex-col h-[700px] shadow-md border overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-4 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-bold text-slate-900">{activeChat.userName}</CardTitle>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium border-slate-200 bg-white">
                      ID: {activeChat.id.substring(0, 12)}
                    </Badge>
                    {activeChat.mode === 'agent' ? (
                      <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 text-[10px] py-0 px-2 font-black">
                        Human Takeover Active
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-[10px] py-0 px-2 font-black">
                        AI Agent (Khai) Running
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs font-semibold text-slate-600">
                    Email: <span className="text-slate-800 font-bold">{activeChat.userEmail}</span> | 
                    Started: {formatDateSafely(activeChat.startedAt)}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {activeChat.mode === 'agent' ? (
                    <Button 
                      onClick={handleRelease} 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] h-8 font-black uppercase tracking-wider text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      Release to AI
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleTakeover} 
                      size="sm" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-8 font-black uppercase tracking-wider shadow-md"
                    >
                      Take Over Chat
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-600 rounded-full h-8 w-8">
                        <Trash className="h-4.5 w-4.5" />
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
              <CardContent className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                {activeChat.messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-12">No messages in this chat session.</p>
                ) : (
                  activeChat.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'bot' && (
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border shrink-0 overflow-hidden shadow-sm">
                          <img src="/favicon.ico" alt="Khai Mascot" className="h-6 w-6 object-contain scale-[1.8]" />
                        </div>
                      )}
                      
                      {msg.role === 'agent' && (
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 shrink-0 overflow-hidden shadow-sm">
                          <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" />
                        </div>
                      )}
                      
                      <div className="flex flex-col space-y-1 max-w-[80%]">
                        <div
                          className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm font-medium ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : msg.role === 'agent'
                                ? 'bg-indigo-600 text-white rounded-tl-none border border-indigo-700 shadow-indigo-100'
                                : 'bg-white text-slate-800 border rounded-tl-none'
                          }`}
                        >
                          {msg.role === 'agent' && (
                            <div className="text-[8px] text-indigo-200 font-extrabold uppercase tracking-widest mb-1.5 select-none flex items-center gap-1">
                              Human Advisor
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          
                          {/* Render triggered tags/actions */}
                          {msg.serviceUrl && (
                            <div className={`mt-3 border-t pt-2 flex items-center gap-1.5 text-xs font-bold ${
                              msg.role === 'agent' ? 'text-indigo-200 border-indigo-500' : 'text-blue-600 border-slate-100'
                            }`}>
                              <ExternalLink className="h-3 w-3" />
                              <span>Referred page: <a href={msg.serviceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{msg.serviceUrl}</a></span>
                            </div>
                          )}
                          {msg.orderId && (
                            <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-100 font-semibold">
                              🛒 Order Generated: <a href={`/admin/orders?search=${msg.orderId}`} className="underline font-bold text-emerald-950">#{msg.orderId}</a>
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] text-muted-foreground font-semibold px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : 'Recent'}
                        </span>
                      </div>

                      {msg.role === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border shrink-0">
                          <User className="h-4.5 w-4.5 text-slate-600" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </CardContent>

              {/* Chat Send Input Box / Banner */}
              {activeChat.mode === 'agent' ? (
                <CardFooter className="p-3 border-t bg-white">
                  <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                    <Input
                      placeholder="Type a reply to the prospect..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-600 text-sm font-medium text-slate-800 placeholder-slate-400 rounded-xl h-10 shadow-inner"
                      autoFocus
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="rounded-xl h-10 w-10 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md"
                    >
                      <Send className="h-4.5 w-4.5 text-white" />
                    </Button>
                  </form>
                </CardFooter>
              ) : (
                <div className="p-3 border-t bg-indigo-50/50 flex items-center justify-between text-xs text-indigo-900/80 font-semibold select-none">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
                    AI Assistant (Khai) is answering questions.
                  </span>
                  <Button 
                    size="sm" 
                    onClick={handleTakeover} 
                    className="h-8 text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 shadow-md"
                  >
                    Take Over Chat
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex flex-col h-[700px] items-center justify-center border shadow-sm bg-slate-50/10 p-6 text-center">
              <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg font-bold">No Chat Selected</CardTitle>
              <CardDescription className="max-w-xs mt-2 text-sm">
                Select a conversation session from the explorer panel on the left to review its detailed transcript and client insights.
              </CardDescription>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
