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
        const code = `
            (() => {
                const el = document.querySelector('table');
                if (!el) return "No table found!";
                
                const keys = Object.keys(el);
                const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
                if (!fiberKey) return "No fiber key found!";
                
                let fiber = el[fiberKey];
                let targetFiber = null;
                
                while (fiber) {
                    let stateNode = fiber.memoizedState;
                    let hookIdx = 0;
                    while (stateNode) {
                        const val = stateNode.memoizedState;
                        if (Array.isArray(val) && val.length === 533) {
                            targetFiber = fiber;
                            break;
                        }
                        stateNode = stateNode.next;
                        hookIdx++;
                    }
                    if (targetFiber) break;
                    fiber = fiber.return;
                }
                
                if (!targetFiber) return "Target fiber component not found!";
                
                const txs = targetFiber.memoizedState.next.next.next.memoizedState;
                
                // Group by merchant first 3 words
                const groups = {};
                txs.forEach(t => {
                    const desc = t.description || '';
                    // Clean description and get first 3 words
                    const words = desc.replace(/POS PURCHASE SETTLEMENT CARD NO. \\d+/i, '')
                                      .replace(/DIGITAL PAYMENT DT SETTLEMENT \\d+\\.\\d+/i, '')
                                      .replace(/IMDTE DIGITAL PMT SETTLEMENT \\d+\\.\\d+/i, '')
                                      .replace(/PAYSHAP EXT DEBIT SETTLEMENT \\d+\\.\\d+/i, '')
                                      .trim()
                                      .split(/\\s+/)
                                      .slice(0, 3)
                                      .join(' ')
                                      .toUpperCase();
                                      
                    if (!groups[words]) {
                        groups[words] = {
                            count: 0,
                            pendingCount: 0,
                            reviewedCount: 0,
                            samples: []
                        };
                    }
                    groups[words].count++;
                    if (t.status === 'reviewed') {
                        groups[words].reviewedCount++;
                    } else {
                        groups[words].pendingCount++;
                    }
                    if (groups[words].samples.length < 2) {
                        groups[words].samples.push({
                            date: t.date,
                            amount: t.amount,
                            description: desc
                        });
                    }
                });
                
                return groups;
            })()
        `;
        const result = await runOnPage(code);
        console.log("MERCHANT_GROUPS_RESULT:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
