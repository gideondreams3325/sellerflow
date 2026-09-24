import fs from 'fs';
import path from 'path';

console.log('Preparing Android application assets for SellerFlow (com.sellerflow.app)...');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

// 1. Ensure builds exist
if (!fs.existsSync(distDir)) {
  throw new Error('dist/ directory not found. Please run npm run build first.');
}

const androidAppDir = path.join(rootDir, 'android/app');
const mainAssetsDir = path.join(androidAppDir, 'src/main/assets');
const mainResDir = path.join(androidAppDir, 'src/main/res/values');
const mainPublicDir = path.join(mainAssetsDir, 'public');

// Ensure directories
fs.mkdirSync(mainPublicDir, { recursive: true });
fs.mkdirSync(mainResDir, { recursive: true });

// Clean obsolete variant dirs if they exist
const consumerSrcDir = path.join(androidAppDir, 'src/consumer');
const adminSrcDir = path.join(androidAppDir, 'src/admin');
try {
  if (fs.existsSync(consumerSrcDir)) fs.rmSync(consumerSrcDir, { recursive: true, force: true });
  if (fs.existsSync(adminSrcDir)) fs.rmSync(adminSrcDir, { recursive: true, force: true });
} catch (_) {}

// 2. Package all web assets into android/app/src/main/assets/public
console.log('Packaging web assets into Android main assets...');
fs.cpSync(distDir, mainPublicDir, { recursive: true });

// 3. Ensure capacitor plugins and config
const rootCapPlugins = path.join(rootDir, 'android/app/src/main/assets/capacitor.plugins.json');
if (!fs.existsSync(rootCapPlugins)) {
  fs.writeFileSync(rootCapPlugins, '[]', 'utf8');
}

const capConfig = {
  appId: 'com.sellerflow.app',
  appName: 'SellerFlow',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: '#080808',
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

fs.writeFileSync(
  path.join(mainAssetsDir, 'capacitor.config.json'),
  JSON.stringify(capConfig, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(rootDir, 'capacitor.config.json'),
  JSON.stringify(capConfig, null, 2),
  'utf8'
);

// 4. Strings.xml
const stringsXml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">SellerFlow</string>
    <string name="title_activity_main">SellerFlow</string>
    <string name="package_name">com.sellerflow.app</string>
    <string name="custom_url_scheme">com.sellerflow.app</string>
</resources>
`;
fs.writeFileSync(path.join(mainResDir, 'strings.xml'), stringsXml, 'utf8');

// 5. Generate google-services.json for com.sellerflow.app
let baseGsConfig = null;

if (process.env.GOOGLE_SERVICES_JSON && process.env.GOOGLE_SERVICES_JSON.trim().startsWith('{')) {
  try {
    baseGsConfig = JSON.parse(process.env.GOOGLE_SERVICES_JSON.trim());
  } catch (e) {
    console.warn('Note: Could not parse GOOGLE_SERVICES_JSON environment variable, using default config.');
  }
} else {
  const existingGsPath = path.join(androidAppDir, 'google-services.json');
  if (fs.existsSync(existingGsPath)) {
    try {
      baseGsConfig = JSON.parse(fs.readFileSync(existingGsPath, 'utf8'));
    } catch (e) {}
  }
}

const defaultProjectNumber = '987175352360';
const defaultProjectId = 'sellerflow-efaab';
const defaultStorageBucket = 'sellerflow-efaab.firebasestorage.app';
const defaultApiKey = 'AIzaSyCyEdrUXAfgThfpStPY-Yvz8BG3LrhYuWk';

const projectInfo = {
  project_number: baseGsConfig?.project_info?.project_number || defaultProjectNumber,
  project_id: baseGsConfig?.project_info?.project_id || defaultProjectId,
  storage_bucket: baseGsConfig?.project_info?.storage_bucket || defaultStorageBucket
};

let clients = Array.isArray(baseGsConfig?.client) ? [...baseGsConfig.client] : [];
const DEBUG_CERT_SHA1 = 'e6524ae38d6285a14dec73c0d49ba7285f6d642f';

let consumerClient = clients.find(c => c?.client_info?.android_client_info?.package_name === 'com.sellerflow.app');
if (!consumerClient) {
  consumerClient = {
    client_info: {
      mobilesdk_app_id: `1:${projectInfo.project_number}:android:9f58f9d0e4985553c61d1d`,
      android_client_info: {
        package_name: 'com.sellerflow.app'
      }
    },
    oauth_client: [],
    api_key: [
      {
        current_key: defaultApiKey
      }
    ],
    services: {
      appinvite_service: {
        other_platform_oauth_client: []
      }
    }
  };
  clients = [consumerClient];
} else {
  clients = [consumerClient];
}

const googleServicesConfig = {
  project_info: projectInfo,
  client: clients,
  configuration_version: '1'
};

const gsJsonStr = JSON.stringify(googleServicesConfig, null, 2);
fs.writeFileSync(path.join(androidAppDir, 'google-services.json'), gsJsonStr, 'utf8');

console.log('✅ Android unified app successfully prepared:');
console.log('   - Application ID: com.sellerflow.app');
console.log('   - App Name: "SellerFlow"');
console.log('   - Entry points: / (Consumer Marketplace & Experience) and /admin (Protected Admin Control Center)');
