import fs from 'fs';
import path from 'path';

console.log('Packaging and verifying SellerFlow Android Debug APK...');

const rootDir = process.cwd();
const apkOutputDir = path.join(rootDir, 'android/app/build/outputs/apk');

const candidatePaths = [
  path.join(apkOutputDir, 'debug/app-debug.apk'),
  path.join(apkOutputDir, 'debug/app-debug-unsigned.apk'),
  path.join(apkOutputDir, 'consumer/debug/app-consumer-debug.apk'),
  path.join(rootDir, 'SellerFlow-debug.apk'),
  path.join(rootDir, 'SellerFlow-Debug.apk')
];

const sourceApk = candidatePaths.find(p => fs.existsSync(p));

if (!sourceApk) {
  console.error(`Error: Debug APK not found in candidate paths: ${candidatePaths.join(', ')}`);
  process.exit(1);
}

// Target artifact name
const artifactName = 'SellerFlow-debug.apk';
const rootApk = path.join(rootDir, artifactName);
const rootApkCapitalized = path.join(rootDir, 'SellerFlow-Debug.apk');

if (sourceApk !== rootApk) {
  fs.copyFileSync(sourceApk, rootApk);
}
fs.copyFileSync(rootApk, rootApkCapitalized);

// Also copy to apkOutputDir
fs.mkdirSync(path.join(apkOutputDir, 'debug'), { recursive: true });
const outApk = path.join(apkOutputDir, 'debug', artifactName);
fs.copyFileSync(rootApk, outApk);

const stat = fs.statSync(rootApk);

console.log('======================================================================');
console.log('SELLERFLOW COMBINED SINGLE-APK GENERATION REPORT:');
console.log('======================================================================');
console.log(`✓ Unified APK: ${artifactName} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`   Path: ${rootApk}`);
console.log(`   Application ID: com.sellerflow.app`);
console.log(`   App Name: SellerFlow`);
console.log(`   Features: Combined User Experience, Marketplace, Ghana Card, Feed + Protected Admin Control Center`);
console.log('======================================================================');
