async function run() {
    try {
        const wsUrl = 'ws://127.0.0.1:9222/devtools/browser/e3a9d6ef-1d8d-4b72-b92a-2f24f4e192d5';
        console.log("Connecting to Chrome browser WebSocket:", wsUrl);
        const ws = new WebSocket(wsUrl);
        let sessionId = null;
        let attachMessageId = 10;
        let navigateMessageId = 20;

        ws.onopen = () => {
            console.log("Connected. Attaching to target CF6A71395F9F71165B50923434DBBAA9...");
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
                    console.error("Attach failed:", msg.error);
                    ws.close();
                } else {
                    sessionId = msg.result.sessionId;
                    console.log("Attached successfully! Session ID:", sessionId);
                    console.log("Navigating to target transactions page...");
                    ws.send(JSON.stringify({
                        id: navigateMessageId,
                        sessionId: sessionId,
                        method: 'Page.navigate',
                        params: {
                            url: 'https://www.myacc.co.za/admin/ai-accountant/MVa8u4DGCjfAaSG8ILWr/bank/transactions?accountId=8400-001'
                        }
                    }));
                }
            }
            if (msg.id === navigateMessageId) {
                console.log("Navigation command confirmed by browser:", msg);
                // Give it 8 seconds to navigate and load all data/components
                console.log("Waiting 8 seconds for page load...");
                setTimeout(async () => {
                    // Let's run a quick evaluate to see the loaded title and page state
                    const evalMessageId = 30;
                    ws.send(JSON.stringify({
                        id: evalMessageId,
                        sessionId: sessionId,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: '({ title: document.title, url: window.location.href, tableFound: !!document.querySelector("table") })',
                            returnByValue: true
                        }
                    }));
                }, 8000);
            }
            if (msg.id === 30) {
                ws.close();
                if (msg.error) {
                    console.error("Verification evaluate failed:", msg.error);
                } else {
                    console.log("Verification state:", JSON.stringify(msg.result.result.value, null, 2));
                }
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed.");
        };

    } catch (e) {
        console.error("Error in main:", e);
    }
}

run();
