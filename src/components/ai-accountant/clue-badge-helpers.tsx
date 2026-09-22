import React from 'react';
import { 
    Clock, 
    Percent, 
    Layers, 
    ShieldAlert, 
    History, 
    ArrowLeftRight, 
    CheckCheck, 
    Globe, 
    Sparkles 
} from 'lucide-react';
import { ClueType } from '@/lib/detective-engine';

export function renderClueIcon(type: ClueType): React.ReactNode {
    switch (type) {
        case 'timing':
            return <Clock className="h-3 w-3 shrink-0" />;
        case 'amount':
            return <Percent className="h-3 w-3 shrink-0" />;
        case 'prefix':
            return <Layers className="h-3 w-3 shrink-0" />;
        case 'reference':
            return <ShieldAlert className="h-3 w-3 shrink-0" />;
        case 'cross_ref':
            return <History className="h-3 w-3 shrink-0" />;
        case 'sweep':
            return <ArrowLeftRight className="h-3 w-3 shrink-0" />;
        case 'structure':
            return <CheckCheck className="h-3 w-3 shrink-0" />;
        case 'web':
            return <Globe className="h-3 w-3 shrink-0" />;
        default:
            return <Sparkles className="h-3 w-3 shrink-0" />;
    }
}

export function getClueBadgeStyle(type: ClueType): string {
    switch (type) {
        case 'timing':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'amount':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'prefix':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'reference':
            return 'bg-red-50 text-red-700 border-red-200';
        case 'cross_ref':
            return 'bg-teal-50 text-teal-700 border-teal-200';
        case 'sweep':
            return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'structure':
            return 'bg-sky-50 text-sky-700 border-sky-200';
        case 'web':
            return 'bg-green-50 text-green-700 border-green-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
}
