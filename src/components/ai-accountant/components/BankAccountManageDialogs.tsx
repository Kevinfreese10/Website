'use client';

import React, { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User, ChartOfAccount } from '@/lib/types';
import { formatPrice } from '../types';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

const db = getFirestore(firebaseApp);

export interface BankAccountManageDialogsProps {
    client: User | null;
    accountId: string | null;
    selectedAccount?: ChartOfAccount;
    fetchClientData: () => void;
    isEditAccountOpen: boolean;
    setIsEditAccountOpen: (open: boolean) => void;
    onEditAccount?: (newName: string) => Promise<void> | void;
    isUpdateBankBalanceOpen: boolean;
    setIsUpdateBankBalanceOpen: (open: boolean) => void;
    isUpdatingBankBalance?: boolean;
    onUpdateActualBankBalance?: (balance: number) => Promise<void> | void;
    isClearAccountAlertOpen: boolean;
    setIsClearAccountAlertOpen: (open: boolean) => void;
    onClearAccount: () => Promise<void> | void;
}

export function BankAccountManageDialogs({
    client,
    accountId,
    selectedAccount,
    fetchClientData,
    isEditAccountOpen,
    setIsEditAccountOpen,
    onEditAccount,
    isUpdateBankBalanceOpen,
    setIsUpdateBankBalanceOpen,
    isUpdatingBankBalance: externalUpdating = false,
    onUpdateActualBankBalance,
    isClearAccountAlertOpen,
    setIsClearAccountAlertOpen,
    onClearAccount,
}: BankAccountManageDialogsProps) {
    const { toast } = useToast();
    const [isInternalUpdating, setIsInternalUpdating] = useState(false);
    const isUpdatingBankBalance = externalUpdating || isInternalUpdating;

    const handleEditAccount = async (newName: string) => {
        if (onEditAccount) {
            await onEditAccount(newName);
            return;
        }
        if (!client || !accountId) return;
        try {
            const updatedCOA = (client.chartOfAccounts || []).map(acc => acc.id === accountId ? { ...acc, description: newName } : acc);
            const targetClientId = client.id || client.uid || '';
            await updateDoc(doc(db, 'aiAccountantClients', targetClientId), { chartOfAccounts: updatedCOA });
            toast({ title: "Account Updated" });
            fetchClientData();
            setIsEditAccountOpen(false);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleUpdateActualBankBalance = async (newBalance: number) => {
        if (onUpdateActualBankBalance) {
            await onUpdateActualBankBalance(newBalance);
            return;
        }
        if (!client || !accountId) return;
        setIsInternalUpdating(true);
        try {
            const updatedCOA = (client.chartOfAccounts || []).map(acc => 
                acc.id === accountId ? { ...acc, bankBalance: newBalance } : acc
            );
            const targetClientId = client.id || client.uid || '';
            await updateDoc(doc(db, 'aiAccountantClients', targetClientId), { chartOfAccounts: updatedCOA });
            toast({ title: "Bank Balance Updated", description: `Actual bank statement balance set to ${formatPrice(newBalance)}.` });
            fetchClientData();
            setIsUpdateBankBalanceOpen(false);
        } catch (e) {
            console.error("Error updating bank balance:", e);
            toast({ title: "Error", description: "Could not update bank balance.", variant: "destructive" });
        } finally {
            setIsInternalUpdating(false);
        }
    };

    return (
        <>
            {/* Edit Bank Account Name Dialog */}
            <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Bank Account Name</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            id="new-account-name" 
                            defaultValue={selectedAccount?.description} 
                            placeholder="e.g. FNB Business Account" 
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditAccountOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            const input = document.getElementById('new-account-name') as HTMLInputElement;
                            const val = input?.value || '';
                            handleEditAccount(val);
                        }}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Actual Bank Balance Dialog */}
            <Dialog open={isUpdateBankBalanceOpen} onOpenChange={setIsUpdateBankBalanceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Actual Bank Balance</DialogTitle>
                        <DialogDescription>
                            Set the actual statement balance for {selectedAccount?.description} to reconcile. This automatically syncs to the Bank Accounts Overview.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="actual-bank-bal-input">Actual Bank Balance (from bank statement)</Label>
                        <Input 
                            id="actual-bank-bal-input" 
                            type="number" 
                            step="0.01" 
                            defaultValue={selectedAccount?.bankBalance !== undefined ? selectedAccount.bankBalance : ''} 
                            placeholder="0.00" 
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateBankBalanceOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            disabled={isUpdatingBankBalance}
                            onClick={() => {
                                const input = document.getElementById('actual-bank-bal-input') as HTMLInputElement;
                                const val = parseFloat(input?.value?.replace(/,/g, '') ?? '');
                                if (!isNaN(val)) {
                                    handleUpdateActualBankBalance(val);
                                } else {
                                    toast({ 
                                        title: "Invalid Amount", 
                                        description: "Please enter a valid numeric balance.", 
                                        variant: "destructive" 
                                    });
                                }
                            }}
                        >
                            {isUpdatingBankBalance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clear Bank Account Alert Dialog */}
            <AlertDialog open={isClearAccountAlertOpen} onOpenChange={setIsClearAccountAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all transactions for the selected bank account ({selectedAccount?.description}). This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={onClearAccount} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Yes, Clear Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
