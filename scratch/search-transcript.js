const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\kev\\.gemini\\antigravity\\brain\\327f65e3-51dc-473f-8238-d29b45fa35b5\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let matches = [];

rl.on('line', (line) => {
  if (line.includes('gemini') || line.includes('Gemini') || line.includes('3.5') || line.includes('model') || line.includes('genai') || line.includes('404')) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' || (obj.content && typeof obj.content === 'string' && obj.content.length < 500)) {
        matches.push({
          step: obj.step_index,
          type: obj.type,
          content: obj.content
        });
      }
    } catch (e) {}
  }
});

rl.on('close', () => {
  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => {
    console.log(`\n--- Step ${m.step} (${m.type}) ---`);
    console.log(m.content);
  });
});
