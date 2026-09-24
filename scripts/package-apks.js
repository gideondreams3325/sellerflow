import fs from 'fs';
import path from 'path';

console.log('Packaging and verifying SellerFlow Android Debug APKs...');

const rootDir = process.cwd();
const apkOutputDir = path.join(rootDir, 'android/app/build/outputs/apk');

const consumerSourceApk = path.join(apkOutputDir, 'consumer/debug/app-consumer-debug.apk');
const adminSourceApk = path.join(apkOutputDir, 'admin/debug/app-admin-debug.apk');

if (!fs.existsSync(consumerSourceApk)) {
  console.error(`Error: Consumer debug APK not found at: ${consumerSourceApk}`);
  process.exit(1);
}

if (!fs.existsSync(adminSourceApk)) {
  console.error(`Error: Admin debug APK not found at: ${adminSourceApk}`);
  process.exit(1);
}

// Target artifact names specified by user
const consumerArtifactName = 'SellerFlow-Consumer-Debug.apk';
const adminArtifactName = 'SellerFlow-Admin-Debug.apk';

// Copy to root directory
const rootConsumerApk = path.join(rootDir, consumerArtifactName);
const rootAdminApk = path.join(rootDir, adminArtifactName);
fs.copyFileSync(consumerSourceApk, rootConsumerApk);
fs.copyFileSync(adminSourceApk, rootAdminApk);

// Also copy to apkOutputDir for GitHub Actions / Gradle output paths
const outConsumerApk = path.join(apkOutputDir, consumerArtifactName);
const outAdminApk = path.join(apkOutputDir, adminArtifactName);
fs.copyFileSync(consumerSourceApk, outConsumerApk);
fs.copyFileSync(adminSourceApk, outAdminApk);

const consumerStat = fs.statSync(rootConsumerApk);
const adminStat = fs.statSync(rootAdminApk);

console.log('======================================================================');
console.log('SELLERFLOW DUAL-APK GENERATION REPORT:');
console.log('======================================================================');
console.log(`✓ APK 1: ${consumerArtifactName} (${(consumerStat.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`   Path: ${rootConsumerApk}`);
console.log(`   Application ID: com.sellerflow.app`);
console.log(`   App Name: 2026 SELLER FLOW.INC`);
console.log(`   Entry Point: / (Consumer Application)`);
console.log('----------------------------------------------------------------------');
console.log(`✓ APK 2: ${adminArtifactName} (${(adminStat.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`   Path: ${rootAdminApk}`);
console.log(`   Application ID: com.sellerflow.admin`);
console.log(`   App Name: 2026 SELLER FLOW.INC Admin`);
console.log(`   Entry Point: /admin (Admin Portal)`);
console.log('======================================================================');
