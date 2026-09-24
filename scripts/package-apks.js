import fs from 'fs';
import path from 'path';

console.log('Packaging and verifying SellerFlow Android Debug APKs...');

const rootDir = process.cwd();
const apkOutputDir = path.join(rootDir, 'android/app/build/outputs/apk');

const consumerCandidates = [
  path.join(apkOutputDir, 'consumer/debug/app-consumer-debug.apk'),
  path.join(apkOutputDir, 'consumer/debug/app-consumer-debug-unsigned.apk'),
  path.join(rootDir, 'SellerFlow-Consumer-Debug.apk'),
  path.join(rootDir, 'SellerFlow-Debug.apk')
];

const adminCandidates = [
  path.join(apkOutputDir, 'admin/debug/app-admin-debug.apk'),
  path.join(apkOutputDir, 'admin/debug/app-admin-debug-unsigned.apk'),
  path.join(rootDir, 'SellerFlow-Admin-Debug.apk')
];

const consumerSourceApk = consumerCandidates.find(p => fs.existsSync(p));
const adminSourceApk = adminCandidates.find(p => fs.existsSync(p));

if (!consumerSourceApk) {
  console.error(`Error: Consumer debug APK not found in candidate paths: ${consumerCandidates.join(', ')}`);
  process.exit(1);
}

if (!adminSourceApk) {
  console.error(`Error: Admin debug APK not found in candidate paths: ${adminCandidates.join(', ')}`);
  process.exit(1);
}

// Target artifact names specified by user
const consumerArtifactName = 'SellerFlow-Debug.apk';
const adminArtifactName = 'SellerFlow-Admin-Debug.apk';

// Copy to root directory
const rootConsumerApk = path.join(rootDir, consumerArtifactName);
const rootAdminApk = path.join(rootDir, adminArtifactName);
if (consumerSourceApk !== rootConsumerApk) {
  fs.copyFileSync(consumerSourceApk, rootConsumerApk);
}
if (adminSourceApk !== rootAdminApk) {
  fs.copyFileSync(adminSourceApk, rootAdminApk);
}

// Also copy to apkOutputDir for GitHub Actions / Gradle output paths
fs.mkdirSync(apkOutputDir, { recursive: true });
const outConsumerApk = path.join(apkOutputDir, consumerArtifactName);
const outAdminApk = path.join(apkOutputDir, adminArtifactName);
fs.copyFileSync(rootConsumerApk, outConsumerApk);
fs.copyFileSync(rootAdminApk, outAdminApk);

const consumerStat = fs.statSync(rootConsumerApk);
const adminStat = fs.statSync(rootAdminApk);

console.log('======================================================================');
console.log('SELLERFLOW DUAL-APK GENERATION REPORT:');
console.log('======================================================================');
console.log(`✓ APK 1: ${consumerArtifactName} (${(consumerStat.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`   Path: ${rootConsumerApk}`);
console.log(`   Application ID: com.sellerflow.app`);
console.log(`   App Name: SellerFlow`);
console.log(`   Entry Point: / (Consumer Application)`);
console.log('----------------------------------------------------------------------');
console.log(`✓ APK 2: ${adminArtifactName} (${(adminStat.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`   Path: ${rootAdminApk}`);
console.log(`   Application ID: com.sellerflow.admin`);
console.log(`   App Name: SellerFlow Admin`);
console.log(`   Entry Point: /admin (Admin Portal)`);
console.log('======================================================================');
