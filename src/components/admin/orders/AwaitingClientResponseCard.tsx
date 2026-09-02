'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Reply, 
  User as UserIcon,
  ShieldAlert,
  Send,
  Loader2,
  Paperclip,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Order, OrderNote, User } from '@/lib/types';
import { AwaitingResponseOrder } from '@/lib/order-communication';
import { getStatusVariant } from '@/lib/order-status';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { cn } from '@/lib/utils';

interface AwaitingClientResponseCardProps {
  awaitingOrders: AwaitingResponseOrder[];
  currentUser?: User | null;
  onOrderUpdated?: (orderId: string, updatedNote: OrderNote) => void;
  onFilterTableToAwaiting?: () => void;
}

export function AwaitingClientResponseCard({
  awaitingOrders,
  currentUser,
  onOrderUpdated,
  onFilterTableToAwaiting,
}: AwaitingClientResponseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeReplyOrder, setActiveReplyOrder] = useState<AwaitingResponseOrder | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const { toast } = useToast();
  const db = getFirestore(firebaseApp);

  const count = awaitingOrders.length;

  const handleOpenReplyDialog = (item: AwaitingResponseOrder) => {
    setActiveReplyOrder(item);
    setReplyText('');
  };

  const handleSendQuickReply = async () => {
    if (!activeReplyOrder || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const orderId = activeReplyOrder.order.id;
      const newNote: OrderNote = {
        text: replyText.trim(),
        date: new Date(),
        authorId: currentUser?.uid || currentUser?.id || 'staff',
        type: 'note',
        isInternal: false,
        subject: `Response regarding Order #${activeReplyOrder.order.originalOrderId || activeReplyOrder.order.id}`,
        attachments: null,
      };

      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        notes: arrayUnion(newNote),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Reply Sent',
        description: `Your response has been posted to Order #${activeReplyOrder.order.originalOrderId || activeReplyOrder.order.id}'s Communication History.`,
      });

      if (onOrderUpdated) {
        onOrderUpdated(orderId, newNote);
      }

      setActiveReplyOrder(null);
      setReplyText('');
    } catch (err: any) {
      console.error('Error sending quick reply:', err);
      toast({
        title: 'Failed to send reply',
        description: err.message || 'Could not post note to Communication History.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Zero state: All caught up!
  if (count === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 px-4 py-3 flex items-center justify-between text-emerald-800 dark:text-emerald-300 shadow-sm transition-all duration-200">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider">Communication Status</span>
            <p className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-200">
              All caught up! There are currently no client messages awaiting a staff response.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-white/80 dark:bg-emerald-900/40 text-[11px] font-bold px-2.5 py-0.5">
          0 Pending
        </Badge>
      </div>
    );
  }

  return (
    <>
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-background dark:to-background shadow-md overflow-hidden transition-all duration-300">
        <CardHeader className="p-4 sm:p-5 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold flex-shrink-0 shadow-inner">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Action Required: Client Responded in Communication History
                  </CardTitle>
                  <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-black px-2.5 py-0.5 text-xs shadow-sm">
                    {count} {count === 1 ? 'Order' : 'Orders'} Awaiting Reply
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  The client has posted a response or document note that has not yet been answered by a team member.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {onFilterTableToAwaiting && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onFilterTableToAwaiting}
                  className="h-8 text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
                >
                  Filter Main Table
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 text-slate-600 hover:bg-amber-500/20"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {awaitingOrders.map((item) => {
                const orderId = item.order.originalOrderId || item.order.id;
                const status = item.order.status || 'Processing';
                const timeAgo = formatDistanceToNow(item.waitingSince, { addSuffix: true });

                return (
                  <div
                    key={item.order.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-200 bg-white dark:bg-card shadow-sm hover:shadow-md",
                      item.isOverdue 
                        ? "border-rose-400/40 bg-rose-50/20 dark:border-rose-900/40" 
                        : "border-amber-200/80 hover:border-amber-300"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      
                      {/* Top Meta info: Order #, Customer, Service, Assigned */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link 
                            href={`/admin/orders/${item.order.id}`}
                            className="font-mono font-black text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            #{orderId}
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </Link>

                          <Badge variant={getStatusVariant(status)} className="text-[10px] font-bold uppercase tracking-wider py-0 px-2">
                            {status}
                          </Badge>

                          {item.isOverdue ? (
                            <Badge variant="destructive" className="text-[10px] font-bold flex items-center gap-1 py-0 px-2 animate-pulse">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Overdue ({timeAgo})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold border-amber-300 text-amber-800 bg-amber-50/80 py-0 px-2 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 text-amber-600" />
                              Waiting {timeAgo}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span>{item.clientName}</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[280px]">{item.serviceSummary}</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="text-[10px] font-semibold text-slate-400">Assigned:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.assignedStaffName}</span>
                          </div>
                        </div>

                        {/* Last client message snippet */}
                        <div className="mt-2 text-xs bg-slate-50 dark:bg-muted/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-normal leading-relaxed relative">
                          <div className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-amber-500" />
                            Latest Client Note:
                          </div>
                          <p className="line-clamp-2 italic font-serif">
                            &ldquo;{item.lastClientNote.text || '(Sent attachments / documents)'}&rdquo;
                          </p>
                          {item.lastClientNote.attachments && item.lastClientNote.attachments.length > 0 && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-600 font-semibold">
                              <Paperclip className="h-3 w-3" />
                              <span>{item.lastClientNote.attachments.length} attachment(s) included</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0 pt-2 md:pt-0">
                        <Button
                          size="sm"
                          onClick={() => handleOpenReplyDialog(item)}
                          className="h-9 px-3.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          Quick Reply
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-9 px-3.5 text-xs font-bold border-slate-300 hover:bg-slate-100"
                        >
                          <Link href={`/admin/orders/${item.order.id}`}>
                            Open Order
                          </Link>
                        </Button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quick Reply Dialog */}
      <Dialog open={!!activeReplyOrder} onOpenChange={(open) => !open && setActiveReplyOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Reply className="h-4 w-4 text-amber-600" />
              Quick Reply to Order #{activeReplyOrder?.order.originalOrderId || activeReplyOrder?.order.id}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Posting a response will immediately add your message to the client&apos;s Communication History and clear this order from the pending alert queue.
            </DialogDescription>
          </DialogHeader>

          {activeReplyOrder && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/30 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between font-semibold text-muted-foreground text-[11px]">
                  <span>Client: {activeReplyOrder.clientName}</span>
                  <span>{formatDistanceToNow(activeReplyOrder.waitingSince, { addSuffix: true })}</span>
                </div>
                <p className="text-foreground italic font-serif mt-1">
                  &ldquo;{activeReplyOrder.lastClientNote.text}&rdquo;
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-reply-text" className="text-xs font-bold">
                  Your Response (Visible to Client)
                </Label>
                <Textarea
                  id="quick-reply-text"
                  placeholder="Type your reply to the client..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveReplyOrder(null)}
              disabled={isSubmittingReply}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSendQuickReply}
              disabled={isSubmittingReply || !replyText.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isSubmittingReply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Post Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
