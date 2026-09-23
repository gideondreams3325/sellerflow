import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Key files to copy
const filesToCopy = [
  'index.html',
  '_redirects',
  'sw.js',
  'manifest.json',
  'icon.svg',
  'logo-full.svg',
  'nav-emblem.svg',
  'default-avatar.svg',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'apple-touch-icon.png',
  'translations.js',
  'recommendation-engine.js',
  'copyright-detector.js',
  'jobs-events.js',
  'capacitor.js',
  'capacitor.config.json'
];

// Scan root for any additional icon or asset files
try {
  const rootFiles = fs.readdirSync(path.resolve('.'));
  for (const file of rootFiles) {
    if (file.endsWith('.svg') || file.endsWith('.png') || file.endsWith('.ico') || file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      if (!filesToCopy.includes(file)) {
        filesToCopy.push(file);
      }
    }
  }
} catch (_) {}

let copiedCount = 0;
for (const file of filesToCopy) {
  const srcPath = path.resolve(file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    if (file === 'index.html') {
      let content = fs.readFileSync(srcPath, 'utf8');
      const appUrl = process.env.APP_URL || 'https://sellerflow-tan.vercel.app';
      content = content.replace(/____SELLERFLOW_APP_URL____/g, appUrl);
      fs.writeFileSync(destPath, content, 'utf8');
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    copiedCount++;
  }
}

const dataDir = path.resolve('data');
const distDataDir = path.join(distDir, 'data');
if (fs.existsSync(dataDir)) {
  if (!fs.existsSync(distDataDir)) fs.mkdirSync(distDataDir, { recursive: true });
  for (const file of fs.readdirSync(dataDir)) {
    fs.copyFileSync(path.join(dataDir, file), path.join(distDataDir, file));
    copiedCount++;
  }
}

// Copy src directory assets (such as profile pictures) to dist/src
const srcDir = path.resolve('src');
const distSrcDir = path.join(distDir, 'src');
if (fs.existsSync(srcDir)) {
  try {
    fs.cpSync(srcDir, distSrcDir, { recursive: true });
    copiedCount++;
  } catch (_) {}
}

// Copy uploads directory to dist/uploads
const uploadsDir = path.resolve('uploads');
const distUploadsDir = path.join(distDir, 'uploads');
if (fs.existsSync(uploadsDir)) {
  try {
    fs.cpSync(uploadsDir, distUploadsDir, { recursive: true });
    copiedCount++;
  } catch (_) {}
}

const androidPublicDir = path.resolve('android/app/src/main/assets/public');
if (fs.existsSync(androidPublicDir)) {
  try {
    fs.cpSync(distDir, androidPublicDir, { recursive: true });
  } catch (_) {}
}

console.log(`Build complete: ${copiedCount} assets ready in dist/`);
