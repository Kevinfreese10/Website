const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  let index = 0;
  while ((index = content.indexOf('<Accordion ', index)) !== -1) {
    let endIndex = content.indexOf('</Accordion>', index);
    if (endIndex === -1) break;
    endIndex += '</Accordion>'.length;

    const block = content.substring(index, endIndex);
    
    // Check if it's an FAQ accordion
    if (block.includes('.map') && (block.includes('faq,') || block.includes('faq:') || block.includes('faq)'))) {
      
      const mapMatch = block.match(/\{([a-zA-Z0-9_.]+)\.map\(\(([^)]+)\)/);
      if (!mapMatch) {
          index = endIndex;
          continue;
      }
      const arrayName = mapMatch[1];
      const mapArgs = mapMatch[2];

      const keyMatch = block.match(/<AccordionItem[^>]*key=\{([^}]+)\}/);
      const keyVar = keyMatch ? keyMatch[1] : 'i';

      const qMatch = block.match(/<AccordionTrigger[^>]*>([\s\S]*?)<\/AccordionTrigger>/);
      // Wait, what if the parameter is not `faq`? Let's check `BecomeAPartnerPageClient.tsx`. 
      // It uses `faq, index`. So `faq.question`?
      // Let's just find the inner content of AccordionTrigger.
      const qContent = qMatch ? qMatch[1].trim() : '{faq.q}';

      const aMatch = block.match(/<AccordionContent[^>]*>([\s\S]*?)<\/AccordionContent>/);
      const aContent = aMatch ? aMatch[1].trim() : '{faq.a}';

      const replacement = `<div className="w-full space-y-6">
          {${arrayName}.map((${mapArgs}) => (
            <div key={${keyVar}} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                ${qContent}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                ${aContent}
              </div>
            </div>
          ))}
        </div>`;

      content = content.substring(0, index) + replacement + content.substring(endIndex);
    } else {
      index = endIndex;
    }
  }

  if (!content.includes('<Accordion')) {
    content = content.replace(/import\s*\{\s*Accordion[^}]*\}\s*from\s*['"]@\/components\/ui\/accordion['"]\s*;\n?/g, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const targetDir1 = path.join(__dirname, '../src/app');
const targetDir2 = path.join(__dirname, '../src/components');

walkDir(targetDir1, processFile);
walkDir(targetDir2, processFile);
