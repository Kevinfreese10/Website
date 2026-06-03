const { chromium } = require('playwright-core');

async function main() {
    try {
        console.log("Connecting to Chrome over CDP...");
        const browser = await chromium.connectOverCDP('http://localhost:9222');
        console.log("Connected!");
        const contexts = browser.contexts();
        console.log(`Found ${contexts.length} contexts.`);
        
        for (const context of contexts) {
            const pages = context.pages();
            console.log(`Context has ${pages.length} pages:`);
            for (const page of pages) {
                console.log(`- Title: ${await page.title()}`);
                console.log(`  URL: ${page.url()}`);
            }
        }
        
        await browser.close();
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
