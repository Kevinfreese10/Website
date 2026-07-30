'use client';

import { Quote, ClientCustomer, User } from "@/lib/types";
import { format } from 'date-fns';
import Image from "next/image";
import React from "react";

const formatPrice = (price: number, currency: string = 'ZAR') => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: currency }).format(price);

const QuotePreview = React.forwardRef<HTMLDivElement, { quote: Quote, client: User | null, customer: ClientCustomer | undefined }>((({ quote, client, customer }, ref) => {
    if (!quote || !client || !customer) return null;
    
    const getVatAmount = (lineItem: { rate: number, quantity: number, vatType: string }) => {
        if (lineItem.vatType === 'standard_rated_sales') {
            return (lineItem.rate * lineItem.quantity) * 0.15;
        }
        return 0;
    };
    
    const renderAddress = (address: any) => {
        if (!address) return null;

        // Handle string address (legacy)
        if (typeof address === 'string') {
            const parts = address.split(',').map(part => part.trim());
            return (
                <div className="text-sm text-gray-600">
                    {parts.map((part, index) => (
                        <p key={index}>{part}</p>
                    ))}
                </div>
            );
        }

        // Handle object address
        return (
             <div className="text-sm text-gray-600">
                {address.unit && address.complex && <p>{address.unit}, {address.complex}</p>}
                {address.unit && !address.complex && <p>Unit {address.unit}</p>}
                {!address.unit && address.complex && <p>{address.complex}</p>}
                {address.street && <p>{address.street}</p>}
                {address.suburb && <p>{address.suburb}</p>}
                {address.city && <p>{address.city}</p>}
                {address.province && <p>{address.province}</p>}
                {address.zip && <p>{address.zip}</p>}
            </div>
        )
    };

    const quoteDateObj = quote.quoteDate instanceof Date ? quote.quoteDate : (quote.quoteDate?.toDate ? quote.quoteDate.toDate() : new Date(quote.quoteDate));
    const expiryDateObj = quote.expiryDate instanceof Date ? quote.expiryDate : (quote.expiryDate?.toDate ? quote.expiryDate.toDate() : new Date(quote.expiryDate));

    return (
        <div ref={ref} className="p-8 bg-white text-gray-800 rounded-lg shadow-inner border max-h-[80vh] overflow-y-auto">
            <header className="flex justify-between items-start mb-10">
                {/* Left Column */}
                <div className="w-1/2 space-y-6">
                    <div className="space-y-1">
                        {client.logoUrl && (
                            <div className="relative h-20 w-48 mb-4">
                                <Image src={client.logoUrl} alt={`${client.companyName || client.name} Logo`} fill className="object-contain object-left"/>
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900">{client.companyName || client.name}</h1>
                        {client.registrationNumber && <p className="text-sm text-gray-600">Reg No: {client.registrationNumber}</p>}
                        {renderAddress(client.address)}
                        {client.isVatRegistered && client.vatNumber && <p className="text-sm text-gray-600">VAT Reg: {client.vatNumber}</p>}
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-1/2 text-right space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-extrabold uppercase text-gray-400">Quote</h2>
                         <div className="grid grid-cols-[auto_1fr] gap-x-4 text-sm justify-end">
                            <span className="font-semibold text-gray-600 text-right">Quote Number:</span>
                            <span className="text-left ml-2">{quote.id}</span>
                            <span className="font-semibold text-gray-600 text-right">Date:</span>
                            <span className="text-left ml-2">{format(quoteDateObj, 'dd/MM/yyyy')}</span>
                            <span className="font-semibold text-gray-600 text-right">Expiry Date:</span>
                            <span className="text-left ml-2">{format(expiryDateObj, 'dd/MM/yyyy')}</span>
                         </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-600">Quote To:</p>
                        <p className="text-lg font-bold text-gray-800">{customer.name}</p>
                        {renderAddress(customer.address)}
                        {customer.vatNumber && <p className="text-sm text-gray-600">VAT Reg: {customer.vatNumber}</p>}
                    </div>
                </div>
            </header>

            <section className="mb-10">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-[10px]">
                            <th className="p-3 border">Description</th>
                            <th className="p-3 text-center border">Qty</th>
                            <th className="p-3 text-right border">Rate (Excl)</th>
                            <th className="p-3 text-right border">VAT</th>
                            <th className="p-3 text-right border">Total (Incl)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.lineItems.map((item, index) => {
                            const vatAmount = getVatAmount(item);
                            const totalAmount = (item.rate * item.quantity) + vatAmount;
                            return (
                                <tr key={index} className="border-b border-gray-200 text-xs">
                                    <td className="p-3 border">{item.description}</td>
                                    <td className="p-3 text-center border">{item.quantity}</td>
                                    <td className="p-3 text-right border font-mono">{formatPrice(item.rate, quote.currency)}</td>
                                    <td className="p-3 text-right border font-mono">{formatPrice(vatAmount, quote.currency)}</td>
                                    <td className="p-3 text-right border font-semibold font-mono">{formatPrice(totalAmount, quote.currency)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </section>

            <section className="flex justify-end mb-10">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between text-gray-600 text-sm">
                        <span>Subtotal (Excl)</span>
                        <span className="font-mono">{formatPrice(quote.subtotal, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm">
                        <span>Total VAT (15%)</span>
                        <span className="font-mono">{formatPrice(quote.vat, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-3 mt-3">
                        <span>Grand Total</span>
                        <span className="font-mono">{formatPrice(quote.total, quote.currency)}</span>
                    </div>
                </div>
            </section>

            {quote.notes && (
                <section className="mb-10 p-4 bg-gray-50 rounded border border-dashed">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quote Notes / Terms</h3>
                    <p className="text-sm text-gray-600 italic whitespace-pre-wrap">{quote.notes}</p>
                </section>
            )}

            <footer className="text-center text-[10px] text-gray-400 border-t pt-6">
                <p>Generated by My Accountant AI Engine. Thank you for your business!</p>
            </footer>
        </div>
    );
}));

QuotePreview.displayName = 'QuotePreview';

export default QuotePreview;
