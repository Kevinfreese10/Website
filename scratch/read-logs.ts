import * as fs from 'fs';

const logPath = 'C:/Users/kev/.gemini/antigravity/brain/2dae3b2f-df90-418c-9fab-a6ea855b1c56/.system_generated/tasks/task-179.log';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  console.log("Total log lines:", lines.length);
  
  const keywords = ['chunk', 'extract', 'failed', 'error', 'exception'];
  
  console.log("\nSearching all matching lines:");
  let found = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (keywords.some(kw => line.toLowerCase().includes(kw))) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
      found++;
    }
  }
  console.log(`\nTotal matches found: ${found}`);
} else {
  console.log("Log file does not exist.");
}
