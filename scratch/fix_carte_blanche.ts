import fs from 'fs';

async function main() {
    console.log("Reading DevTools active port file...");
    const activePortContent = fs.readFileSync('C:/Users/kev/AppData/Local/Google/Chrome/User Data/DevToolsActivePort', 'utf-8');
    const [port, browserPath] = activePortContent.split('\n').map(s => s.trim());

    const wsUrl = `ws://127.0.0.1:${port}${browserPath}`;
    console.log(`Connecting to browser DevTools WebSocket...`);

    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = (err) => reject(err);
    });
    console.log("Connected successfully!");

    let messageId = 1;
    const send = (method: string, params: any = {}, sessionId?: string) => {
        const id = messageId++;
        const payload: any = { id, method, params };
        if (sessionId) payload.sessionId = sessionId;
        ws.send(JSON.stringify(payload));
        return id;
    };

    const waitResponse = (id: number) => {
        return new Promise<any>((resolve) => {
            const listener = (event: MessageEvent) => {
                const res = JSON.parse(event.data);
                if (res.id === id) {
                    ws.removeEventListener('message', listener);
                    resolve(res);
                }
            };
            ws.addEventListener('message', listener);
        });
    };

    const targetsId = send("Target.getTargets");
    const targetsRes = await waitResponse(targetsId);
    const targets = targetsRes.result.targetInfos as any[];

    const pageTarget = targets.find(t => t.type === 'page' && (t.url.includes('myacc.co.za') || t.url.includes('localhost')));
    if (!pageTarget) {
        console.error("Could not find active page target!");
        ws.close();
        return;
    }
    console.log(`Using active tab: "${pageTarget.title}" | URL: "${pageTarget.url}"`);

    const attachId = send("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });
    const attachRes = await waitResponse(attachId);
    const sessionId = attachRes.result.sessionId;

    const repairScript = `(async () => {
        try {
            console.log("Reading Firebase Auth token from IndexedDB...");
            const val = await new Promise((resolve) => {
                const request = indexedDB.open("firebaseLocalStorageDb");
                request.onerror = () => resolve({ error: "IndexedDB open failed" });
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
                        resolve({ error: "Store not found" });
                        return;
                    }
                    const transaction = db.transaction(["firebaseLocalStorage"], "readonly");
                    const store = transaction.objectStore("firebaseLocalStorage");
                    const getAllRequest = store.getAll();
                    getAllRequest.onsuccess = () => {
                        const results = getAllRequest.result;
                        if (results && results.length > 0) {
                            const user = results[0].value;
                            if (user && user.stsTokenManager && user.stsTokenManager.accessToken) {
                                resolve({ token: user.stsTokenManager.accessToken, email: user.email });
                                return;
                            }
                        }
                        resolve({ error: "No user found in store" });
                    };
                    getAllRequest.onerror = () => resolve({ error: "Store get failed" });
                };
            });

            if (val.error) {
                return { error: "Failed to read credentials: " + val.error };
            }

            const token = val.token;
            const projectId = 'studio-2604127518-57889';

            async function fetchREST(path, options = {}) {
                const url = "https://firestore.googleapis.com/v1/projects/" + projectId + "/databases/(default)/documents/" + path;
                const headers = {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    ...options.headers
                };
                const response = await fetch(url, { ...options, headers });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error("REST failed: " + response.status + " " + response.statusText + " - " + errText);
                }
                return response.json();
            }

            async function listDocuments(path) {
                let documents = [];
                let nextPageToken = '';
                do {
                    const queryParams = nextPageToken ? "?pageToken=" + nextPageToken : '';
                    const res = await fetchREST(path + queryParams);
                    if (res.documents) {
                        documents = documents.concat(res.documents);
                    }
                    nextPageToken = res.nextPageToken || '';
                } while (nextPageToken);
                return documents;
            }

            function getDocId(doc) {
                const parts = doc.name.split('/');
                return parts[parts.length - 1];
            }

            function getField(doc, fieldName) {
                const field = doc.fields && doc.fields[fieldName];
                if (!field) return undefined;
                if (field.stringValue !== undefined) return field.stringValue;
                if (field.integerValue !== undefined) return parseInt(field.integerValue);
                if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
                if (field.booleanValue !== undefined) return field.booleanValue;
                if (field.mapValue !== undefined) return field.mapValue;
                return field;
            }

            // 1. Get clients
            console.log("Loading clients...");
            const clients = await listDocuments('aiAccountantClients');
            let targetClientId = '';
            let targetClientName = '';
            for (const c of clients) {
                const companyName = getField(c, 'companyName') || '';
                const name = getField(c, 'name') || '';
                if (companyName.toLowerCase().includes('carte blanche') || name.toLowerCase().includes('carte blanche')) {
                    targetClientId = getDocId(c);
                    targetClientName = companyName || name;
                    break;
                }
            }

            if (!targetClientId) {
                return { error: "Carte Blanche client not found in DB!" };
            }

            // 2. Load suppliers
            console.log("Loading suppliers...");
            const suppliers = await listDocuments("aiAccountantClients/" + targetClientId + "/suppliers");
            const supplierIds = new Set();
            const supplierMap = new Map();
            for (const s of suppliers) {
                const id = getDocId(s);
                const sName = getField(s, 'name');
                supplierIds.add(id);
                supplierMap.set(id, sName);
            }
            console.log("Loaded " + supplierIds.size + " suppliers.");

            // 3. Load customers
            console.log("Loading customers...");
            const customers = await listDocuments("aiAccountantClients/" + targetClientId + "/customers");
            const customerIds = new Set();
            const customerMap = new Map();
            for (const c of customers) {
                const id = getDocId(c);
                const cName = getField(c, 'name');
                customerIds.add(id);
                customerMap.set(id, cName);
            }
            console.log("Loaded " + customerIds.size + " customers.");

            // 4. Query all journal transactions
            console.log("Loading all transactions...");
            const allTxs = await listDocuments("aiAccountantClients/" + targetClientId + "/transactions");
            const txDocs = allTxs.filter(tx => getField(tx, 'bankAccountId') === 'JOURNAL');
            console.log("Found " + txDocs.length + " journal transactions among " + allTxs.length + " total transactions.");

            let fixedCount = 0;
            const fixes = [];
            for (const tx of txDocs) {
                const allocatedTo = getField(tx, 'allocatedTo');
                if (allocatedTo && allocatedTo.fields) {
                    const valueField = allocatedTo.fields.value;
                    const typeField = allocatedTo.fields.type;
                    const val = valueField ? valueField.stringValue : '';
                    const type = typeField ? typeField.stringValue : '';

                    if (supplierIds.has(val) && type !== 'supplier') {
                        const supplierName = supplierMap.get(val);
                        fixes.push("Supplier: Reference \\"" + getField(tx, 'reference') + "\\", ID: \\"" + getDocId(tx) + "\\", Name: \\"" + supplierName + "\\"");
                        await fetchREST("aiAccountantClients/" + targetClientId + "/transactions/" + getDocId(tx) + "?updateMask.fieldPaths=allocatedTo", {
                            method: 'PATCH',
                            body: JSON.stringify({
                                fields: {
                                    allocatedTo: {
                                        mapValue: {
                                            fields: {
                                                type: { stringValue: 'supplier' },
                                                value: { stringValue: val }
                                            }
                                        }
                                    }
                                }
                            })
                        });
                        fixedCount++;
                    } else if (customerIds.has(val) && type !== 'customer') {
                        const customerName = customerMap.get(val);
                        fixes.push("Customer: Reference \\"" + getField(tx, 'reference') + "\\", ID: \\"" + getDocId(tx) + "\\", Name: \\"" + customerName + "\\"");
                        await fetchREST("aiAccountantClients/" + targetClientId + "/transactions/" + getDocId(tx) + "?updateMask.fieldPaths=allocatedTo", {
                            method: 'PATCH',
                            body: JSON.stringify({
                                fields: {
                                    allocatedTo: {
                                        mapValue: {
                                            fields: {
                                                type: { stringValue: 'customer' },
                                                value: { stringValue: val }
                                            }
                                        }
                                    }
                                }
                            })
                        });
                        fixedCount++;
                    }
                }
            }

            return {
                success: true,
                clientName: targetClientName,
                clientId: targetClientId,
                fixedCount,
                fixes
            };
        } catch (e) {
            return { error: e.message || String(e) };
        }
    })()`;

    console.log("Evaluating repair script in page context...");
    const evalId = send("Runtime.evaluate", {
        expression: repairScript,
        awaitPromise: true,
        returnByValue: true
    }, sessionId);

    const evalRes = await waitResponse(evalId);
    console.log("Evaluation complete.");

    const resultValue = evalRes.result.result.value;
    if (resultValue && resultValue.success) {
        console.log("\n==============================================");
        console.log(`Successfully repaired client: "${resultValue.clientName}" (${resultValue.clientId})`);
        console.log(`Fixed count: ${resultValue.fixedCount}`);
        console.log("Applied repairs:");
        resultValue.fixes.forEach((fix: string) => console.log(` - ${fix}`));
        console.log("==============================================\n");
    } else if (resultValue && resultValue.error) {
        console.error("Execution error returned from page context:", resultValue.error);
    } else {
        console.error("Unexpected response value format:", evalRes.result);
    }

    ws.close();
}

main().catch(console.error);
