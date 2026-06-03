async function main() {
    try {
        console.log("Global WebSocket available?", typeof WebSocket !== 'undefined');
        if (typeof WebSocket === 'undefined') return;

        const wsUrl = 'ws://127.0.0.1:9222/devtools/browser/e3a9d6ef-1d8d-4b72-b92a-2f24f4e192d5';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("WebSocket connection opened successfully!");
            // Let's send a command to list targets
            ws.send(JSON.stringify({
                id: 1,
                method: 'Target.getTargets'
            }));
        };

        ws.onmessage = (event) => {
            console.log("Received message from Chrome:", event.data);
            ws.close();
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed.");
        };

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
