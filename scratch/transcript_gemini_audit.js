const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\kev\\.gemini\\antigravity\\brain';
const dirs = fs.readdirSync(brainDir);

let matches = [];

dirs.forEach(d => {
  const logFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(logFile)) {
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n');
      lines.forEach(line => {
        if (!line.trim()) return;
        try {
          const obj = JSON.parse(line);
          const text = JSON.stringify(obj.content || '');
          if (text.includes('gemini') || text.includes('Gemini') || text.includes('3.5') || text.includes('genkit') || text.includes('404')) {
            if (obj.type === 'USER_INPUT' || obj.type === 'PLANNER_RESPONSE') {
              matches.push({
                convId: d,
                step: obj.step_index,
                type: obj.type,
                textSnippet: text.substring(0, 300)
              });
            }
          }
        } catch (e) {}
      });
    } catch (e) {}
  }
});

console.log(`Found ${matches.length} matches across conversations:`);
matches.slice(0, 40).forEach(m => {
  console.log(`\n--- Conv ${m.convId} Step ${m.step} (${m.type}) ---`);
  console.log(m.textSnippet);
});
