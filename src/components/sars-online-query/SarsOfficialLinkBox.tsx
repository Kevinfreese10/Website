import React from 'react';
import { ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SarsOfficialLinkBoxProps {
  title?: string;
  description?: string;
  portalUrl?: string;
  guideUrl?: string;
  guideButtonText?: string;
}

export default function SarsOfficialLinkBox({
  title = "Official SARS Online Query System (SOQS)",
  description = "Access the official SARS digital portal to submit your query directly without queuing at a SARS branch or logging into eFiling.",
  portalUrl = "https://tools.sars.gov.za/soqs",
  guideUrl = "https://www.sars.gov.za/individuals/i-need-help-with-my-tax/use-our-digital-channels/",
  guideButtonText = "SARS Official Service Guide"
}: SarsOfficialLinkBoxProps) {
  return (
    <Card className="border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background shadow-lg overflow-hidden my-8">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified SARS Portal
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              {title}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md">
              <a 
                href={portalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Launch SOQS Portal
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-amber-500/30 hover:bg-amber-500/10 font-bold">
              <a 
                href={guideUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                {guideButtonText}
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
