import fs from 'fs';
import path from 'path';

const root = process.cwd();
const standaloneDir = path.join(root, '.next', 'standalone');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(standaloneDir)) {
  // 1. Copy public/ -> .next/standalone/public/
  const publicSrc = path.join(root, 'public');
  const publicDest = path.join(standaloneDir, 'public');
  copyRecursiveSync(publicSrc, publicDest);
  console.log('[copy-standalone-assets] Copied public/ to .next/standalone/public/');

  // 2. Copy .next/static/ -> .next/standalone/.next/static/
  const staticSrc = path.join(root, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  copyRecursiveSync(staticSrc, staticDest);
  console.log('[copy-standalone-assets] Copied .next/static/ to .next/standalone/.next/static/');

  // 3. Copy src/server/templates/ -> .next/standalone/src/server/templates/
  const templatesSrc = path.join(root, 'src', 'server', 'templates');
  const templatesDest = path.join(standaloneDir, 'src', 'server', 'templates');
  copyRecursiveSync(templatesSrc, templatesDest);
  console.log('[copy-standalone-assets] Copied src/server/templates/ to .next/standalone/src/server/templates/');
} else {
  console.warn('[copy-standalone-assets] .next/standalone not found, skipping.');
}
