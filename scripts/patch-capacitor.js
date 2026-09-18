import fs from 'fs';
import path from 'path';

const capacitorGradle = path.resolve('node_modules/@capacitor/android/capacitor/build.gradle');
if (fs.existsSync(capacitorGradle)) {
  let content = fs.readFileSync(capacitorGradle, 'utf8');
  content = content.replace(/8\.13\.0/g, '8.2.2');
  content = content.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');
  fs.writeFileSync(capacitorGradle, content, 'utf8');
  console.log('Successfully patched Capacitor Android template dependencies.');
}

const cordovaPluginsGradle = path.resolve('android/capacitor-cordova-android-plugins/build.gradle');
if (fs.existsSync(cordovaPluginsGradle)) {
  let content = fs.readFileSync(cordovaPluginsGradle, 'utf8');
  content = content.replace(/8\.13\.0/g, '8.2.2');
  content = content.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');
  fs.writeFileSync(cordovaPluginsGradle, content, 'utf8');
  console.log('Successfully patched Capacitor Cordova plugins build.gradle.');
}
