try {
    const WebSocket = require('ws');
    console.log("SUCCESS! ws is available.");
} catch (e) {
    console.error("ws is NOT available:", e);
}
