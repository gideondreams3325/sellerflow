import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standalone Emblem SVG - Scaled & centered with tight viewBox
// Coordinates:
// Top Ribbon: y=25 to 110
// Main S & Cart: y=95 to 275
// Cart Bottom Base: y=265
// Clear Space Gap: y=265 to 282
// Wheels (Two Round Dots): cy=298 (Distinctly UNDER the cart)
// Speed Lines: x=25 to 90
// S curve right: x=280
const emblemContent = `
  <defs>
    <!-- Top ribbon surface gradient -->
    <linearGradient id="sfGoldTop" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="25%" stop-color="#FFD61E"/>
      <stop offset="65%" stop-color="#F5A300"/>
      <stop offset="100%" stop-color="#FFB800"/>
    </linearGradient>

    <!-- 3D Under-fold shadow inside ribbon -->
    <linearGradient id="sfFoldShadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="40%" stop-color="#9A3412"/>
      <stop offset="80%" stop-color="#5B1902"/>
      <stop offset="100%" stop-color="#350E00"/>
    </linearGradient>

    <!-- Main sweeping S and Cart Body -->
    <linearGradient id="sfGoldBody" x1="15%" y1="10%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="20%" stop-color="#FFD000"/>
      <stop offset="60%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Speed bars and internal slats -->
    <linearGradient id="sfGoldBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF275"/>
      <stop offset="45%" stop-color="#FFC000"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <!-- Two Wheels Gradient (Under the cart) -->
    <linearGradient id="sfGoldWheel" x1="25%" y1="15%" x2="75%" y2="85%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="40%" stop-color="#FFBD00"/>
      <stop offset="85%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#9A3412"/>
    </linearGradient>

    <!-- Radial golden ambient aura -->
    <radialGradient id="sfAmbientAura" cx="50%" cy="48%" r="48%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.32"/>
      <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Ambient Glow Behind Emblem -->
  <circle cx="160" cy="165" r="150" fill="url(#sfAmbientAura)"/>

  <!-- 3 Speed Lines on the Left -->
  <rect x="25" y="152" width="56" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>
  <rect x="25" y="177" width="40" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>
  <rect x="40" y="202" width="32" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>

  <!-- Inside Cart Slats (Horizontal bars inside basket) -->
  <rect x="110" y="177" width="64" height="13" rx="6.5" fill="url(#sfGoldBar)"/>
  <rect x="118" y="202" width="50" height="13" rx="6.5" fill="url(#sfGoldBar)"/>

  <!-- Top Ribbon Loop of the "S" -->
  <path d="M 235 28 
           L 262 28 
           L 242 58 
           C 242 58 142 56 122 58 
           C 82 62 70 94 88 126 
           L 122 142 
           C 106 120 120 88 152 84 
           C 178 80 216 80 235 80 
           Z" 
        fill="url(#sfGoldTop)"/>

  <!-- 3D Ribbon Under-fold Shadow -->
  <path d="M 88 126 
           C 98 144 122 160 156 164 
           L 132 146 
           L 88 126 
           Z" 
        fill="url(#sfFoldShadow)"/>

  <!-- Main S Body & Shopping Cart Chassis -->
  <path d="M 122 142 
           C 160 150 226 168 248 202 
           C 268 238 256 265 220 275 
           C 190 282 140 282 124 278 
           C 114 274 108 264 104 250 
           L 92 170 
           C 92 160 99 152 109 152 
           C 118 152 125 159 127 168 
           L 135 245 
           C 140 252 178 255 198 248 
           C 216 240 224 218 212 196 
           C 196 170 152 158 122 142 
           Z" 
        fill="url(#sfGoldBody)"/>

  <!-- Two Round Wheels - Positioned distinctly UNDER the cart with clean separation -->
  <circle cx="128" cy="308" r="14" fill="url(#sfGoldWheel)"/>
  <circle cx="178" cy="308" r="14" fill="url(#sfGoldWheel)"/>
`;

// 1. Standalone nav-emblem.svg with tight square bounding box (0 0 310 335)
const navEmblemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 15 280 315" width="100%" height="100%" class="sf-brand-logo shrink-0">
${emblemContent}
</svg>`;

// 2. Full Logo with Typography (600x600)
const logoFullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="fullBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>

    <!-- Top ribbon surface gradient -->
    <linearGradient id="sfGoldTop" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="25%" stop-color="#FFD61E"/>
      <stop offset="65%" stop-color="#F5A300"/>
      <stop offset="100%" stop-color="#FFB800"/>
    </linearGradient>

    <!-- 3D Under-fold shadow inside ribbon -->
    <linearGradient id="sfFoldShadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="40%" stop-color="#9A3412"/>
      <stop offset="80%" stop-color="#5B1902"/>
      <stop offset="100%" stop-color="#350E00"/>
    </linearGradient>

    <!-- Main sweeping S and Cart Body -->
    <linearGradient id="sfGoldBody" x1="15%" y1="10%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="20%" stop-color="#FFD000"/>
      <stop offset="60%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Speed bars and internal slats -->
    <linearGradient id="sfGoldBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF275"/>
      <stop offset="45%" stop-color="#FFC000"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <!-- Two Wheels Gradient (Under the cart) -->
    <linearGradient id="sfGoldWheel" x1="25%" y1="15%" x2="75%" y2="85%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="40%" stop-color="#FFBD00"/>
      <stop offset="85%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#9A3412"/>
    </linearGradient>

    <!-- Wordmark "Flow" Gradient -->
    <linearGradient id="sfGoldWordmark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF066"/>
      <stop offset="40%" stop-color="#FFC300"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <!-- Ambient Golden Glow -->
    <radialGradient id="sfCenterGlow" cx="50%" cy="40%" r="48%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Deep Black Canvas -->
  <rect width="600" height="600" fill="url(#fullBg)"/>

  <!-- Radiant Golden Glow behind emblem -->
  <circle cx="300" cy="210" r="220" fill="url(#sfCenterGlow)"/>

  <!-- Centered S-Cart Emblem -->
  <g transform="translate(145, 30) scale(1.05)">
    <!-- 3 Speed Lines on the Left -->
    <rect x="25" y="152" width="56" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>
    <rect x="25" y="177" width="40" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>
    <rect x="40" y="202" width="32" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>

    <!-- Inside Cart Slats (Horizontal bars inside basket) -->
    <rect x="110" y="177" width="64" height="13" rx="6.5" fill="url(#sfGoldBar)"/>
    <rect x="118" y="202" width="50" height="13" rx="6.5" fill="url(#sfGoldBar)"/>

    <!-- Top Ribbon Loop of the "S" -->
    <path d="M 235 28 
             L 262 28 
             L 242 58 
             C 242 58 142 56 122 58 
             C 82 62 70 94 88 126 
             L 122 142 
             C 106 120 120 88 152 84 
             C 178 80 216 80 235 80 
             Z" 
          fill="url(#sfGoldTop)"/>

    <!-- 3D Ribbon Under-fold Shadow -->
    <path d="M 88 126 
             C 98 144 122 160 156 164 
             L 132 146 
             L 88 126 
             Z" 
          fill="url(#sfFoldShadow)"/>

    <!-- Main S Body & Shopping Cart Chassis -->
    <path d="M 122 142 
             C 160 150 226 168 248 202 
             C 268 238 256 265 220 275 
             C 190 282 140 282 124 278 
             C 114 274 108 264 104 250 
             L 92 170 
             C 92 160 99 152 109 152 
             C 118 152 125 159 127 168 
             L 135 245 
             C 140 252 178 255 198 248 
             C 216 240 224 218 212 196 
             C 196 170 152 158 122 142 
             Z" 
          fill="url(#sfGoldBody)"/>

    <!-- Two Round Wheels (under cart) -->
    <circle cx="128" cy="308" r="14" fill="url(#sfGoldWheel)"/>
    <circle cx="178" cy="308" r="14" fill="url(#sfGoldWheel)"/>
  </g>

  <!-- Typography: "SellerFlow" -->
  <g transform="translate(300, 442)" text-anchor="middle" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">
    <text y="0" font-size="64" font-weight="900" letter-spacing="-1.5">
      <tspan fill="#FFFFFF">Seller</tspan><tspan fill="url(#sfGoldWordmark)">Flow</tspan>
    </text>
  </g>

  <!-- Subtitle Tagline: "BUY  •  SELL  •  GROW" -->
  <g transform="translate(300, 486)" text-anchor="middle" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">
    <text y="0" font-size="16" font-weight="700" letter-spacing="6" fill="#FFFFFF">
      BUY <tspan fill="url(#sfGoldWordmark)">•</tspan> SELL <tspan fill="url(#sfGoldWordmark)">•</tspan> GROW
    </text>
  </g>
</svg>`;

// 3. Square App Icon (512x512)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080808"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>

    <!-- Top ribbon surface gradient -->
    <linearGradient id="sfGoldTop" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="25%" stop-color="#FFD61E"/>
      <stop offset="65%" stop-color="#F5A300"/>
      <stop offset="100%" stop-color="#FFB800"/>
    </linearGradient>

    <!-- 3D Under-fold shadow inside ribbon -->
    <linearGradient id="sfFoldShadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="40%" stop-color="#9A3412"/>
      <stop offset="80%" stop-color="#5B1902"/>
      <stop offset="100%" stop-color="#350E00"/>
    </linearGradient>

    <!-- Main sweeping S and Cart Body -->
    <linearGradient id="sfGoldBody" x1="15%" y1="10%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="20%" stop-color="#FFD000"/>
      <stop offset="60%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Speed bars and internal slats -->
    <linearGradient id="sfGoldBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF275"/>
      <stop offset="45%" stop-color="#FFC000"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <!-- Two Wheels Gradient (Under the cart) -->
    <linearGradient id="sfGoldWheel" x1="25%" y1="15%" x2="75%" y2="85%">
      <stop offset="0%" stop-color="#FFF58A"/>
      <stop offset="40%" stop-color="#FFBD00"/>
      <stop offset="85%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#9A3412"/>
    </linearGradient>

    <radialGradient id="iconAmbientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.28"/>
      <stop offset="60%" stop-color="#F59E0B" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#iconBg)"/>
  <circle cx="256" cy="256" r="230" fill="url(#iconAmbientGlow)"/>

  <!-- Centered Emblem -->
  <g transform="translate(100, 75) scale(1.1)">
    <!-- 3 Speed Lines on the Left -->
    <rect x="25" y="152" width="56" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>
    <rect x="25" y="177" width="40" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>
    <rect x="40" y="202" width="32" height="13.5" rx="6.75" fill="url(#sfGoldBar)"/>

    <!-- Inside Cart Slats (Horizontal bars inside basket) -->
    <rect x="110" y="177" width="64" height="13" rx="6.5" fill="url(#sfGoldBar)"/>
    <rect x="118" y="202" width="50" height="13" rx="6.5" fill="url(#sfGoldBar)"/>

    <!-- Top Ribbon Loop of the "S" -->
    <path d="M 235 28 
             L 262 28 
             L 242 58 
             C 242 58 142 56 122 58 
             C 82 62 70 94 88 126 
             L 122 142 
             C 106 120 120 88 152 84 
             C 178 80 216 80 235 80 
             Z" 
          fill="url(#sfGoldTop)"/>

    <!-- 3D Ribbon Under-fold Shadow -->
    <path d="M 88 126 
             C 98 144 122 160 156 164 
             L 132 146 
             L 88 126 
             Z" 
          fill="url(#sfFoldShadow)"/>

    <!-- Main S Body & Shopping Cart Chassis -->
    <path d="M 122 142 
             C 160 150 226 168 248 202 
             C 268 238 256 265 220 275 
             C 190 282 140 282 124 278 
             C 114 274 108 264 104 250 
             L 92 170 
             C 92 160 99 152 109 152 
             C 118 152 125 159 127 168 
             L 135 245 
             C 140 252 178 255 198 248 
             C 216 240 224 218 212 196 
             C 196 170 152 158 122 142 
             Z" 
        fill="url(#sfGoldBody)"/>

    <!-- Two Round Wheels (Under the cart) -->
    <circle cx="128" cy="308" r="14" fill="url(#sfGoldWheel)"/>
    <circle cx="178" cy="308" r="14" fill="url(#sfGoldWheel)"/>
  </g>
</svg>`;

async function generateAllAssets() {
  console.log('Writing updated vector SVGs...');

  fs.writeFileSync(path.join(__dirname, '../nav-emblem.svg'), navEmblemSvg, 'utf8');
  fs.writeFileSync(path.join(__dirname, '../logo-full.svg'), logoFullSvg, 'utf8');
  fs.writeFileSync(path.join(__dirname, '../icon.svg'), iconSvg, 'utf8');

  if (fs.existsSync(path.join(__dirname, '../dist'))) {
    fs.writeFileSync(path.join(__dirname, '../dist/nav-emblem.svg'), navEmblemSvg, 'utf8');
    fs.writeFileSync(path.join(__dirname, '../dist/logo-full.svg'), logoFullSvg, 'utf8');
    fs.writeFileSync(path.join(__dirname, '../dist/icon.svg'), iconSvg, 'utf8');
  }

  console.log('Rendering crisp high resolution PNG icons...');
  const iconBuffer = Buffer.from(iconSvg);

  await sharp(iconBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, '../pwa-512x512.png'));

  await sharp(iconBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, '../pwa-192x192.png'));

  await sharp(iconBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, '../apple-touch-icon.png'));

  if (fs.existsSync(path.join(__dirname, '../dist'))) {
    await sharp(iconBuffer)
      .resize(512, 512)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(__dirname, '../dist/pwa-512x512.png'));

    await sharp(iconBuffer)
      .resize(192, 192)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(__dirname, '../dist/pwa-192x192.png'));

    await sharp(iconBuffer)
      .resize(180, 180)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(__dirname, '../dist/apple-touch-icon.png'));
  }

  console.log('All SellerFlow brand logo assets updated and generated successfully!');
}

generateAllAssets().catch(err => {
  console.error('Asset generation error:', err);
  process.exit(1);
});
