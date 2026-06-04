'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Table, FileSpreadsheet } from 'lucide-react';

export default function ToolsIndexPage() {
  const tools = [
    {
      title: "Bank Recon & Statement Extractor",
      description: "Batch upload multiple PDF bank statements. Automatically groups statements by bank account, detects date range gaps, checks balance flow, and lets you verify transactions side-by-side with the original document.",
      href: "/admin/tools/bank-recon",
      icon: Sparkles,
      color: "bg-primary/10 text-primary"
    },
    {
      title: "PDF to CSV Parser",
      description: "Extract unstructured financial PDF tables and convert them into clean comma-separated values (CSV) sheets for ledger entries.",
      href: "/admin/tools/pdf-to-csv",
      icon: Table,
      color: "bg-slate-100 text-slate-600",
      disabled: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Admin Utilities & Tools</h1>
        <p className="text-sm text-muted-foreground">
          Advanced helper applications for managing statements, spreadsheets, and document processing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <Card key={idx} className="border border-muted hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className={`p-3 rounded-xl w-fit ${tool.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-black">{tool.title}</CardTitle>
                  <CardDescription className="text-xs">{tool.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {tool.disabled ? (
                  <span className="text-[10px] uppercase font-black text-muted-foreground">Coming Soon</span>
                ) : (
                  <Link href={tool.href} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                    Open Tool <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
