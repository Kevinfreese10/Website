async function runOnPage(jsCode) {
    return new Promise((resolve, reject) => {
        const wsUrl = 'ws://127.0.0.1:9222/devtools/browser/e3a9d6ef-1d8d-4b72-b92a-2f24f4e192d5';
        const ws = new WebSocket(wsUrl);
        let sessionId = null;
        let attachMessageId = 10;
        let evalMessageId = 20;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                id: attachMessageId,
                method: 'Target.attachToTarget',
                params: {
                    targetId: 'CF6A71395F9F71165B50923434DBBAA9',
                    flatten: true
                }
            }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.id === attachMessageId) {
                if (msg.error) {
                    reject(new Error("Attach failed: " + JSON.stringify(msg.error)));
                    ws.close();
                } else {
                    sessionId = msg.result.sessionId;
                    ws.send(JSON.stringify({
                        id: evalMessageId,
                        sessionId: sessionId,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: jsCode,
                            returnByValue: true,
                            awaitPromise: true
                        }
                    }));
                }
            }
            if (msg.id === evalMessageId) {
                ws.close();
                if (msg.error) {
                    reject(new Error("Evaluate failed: " + JSON.stringify(msg.error)));
                } else if (msg.result.exceptionDetails) {
                    reject(new Error("JS Exception: " + JSON.stringify(msg.result.exceptionDetails)));
                } else {
                    resolve(msg.result.result.value);
                }
            }
        };

        ws.onerror = (err) => {
            reject(err);
        };
    });
}

async function main() {
    try {
        console.log("Analyzing React Fiber tree on page...");
        const code = `
            (() => {
                const el = document.querySelector('table');
                if (!el) return "No table found!";
                
                const keys = Object.keys(el);
                const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
                if (!fiberKey) return "No fiber key found!";
                
                let fiber = el[fiberKey];
                const paths = [];
                
                while (fiber) {
                    const nodeInfo = {
                        type: typeof fiber.type === 'function' ? fiber.type.name : String(fiber.type),
                        hasMemoizedState: !!fiber.memoizedState,
                        stateKeys: fiber.memoizedState ? Object.keys(fiber.memoizedState) : [],
                        propsKeys: fiber.memoizedProps ? Object.keys(fiber.memoizedProps) : []
                    };
                    paths.push(nodeInfo);
                    
                    // Let's inspect memoizedState hooks chain
                    let stateNode = fiber.memoizedState;
                    let hookIdx = 0;
                    while (stateNode && stateNode.next) {
                        const val = stateNode.memoizedState;
                        const summary = typeof val === 'object' && val !== null ? Object.keys(val) : typeof val;
                        
                        // Look for transactions array or allocations object
                        let looksLikeAllocations = false;
                        let looksLikeTransactions = false;
                        if (val && typeof val === 'object') {
                            if (Array.isArray(val) && val.length > 0 && val[0].bankAccountId) {
                                looksLikeTransactions = true;
                            } else if (!Array.isArray(val) && Object.keys(val).length > 0 && Object.keys(val)[0].startsWith('CSV-')) {
                                looksLikeAllocations = true;
                            }
                        }
                        
                        if (looksLikeAllocations || looksLikeTransactions) {
                            paths.push({
                                HookFound: true,
                                component: nodeInfo.type,
                                hookIndex: hookIdx,
                                looksLikeAllocations,
                                looksLikeTransactions,
                                size: Array.isArray(val) ? val.length : Object.keys(val).length
                            });
                        }
                        
                        stateNode = stateNode.next;
                        hookIdx++;
                    }
                    
                    fiber = fiber.return;
                }
                
                return paths;
            })()
        `;
        const result = await runOnPage(code);
        console.log("Fiber tree analysis:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
