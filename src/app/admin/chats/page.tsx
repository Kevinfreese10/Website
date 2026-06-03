'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Search, Calendar, User, Trash, ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { collection, getDocs, deleteDoc, doc, query, orderBy, getFirestore } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { formatDistanceToNow, format } from 'date-fns';

type ChatMessage = {
  role: 'user' | 'bot';
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
};

const db = getFirestore(firebaseApp);

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "chatbotConversations"), orderBy("updatedAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: Conversation[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userName: data.userName || 'Guest',
          userEmail: data.userEmail || 'Anonymous',
          startedAt: data.startedAt,
          updatedAt: data.updatedAt,
          messages: data.messages || [],
        };
      });
      setConversations(fetched);
      
      // Keep selected chat updated if it exists
      if (selectedChat) {
        const updatedSelected = fetched.find(c => c.id === selectedChat.id);
        if (updatedSelected) {
          setSelectedChat(updatedSelected);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Could not load chatbot conversations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'chatbotConversations', id));
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedChat?.id === id) {
        setSelectedChat(null);
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
      // Handles Firestore timestamp
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'dd MMM yyyy, HH:mm');
      }
      // Handles ISO string
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
            Review live client interactions with the AI assistant Khai for quality assurance and training.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadConversations} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading && 'animate-spin'}`} />
          Refresh
        </Button>
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
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedChat?.id === chat.id
                        ? 'bg-blue-50 border-blue-200 text-slate-900 shadow-sm'
                        : 'bg-white border-transparent hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm truncate max-w-[150px]">{chat.userName}</div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 font-medium">
                        {chat.messages.length} msg
                      </Badge>
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
          {selectedChat ? (
            <Card className="flex flex-col h-[700px] shadow-md border overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-4 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">{selectedChat.userName}</CardTitle>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium border-slate-200 bg-white">
                      ID: {selectedChat.id.substring(0, 12)}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs font-semibold text-slate-600">
                    Email: <span className="text-slate-800 font-bold">{selectedChat.userEmail}</span> | 
                    Started: {formatDateSafely(selectedChat.startedAt)}
                  </CardDescription>
                </div>

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
                        onClick={(e) => handleDeleteConversation(e, selectedChat.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>

              {/* Chat Bubble Area */}
              <CardContent className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                {selectedChat.messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-12">No messages in this chat session.</p>
                ) : (
                  selectedChat.messages.map((msg, index) => (
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
                      
                      <div className="flex flex-col space-y-1 max-w-[80%]">
                        <div
                          className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm font-medium ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border rounded-tl-none'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          
                          {/* Render triggered tags/actions */}
                          {msg.serviceUrl && (
                            <div className="mt-3 border-t border-slate-100 pt-2 flex items-center gap-1.5 text-xs text-blue-600 font-bold">
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
              </CardContent>
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
