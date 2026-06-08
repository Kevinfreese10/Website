"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandGroup, CommandSeparator } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, PlusCircle, ArrowLeft } from "lucide-react";
import { User, ClientCustomer, Supplier, VatType } from "@/lib/types";
import { allVatTypes } from "@/lib/vat-types";

export interface AccountSelection {
    value: string;
    type: "account" | "customer" | "supplier";
}

interface AccountSelectorProps {
    client: User | null;
    customers?: ClientCustomer[];
    suppliers?: Supplier[];
    value?: AccountSelection | string | null;
    onChange: (selection: AccountSelection, vatType?: VatType) => void;
    // Filtering/Visibility props
    showAccounts?: boolean;
    showCustomers?: boolean;
    showSuppliers?: boolean;
    // VAT props
    isVatRegistered?: boolean;
    requireVatSelection?: boolean; // If true, and selecting a GL Account, transitions to VAT selection view before calling onChange
    // Trigger / Styling
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    size?: "sm" | "default";
    onCreateAccountClick?: () => void;
    // Optional account filter
    filterAccounts?: (acc: any) => boolean;
}

export function AccountSelector({
    client,
    customers = [],
    suppliers = [],
    value,
    onChange,
    showAccounts = true,
    showCustomers = false,
    showSuppliers = false,
    isVatRegistered = false,
    requireVatSelection = false,
    placeholder = "Select account...",
    className,
    disabled = false,
    size = "default",
    onCreateAccountClick,
    filterAccounts,
}: AccountSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAccountForVat, setSelectedAccountForVat] = useState<any>(null);

    // Normalize value to AccountSelection | null
    const normalizedValue = useMemo<AccountSelection | null>(() => {
        if (!value) return null;
        if (typeof value === "object" && "value" in value) {
            return value as AccountSelection;
        }
        if (typeof value === "string") {
            // Try to resolve the type
            if (client?.chartOfAccounts?.some((acc) => acc.id === value)) {
                return { value, type: "account" };
            }
            if (customers.some((cust) => cust.id === value)) {
                return { value, type: "customer" };
            }
            if (suppliers.some((sup) => sup.id === value)) {
                return { value, type: "supplier" };
            }
            // Default fallback
            return { value, type: "account" };
        }
        return null;
    }, [value, client, customers, suppliers]);

    // Resolve display name for trigger button
    const displayName = useMemo(() => {
        if (!normalizedValue) return placeholder;
        const { value: valId, type } = normalizedValue;

        if (type === "account") {
            const acc = client?.chartOfAccounts?.find((a) => a.id === valId);
            return acc ? acc.description : placeholder;
        }
        if (type === "customer") {
            const cust = customers.find((c) => c.id === valId);
            return cust ? cust.name : placeholder;
        }
        if (type === "supplier") {
            const sup = suppliers.find((s) => s.id === valId);
            return sup ? sup.name : placeholder;
        }
        return placeholder;
    }, [normalizedValue, client, customers, suppliers, placeholder]);

    // Helper to check if an item is currently selected
    const isSelected = (id: string, type: "account" | "customer" | "supplier") => {
        return normalizedValue?.value === id && normalizedValue?.type === type;
    };

    // Filter accounts if filter function is provided
    const filteredAccounts = useMemo(() => {
        const accounts = client?.chartOfAccounts || [];
        const sorted = [...accounts].sort((a, b) => a.description.localeCompare(b.description));
        if (filterAccounts) {
            return sorted.filter(filterAccounts);
        }
        return sorted;
    }, [client, filterAccounts]);

    const handleSelect = (item: any, type: "account" | "customer" | "supplier") => {
        if (type === "account" && requireVatSelection && isVatRegistered) {
            setSelectedAccountForVat(item);
        } else {
            onChange({ value: item.id, type }, "no_vat");
            setIsOpen(false);
        }
    };

    const handleVatSelect = (vatName: VatType) => {
        if (selectedAccountForVat) {
            onChange({ value: selectedAccountForVat.id, type: "account" }, vatName);
            setSelectedAccountForVat(null);
            setIsOpen(false);
        }
    };

    return (
        <Popover
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    setSelectedAccountForVat(null);
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between text-left font-normal border-muted-foreground/30",
                        size === "sm" ? "h-8 text-[11px]" : "h-10 text-sm",
                        className
                    )}
                >
                    <span className="truncate">{displayName}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                {selectedAccountForVat ? (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 p-3 border-b bg-muted/20">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => setSelectedAccountForVat(null)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    VAT Treatment
                                </p>
                                <p className="text-xs font-semibold truncate text-foreground">
                                    {selectedAccountForVat.description}
                                </p>
                            </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1">
                            {allVatTypes.map((v) => (
                                <button
                                    key={v.name}
                                    onClick={() => handleVatSelect(v.name)}
                                    className="w-full text-left text-xs px-3 py-2 rounded-sm transition-colors hover:bg-muted hover:text-foreground text-muted-foreground flex items-center justify-between"
                                >
                                    <span>{v.label}</span>
                                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground font-semibold">
                                        {v.category}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <Command className="w-full">
                        <CommandInput placeholder="Search accounts..." />
                        <CommandList className="max-h-72 overflow-y-auto">
                            <CommandEmpty>No results found.</CommandEmpty>
                            {onCreateAccountClick && (
                                <>
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => {
                                                onCreateAccountClick();
                                                setIsOpen(false);
                                            }}
                                            className="text-primary font-medium cursor-pointer p-2 flex items-center text-xs"
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Create new account...
                                        </CommandItem>
                                    </CommandGroup>
                                    <CommandSeparator />
                                </>
                            )}
                            {showCustomers && customers.length > 0 && (
                                <CommandGroup heading="Customers">
                                    {customers.map((c) => (
                                        <CommandItem
                                            key={c.id}
                                            value={c.name}
                                            onSelect={() => handleSelect(c, "customer")}
                                            className="p-2 cursor-pointer hover:bg-muted text-xs flex items-center justify-between"
                                        >
                                            <span>{c.name}</span>
                                            {isSelected(c.id, "customer") && (
                                                <Check className="h-3 w-3 text-primary" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {showSuppliers && suppliers.length > 0 && (
                                <CommandGroup heading="Suppliers">
                                    {suppliers.map((s) => (
                                        <CommandItem
                                            key={s.id}
                                            value={s.name}
                                            onSelect={() => handleSelect(s, "supplier")}
                                            className="p-2 cursor-pointer hover:bg-muted text-xs flex items-center justify-between"
                                        >
                                            <span>{s.name}</span>
                                            {isSelected(s.id, "supplier") && (
                                                <Check className="h-3 w-3 text-primary" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {showAccounts && filteredAccounts.length > 0 && (
                                <CommandGroup heading="General Ledger Accounts">
                                    {filteredAccounts.map((acc) => (
                                        <CommandItem
                                            key={acc.id}
                                            value={`${acc.accountNumber} ${acc.description}`}
                                            onSelect={() => handleSelect(acc, "account")}
                                            className="p-2 cursor-pointer hover:bg-muted text-xs flex items-center justify-between"
                                        >
                                            <span className="truncate">{acc.description}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {acc.accountNumber && (
                                                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                                        {acc.accountNumber}
                                                    </span>
                                                )}
                                                {isSelected(acc.id, "account") && (
                                                    <Check className="h-3 w-3 text-primary" />
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                )}
            </PopoverContent>
        </Popover>
    );
    }
