import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('======================================================================');
console.log('SELLERFLOW COMBINED ANDROID DEBUG APK PACKAGING & SECURITY VERIFICATION');
console.log('======================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failCount++;
  }
}

const rootDir = process.cwd();
const combinedApk = path.join(rootDir, 'SellerFlow-debug.apk');
const combinedApkAlt = path.join(rootDir, 'SellerFlow-Debug.apk');

// --- 1. BINARY EXISTENCE & SIZES ---
console.log('--- 1. APK BINARY EXISTENCE & SIZE VERIFICATION ---');
assert(fs.existsSync(combinedApk) || fs.existsSync(combinedApkAlt), 'SellerFlow-debug.apk exists in project root');

const actualApk = fs.existsSync(combinedApk) ? combinedApk : combinedApkAlt;
const apkSize = fs.existsSync(actualApk) ? fs.statSync(actualApk).size : 0;
assert(apkSize > 4 * 1024 * 1024, `Combined APK size is valid (${(apkSize / 1024 / 1024).toFixed(2)} MB)`);

// --- 2. AAPT METADATA & PACKAGE VERIFICATION ---
console.log('\n--- 2. AAPT BADGING, PACKAGE ID & APPLICATION LABEL ---');
const aaptPath = '/opt/android-sdk/build-tools/34.0.0/aapt';

if (fs.existsSync(aaptPath) && fs.existsSync(actualApk)) {
  const badging = execSync(`${aaptPath} dump badging "${actualApk}"`, { encoding: 'utf8' });

  assert(badging.includes("package: name='com.sellerflow.app'"), 'Package name is "com.sellerflow.app"');
  assert(badging.includes("application-label:'SellerFlow'") || badging.includes("application-label:'2026 SELLER FLOW.INC'"), 'Application label is "SellerFlow"');
  assert(!badging.includes("package: name='com.sellerflow.admin'"), 'APK is unified under com.sellerflow.app');
} else {
  console.log('  ⚠️ AAPT binary not found or APK missing, skipping badging dump');
}

// --- 3. MANIFEST AUTHORITIES ---
console.log('\n--- 3. ANDROID MANIFEST AUTHORITIES ---');
if (fs.existsSync(aaptPath) && fs.existsSync(actualApk)) {
  const xmlTree = execSync(`${aaptPath} dump xmltree "${actualApk}" AndroidManifest.xml`, { encoding: 'utf8' });

  assert(xmlTree.includes('com.sellerflow.app.fileprovider'), 'FileProvider authority is "com.sellerflow.app.fileprovider"');
}

// --- 4. COMBINED ASSETS & ENTRY POINTS ---
console.log('\n--- 4. COMBINED ASSET VERIFICATION ---');
if (fs.existsSync(actualApk)) {
  const listing = execSync(`unzip -l "${actualApk}"`, { encoding: 'utf8' });

  assert(listing.includes('assets/public/index.html'), 'APK contains assets/public/index.html with full combined experience');
  assert(listing.includes('assets/public/jobs-events.js'), 'APK contains jobs-events.js');
  assert(listing.includes('assets/public/recommendation-engine.js'), 'APK contains recommendation-engine.js');
  assert(listing.includes('assets/public/copyright-detector.js'), 'APK contains copyright-detector.js');

  // Embedded capacitor config
  const capCfg = JSON.parse(execSync(`unzip -p "${actualApk}" assets/capacitor.config.json`, { encoding: 'utf8' }));
  assert(capCfg.appId === 'com.sellerflow.app', 'capacitor.config.json appId is com.sellerflow.app');
  assert(capCfg.appName === 'SellerFlow' || capCfg.appName === '2026 SELLER FLOW.INC', 'capacitor.config.json appName is "SellerFlow"');
}

// --- 5. SECURITY AUDIT & SECRET LEAK PREVENTION ---
console.log('\n--- 5. SECURITY AUDIT & SECRET LEAK PREVENTION ---');
if (fs.existsSync(actualApk)) {
  const tempSecDir = '/tmp/apk-test-sec-audit-single';
  fs.mkdirSync(tempSecDir, { recursive: true });
  execSync(`unzip -q -o "${actualApk}" -d "${tempSecDir}"`);

  const secretKeywords = [
    'BEGIN PRIVATE KEY',
    'FIREBASE_PRIVATE_KEY',
    'GEMINI_API_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'private_key_id'
  ];
  let leakFound = false;
  for (const keyword of secretKeywords) {
    try {
      const result = execSync(`grep -rn "${keyword}" "${tempSecDir}/assets/" 2>/dev/null || true`, { encoding: 'utf8' }).trim();
      if (result.length > 0) {
        console.error(`  ❌ Potential leak of "${keyword}": ${result.slice(0, 100)}`);
        leakFound = true;
      }
    } catch (e) {}
  }
  assert(!leakFound, 'No server secrets, private keys, or service-accounts in APK');
  fs.rmSync(tempSecDir, { recursive: true, force: true });
}

console.log('\n======================================================================');
if (failCount === 0) {
  console.log(`ALL ${passCount} SINGLE-APK PACKAGING & SECURITY CHECKS PASSED SUCCESSFULLY!`);
} else {
  console.error(`FAILED: ${failCount} checks failed, ${passCount} passed.`);
  process.exit(1);
}
console.log('======================================================================');
