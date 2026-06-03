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
        console.log("Executing bulk allocation script on page...");
        
        const code = `
            (() => {
                const el = document.querySelector('table');
                if (!el) return { success: false, error: "No table found!" };
                
                const keys = Object.keys(el);
                const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
                if (!fiberKey) return { success: false, error: "No fiber key found!" };
                
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
                
                if (!targetFiber) return { success: false, error: "Target fiber component not found!" };
                
                const txs = targetFiber.memoizedState.next.next.next.memoizedState; // Hook 3
                const allocationsHook = targetFiber.memoizedState.next.next.next.next.next; // Hook 5
                
                // Helper to format date
                const formatDate = (dateStr) => {
                    if (!dateStr) return '';
                    const d = new Date(new Date(dateStr).getTime() + 2 * 60 * 60 * 1000);
                    const yyyy = d.getUTCFullYear();
                    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const dd = String(d.getUTCDate()).padStart(2, '0');
                    return dd + '/' + mm + '/' + yyyy;
                };

                const matchedAllocations = {};
                let allocatedCount = 0;
                
                txs.forEach(t => {
                    const desc = (t.description || '').toUpperCase();
                    const amount = Math.abs(t.amount);
                    const date = formatDate(t.date);
                    
                    let glId = null;
                    
                    // Group 1: Clothing (3000-053)
                    if (desc.includes('ACKERMANS') || desc.includes('BARGAIN WORLD') || desc.includes('BASSON SPORT') ||
                        desc.includes('JRT TRADERS') || desc.includes('TRUWORTHS') || desc.includes('LUCKY KING') ||
                        desc.includes('MARKHAM') || desc.includes('MR PRICE') || desc.includes('MRP') ||
                        desc.includes('POWER FASHION') || desc.includes('TEKKIE TOWN') || desc.includes('TRADERS WAREHOUSE')) {
                        glId = '3000-053';
                    }
                    
                    // Group 2: Meal staff / Meals / Food / Staff welfare (3000-049)
                    else if (desc.includes('ROOMYS') || desc.includes('ASJ CERES') || desc.includes('BELMONT BLUE') ||
                             desc.includes('BLUE BOTTLE') || desc.includes('CCN*HOSANA') || desc.includes('CCN*JJ') ||
                             desc.includes('CCRRJJ') || desc.includes('CERES FISHERIES') || desc.includes('CHICKOS CERES') ||
                             desc.includes('CHINE TAI') || desc.includes('DOS PURCHASE') || desc.includes('FAMILY FAVOURITE') ||
                             desc.includes('EXPRESSMARK') || desc.includes('GELDENHUYS SLAGTERY') || desc.includes('HAPPY LIFE') ||
                             desc.includes('HPRHAPPY LIFE') || desc.includes('HPY*FAMILY') || desc.includes('HPY*HAPPY') ||
                             desc.includes('HPYLAMILY') || desc.includes('LESVOS FISHERIES') || desc.includes('LK *LESVOS') ||
                             desc.includes('LK *MOILOA') || desc.includes('LK*MOILOA') || desc.includes('VISFABRIEK') ||
                             desc.includes('PRINCE HAMLET') || desc.includes('USAVE') || desc.includes('WITZEN PHARMACY') ||
                             desc.includes('DRS AS') || desc.includes('DRS BURMEISTER')) {
                        glId = '3000-049';
                    }
                    
                    // Group 3: Catering / Entertainment (3000-020)
                    else if (desc.includes('DC MEAT') || desc.includes('HAMLET COUNTR') || desc.includes('GADGET AND VAPES')) {
                        glId = '3000-020';
                    }
                    
                    // Group 4: Tools / Repairs / Equipment / Computer repairs (3000-039)
                    else if (desc.includes('BMG CERES') || desc.includes('BOKKEVELD GAS') || desc.includes('CASH WDL') ||
                             desc.includes('CERES AP') || desc.includes('CERES PLANT') || desc.includes('COLORFUL ZONE') ||
                             desc.includes('KAAP AGRI') || desc.includes('TALISMAN HIRE') || desc.includes('RAGE CLS') ||
                             desc.includes('SPILHAUS')) {
                        glId = '3000-039';
                    }
                    
                    // Group 5: School fees (4000-000)
                    else if (desc.includes('CHARLIE HOFMEYER')) {
                        glId = '4000-000';
                    }
                    
                    // Group 6: Consumables (3000-007)
                    else if (desc.includes('LK *HOME') || desc.includes('NEW LIFE STORE')) {
                        glId = '3000-007';
                    }
                    
                    // Group 7: Telephone (3000-051)
                    else if (desc.includes('LK *WORLD')) {
                        glId = '3000-051';
                    }
                    
                    // Group 8: Computer expense (3000-006)
                    else if (desc.includes('TELEVIDEO')) {
                        glId = '3000-006';
                    }
                    
                    // Group 9: Namib Holdings
                    else if (desc.includes('NAMIB HOLDINGS')) {
                        if (amount === 125) glId = '3000-036';
                        if (amount === 755) glId = '3000-039';
                    }
                    
                    // Group 10: Special cases
                    else if (desc.includes('VAN DER MERWE')) {
                        glId = '3000-039'; // Tools / Repairs
                    } else if (desc.includes('DR RF')) {
                        glId = '3000-049'; // Dental -> Medical -> Staff Welfare
                    } else if (desc.includes('SILLY!ILLY')) {
                        glId = '3000-007'; // Consumables
                    }
                    
                    // Complex Group: DIGITAL SETTLEMENT / DIGITAL PAYMENT
                    else if (desc.includes('DIGITAL PAYMENT') || desc.includes('DIGITAL SETTLEMENT') || desc.includes('RODERICK')) {
                        // Subscriptions (3000-008)
                        if (desc.includes('RODERICK') && amount === 190 && date === '04/02/2025') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 310 && date === '22/06/2024') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 230 && date === '27/08/2024') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 385 && date === '12/03/2024') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 235 && date === '27/02/2025') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '04/02/2025') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '17/10/2024') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 275 && date === '01/08/2024') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '05/12/2024') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 230 && date === '06/01/2025') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 280 && date === '13/11/2024') glId = '3000-008';
                        else if (desc.includes('RODERICK') && amount === 320 && date === '11/02/2025') glId = '3000-008';
                        else if (desc.includes('REC REFRIGERATION') && amount === 450 && date === '29/07/2024') glId = '3000-008';
                        
                        // Telephone (3000-051)
                        else if (amount === 340 && date === '27/08/2024') glId = '3000-051';
                        else if (desc.includes('REC REFRIGERATION') && amount === 450 && date === '02/01/2025') glId = '3000-051';
                        else if (desc.includes('R.E.0') && amount === 200 && date === '17/09/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 320 && date === '05/11/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '05/09/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '20/02/2025') glId = '3000-051';
                        else if (desc.includes('RODERICK CYSTER') && amount === 216.1 && date === '11/02/2025') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '10/09/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 330 && date === '22/08/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '06/11/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 475 && date === '20/02/2025') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 340 && date === '12/03/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '10/04/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '06/01/2025') glId = '3000-051';
                        else if (desc.includes('R.E.0') && amount === 140 && date === '22/10/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK CYSTER') && amount === 408.43 && date === '04/02/2025') glId = '3000-051';
                        
                        // Rendering of Services (1000-000)
                        else if (desc.includes('RODERICK OYSTER') && amount === 1404.81 && date === '21/08/2024') glId = '1000-000';
                        else if (desc.includes('RODERICK CYSTER') && amount === 11142.52 && date === '15/11/2024') glId = '1000-000';
                        else if (desc.includes('COMPENSATION FUND') && amount === 3107.2 && date === '09/07/2024') glId = '1000-000';
                        else if (desc.includes('RODERICK CYSTER') && amount === 687.82 && date === '04/02/2025') glId = '1000-000';
                        else if (desc.includes('RECC002') && amount === 2762.3 && date === '20/02/2025') glId = '1000-000';
                        else if (desc.includes('RECC002') && amount === 2068.9 && date === '19/12/2024') glId = '1000-000';
                        else if (desc.includes('RODERICK OYSTER') && amount === 10695.59 && date === '10/10/2024') glId = '1000-000';
                        else if (desc.includes('CLAUDIA') && amount === 1000 && date === '10/01/2025') glId = '1000-000';
                        else if (desc.includes('JN/WII/001') && amount === 4560 && date === '30/04/2024') glId = '1000-000';
                        else if (desc.includes('RODERICK OYSTER') && amount === 5228.65 && date === '14/08/2024') glId = '1000-000';
                        else if (desc.includes('RODERICK OYSTER') && amount === 5503.33 && date === '21/08/2024') glId = '1000-000';
                        else if (desc.includes('RODERICK CYSTER') && amount === 10731.9 && date === '05/07/2024') glId = '1000-000';
                        else if (desc.includes('RODERICK CYSTER') && amount === 5368.11 && date === '08/10/2024') glId = '1000-000';
                        else if (desc.includes('RECC002') && amount === 2512.6 && date === '22/03/2024') glId = '1000-000';
                        
                        // Consumables (3000-007)
                        else if (desc.includes('CLAUDIA') && amount === 430 && date === '03/08/2024') glId = '3000-007';
                        else if (amount === 195 && date === '05/11/2024') glId = '3000-007';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '17/09/2024') glId = '3000-007';
                        else if (desc.includes('RODERICK') && amount === 250 && date === '27/08/2024') glId = '3000-007';
                        else if (desc.includes('RODERICK') && amount === 250 && date === '12/03/2024') glId = '3000-007';
                        else if (desc.includes('CLAUDIA') && amount === 430 && date === '24/08/2024') glId = '3000-007';
                        else if (desc.includes('RODERICK') && amount === 760 && date === '13/11/2024') glId = '3000-007';
                        else if (desc.includes('R.E.0') && amount === 980 && date === '23/09/2024') glId = '3000-007';
                        else if (desc.includes('RODERICK') && amount === 220 && date === '05/12/2024') glId = '3000-007';
                        else if (desc.includes('R.E.0') && amount === 610 && date === '08/10/2024') glId = '3000-007';
                        else if (desc.includes('RECREFRIGERATION') && amount === 621 && date === '25/06/2024') glId = '3000-007';
                        else if (desc.includes('RODERICK') && amount === 230 && date === '22/08/2024') glId = '3000-007';
                        else if (desc.includes('RECREFRIGERATION') && amount === 710 && date === '15/08/2024') glId = '3000-007';
                        else if (desc.includes('SILLY LILLY') && amount === 300 && date === '13/02/2025') glId = '3000-007';
                        else if (desc.includes('RODERICK') && amount === 255 && date === '22/06/2024') glId = '3000-007';
                        
                        // Utilities (3000-016)
                        else if (desc.includes('RODERICK') && amount === 195 && date === '10/10/2024') glId = '3000-016';
                        else if (desc.includes('R.E.0') && amount === 420 && date === '13/11/2024') glId = '3000-016';
                        else if (amount === 190 && date === '22/08/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 320 && date === '31/10/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '29/01/2025') glId = '3000-016';
                        else if (desc.includes('REC REFRIGERATION') && amount === 450 && date === '02/12/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '06/01/2025') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '26/11/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 545 && date === '17/10/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '30/09/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '21/08/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 220 && date === '10/10/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '15/05/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 340 && date === '10/10/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 465 && date === '27/08/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 245 && date === '07/01/2025') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '15/07/2024') glId = '3000-016';
                        else if (desc.includes('REC REFRIGERATION') && amount === 450 && date === '02/06/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 240 && date === '06/11/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '13/11/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 245 && date === '10/10/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 220 && date === '10/04/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 370 && date === '11/02/2025') glId = '3000-016';
                        
                        // Transport (3000-052)
                        else if (desc.includes('RODERICK') && amount === 190 && date === '21/08/2024') glId = '3000-052';
                        else if (desc.includes('RODERICK CYSTER') && amount === 384.71 && date === '10/02/2025') glId = '3000-052';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '10/04/2024') glId = '3000-052';
                        else if (desc.includes('REC REFRIGERATION') && amount === 450 && date === '01/11/2024') glId = '3000-052';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '12/03/2024') glId = '3000-052';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '10/09/2024') glId = '3000-052';
                        
                        // Printing and Stationery (3000-036)
                        else if (desc.includes('RODERICK') && amount === 195 && date === '13/11/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '17/10/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '26/11/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 220 && date === '15/05/2024') glId = '3000-036';
                        else if (desc.includes('R.E.0') && amount === 110 && date === '04/10/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '22/08/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 385 && date === '06/11/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 320 && date === '12/03/2024') glId = '3000-036';
                        else if (desc.includes('R.E.0') && amount === 495 && date === '29/08/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '27/08/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '31/10/2024') glId = '3000-036';
                        else if (desc.includes('RODERICK') && amount === 475 && date === '05/12/2024') glId = '3000-036';
                        
                        // Repairs / Tools (3000-039)
                        else if (desc.includes('REC REFRIGERATION') && amount === 450 && date === '30/08/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '27/08/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 380 && date === '08/01/2025') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 470 && date === '29/01/2025') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '31/10/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 230 && date === '23/10/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '17/10/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 380 && date === '10/09/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 430 && date === '22/08/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '20/02/2025') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 200 && date === '15/05/2024') glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION') && amount === 450 && date === '30/04/2024') glId = '3000-039';
                        else if (desc.includes('R.E.0') && amount === 200 && date === '23/10/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 215 && date === '24/07/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 510 && date === '10/09/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 335 && date === '10/04/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '10/10/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '20/02/2025') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 200 && date === '15/05/2024') glId = '3000-039';
                        else if (desc.includes('CLAUDIA') && amount === 800 && date === '05/11/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 390 && date === '08/01/2025') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 200 && date === '06/01/2025') glId = '3000-039';
                        else if (desc.includes('RECC002') && amount === 125.93 && date === '30/10/2024') glId = '3000-039';
                        else if (amount === 450 && date === '30/09/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '10/09/2024') glId = '3000-039';
                        else if (desc.includes('R.E.0') && amount === 1280 && date === '07/02/2025') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 190 && date === '01/08/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 195 && date === '23/10/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 230 && date === '27/02/2025') glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION') && amount === 450 && date === '02/04/2024') glId = '3000-039';
                        else if (desc.includes('SILLY LILLY') && amount === 300 && date === '05/08/2024') glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 550 && date === '23/07/2024') glId = '3000-039';
                        else if (desc.includes('R.E.0 REFRIGERATION') && amount === 600 && date === '12/08/2024') glId = '3000-036';
                    }
                    
                    // Complex Group: PAYSHAP
                    else if (desc.includes('PAYSHAP')) {
                        if (desc.includes('126') && amount === 1460.5) glId = '1000-000';
                        else if (desc.includes('CYSTER') && amount === 300 && date === '13/09/2024') glId = '3000-051';
                        else if (desc.includes('RODERICK CYSTER') && amount === 550.16) glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 600 && date === '21/11/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK CYSTER') && amount === 2836) glId = '3000-016';
                        else if (desc.includes('RODERICK') && amount === 500 && date === '30/07/2024') glId = '3000-016';
                        else if (desc.includes('RODERICK CYSTER') && amount === 1000 && date === '16/05/2024') glId = '3000-016';
                        else if (desc.includes('126') && amount === 517.5) glId = '3000-036';
                        else if (desc.includes('CYSTER') && amount === 800) glId = '3000-036';
                        else if (amount === 1057.77) glId = '1000-000';
                        else if (desc.includes('CYSTER') && amount === 350 && date === '10/09/2024') glId = '3000-052';
                        else if (desc.includes('RODERICK') && amount === 400) glId = '3000-052';
                        else if (desc.includes('126') && amount === 120.4) glId = '3000-052';
                        else if (desc.includes('126') && amount === 473) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 1500) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 600 && date === '18/02/2025') glId = '3000-039';
                        else if (desc.includes('126') && amount === 2181.92) glId = '1000-000';
                        else if (desc.includes('SILLY LILLY') && amount === 1093) glId = '3000-016';
                        else if (desc.includes('126') && amount === 1014.1) glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 328.57) glId = '1000-000';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 707.9) glId = '3000-016';
                        else if (desc.includes('126') && amount === 924.7) glId = '3000-016';
                        else if (desc.includes('126') && amount === 828) glId = '3000-016';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 945.04) glId = '3000-051';
                        else if (desc.includes('RODERICK') && amount === 500 && date === '14/07/2024') glId = '3000-051';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 313.72) glId = '3000-035';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 653) glId = '3000-035';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 1193.45) glId = '3000-039';
                        else if (desc.includes('ELTON CYSTER') && amount === 700) glId = '3000-035';
                        else if (desc.includes('CYSTER') && amount === 1110) glId = '3000-039';
                        else if (desc.includes('ELTON OYSTER') && amount === 1450) glId = '3000-035';
                        else if (desc.includes('R.E.0') && amount === 650) glId = '3000-039';
                        else if (amount === 810) glId = '3000-016';
                        else if (desc.includes('OYSTER') && amount === 1200) glId = '1000-000';
                        else if (desc.includes('126') && amount === 787) glId = '3000-039';
                        else if (desc.includes('R.E.0') && amount === 820) glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION') && amount === 450) glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 814.55) glId = '3000-039';
                        else if (desc.includes('126') && amount === 1934) glId = '3000-039';
                        else if (desc.includes('126') && amount === 1231.23) glId = '3000-039';
                        else if (desc.includes('OYSTER') && amount === 345) glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 868.72) glId = '3000-039';
                        else if (desc.includes('ELTON CYSTER') && amount === 1900) glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 580.73) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 1000 && date === '01/06/2024') glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 806.6) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 750) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 200) glId = '3000-039';
                        else if (desc.includes('R.E.0') && amount === 210) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 800) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 500 && date === '23/05/2024') glId = '3000-039';
                        else if (desc.includes('126') && amount === 1362.75) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 1000 && date === '08/06/2024') glId = '3000-039';
                        else if (desc.includes('RECREFRIGERATION AND') && amount === 595) glId = '3000-039';
                        else if (desc.includes('RECREFRIGERATION AND') && amount === 621) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 500 && date === '23/07/2024') glId = '3000-039';
                        else if (desc.includes('REC REFRIGERATION EL') && amount === 891.42) glId = '3000-007';
                        else if (desc.includes('CYSTER') && amount === 300 && date === '24/07/2024') glId = '3000-007';
                        else if (desc.includes('126') && amount === 1353) glId = '3000-039';
                        else if (desc.includes('RODERICK') && amount === 400 && date === '21/11/2024') glId = '3000-039';
                    }
                    
                    // Complex Group: SETTLEMENT
                    else if (desc === 'POS PURCHASE SETTLEMENT') {
                        if (amount === 174 && date === '28/12/2024') glId = '3000-016';
                        else if (amount === 780 && date === '24/07/2024') glId = '3000-016';
                        else if (amount === 294.9 && date === '25/12/2024') glId = '3000-016';
                        else if (amount === 456.4 && date === '30/07/2024') glId = '3000-039';
                        else if (amount === 23.9 && date === '29/03/2024') glId = '3000-039';
                        else if (amount === 250 && date === '02/02/2025') glId = '3000-039';
                        else if (amount === 308 && date === '10/10/2024') glId = '3000-039';
                        else if (amount === 823.48 && date === '18/02/2025') glId = '3000-036';
                        else if (amount === 300 && date === '12/03/2024') glId = '3000-036';
                        else if (amount === 711.4 && date === '08/12/2024') glId = '3000-039';
                        else if (amount === 250 && date === '13/06/2024') glId = '3000-051';
                        else if (amount === 420 && date === '21/12/2024') glId = '3000-051';
                    }
                    
                    // Complex Group: PUS SETTLEMENT
                    else if (desc.includes('PUS PURCHASE SETTLEMENT')) {
                        if (desc.includes('THE HAMLET COUNTR') && amount === 137) glId = '3000-049';
                        else if (desc.includes('BMG CERES') && amount === 30) glId = '3000-035';
                        else if (desc.includes('LESVOS FISHERIES') && amount === 92.95) glId = '3000-049';
                        else if (desc.includes('CCNI STORE 2') && amount === 210) glId = '3000-049';
                        else if (desc.includes('EXPRESSMARK') && amount === 400) glId = '3000-049';
                        else if (desc.includes('TELEVIDEO') && amount === 320) glId = '3000-039';
                        else if (desc.includes('YOCO *HAMLET ELEKTRI') && amount === 169.86) glId = '3000-039';
                        else if (desc.includes('HAPPY LITE STORE') && amount === 180) glId = '3000-039';
                        else if (desc.includes('CCRRJJ STORE 2') && amount === 60) glId = '3000-039';
                        else if (desc.includes('HPY*CY SUPERMARKET') && amount === 131.52) glId = '3000-049';
                        else if (desc.includes('BELMONT BLUE BOTTLE') && amount === 133) glId = '3000-049';
                        else if (desc.includes('LK "WORLD CELL') && amount === 800) glId = '3000-039';
                        else if (desc.includes('BELMONT BLUE BOTTLE') && amount === 380) glId = '3000-049';
                        else if (desc.includes('BOKKEVELD GAS') && amount === 318) glId = '3000-039';
                        else if (desc.includes('WITZEN PHARMACY') && amount === 460) glId = '3000-049';
                        else if (desc.includes('CCN*JJ STORE 2') && amount === 36) glId = '3000-039';
                    }

                    // If a GL ID was matched and the transaction is currently not reviewed
                    if (glId && t.status !== 'reviewed') {
                        matchedAllocations[t.id] = {
                            value: glId,
                            type: 'account'
                        };
                        allocatedCount++;
                    }
                });
                
                if (allocatedCount === 0) {
                    return { success: false, error: "No matching pending transactions found to allocate!" };
                }
                
                // Dispatch allocations state update
                allocationsHook.queue.dispatch(matchedAllocations);
                
                return {
                    success: true,
                    allocatedCount,
                    sampleAllocations: Object.keys(matchedAllocations).slice(0, 3).map(k => ({
                        id: k,
                        alloc: matchedAllocations[k]
                    }))
                };
            })()
        `;
        
        const result = await runOnPage(code);
        console.log("React state update result:", JSON.stringify(result, null, 2));
        
        if (!result || !result.success) {
            console.error("Failed to allocate:", result ? result.error : "Unknown error");
            return;
        }

        // Wait 2.5 seconds to let React render and enable the Save button
        console.log("Waiting 2.5 seconds for UI render...");
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Click the Save Allocations button in the browser!
        console.log("Clicking the 'Save Allocations' button...");
        const clickCode = `
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const saveBtn = buttons.find(b => b.innerText.includes('Save Allocations'));
                if (!saveBtn) return "Save button not found!";
                if (saveBtn.disabled) return "Save button is disabled!";
                saveBtn.click();
                return "Save button clicked successfully!";
            })()
        `;
        const clickResult = await runOnPage(clickCode);
        console.log("Click result:", clickResult);
        
        // Give Firestore 6 seconds to write the batch and show success toast
        console.log("Waiting 6 seconds for database write batch to commit...");
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        // Verify by scraping table one final time to see if matched items are reviewed/cleared
        console.log("Running final verification...");
        const verifyCode = `
            (() => {
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                return rows.slice(0, 10).map(tr => {
                    const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
                    return cells;
                });
            })()
        `;
        const verifyResult = await runOnPage(verifyCode);
        console.log("Final top 10 rows in DOM table after save:", JSON.stringify(verifyResult, null, 2));
        
    } catch (e) {
        console.error("Execution error:", e);
    }
}

main();
