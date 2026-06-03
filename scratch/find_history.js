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
        console.log("Querying Firestore history from the browser page...");
        const code = `
            (async () => {
                // We can query Firestore using the import/window if available,
                // or we can use the React state/props which might have the firebase DB instance.
                // Wait! Let's find the Firebase 'db' instance from the React tree!
                const el = document.querySelector('table');
                if (!el) return "No table found!";
                const keys = Object.keys(el);
                const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
                if (!fiberKey) return "No fiber key found!";
                
                let fiber = el[fiberKey];
                let dbInstance = null;
                
                // Let's traverse up to find 'db' in props or context
                while (fiber) {
                    const props = fiber.memoizedProps;
                    if (props && props.client) {
                        // Let's see if there's firebase db in window or if we can import it.
                        // Wait! Next.js packs modules, but wait, 'db' is imported in page.tsx as 'db' from '@/lib/firebase'.
                        // Let's see if we can find 'db' inside the React component's context or a hook!
                    }
                    fiber = fiber.return;
                }

                // Wait! In the page, is 'db' exposed anywhere?
                // Let's check if we can query from Firestore by using the global 'firebase' or if we can run onSnapshot/getDocs
                // If we can't query Firestore directly, we can scrape the page itself or check if there's anything else.
                // Let's see if we can just scrape all rows currently loaded on the page and their existing allocations!
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                const scraped = rows.map(tr => {
                    const cells = Array.from(tr.querySelectorAll('td')).map(cell => cell.innerText.trim());
                    const button = tr.querySelector('td:nth-child(5) button');
                    const allocationText = button ? button.innerText.trim() : '';
                    return {
                        description: cells[2] || '',
                        allocation: allocationText,
                        amount: cells[5] || ''
                    };
                });
                return scraped;
            })()
        `;
        const result = await runOnPage(code);
        console.log("Scraped loaded transactions count:", result.length);
        console.log("Loaded transactions with allocations:");
        result.forEach((r, i) => {
            if (r.allocation && r.allocation !== 'Select Account...') {
                console.log(`- Description: ${r.description.split('\\n')[0]} | Allocation: ${r.allocation} | Amount: ${r.amount}`);
            }
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
