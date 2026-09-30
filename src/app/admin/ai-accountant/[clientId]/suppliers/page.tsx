'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Trash2, Edit, MoreHorizontal, FileUp, Download, BookUser, GitMerge } from 'lucide-react';
import { getFirestore, collection, query, getDocs, doc, deleteDoc, addDoc, writeBatch, orderBy, where, onSnapshot, setDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Supplier, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx-js-style';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const db = getFirestore(firebaseApp);

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Supplier name is required"),
});

function ImportSuppliersDialog({ clientId, onImportComplete }: { clientId: string; onImportComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !clientId) return;

        setIsUploading(true);
        toast({ title: "Reading file..." });

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

                const rawNames = json.map(row => row['Supplier Name'] || row['supplierName'] || row['Name']).filter((name): name is string => !!name);

                if (rawNames.length === 0) {
                    toast({ title: "No suppliers found", description: "Make sure your file has a column named 'Supplier Name'.", variant: "destructive" });
                    setIsUploading(false);
                    return;
                }

                // Check existing suppliers in Firestore to prevent duplicates
                const existingSnap = await getDocs(collection(db, `aiAccountantClients/${clientId}/suppliers`));
                const existingNames = new Set(existingSnap.docs.map(d => (d.data().name || '').trim().toUpperCase()));

                // Filter unique names not already in Firestore
                const uniqueNewNames = Array.from(new Set(rawNames.map(n => n.trim().toUpperCase()))).filter(n => !existingNames.has(n));

                if (uniqueNewNames.length === 0) {
                    toast({ title: "All suppliers already exist", description: "No new unique suppliers to import." });
                    setIsUploading(false);
                    setIsOpen(false);
                    return;
                }

                const batch = writeBatch(db);
                uniqueNewNames.forEach(name => {
                    const docRef = doc(collection(db, `aiAccountantClients/${clientId}/suppliers`));
                    batch.set(docRef, { name });
                });

                await batch.commit();

                toast({ title: "Import Successful", description: `${uniqueNewNames.length} new suppliers imported (${rawNames.length - uniqueNewNames.length} duplicates skipped).` });
                onImportComplete();
                setIsOpen(false);
            } catch (error) {
                console.error("Error importing suppliers:", error);
                toast({ title: "Import Failed", description: "An error occurred during the import process.", variant: "destructive" });
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDownloadTemplate = () => {
        const headers = [['Supplier Name']];
        const examples = [['TELKOM SA'], ['VODACOM'], ['ESKOM'], ['OFFICE RENTALS']];
        const ws = XLSX.utils.aoa_to_sheet([...headers, ...examples]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
        XLSX.writeFile(wb, "supplier_import_template.xlsx");
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><FileUp className="mr-2 h-4 w-4" /> Import Suppliers</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Supplier List</DialogTitle>
                    <DialogDescription>Upload an Excel or CSV file to bulk add suppliers to this client profile.</DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-6">
                     <div className="space-y-3">
                         <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">1. Get the template</Label>
                         <Button variant="secondary" className="w-full h-12 gap-3 justify-start" onClick={handleDownloadTemplate}>
                            <Download className="h-5 w-5 text-primary" />
                            <div className="text-left">
                                <p className="text-sm font-bold">Download Template</p>
                                <p className="text-[10px] text-muted-foreground">supplier_import_template.xlsx</p>
                            </div>
                         </Button>
                     </div>
                     
                     <Separator />

                     <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">2. Upload your file</Label>
                        <Input 
                            id="supplier-file" 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleFileChange} 
                            disabled={isUploading}
                            className="h-12 pt-3"
                        />
                        {isUploading && (
                            <div className="flex items-center gap-2 text-primary animate-pulse font-bold text-xs mt-2">
                                <Loader2 className="h-4 w-4 animate-spin"/> Processing data...
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SuppliersPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const fetchSuppliers = useCallback(async () => {
        if (!clientId) return;
        setIsLoading(true);
        try {
            const supQuery = query(collection(db, `aiAccountantClients/${clientId}/suppliers`), orderBy("name"));
            const supSnapshot = await getDocs(supQuery);
            setSuppliers(supSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Supplier)));

        } catch (error) {
            toast({ title: 'Error', description: 'Could not fetch suppliers.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [clientId, toast]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleAdd = () => {
        setSelectedSupplier(null);
        form.reset({ name: '' });
        setIsFormOpen(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        form.reset(supplier);
        setIsFormOpen(true);
    };

    const [isDeduplicating, setIsDeduplicating] = useState(false);

    const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            const finalName = data.name.trim().toUpperCase();
            if (selectedSupplier) {
                const isDup = suppliers.some(s => s.id !== selectedSupplier.id && s.name.trim().toUpperCase() === finalName);
                if (isDup) {
                    toast({ title: 'Duplicate Name', description: 'Another supplier already exists with this name.', variant: 'destructive' });
                    return;
                }
                await setDoc(doc(db, `aiAccountantClients/${clientId}/suppliers`, selectedSupplier.id), { ...data, name: finalName }, { merge: true });
                toast({ title: 'Supplier Updated' });
            } else {
                const isDup = suppliers.some(s => s.name.trim().toUpperCase() === finalName);
                if (isDup) {
                    toast({ title: 'Duplicate Supplier', description: 'A supplier with this name already exists.', variant: 'destructive' });
                    return;
                }
                await addDoc(collection(db, `aiAccountantClients/${clientId}/suppliers`), { ...data, name: finalName });
                toast({ title: 'Supplier Created' });
            }
            fetchSuppliers();
            setIsFormOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not save the supplier.', variant: 'destructive'});
        }
    };

    const handleDeduplicate = async () => {
        setIsDeduplicating(true);
        try {
            const snap = await getDocs(collection(db, `aiAccountantClients/${clientId}/suppliers`));
            const nameMap = new Map<string, Array<{ id: string; name: string }>>();
            snap.forEach(d => {
                const name = (d.data().name || '').trim().toUpperCase();
                if (!nameMap.has(name)) nameMap.set(name, []);
                nameMap.get(name)!.push({ id: d.id, name });
            });

            const dupGroups = Array.from(nameMap.entries()).filter(([_, docs]) => docs.length > 1);
            if (dupGroups.length === 0) {
                toast({ title: 'No Duplicates Found', description: 'All suppliers have unique names.' });
                setIsDeduplicating(false);
                return;
            }

            const txSnap = await getDocs(collection(db, `aiAccountantClients/${clientId}/transactions`));
            let totalConsolidated = 0;

            for (const [_, dupDocs] of dupGroups) {
                const primaryDoc = dupDocs[0];
                const secondaryDocs = dupDocs.slice(1);

                for (const sec of secondaryDocs) {
                    const batch = writeBatch(db);

                    txSnap.docs.forEach(tDoc => {
                        const tData = tDoc.data();
                        const updates: any = {};
                        if (tData.allocatedTo?.value === sec.id) {
                            updates['allocatedTo.value'] = primaryDoc.id;
                        }
                        if (tData.accountId === sec.id) {
                            updates.accountId = primaryDoc.id;
                        }
                        if (tData.supplierId === sec.id) {
                            updates.supplierId = primaryDoc.id;
                        }
                        if (Object.keys(updates).length > 0) {
                            batch.update(tDoc.ref, updates);
                        }
                    });

                    batch.delete(doc(db, `aiAccountantClients/${clientId}/suppliers`, sec.id));
                    await batch.commit();
                    totalConsolidated++;
                }
            }

            toast({ title: 'Suppliers Consolidated', description: `Successfully merged ${totalConsolidated} duplicate supplier(s).` });
            fetchSuppliers();
        } catch (error) {
            console.error('Error consolidating suppliers:', error);
            toast({ title: 'Consolidation Failed', description: 'An error occurred while merging suppliers.', variant: 'destructive' });
        } finally {
            setIsDeduplicating(false);
        }
    };

    const handleDelete = async (supplierId: string) => {
        try {
            await deleteDoc(doc(db, `aiAccountantClients/${clientId}/suppliers`, supplierId));
            toast({ title: 'Supplier Deleted', variant: 'destructive' });
            fetchSuppliers();
        } catch (error) {
            toast({ title: 'Error', description: 'Could not delete supplier.', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground">Manage your client's suppliers.</p>
                </div>
            </div>
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSupplier ? 'Edit' : 'Create'} Supplier</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                             <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                <Button type="submit">Save</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ImportSuppliersDialog clientId={clientId} onImportComplete={fetchSuppliers} />
                        <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Create Supplier</Button>
                        <Button
                            variant="outline"
                            onClick={handleDeduplicate}
                            disabled={isDeduplicating}
                        >
                            {isDeduplicating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <GitMerge className="mr-2 h-4 w-4" />
                            )}
                            Consolidate Duplicates
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
                    ) : suppliers.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10"><p>No suppliers created for this client yet.</p></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.map(supplier => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => handleEdit(supplier)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/ai-accountant/${clientId}/journals?type=supplier&actorId=${supplier.id}`}><BookUser className="mr-2 h-4 w-4" /> Post Journal</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the supplier "{supplier.name}".</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(supplier.id)}>Yes, Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
