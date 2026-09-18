import fs from 'fs';
import path from 'path';

function patchFile(filePath, replacements) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    for (const [from, to] of replacements) {
      if (content.includes(from)) {
        content = content.replaceAll(from, to);
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched ${filePath}`);
    }
  }
}

// 1. Patch Capacitor Android module template
patchFile(path.resolve('node_modules/@capacitor/android/capacitor/build.gradle'), [
  ['8.13.0', '8.2.2'],
  ['JavaVersion.VERSION_17', 'JavaVersion.VERSION_21'],
  ['compileSdk 36', 'compileSdk 34'],
  ['targetSdkVersion 36', 'targetSdkVersion 34']
]);

// 2. Patch Cordova Plugins module
patchFile(path.resolve('android/capacitor-cordova-android-plugins/build.gradle'), [
  ['8.13.0', '8.2.2'],
  ['JavaVersion.VERSION_17', 'JavaVersion.VERSION_21'],
  ['compileSdk = 36', 'compileSdk = 34'],
  ['targetSdkVersion = 36', 'targetSdkVersion = 34']
]);

// 3. Patch App module
patchFile(path.resolve('android/app/build.gradle'), [
  ['JavaVersion.VERSION_17', 'JavaVersion.VERSION_21']
]);

// 4. Patch Capacitor App plugin build.gradle
patchFile(path.resolve('node_modules/@capacitor/app/android/build.gradle'), [
  ['8.13.0', '8.2.2'],
  ['36', '34']
]);

// 5. Patch Capacitor Browser plugin build.gradle
patchFile(path.resolve('node_modules/@capacitor/browser/android/build.gradle'), [
  ['8.13.0', '8.2.2'],
  ['36', '34']
]);

// 6. Patch Capacitor Push Notifications plugin build.gradle
patchFile(path.resolve('node_modules/@capacitor/push-notifications/android/build.gradle'), [
  ['8.13.0', '8.2.2'],
  ['36', '34']
]);


