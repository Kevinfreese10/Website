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
import { NoteAttachmentsPreview } from '@/components/orders/NoteAttachmentsPreview';

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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
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
    if (!noteText.trim() && attachedFiles.length === 0) return;

    setIsSubmitting(true);
    let attachments: { name: string; url: string }[] = [];

    if (attachedFiles.length > 0) {
      setUploadProgress(0);
      try {
        const uploadPromises = attachedFiles.map(async (file) => {
          const uniqueFileName = `${Date.now()}-${file.name}`;
          const storageRef = ref(storage, `ai-payroll/${clientId}/notes/${uniqueFileName}`);
          const uploadTask = uploadBytesResumable(storageRef, file);
          const snapshot = await uploadTask;
          const downloadURL = await getDownloadURL(snapshot.ref);
          return { name: file.name, url: downloadURL };
        });
        attachments = await Promise.all(uploadPromises);
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
      setAttachedFiles([]);
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
            <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center py-10 flex-grow"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
          ) : notes.length > 0 ? (
            notes.map((note) => {
              const isEmail = note.type === 'email';
              const isMe = note.authorId === currentUser.uid;
              const formattedDate = note.date?.toDate 
                ? format(note.date.toDate(), 'dd MMM yyyy, HH:mm') 
                : note.date ? format(new Date(note.date), 'dd MMM yyyy, HH:mm') : '';

              return (
                <div key={note.id} className={`flex items-start gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] border shadow-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-none ml-auto' 
                      : 'bg-muted/60 text-foreground rounded-tl-none mr-auto'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/10 pb-1">
                      <span className={`text-[11px] font-bold ${isMe ? 'text-primary-foreground/90' : 'text-primary'}`}>
                        {isMe ? 'You' : note.authorName}
                      </span>
                      <span className={`text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formattedDate}
                      </span>
                    </div>

                    {isEmail && note.subject && (
                      <div className={`text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${
                        isMe ? 'text-primary-foreground/95' : 'text-foreground'
                      }`}>
                        <Mail className="h-3.5 w-3.5" />
                        <span>{note.subject}</span>
                      </div>
                    )}

                    <p className={`text-xs whitespace-pre-wrap leading-relaxed ${
                      isMe ? 'text-primary-foreground' : 'text-foreground/90'
                    }`}>
                      {note.text}
                    </p>

                    {note.attachments && note.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
                        {note.attachments.map((att, i) => (
                          <a 
                            key={i} 
                            href={att.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`text-xs flex items-center gap-1.5 p-1.5 rounded-lg transition-colors ${
                              isMe 
                                ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground' 
                                : 'bg-background hover:bg-muted text-primary'
                            }`}
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[180px] font-medium">{att.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <p className="text-xs">No notes or messages yet.</p>
              <p className="text-[11px]">Send a note below to start the conversation.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t">
          <Textarea 
            placeholder="Type a message or add a note... (Tip: You can paste screenshots directly with Ctrl+V)"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (!items) return;
              const newImages: File[] = [];
              for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                  const file = items[i].getAsFile();
                  if (file) {
                    const renamedFile = new File([file], `screenshot-${Date.now()}.png`, { type: file.type });
                    newImages.push(renamedFile);
                  }
                }
              }
              if (newImages.length > 0) {
                setAttachedFiles(prev => [...prev, ...newImages]);
                toast({ 
                  title: '📸 Screenshot Captured!', 
                  description: `${newImages.length} screenshot(s) attached. See preview below before posting.` 
                });
              }
            }}
            rows={3}
            disabled={isSubmitting}
            className="bg-white border-primary/15 focus-visible:ring-primary text-sm"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Attachments (optional)</label>
              <span className="text-[11px] text-muted-foreground font-mono">PNG, JPG, PDF, DOCX or Ctrl+V</span>
            </div>
            <Input 
              type="file" 
              ref={fileInputRef}
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const filesArray = Array.from(e.target.files);
                  setAttachedFiles(prev => [...prev, ...filesArray]);
                }
              }}
              disabled={isSubmitting}
              className="h-9 text-xs"
            />
          </div>

          {/* Live Thumbnail & File Attachment Preview */}
          <NoteAttachmentsPreview 
            files={attachedFiles} 
            onRemoveFile={(idx) => {
              setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
            }}
            onClearAll={() => {
              setAttachedFiles([]);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              {uploadProgress !== null && (
                <div className="text-xs text-primary font-bold animate-pulse">
                  Uploading... {Math.round(uploadProgress)}%
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitting || (!noteText.trim() && attachedFiles.length === 0)}
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
