const { chromium } = require('playwright-core');

async function main() {
    try {
        console.log("Connecting to Chrome over CDP on port 9222...");
        const browser = await chromium.connectOverCDP('http://localhost:9222');
        console.log("Connected!");
        const contexts = browser.contexts();
        let iframeElement = null;
        let mainPage = null;

        for (const context of contexts) {
            const pages = context.pages();
            for (const page of pages) {
                if (page.url().includes('google.com')) {
                    mainPage = page;
                    break;
                }
            }
            if (mainPage) break;
        }

        if (!mainPage) {
            console.log("Could not find page with google.com. Opening a new page...");
            const context = contexts[0] || await browser.newContext();
            mainPage = await context.newPage();
            await mainPage.goto('https://www.google.com/search?q=my+accountant&rlz=1C1CHBF_enZA1012ZA1012#mpd=~5078362611179234875/editprofile/products/add');
        }

        console.log("Current page title:", await mainPage.title());
        console.log("Current page URL:", mainPage.url());

        // Wait for iframe
        console.log("Waiting for iframe to load...");
        const iframeLocator = mainPage.frameLocator('iframe[title="Add product"], iframe[src*="editprofile/products"]');
        
        // Wait for the form container or product name field
        const nameInput = iframeLocator.locator('input[aria-label*="Product name"], input[type="text"][required]');
        await nameInput.waitFor({ timeout: 10000 });
        console.log("Iframe loaded successfully!");

        // Let's dump all inputs and buttons in the iframe to see their attributes
        const inputs = await iframeLocator.locator('input, textarea, select, button, [role="combobox"]').evaluateAll(elements => {
            return elements.map(el => ({
                tagName: el.tagName.toLowerCase(),
                type: el.getAttribute('type'),
                id: el.getAttribute('id'),
                class: el.getAttribute('class'),
                name: el.getAttribute('name'),
                placeholder: el.getAttribute('placeholder'),
                ariaLabel: el.getAttribute('aria-label'),
                role: el.getAttribute('role'),
                text: el.innerText || el.textContent || ''
            }));
        });

        console.log("Found form elements inside iframe:");
        console.log(JSON.stringify(inputs, null, 2));

        await browser.close();
    } catch (e) {
        console.error("Error inspecting iframe:", e);
    }
}

main();
