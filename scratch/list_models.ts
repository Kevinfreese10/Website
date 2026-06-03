import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("GEMINI_API_KEY is not defined in env.");
        process.exit(1);
    }
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        console.log("Fetching models list from:", url.replace(key, "HIDDEN_KEY"));
        const res = await fetch(url);
        const data = await res.json();
        console.log("Status:", res.status);
        if (data.models) {
            console.log("Available models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (methods: ${m.supportedGenerationMethods?.join(', ') || 'none'})`);
            });
        } else {
            console.log("No models returned. Response:", JSON.stringify(data, null, 2));
        }
    } catch (e: any) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
