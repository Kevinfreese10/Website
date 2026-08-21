const fs = require('fs');

const content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');

let updated = content;

if (!updated.includes("import { getAuthContext }")) {
    updated = "import { getAuthContext } from '@/lib/server-auth';\n" + updated;
}

updated = updated.replace(/export async function (\w+)\(\s*({\s*[\s\S]*?})\s*(:\s*{\s*[\s\S]*?})?\s*\)\s*{/g, (match, funcName, args, typeArgs) => {
    if (args.includes('requestorId')) return match;
    
    // Some functions might have no args, or not use destructuring correctly, but we'll assume they do.
    const newArgs = args.replace(/}\s*$/, ',\n    requestorId\n}');
    let newTypeArgs = typeArgs || '';
    if (typeArgs) {
        newTypeArgs = typeArgs.replace(/}\s*$/, ',\n    requestorId?: string\n}');
    }

    const authCheck = `\n    const authCtx = await getAuthContext(requestorId as string);\n    if (!authCtx) throw new Error('Unauthorized');\n    if (!authCtx.isAdmin && !authCtx.isPartner) throw new Error('Unauthorized');\n`;
    
    return `export async function ${funcName}(${newArgs}${newTypeArgs}) {${authCheck}`;
});

fs.writeFileSync('src/app/actions/ai-recon.ts', updated);
