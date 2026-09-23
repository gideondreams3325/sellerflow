import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminRoot = __dirname;
const distDir = path.join(adminRoot, 'dist');

console.log('[SellerFlow Admin] Initiating independent production build...');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Files to bundle for standalone deployment
const filesToBundle = ['index.html', 'admin.css', 'app.js'];

let copiedCount = 0;
for (const file of filesToBundle) {
  const src = path.join(adminRoot, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    copiedCount++;
    console.log(`  ✓ Bundled ${file} -> dist/${file}`);
  } else {
    console.warn(`  ⚠ Warning: Missing expected file ${src}`);
  }
}

// 2. Bundle optional assets directory if present
const assetsDir = path.join(adminRoot, 'assets');
const distAssetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, distAssetsDir, { recursive: true });
  copiedCount++;
  console.log(`  ✓ Bundled assets directory -> dist/assets/`);
}

// 3. Create standalone package.json and deployment manifest for static hosting (e.g. Firebase Hosting, Vercel, Netlify)
const standalonePkg = {
  name: 'sellerflow-admin-standalone',
  version: '1.0.0',
  description: 'SellerFlow Admin - Standalone Production Distribution',
  private: true,
  scripts: {
    preview: 'npx serve -l 3001'
  }
};
fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(standalonePkg, null, 2), 'utf8');

// 4. Create _redirects for single-page application routing on static hosts
fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n', 'utf8');

console.log(`[SellerFlow Admin] Standalone build complete: ${copiedCount} files ready in admin/dist/`);
