import re

filepath = r'c:\myacc\src\app\actions\ai-recon.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Add imports
if 'getAuthContext' not in content:
    content = content.replace("'use server';", "'use server';\n\nimport { getAuthContext } from '@/lib/server-auth';")

# The block to insert
auth_block = '''
    const authCtx = await getAuthContext(requestorId as string);
    if (!authCtx) throw new Error('Unauthorized');
    if (!authCtx.isAdmin && !authCtx.isPartner) throw new Error('Unauthorized');
'''

funcs = [
    'extractStatementChunk',
    'prepareAiAccountantAnalysis',
    'runAiAccountantAnalysis',
    'moveTransactionToNew',
    'bulkMoveTransactionsToNew',
    'researchMerchantWithAi',
    'updateGlobalMerchantDb',
    'resetAiAccountantAnalysis',
    'reanalyzeAndRegroupTransactions',
    'proposeRegroups',
    'applyRegroups',
    'proposeAiRegroups',
    'analyzeClientCommentAndSuggest',
    'matchTransactionsToSuppliers',
    'finalizeChatAllocation',
    'analyzeSpreadsheetAllocationsAction',
    'applySpreadsheetAllocationsAction',
    'matchTransactionsToHistory'
]

for func in funcs:
    # Find the function signature
    pattern = r'(export\s+async\s+function\s+' + func + r'\s*\(\s*\{.*?\}\s*(?::\s*any\s*)?\)\s*\{)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        sig = match.group(1)
        
        # Add requestorId to args if not there
        if 'requestorId' not in sig:
            if '}: ' in sig:
                # { ... }: any
                if ': any' in sig:
                    new_sig = sig.replace('}: any', ', requestorId?: string }: any')
                else:
                    new_sig = sig.replace('}', ', requestorId?: string }')
            elif '} : ' in sig:
                new_sig = sig.replace('}', ', requestorId?: string }')
            else:
                new_sig = sig.replace('}', ', requestorId?: string }')
            
            # replace sig with new_sig
            content = content.replace(sig, new_sig + auth_block)
            continue
    
    # special case for updateGlobalMerchantDb
    if func == 'updateGlobalMerchantDb':
        pattern = r'export\s+async\s+function\s+updateGlobalMerchantDb\s*\(\s*data:\s*any\s*\)\s*\{'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            sig = match.group(0)
            new_sig = 'export async function updateGlobalMerchantDb(data: any, requestorId?: string) {'
            content = content.replace(sig, new_sig + auth_block)
            continue
            
    # special case for analyzeSpreadsheetAllocationsAction & applySpreadsheetAllocationsAction
    pattern2 = r'(export\s+async\s+function\s+' + func + r'\s*\(\s*\{.*?\)\s*\{)'
    match2 = re.search(pattern2, content, re.DOTALL)
    if match2 and func in ['analyzeSpreadsheetAllocationsAction', 'applySpreadsheetAllocationsAction']:
        sig2 = match2.group(1)
        if 'requestorId' not in sig2:
            new_sig2 = sig2.replace('clientId,', 'clientId, requestorId,').replace('clientId: string;', 'clientId: string;\n    requestorId?: string;')
            content = content.replace(sig2, new_sig2 + auth_block)

with open(filepath, 'w') as f:
    f.write(content)
