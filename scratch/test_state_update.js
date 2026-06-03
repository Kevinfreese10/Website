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
        console.log("Testing React state update for a single transaction...");
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
                
                // Let's get the transactions list
                const txs = targetFiber.memoizedState.next.next.next.memoizedState; // Hook 3
                const allocationsHook = targetFiber.memoizedState.next.next.next.next.next; // Hook 5
                
                // Find a transaction to test, say the one for HAPPY LIFE STORE PAARL amount -40.00
                const testTx = txs.find(t => t.amount === -40.00 && t.description.includes('HAPPY LIFE'));
                if (!testTx) return "Test transaction not found!";
                
                // Let's allocate it to "Staff Welfare" (GL Account ID "3000-049")
                const newAlloc = {
                    [testTx.id]: {
                        value: "3000-049",
                        type: "account"
                    }
                };
                
                // Call dispatch
                allocationsHook.queue.dispatch(newAlloc);
                
                return {
                    success: true,
                    testTxId: testTx.id,
                    testTxDesc: testTx.description,
                    allocatedValue: newAlloc[testTx.id]
                };
            })()
        `;
        const result = await runOnPage(code);
        console.log("State update result:", JSON.stringify(result, null, 2));

        // Now let's wait a second and scrape the table again to see if the UI has updated!
        console.log("Waiting 2 seconds to check if DOM reflects change...");
        setTimeout(async () => {
            const checkCode = `
                (() => {
                    const rows = Array.from(document.querySelectorAll('table tbody tr'));
                    // Look for the row containing -40.00
                    const row = rows.find(tr => tr.innerText.includes('-40.00') && tr.innerText.includes('HAPPY LIFE'));
                    if (!row) return "Row not found in DOM!";
                    const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
                    return { cells };
                })()
            `;
            const checkResult = await runOnPage(checkCode);
            console.log("Check row state in DOM:", JSON.stringify(checkResult, null, 2));
        }, 2000);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
