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
        console.log("Searching React Fiber tree for Firestore 'db'...");
        const code = `
            (() => {
                const allElements = Array.from(document.querySelectorAll('*'));
                for (let el of allElements) {
                    const keys = Object.keys(el);
                    const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
                    if (!fiberKey) continue;
                    
                    let fiber = el[fiberKey];
                    while (fiber) {
                        const props = fiber.memoizedProps;
                        if (props) {
                            // Let's inspect props keys
                            for (let k in props) {
                                const val = props[k];
                                if (val && typeof val === 'object') {
                                    if (val.type === 'firestore' || val.databaseId || (val.app && val.app.name)) {
                                        return {
                                            elementTag: el.tagName,
                                            propName: k,
                                            keys: Object.keys(val),
                                            projectId: val.databaseId ? val.databaseId.projectId : (val.app ? val.app.options.projectId : null)
                                        };
                                    }
                                }
                            }
                        }
                        fiber = fiber.return;
                    }
                }
                return "Not found";
            })()
        `;
        const result = await runOnPage(code);
        console.log("Search result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
