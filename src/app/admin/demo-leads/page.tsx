'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { DemoLead } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Mail, Phone, Calendar, Trash2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const db = getFirestore(firebaseApp);

export default function DemoLeadsPage() {
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmailLead, setSelectedEmailLead] = useState<DemoLead | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this demo lead?')) {
      try {
        await deleteDoc(doc(db, 'demoLeads', id));
        toast({
          title: "Lead Deleted",
          description: "The demo lead has been successfully removed.",
        });
      } catch (error) {
        console.error("Error deleting lead:", error);
        toast({
          title: "Error",
          description: "Failed to delete the lead.",
          variant: "destructive"
        });
      }
    }
  };

  const openEmailModal = (lead: DemoLead) => {
    setSelectedEmailLead(lead);
    setEmailSubject('Follow up on your Bookkeeper Empowerment Initiative Demo Request');
    setEmailBody(`Hi ${lead.name},\n\nThank you for requesting a demo of the Bookkeeper Empowerment Initiative (BEI).\n\nAre you available sometime this week for a quick walkthrough?\n\nBest regards,\nMy Accountant Team`);
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedEmailLead) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedEmailLead.email,
          subject: emailSubject,
          html: emailBody.replace(/\n/g, '<br/>'),
        }),
      });
      if (!res.ok) throw new Error('Failed to send email');
      
      toast({
        title: "Email Sent",
        description: `Successfully sent email to ${selectedEmailLead.email}`,
      });
      setIsEmailModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send the email.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'demoLeads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as DemoLead));
      setLeads(fetchedLeads);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLeads = leads.filter(lead => 
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.surname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM yyyy, HH:mm');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Demo Leads</h1>
          <p className="text-muted-foreground">Prospective partners who requested a platform demonstration.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Prospective Partners</CardTitle>
              <CardDescription>Follow up with these practitioners to schedule their BEI walkthrough.</CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cell</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(lead.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {lead.name} {lead.surname}
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-primary hover:underline">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${lead.cell}`} className="flex items-center gap-2 hover:text-primary">
                            <Phone className="h-3 w-3" />
                            {lead.cell}
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEmailModal(lead)}>
                              <Send className="h-3 w-3 mr-1" /> Email
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => lead.id && handleDelete(lead.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      No demo leads found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedEmailLead?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
