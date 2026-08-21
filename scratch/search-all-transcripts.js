const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\kev\\.gemini\\antigravity\\brain';
const dirs = fs.readdirSync(brainDir);

let results = [];

dirs.forEach(d => {
  const logFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(logFile)) {
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      if (content.includes('3.5') || content.includes('gemini-1.5') || content.includes('googleai') || content.includes('geminiApiKey')) {
        const lines = content.split('\n');
        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const obj = JSON.parse(line);
            if (obj.type === 'USER_INPUT') {
              results.push({ convId: d, step: obj.step_index, content: obj.content });
            } else if (obj.type === 'PLANNER_RESPONSE' && (obj.content?.includes('3.5') || obj.content?.includes('gemini'))) {
              results.push({ convId: d, step: obj.step_index, modelResponse: obj.content.substring(0, 300) });
            }
          } catch(e) {}
        });
      }
    } catch(e) {}
  }
});

console.log(`Found ${results.length} relevant entries across conversations:`);
console.log(JSON.stringify(results.slice(0, 30), null, 2));
