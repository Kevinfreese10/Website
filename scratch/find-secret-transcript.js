const fs = require('fs');
const path = 'C:\\Users\\kev\\.gemini\\antigravity\\brain\\e0fb6afd-aa03-4ce2-8762-689c86b506d5\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  console.log('Transcript from Secret Manager subagent:');
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('MikeOxlong') || line.includes('secret') || line.includes('SMTP_PASS')) {
      console.log(line.substring(0, 300));
    }
  });
} else {
  console.log('Transcript file not found at:', path);
}
