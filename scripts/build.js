import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Ensure capacitor.js runtime bundle is properly built from @capacitor dependencies
function buildCapacitorBundle() {
  const corePath = path.resolve('node_modules/@capacitor/core/dist/capacitor.js');
  const browserPath = path.resolve('node_modules/@capacitor/browser/dist/plugin.js');
  const appPath = path.resolve('node_modules/@capacitor/app/dist/plugin.js');
  const pushPath = path.resolve('node_modules/@capacitor/push-notifications/dist/plugin.js');

  if (fs.existsSync(corePath) && fs.existsSync(browserPath) && fs.existsSync(appPath) && fs.existsSync(pushPath)) {
    const core = fs.readFileSync(corePath, 'utf8');
    const browser = fs.readFileSync(browserPath, 'utf8');
    const app = fs.readFileSync(appPath, 'utf8');
    const push = fs.readFileSync(pushPath, 'utf8');

    const bundle = [
      '// SellerFlow Capacitor Runtime Bridge Bundle',
      core,
      'if (typeof window !== "undefined" && typeof capacitorExports !== "undefined") {',
      '  window.capacitorExports = capacitorExports;',
      '}',
      browser,
      app,
      push,
      '(function() {',
      '  if (typeof window === "undefined") return;',
      '  var cap = window.Capacitor || (typeof capacitorExports !== "undefined" && capacitorExports.Capacitor) || {};',
      '  cap.Plugins = cap.Plugins || {};',
      '  if (typeof capacitorBrowser !== "undefined" && capacitorBrowser.Browser) cap.Plugins.Browser = capacitorBrowser.Browser;',
      '  if (typeof capacitorApp !== "undefined" && capacitorApp.App) cap.Plugins.App = capacitorApp.App;',
      '  if (typeof capacitorPushNotifications !== "undefined" && capacitorPushNotifications.PushNotifications) cap.Plugins.PushNotifications = capacitorPushNotifications.PushNotifications;',
      '  window.Capacitor = cap;',
      '})();\n'
    ].join('\n');

    fs.writeFileSync(path.resolve('capacitor.js'), bundle, 'utf8');
  }
}
buildCapacitorBundle();

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
      let appUrl = process.env.APP_URL || 'https://sellerflow-tan.vercel.app';
      if (appUrl.includes('.run.app') || appUrl.includes('ais-dev-') || appUrl.includes('localhost')) {
        appUrl = 'https://sellerflow-tan.vercel.app';
      }
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

// Bundle SellerFlow Admin standalone application into dist/admin and admin/dist
const adminDir = path.resolve('admin');
const distAdminDir = path.join(distDir, 'admin');
const adminDistDir = path.join(adminDir, 'dist');
if (fs.existsSync(adminDir)) {
  try {
    if (!fs.existsSync(distAdminDir)) fs.mkdirSync(distAdminDir, { recursive: true });
    if (!fs.existsSync(adminDistDir)) fs.mkdirSync(adminDistDir, { recursive: true });
    for (const f of ['index.html', 'admin.css', 'app.js', 'package.json', '_redirects']) {
      const srcF = path.join(adminDir, f);
      if (fs.existsSync(srcF)) {
        fs.copyFileSync(srcF, path.join(distAdminDir, f));
        fs.copyFileSync(srcF, path.join(adminDistDir, f));
        copiedCount++;
      }
    }
    const adminAssets = path.join(adminDir, 'assets');
    if (fs.existsSync(adminAssets)) {
      fs.cpSync(adminAssets, path.join(distAdminDir, 'assets'), { recursive: true });
      fs.cpSync(adminAssets, path.join(adminDistDir, 'assets'), { recursive: true });
      copiedCount++;
    }
  } catch (adminErr) {
    console.warn('Admin build copy notice:', adminErr.message);
  }
}

const androidPublicDir = path.resolve('android/app/src/main/assets/public');
if (fs.existsSync(androidPublicDir)) {
  try {
    fs.cpSync(distDir, androidPublicDir, { recursive: true });
  } catch (_) {}
}

console.log(`Build complete: ${copiedCount} assets ready in dist/`);
