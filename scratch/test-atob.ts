const base64Data = 'SGVsbG8gV29ybGQ='; // 'Hello World' in base64

try {
  const binaryString = atob(base64Data);
  const arrayBuffer = Uint8Array.from(binaryString, c => c.charCodeAt(0)).buffer;
  console.log("ArrayBuffer length:", arrayBuffer.byteLength);
  console.log("Content bytes:", new Uint8Array(arrayBuffer));
  console.log("Success! Uint8Array.from worked.");
} catch (e: any) {
  console.error("Failed:", e.message);
}
