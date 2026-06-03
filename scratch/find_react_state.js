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
        console.log("Locating React transaction/allocation states...");
        const code = `
            (() => {
                const el = document.querySelector('table');
                if (!el) return "No table found!";
                
                const keys = Object.keys(el);
                const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
                if (!fiberKey) return "No fiber key found!";
                
                let fiber = el[fiberKey];
                const matches = [];
                
                while (fiber) {
                    const compName = typeof fiber.type === 'function' ? fiber.type.name : String(fiber.type);
                    
                    let stateNode = fiber.memoizedState;
                    let hookIdx = 0;
                    while (stateNode) {
                        const val = stateNode.memoizedState;
                        
                        // Check if it looks like transactions array
                        if (Array.isArray(val) && val.length > 0 && val[0] && typeof val[0] === 'object') {
                            if ('bankAccountId' in val[0] || 'amount' in val[0]) {
                                matches.push({
                                    type: 'transactions',
                                    compName,
                                    hookIdx,
                                    length: val.length,
                                    firstItem: {
                                        id: val[0].id,
                                        date: val[0].date,
                                        amount: val[0].amount,
                                        description: val[0].description,
                                        reference: val[0].reference
                                    }
                                });
                            }
                        }
                        
                        // Check if it looks like allocations object
                        if (val && typeof val === 'object' && !Array.isArray(val)) {
                            const keys = Object.keys(val);
                            if (keys.length > 0 && keys.some(k => k.startsWith('CSV-') || k.length > 15)) {
                                const sampleVal = val[keys[0]];
                                matches.push({
                                    type: 'allocations',
                                    compName,
                                    hookIdx,
                                    keysCount: keys.length,
                                    sampleKeys: keys.slice(0, 3),
                                    sampleValue: sampleVal ? {
                                        id: sampleVal.id,
                                        accountNumber: sampleVal.accountNumber,
                                        description: sampleVal.description
                                    } : null
                                });
                            }
                        }
                        
                        stateNode = stateNode.next;
                        hookIdx++;
                    }
                    
                    fiber = fiber.return;
                }
                
                return matches;
            })()
        `;
        const result = await runOnPage(code);
        console.log("Matches found:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
