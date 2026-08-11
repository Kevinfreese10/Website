const fs = require('fs');

let content = fs.readFileSync('src/app/admin/ai-accountant/[clientId]/invoices/page.tsx', 'utf8');

// Add the Label import
if (!content.includes('import { Label } from "@/components/ui/label";')) {
    content = content.replace(
        'import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";',
        'import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";\nimport { Label } from "@/components/ui/label";'
    );
}

// Replace all FormLabel that are NOT inside FormItem with Label
content = content.replace(/<FormLabel>Search<\/FormLabel>/g, '<Label className="mb-2 block font-medium text-sm">Search</Label>');
content = content.replace(/<FormLabel>Status<\/FormLabel>/g, '<Label className="mb-2 block font-medium text-sm">Status</Label>');
content = content.replace(/<FormLabel>Date Range<\/FormLabel>/g, '<Label className="mb-2 block font-medium text-sm">Date Range</Label>');
content = content.replace(/<FormLabel>Send To Email<\/FormLabel>/g, '<Label className="mb-2 block font-medium text-sm">Send To Email</Label>');
content = content.replace(/<FormLabel>Amount Received<\/FormLabel>/g, '<Label className="mb-2 block font-medium text-sm">Amount Received</Label>');
content = content.replace(/<FormLabel>Payment Date<\/FormLabel>/g, '<Label className="mb-2 block font-medium text-sm">Payment Date</Label>');
content = content.replace(/<FormLabel>Deposited To \(Bank Account\)<\/FormLabel>/g, '<Label className="mb-2 block font-medium text-sm">Deposited To (Bank Account)</Label>');
content = content.replace(/<FormLabel>Reference<\/FormLabel>/g, '<Label className="mb-2 block font-medium text-sm">Reference</Label>');

fs.writeFileSync('src/app/admin/ai-accountant/[clientId]/invoices/page.tsx', content);
console.log('Fixed FormLabel imports and usages.');
