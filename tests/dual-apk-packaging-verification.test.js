import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('======================================================================');
console.log('SELLERFLOW DUAL ANDROID DEBUG APK PACKAGING & SECURITY VERIFICATION');
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
const consumerApk = path.join(rootDir, 'SellerFlow-Consumer-Debug.apk');
const adminApk = path.join(rootDir, 'SellerFlow-Admin-Debug.apk');

// --- 1. BINARY EXISTENCE & SIZES ---
console.log('--- 1. APK BINARY EXISTENCE & SIZE VERIFICATION ---');
assert(fs.existsSync(consumerApk), 'SellerFlow-Consumer-Debug.apk exists in project root');
assert(fs.existsSync(adminApk), 'SellerFlow-Admin-Debug.apk exists in project root');

const consumerSize = fs.existsSync(consumerApk) ? fs.statSync(consumerApk).size : 0;
const adminSize = fs.existsSync(adminApk) ? fs.statSync(adminApk).size : 0;

assert(consumerSize > 4 * 1024 * 1024, `Consumer APK size is valid (${(consumerSize / 1024 / 1024).toFixed(2)} MB)`);
assert(adminSize > 4 * 1024 * 1024, `Admin APK size is valid (${(adminSize / 1024 / 1024).toFixed(2)} MB)`);

// --- 2. AAPT METADATA & PACKAGE VERIFICATION ---
console.log('\n--- 2. AAPT BADGING, PACKAGE ID & APPLICATION LABEL ---');
const aaptPath = '/opt/android-sdk/build-tools/34.0.0/aapt';

if (fs.existsSync(aaptPath)) {
  const consumerBadging = execSync(`${aaptPath} dump badging "${consumerApk}"`, { encoding: 'utf8' });
  const adminBadging = execSync(`${aaptPath} dump badging "${adminApk}"`, { encoding: 'utf8' });

  assert(consumerBadging.includes("package: name='com.sellerflow.app'"), 'Consumer package name is "com.sellerflow.app"');
  assert(consumerBadging.includes("application-label:'2026 SELLER FLOW.INC'"), 'Consumer application label is "2026 SELLER FLOW.INC"');

  assert(adminBadging.includes("package: name='com.sellerflow.admin'"), 'Admin package name is "com.sellerflow.admin"');
  assert(adminBadging.includes("application-label:'2026 SELLER FLOW.INC Admin'"), 'Admin application label is "2026 SELLER FLOW.INC Admin"');

  assert(!consumerBadging.includes("package: name='com.sellerflow.admin'"), 'Consumer APK does NOT contain Admin package name');
  assert(!adminBadging.includes("package: name='com.sellerflow.app'"), 'Admin APK does NOT contain Consumer package name');
} else {
  console.log('  ⚠️ AAPT binary not found, skipping badging dump');
}

// --- 3. MANIFEST AUTHORITIES & SIMULTANEOUS INSTALLATION ---
console.log('\n--- 3. ANDROID MANIFEST AUTHORITIES & COEXISTENCE ---');
if (fs.existsSync(aaptPath)) {
  const consumerXml = execSync(`${aaptPath} dump xmltree "${consumerApk}" AndroidManifest.xml`, { encoding: 'utf8' });
  const adminXml = execSync(`${aaptPath} dump xmltree "${adminApk}" AndroidManifest.xml`, { encoding: 'utf8' });

  assert(consumerXml.includes('com.sellerflow.app.fileprovider'), 'Consumer FileProvider authority is "com.sellerflow.app.fileprovider"');
  assert(adminXml.includes('com.sellerflow.admin.fileprovider'), 'Admin FileProvider authority is "com.sellerflow.admin.fileprovider"');
  assert(consumerXml.includes('com.sellerflow.app.firebaseinitprovider'), 'Consumer FirebaseInitProvider authority is distinct');
  assert(adminXml.includes('com.sellerflow.admin.firebaseinitprovider'), 'Admin FirebaseInitProvider authority is distinct');
  assert(consumerXml.includes('com.sellerflow.app.androidx-startup'), 'Consumer androidx-startup authority is distinct');
  assert(adminXml.includes('com.sellerflow.admin.androidx-startup'), 'Admin androidx-startup authority is distinct');
}

// --- 4. ASSET ISOLATION & ENTRY POINTS ---
console.log('\n--- 4. ASSET ISOLATION & ENTRY POINT VALIDATION ---');
const consumerListing = execSync(`unzip -l "${consumerApk}"`, { encoding: 'utf8' });
const adminListing = execSync(`unzip -l "${adminApk}"`, { encoding: 'utf8' });

assert(consumerListing.includes('assets/public/index.html'), 'Consumer APK contains assets/public/index.html');
assert(!consumerListing.includes('assets/public/admin/index.html'), 'Consumer APK strictly excludes assets/public/admin/');
assert(!consumerListing.includes('assets/public/admin.css'), 'Consumer APK strictly excludes admin.css');

assert(adminListing.includes('assets/public/index.html'), 'Admin APK contains assets/public/index.html (Admin Portal root)');
assert(adminListing.includes('assets/public/admin.css'), 'Admin APK contains assets/public/admin.css');
assert(adminListing.includes('assets/public/app.js'), 'Admin APK contains assets/public/app.js');
assert(!adminListing.includes('assets/public/jobs-events.js'), 'Admin APK strictly excludes consumer jobs-events.js');
assert(!adminListing.includes('assets/public/recommendation-engine.js'), 'Admin APK strictly excludes consumer recommendation-engine.js');
assert(!adminListing.includes('assets/public/copyright-detector.js'), 'Admin APK strictly excludes consumer copyright-detector.js');

// --- 5. CAPACITOR EMBEDDED CONFIGURATION ---
console.log('\n--- 5. EMBEDDED CAPACITOR CONFIGURATION ---');
const consumerCapCfg = JSON.parse(execSync(`unzip -p "${consumerApk}" assets/capacitor.config.json`, { encoding: 'utf8' }));
const adminCapCfg = JSON.parse(execSync(`unzip -p "${adminApk}" assets/capacitor.config.json`, { encoding: 'utf8' }));

assert(consumerCapCfg.appId === 'com.sellerflow.app', 'Consumer capacitor.config.json appId is com.sellerflow.app');
assert(consumerCapCfg.appName === '2026 SELLER FLOW.INC', 'Consumer capacitor.config.json appName is "2026 SELLER FLOW.INC"');

assert(adminCapCfg.appId === 'com.sellerflow.admin', 'Admin capacitor.config.json appId is com.sellerflow.admin');
assert(adminCapCfg.appName === '2026 SELLER FLOW.INC Admin', 'Admin capacitor.config.json appName is "2026 SELLER FLOW.INC Admin"');

// --- 6. SECURITY AUDIT & SECRET LEAK PREVENTION ---
console.log('\n--- 6. SECURITY AUDIT & SECRET LEAK PREVENTION ---');
const tempSecDir = '/tmp/apk-test-sec-audit';
fs.mkdirSync(path.join(tempSecDir, 'c'), { recursive: true });
fs.mkdirSync(path.join(tempSecDir, 'a'), { recursive: true });

execSync(`unzip -q -o "${consumerApk}" -d "${tempSecDir}/c"`);
execSync(`unzip -q -o "${adminApk}" -d "${tempSecDir}/a"`);

function scanForSecrets(dirPath, apkName) {
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
      const result = execSync(`grep -rn "${keyword}" "${dirPath}/assets/" 2>/dev/null || true`, { encoding: 'utf8' }).trim();
      if (result.length > 0) {
        console.error(`  ❌ Potential leak of "${keyword}" in ${apkName}: ${result.slice(0, 100)}`);
        leakFound = true;
      }
    } catch (e) {}
  }
  return !leakFound;
}

assert(scanForSecrets(`${tempSecDir}/c`, 'Consumer APK'), 'No server secrets, private keys, or service-accounts in Consumer APK');
assert(scanForSecrets(`${tempSecDir}/a`, 'Admin APK'), 'No server secrets, private keys, or service-accounts in Admin APK');

// Cleanup temp audit
fs.rmSync(tempSecDir, { recursive: true, force: true });

// --- 7. GITHUB ACTIONS WORKFLOW VERIFICATION ---
console.log('\n--- 7. GITHUB ACTIONS WORKFLOW AUDIT ---');
const apkWorkflowPath = path.join(rootDir, '.github/workflows/android-apk.yml');
assert(fs.existsSync(apkWorkflowPath), '.github/workflows/android-apk.yml exists');

const apkWorkflowContent = fs.readFileSync(apkWorkflowPath, 'utf8');
assert(apkWorkflowContent.includes('SellerFlow-Consumer-Debug.apk'), 'Workflow builds SellerFlow-Consumer-Debug.apk');
assert(apkWorkflowContent.includes('SellerFlow-Admin-Debug.apk'), 'Workflow builds SellerFlow-Admin-Debug.apk');
assert(apkWorkflowContent.includes('assembleDebug'), 'Workflow runs assembleDebug');
assert(apkWorkflowContent.includes('actions/upload-artifact@v4'), 'Workflow uploads artifacts via v4');

console.log('\n======================================================================');
if (failCount === 0) {
  console.log(`ALL ${passCount} DUAL-APK PACKAGING & SECURITY CHECKS PASSED SUCCESSFULLY!`);
} else {
  console.error(`FAILED: ${failCount} checks failed, ${passCount} passed.`);
  process.exit(1);
}
console.log('======================================================================');
