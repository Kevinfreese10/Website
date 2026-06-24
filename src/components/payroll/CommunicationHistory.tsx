'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Paperclip, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { User } from '@/lib/types';
import { sendNewPayrollNoteNotification } from '@/app/actions/payroll-portal';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

type PayrollNote = {
  id?: string;
  text: string;
  authorId: string;
  authorName: string;
  date: any; // Firestore Timestamp
  type: 'note' | 'email';
  subject?: string | null;
  attachments?: { name: string; url: string }[] | null;
};

interface CommunicationHistoryProps {
  clientId: string;
  currentUser: User;
}

export default function CommunicationHistory({ clientId, currentUser }: CommunicationHistoryProps) {
  const [notes, setNotes] = useState<PayrollNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId) return;

    const notesRef = collection(db, 'aiPayrollClients', clientId, 'notes');
    const q = query(notesRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PayrollNote));
      setNotes(fetched);
      setIsLoading(false);

      // Auto scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error("Error fetching payroll notes:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() && !selectedFile) return;

    setIsSubmitting(true);
    let attachments: { name: string; url: string }[] = [];

    if (selectedFile) {
      setUploadProgress(0);
      try {
        const uniqueFileName = `${Date.now()}-${selectedFile.name}`;
        const storageRef = ref(storage, `ai-payroll/${clientId}/notes/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              attachments = [{ name: selectedFile.name, url: downloadURL }];
              resolve();
            }
          );
        });
      } catch (error) {
        console.error('File upload failed:', error);
        toast({ title: 'File Upload Failed', description: 'Could not upload attachment.', variant: 'destructive' });
        setIsSubmitting(false);
        setUploadProgress(null);
        return;
      }
    }

    try {
      const newNote = {
        text: noteText,
        authorId: currentUser.uid,
        authorName: currentUser.name,
        date: Timestamp.now(),
        type: 'note',
        subject: null,
        attachments: attachments.length > 0 ? attachments : null,
      };

      const notesRef = collection(db, 'aiPayrollClients', clientId, 'notes');
      await addDoc(notesRef, newNote);

      if (currentUser.role === 'client') {
        const attachmentName = attachments.length > 0 ? attachments[0].name : undefined;
        sendNewPayrollNoteNotification({
          clientId,
          noteText,
          authorName: currentUser.name,
          attachmentName,
        }).catch(err => console.error("Failed to send note notification email:", err));
      }

      setNoteText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: 'Note Added', description: 'Your message has been posted.' });
    } catch (error) {
      console.error('Failed to add note:', error);
      toast({ title: 'Error', description: 'Failed to post note. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="bg-muted/10 border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          Communication History
        </CardTitle>
        <CardDescription>
          Internal notes and messages for collaboration.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div 
          ref={scrollRef} 
          className="space-y-4 max-h-[350px] overflow-y-auto pr-2 min-h-[100px] flex flex-col"
        >
          {isLoading ? (
            <div className="flex justify-center items-center py-10 flex-grow">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notes.length > 0 ? (
            notes.map((note) => {
              const isEmail = note.type === 'email';
              const isMe = note.authorId === currentUser.uid;
              const formattedDate = note.date?.toDate 
                ? format(note.date.toDate(), 'dd MMM yyyy, HH:mm') 
                : note.date ? format(new Date(note.date), 'dd MMM yyyy, HH:mm') : '';

              return (
                <div key={note.id} className={`flex items-start gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] border shadow-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-br-none border-primary/20' 
                      : 'bg-muted rounded-bl-none text-slate-900 border-slate-200'
                  }`}>
                    <div className="flex justify-between items-center mb-1 gap-4">
                      <p className="text-[10px] font-black uppercase opacity-80">
                        {isMe ? 'You' : note.authorName || 'Consultant'}
                      </p>
                      <p className="text-[9px] opacity-70">
                        {formattedDate}
                      </p>
                    </div>
                    {isEmail ? (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <p className="text-xs font-bold">{note.subject}</p>
                        </div>
                        <p className="text-sm italic opacity-90 leading-relaxed font-medium">"{note.text}"</p>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">
                        {note.text}
                      </p>
                    )}
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {note.attachments.map((att, i) => (
                          <a 
                            key={i} 
                            href={att.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`text-xs font-bold hover:underline flex items-center gap-1 ${
                              isMe ? 'text-primary-foreground' : 'text-primary'
                            }`}
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            {att.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground flex-grow">
              <p className="font-semibold text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation by posting a note below.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t">
          <Textarea 
            placeholder="Type a message or add a note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            disabled={isSubmitting}
            className="bg-white border-primary/15 focus-visible:ring-primary text-sm"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
              <Input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={isSubmitting}
                className="max-w-[200px] h-9 text-xs"
              />
            </div>
            
            {uploadProgress !== null && (
              <div className="text-xs text-primary font-bold animate-pulse">
                Uploading... {Math.round(uploadProgress)}%
              </div>
            )}

            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitting || (!noteText.trim() && !selectedFile)}
              className="gap-1.5 font-bold px-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Post Note
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
