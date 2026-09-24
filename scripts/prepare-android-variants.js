import fs from 'fs';
import path from 'path';

console.log('Preparing Android Consumer and Admin variants...');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const adminDistDir = path.join(rootDir, 'admin/dist');

// 1. Ensure builds exist
if (!fs.existsSync(distDir)) {
  throw new Error('dist/ directory not found. Please run npm run build first.');
}

const androidAppDir = path.join(rootDir, 'android/app');
const consumerSrcDir = path.join(androidAppDir, 'src/consumer');
const adminSrcDir = path.join(androidAppDir, 'src/admin');

// Ensure directories
fs.mkdirSync(path.join(consumerSrcDir, 'assets/public'), { recursive: true });
fs.mkdirSync(path.join(consumerSrcDir, 'res/values'), { recursive: true });
fs.mkdirSync(path.join(adminSrcDir, 'assets/public/admin'), { recursive: true });
fs.mkdirSync(path.join(adminSrcDir, 'res/values'), { recursive: true });

// 2. Prepare Consumer Assets
console.log('Packaging Consumer assets...');
// Copy dist files except admin
const distFiles = fs.readdirSync(distDir);
for (const file of distFiles) {
  if (file === 'admin') continue; // Isolate consumer from admin
  const src = path.join(distDir, file);
  const dest = path.join(consumerSrcDir, 'assets/public', file);
  if (fs.statSync(src).isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy capacitor runtime files
const mainAssetsDir = path.join(androidAppDir, 'src/main/assets');
if (fs.existsSync(path.join(mainAssetsDir, 'capacitor.plugins.json'))) {
  fs.copyFileSync(
    path.join(mainAssetsDir, 'capacitor.plugins.json'),
    path.join(consumerSrcDir, 'assets/capacitor.plugins.json')
  );
  fs.copyFileSync(
    path.join(mainAssetsDir, 'capacitor.plugins.json'),
    path.join(adminSrcDir, 'assets/capacitor.plugins.json')
  );
}

// Consumer capacitor.config.json
const consumerCapConfig = {
  appId: 'com.sellerflow.app',
  appName: '2026 SELLER FLOW.INC',
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
  path.join(consumerSrcDir, 'assets/capacitor.config.json'),
  JSON.stringify(consumerCapConfig, null, 2),
  'utf8'
);

// Consumer strings.xml
const consumerStringsXml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">2026 SELLER FLOW.INC</string>
    <string name="title_activity_main">2026 SELLER FLOW.INC</string>
    <string name="package_name">com.sellerflow.app</string>
    <string name="custom_url_scheme">com.sellerflow.app</string>
</resources>
`;
fs.writeFileSync(path.join(consumerSrcDir, 'res/values/strings.xml'), consumerStringsXml, 'utf8');

// 3. Prepare Admin Assets
console.log('Packaging Admin assets...');
const adminDir = path.join(rootDir, 'admin');
const adminPublicDir = path.join(adminSrcDir, 'assets/public');

// Copy admin standalone files into root of public/ (so it loads as primary entry point)
const adminFiles = ['index.html', 'admin.css', 'app.js', 'package.json', '_redirects'];
for (const f of adminFiles) {
  const src = path.join(adminDir, f);
  if (fs.existsSync(src)) {
    // Copy to root of public/
    fs.copyFileSync(src, path.join(adminPublicDir, f));
    // Also copy to public/admin/ so /admin/ deep-links and assets resolve
    fs.copyFileSync(src, path.join(adminPublicDir, 'admin', f));
  }
}

// Copy branding icons to Admin
const brandingAssets = ['icon.svg', 'nav-emblem.svg', 'logo-full.svg', 'default-avatar.svg', 'apple-touch-icon.png'];
for (const b of brandingAssets) {
  const src = path.join(rootDir, b);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(adminPublicDir, b));
  }
}

// Admin capacitor.config.json
const adminCapConfig = {
  appId: 'com.sellerflow.admin',
  appName: '2026 SELLER FLOW.INC Admin',
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
      backgroundColor: '#0d0d0d',
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};
fs.writeFileSync(
  path.join(adminSrcDir, 'assets/capacitor.config.json'),
  JSON.stringify(adminCapConfig, null, 2),
  'utf8'
);

// Admin strings.xml
const adminStringsXml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">2026 SELLER FLOW.INC Admin</string>
    <string name="title_activity_main">2026 SELLER FLOW.INC Admin</string>
    <string name="package_name">com.sellerflow.admin</string>
    <string name="custom_url_scheme">com.sellerflow.admin</string>
</resources>
`;
fs.writeFileSync(path.join(adminSrcDir, 'res/values/strings.xml'), adminStringsXml, 'utf8');

// 4. Generate google-services.json for dual variants
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

// Find or create consumer client
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
  clients.push(consumerClient);
}

// Find or create admin client
let adminClient = clients.find(c => c?.client_info?.android_client_info?.package_name === 'com.sellerflow.admin');
if (!adminClient) {
  const consumerKey = consumerClient?.api_key?.[0]?.current_key || defaultApiKey;
  adminClient = {
    client_info: {
      mobilesdk_app_id: `1:${projectInfo.project_number}:android:9f58f9d0e4985553c61d1e`,
      android_client_info: {
        package_name: 'com.sellerflow.admin'
      }
    },
    oauth_client: consumerClient?.oauth_client ? [...consumerClient.oauth_client] : [],
    api_key: [
      {
        current_key: consumerKey
      }
    ],
    services: {
      appinvite_service: {
        other_platform_oauth_client: []
      }
    }
  };
  clients.push(adminClient);
}

const googleServicesConfig = {
  project_info: projectInfo,
  client: clients,
  configuration_version: '1'
};

const gsJsonStr = JSON.stringify(googleServicesConfig, null, 2);
fs.writeFileSync(path.join(androidAppDir, 'google-services.json'), gsJsonStr, 'utf8');
fs.writeFileSync(path.join(consumerSrcDir, 'google-services.json'), gsJsonStr, 'utf8');
fs.writeFileSync(path.join(adminSrcDir, 'google-services.json'), gsJsonStr, 'utf8');

console.log('✅ Android variants successfully prepared:');
console.log('   - Consumer (com.sellerflow.app): "2026 SELLER FLOW.INC"');
console.log('   - Admin (com.sellerflow.admin): "2026 SELLER FLOW.INC Admin"');
