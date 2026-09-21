import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared SVG Definitions (gradients, glow, etc.)
const svgDefs = `
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="fullBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="50%" stop-color="#000000"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>

    <!-- Top ribbon surface gradient -->
    <linearGradient id="sfGoldTop" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF994"/>
      <stop offset="22%" stop-color="#FFDD1A"/>
      <stop offset="60%" stop-color="#F5A300"/>
      <stop offset="100%" stop-color="#FFB800"/>
    </linearGradient>

    <!-- 3D Under-fold shadow inside ribbon -->
    <linearGradient id="sfFoldShadow" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="30%" stop-color="#B45309"/>
      <stop offset="65%" stop-color="#782404"/>
      <stop offset="90%" stop-color="#451202"/>
      <stop offset="100%" stop-color="#240700"/>
    </linearGradient>

    <!-- Main sweeping S and Cart Body -->
    <linearGradient id="sfGoldBody" x1="15%" y1="10%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFF994"/>
      <stop offset="20%" stop-color="#FFD000"/>
      <stop offset="60%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Speed bars and internal slats -->
    <linearGradient id="sfGoldBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="40%" stop-color="#FFC000"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <!-- Two Wheels Gradient (Under the cart) -->
    <linearGradient id="sfGoldWheel" x1="25%" y1="15%" x2="75%" y2="85%">
      <stop offset="0%" stop-color="#FFF994"/>
      <stop offset="40%" stop-color="#FFBD00"/>
      <stop offset="85%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#9A3412"/>
    </linearGradient>

    <!-- Wordmark & Bullet Accent "Flow" Gradient -->
    <linearGradient id="sfGoldWordmark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF480"/>
      <stop offset="40%" stop-color="#FFC300"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <!-- Radiant Golden Glow Behind Emblem -->
    <radialGradient id="sfCenterGlow" cx="50%" cy="40%" r="48%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.32"/>
      <stop offset="45%" stop-color="#F59E0B" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="sfAmbientAura" cx="50%" cy="48%" r="48%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.09"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
  </defs>
`;

// S-Cart Emblem SVG Paths
const emblemPaths = `
  <!-- 3 Speed Lines on the Left -->
  <rect x="20" y="152" width="62" height="14" rx="7" fill="url(#sfGoldBar)"/>
  <rect x="20" y="179" width="45" height="14" rx="7" fill="url(#sfGoldBar)"/>
  <rect x="36" y="206" width="36" height="14" rx="7" fill="url(#sfGoldBar)"/>

  <!-- Inside Cart Slats (Horizontal bars inside basket) -->
  <rect x="110" y="179" width="68" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>
  <rect x="118" y="206" width="52" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>

  <!-- Top Ribbon Loop of the "S" -->
  <path d="M 235 26 
           L 266 26 
           L 245 56 
           C 245 56 140 54 118 56 
           C 76 60 64 92 82 125 
           L 118 142 
           C 102 120 116 87 148 83 
           C 174 79 216 79 235 79 
           Z" 
        fill="url(#sfGoldTop)"/>

  <!-- 3D Ribbon Under-fold Shadow -->
  <path d="M 82 125 
           C 92 144 118 162 154 166 
           L 128 147 
           L 82 125 
           Z" 
        fill="url(#sfFoldShadow)"/>

  <!-- Main S Body & Shopping Cart Chassis -->
  <path d="M 118 142 
           C 158 150 226 168 250 204 
           C 272 242 258 270 220 280 
           C 188 288 138 288 122 284 
           C 112 280 106 270 102 254 
           L 90 170 
           C 90 159 98 152 108 152 
           C 117 152 124 159 126 168 
           L 134 248 
           C 139 256 178 260 200 252 
           C 220 244 228 220 215 197 
           C 198 170 152 158 118 142 
           Z" 
        fill="url(#sfGoldBody)"/>

  <!-- Two Round Wheels - Under the cart with clean vertical space -->
  <circle cx="127" cy="316" r="14.5" fill="url(#sfGoldWheel)"/>
  <circle cx="179" cy="316" r="14.5" fill="url(#sfGoldWheel)"/>
`;

// 1. Standalone Emblem SVG - Scaled & centered with tight viewBox for header, tabs, and small badges
const navEmblemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 290 325" width="100%" height="100%" class="sf-brand-logo shrink-0">
  ${svgDefs}
  <!-- Ambient Glow Behind Emblem -->
  <circle cx="155" cy="170" r="150" fill="url(#sfAmbientAura)"/>
  ${emblemPaths}
</svg>`;

// 2. Full Brand Logo with Wordmark & Tagline: "SellerFlow" + "BUY • SELL • GROW" (600x600)
const logoFullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  ${svgDefs}

  <!-- Deep Black Canvas -->
  <rect width="600" height="600" fill="url(#fullBg)"/>

  <!-- Radiant Golden Glow behind emblem -->
  <circle cx="300" cy="208" r="230" fill="url(#sfCenterGlow)"/>

  <!-- Centered S-Cart Emblem -->
  <g transform="translate(136, 32) scale(1.08)">
    ${emblemPaths}
  </g>

  <!-- Wordmark: "SellerFlow" -->
  <g transform="translate(300, 442)" text-anchor="middle" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">
    <text y="0" font-size="64" font-weight="900" letter-spacing="-1.5">
      <tspan fill="#FFFFFF">Seller</tspan><tspan fill="url(#sfGoldWordmark)">Flow</tspan>
    </text>
  </g>

  <!-- Subtitle Tagline: "BUY  •  SELL  •  GROW" -->
  <g transform="translate(300, 488)" text-anchor="middle" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">
    <text y="0" font-size="16.5" font-weight="800" letter-spacing="6.5" fill="#FFFFFF">
      BUY <tspan fill="url(#sfGoldWordmark)">•</tspan> SELL <tspan fill="url(#sfGoldWordmark)">•</tspan> GROW
    </text>
  </g>
</svg>`;

// 3. Square App Icon with Full Brand Lockup (512x512)
// Contains S-Cart Emblem + "SellerFlow" + "BUY • SELL • GROW"
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  ${svgDefs}

  <rect width="512" height="512" rx="100" fill="url(#fullBg)"/>
  <circle cx="256" cy="180" r="190" fill="url(#sfCenterGlow)"/>

  <!-- Emblem Scaled & Centered -->
  <g transform="translate(116, 20) scale(0.96)">
    ${emblemPaths}
  </g>

  <!-- Wordmark: "SellerFlow" -->
  <g transform="translate(256, 382)" text-anchor="middle" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">
    <text y="0" font-size="56" font-weight="900" letter-spacing="-1.5">
      <tspan fill="#FFFFFF">Seller</tspan><tspan fill="url(#sfGoldWordmark)">Flow</tspan>
    </text>
  </g>

  <!-- Subtitle Tagline: "BUY  •  SELL  •  GROW" -->
  <g transform="translate(256, 424)" text-anchor="middle" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">
    <text y="0" font-size="14.5" font-weight="800" letter-spacing="5.5" fill="#FFFFFF">
      BUY <tspan fill="url(#sfGoldWordmark)">•</tspan> SELL <tspan fill="url(#sfGoldWordmark)">•</tspan> GROW
    </text>
  </g>
</svg>`;

async function generateAllAssets() {
  console.log('Writing updated vector SVGs...');

  const rootDir = path.join(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  const androidAssetsDir = path.join(rootDir, 'android/app/src/main/assets/public');

  // 1. Write SVGs to Root
  fs.writeFileSync(path.join(rootDir, 'nav-emblem.svg'), navEmblemSvg, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'logo-full.svg'), logoFullSvg, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'icon.svg'), iconSvg, 'utf8');

  // 2. Write SVGs to dist (if exists)
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'nav-emblem.svg'), navEmblemSvg, 'utf8');
    fs.writeFileSync(path.join(distDir, 'logo-full.svg'), logoFullSvg, 'utf8');
    fs.writeFileSync(path.join(distDir, 'icon.svg'), iconSvg, 'utf8');
  }

  // 3. Write SVGs to Android assets (if exists)
  if (fs.existsSync(androidAssetsDir)) {
    fs.writeFileSync(path.join(androidAssetsDir, 'nav-emblem.svg'), navEmblemSvg, 'utf8');
    fs.writeFileSync(path.join(androidAssetsDir, 'logo-full.svg'), logoFullSvg, 'utf8');
    fs.writeFileSync(path.join(androidAssetsDir, 'icon.svg'), iconSvg, 'utf8');
  }

  console.log('Rendering crisp high resolution PNG icons with BUY • SELL • GROW...');
  const iconBuffer = Buffer.from(iconSvg);
  const logoFullBuffer = Buffer.from(logoFullSvg);

  // PWA & Web Icons
  const pwa512 = await sharp(iconBuffer).resize(512, 512).png({ quality: 100, compressionLevel: 9 }).toBuffer();
  const pwa192 = await sharp(iconBuffer).resize(192, 192).png({ quality: 100, compressionLevel: 9 }).toBuffer();
  const appleTouch = await sharp(iconBuffer).resize(180, 180).png({ quality: 100, compressionLevel: 9 }).toBuffer();

  fs.writeFileSync(path.join(rootDir, 'pwa-512x512.png'), pwa512);
  fs.writeFileSync(path.join(rootDir, 'pwa-192x192.png'), pwa192);
  fs.writeFileSync(path.join(rootDir, 'apple-touch-icon.png'), appleTouch);

  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'pwa-512x512.png'), pwa512);
    fs.writeFileSync(path.join(distDir, 'pwa-192x192.png'), pwa192);
    fs.writeFileSync(path.join(distDir, 'apple-touch-icon.png'), appleTouch);
  }

  if (fs.existsSync(androidAssetsDir)) {
    fs.writeFileSync(path.join(androidAssetsDir, 'pwa-512x512.png'), pwa512);
    fs.writeFileSync(path.join(androidAssetsDir, 'pwa-192x192.png'), pwa192);
    fs.writeFileSync(path.join(androidAssetsDir, 'apple-touch-icon.png'), appleTouch);
  }

  // Android mipmap icons (ic_launcher, ic_launcher_round, ic_launcher_foreground)
  const androidResDir = path.join(rootDir, 'android/app/src/main/res');
  if (fs.existsSync(androidResDir)) {
    const mipmaps = [
      { dir: 'mipmap-mdpi', size: 48 },
      { dir: 'mipmap-hdpi', size: 72 },
      { dir: 'mipmap-xhdpi', size: 96 },
      { dir: 'mipmap-xxhdpi', size: 144 },
      { dir: 'mipmap-xxxhdpi', size: 192 }
    ];

    for (const m of mipmaps) {
      const targetDir = path.join(androidResDir, m.dir);
      if (fs.existsSync(targetDir)) {
        const buf = await sharp(iconBuffer).resize(m.size, m.size).png({ quality: 100 }).toBuffer();
        fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), buf);
        fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), buf);
        fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), buf);
      }
    }

    // Android Splash screens
    const splashFiles = [
      'drawable/splash.png',
      'drawable-land-mdpi/splash.png',
      'drawable-land-hdpi/splash.png',
      'drawable-land-xhdpi/splash.png',
      'drawable-land-xxhdpi/splash.png',
      'drawable-land-xxxhdpi/splash.png',
      'drawable-port-mdpi/splash.png',
      'drawable-port-hdpi/splash.png',
      'drawable-port-xhdpi/splash.png',
      'drawable-port-xxhdpi/splash.png',
      'drawable-port-xxxhdpi/splash.png'
    ];

    for (const rel of splashFiles) {
      const splashPath = path.join(androidResDir, rel);
      if (fs.existsSync(path.dirname(splashPath))) {
        const splashBuf = await sharp(logoFullBuffer).resize(800, 800, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } }).png().toBuffer();
        fs.writeFileSync(splashPath, splashBuf);
      }
    }
  }

  console.log('All SellerFlow brand assets with BUY • SELL • GROW generated successfully!');
}

generateAllAssets().catch(err => {
  console.error('Asset generation error:', err);
  process.exit(1);
});
