'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPartnerLeads } from '@/app/actions/partnerLeads';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

async function getIdToken(): Promise<string> {
  const token = await getAuth(firebaseApp).currentUser?.getIdToken();
  if (!token) throw new Error('You must be signed in to do this.');
  return token;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Search, Mail, Phone, Calendar, MessageSquare, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function PartnerLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const partnerId = user?.role === 'partner' ? user.uid : user?.partnerId;

  useEffect(() => {
    if (!partnerId) return;
    const currentPartnerId = partnerId;

    async function loadLeads() {
      setIsLoading(true);
      try {
        const idToken = await getIdToken();
        const res = await getPartnerLeads(currentPartnerId, idToken);
        if (res.success && res.leads) {
          setLeads(res.leads);
        }
      } catch (err) {
        console.error("Failed to load partner leads:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLeads();
  }, [partnerId]);

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return format(date, 'dd MMM yyyy, HH:mm');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Inquiries</h1>
          <p className="text-muted-foreground">Prospective clients who contacted you through your White-Label Landing Page.</p>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Inquiries & Leads</CardTitle>
              <CardDescription>Follow up with these prospects to convert them into active clients.</CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries..."
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
                  <TableHead>Received</TableHead>
                  <TableHead>Prospect Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Message Snippet</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(lead.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {lead.name}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {lead.email}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {lead.phone}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {lead.message}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}>
                              <ExternalLink className="h-4 w-4 mr-1.5" /> View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" /> Lead Details
                              </DialogTitle>
                              <DialogDescription>
                                Received on {formatDate(lead.createdAt)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4 text-sm">
                              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div>
                                  <span className="text-xs font-bold text-muted-foreground uppercase">Prospect Name</span>
                                  <p className="font-bold text-base mt-1">{lead.name}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-muted-foreground uppercase">Phone Number</span>
                                  <p className="mt-1">
                                    <a href={`tel:${lead.phone}`} className="hover:underline hover:text-primary font-medium flex items-center gap-1">
                                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {lead.phone}
                                    </a>
                                  </p>
                                </div>
                              </div>
                              <div className="border-b pb-4">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Email Address</span>
                                <p className="mt-1">
                                  <a href={`mailto:${lead.email}`} className="hover:underline hover:text-primary font-medium flex items-center gap-1 text-primary">
                                    <Mail className="h-3.5 w-3.5" /> {lead.email}
                                  </a>
                                </p>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Message</span>
                                <div className="bg-slate-50 border rounded-lg p-3 leading-relaxed whitespace-pre-wrap text-slate-700">
                                  {lead.message}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 justify-end">
                                <Button variant="outline" asChild>
                                  <a href={`mailto:${lead.email}?subject=RE: Your Inquiry on our Website`}>
                                    <Mail className="h-4 w-4 mr-2" /> Reply via Email
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No inquiries found. When prospects contact you from your landing page, they will show up here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
