import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

// 1. Precise vector definition of the SellerFlow golden S-cart emblem
function getEmblemSvg({ width = 512, height = 512, showBg = true, rx = 112 } = {}) {
  const bgMarkup = showBg ? `
    <rect width="${width}" height="${height}" rx="${rx}" fill="url(#sfBg)"/>
    <rect width="${width - 4}" height="${height - 4}" x="2" y="2" rx="${rx - 2}" fill="none" stroke="#222" stroke-width="2"/>
  ` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${width}" height="${height}">
  <defs>
    <!-- Rich deep black background -->
    <linearGradient id="sfBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d0d0d"/>
      <stop offset="100%" stop-color="#020202"/>
    </linearGradient>

    <!-- Metallic Gold: Top Ribbon Horizontal Face -->
    <linearGradient id="goldTopFace" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="35%" stop-color="#ffd000"/>
      <stop offset="75%" stop-color="#f5a623"/>
      <stop offset="100%" stop-color="#ffb81c"/>
    </linearGradient>

    <!-- Metallic Gold: Top Fold 3D Shadow -->
    <linearGradient id="goldFoldUnder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5a623"/>
      <stop offset="40%" stop-color="#c97200"/>
      <stop offset="85%" stop-color="#804100"/>
      <stop offset="100%" stop-color="#612f00"/>
    </linearGradient>

    <!-- Metallic Gold: Lower Ribbon Fold Highlight -->
    <linearGradient id="goldFoldFront" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffec82"/>
      <stop offset="45%" stop-color="#ffbe1a"/>
      <stop offset="100%" stop-color="#e28c00"/>
    </linearGradient>

    <!-- Metallic Gold: Main S-Swoop and Cart Body -->
    <linearGradient id="goldSwoop" x1="20%" y1="10%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="30%" stop-color="#ffb81c"/>
      <stop offset="70%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <!-- Metallic Gold: Speed Lines and Cart Grille -->
    <linearGradient id="goldBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="50%" stop-color="#ffb81c"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <!-- Metallic Gold: Cart Wheels with 3D spherical shading -->
    <linearGradient id="goldWheel" x1="30%" y1="20%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#ffea79"/>
      <stop offset="45%" stop-color="#ffb81c"/>
      <stop offset="85%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <!-- Soft ambient glow behind emblem -->
    <radialGradient id="goldGlow" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.12"/>
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
  </defs>

  ${bgMarkup}

  <!-- Ambient Golden Glow -->
  <circle cx="260" cy="240" r="170" fill="url(#goldGlow)"/>

  <!-- Logo Mark Graphic Group -->
  <g id="sellerFlowEmblem">
    <!-- 3 Speed Lines on the left -->
    <!-- Top Speed Line Lip (capsule) -->
    <rect x="154" y="184" width="60" height="15" rx="7.5" fill="url(#goldBar)"/>
    <!-- Middle Speed Line -->
    <rect x="154" y="214" width="46" height="15" rx="7.5" fill="url(#goldBar)"/>
    <!-- Bottom Speed Line -->
    <rect x="172" y="244" width="36" height="15" rx="7.5" fill="url(#goldBar)"/>

    <!-- Inside Shopping Cart: 2 Horizontal Grille Bars -->
    <rect x="236" y="214" width="76" height="14" rx="7" fill="url(#goldBar)"/>
    <rect x="244" y="242" width="60" height="14" rx="7" fill="url(#goldBar)"/>

    <!-- 2 Shopping Cart Wheels -->
    <circle cx="247" cy="307" r="14.5" fill="url(#goldWheel)"/>
    <circle cx="295" cy="307" r="14.5" fill="url(#goldWheel)"/>

    <!-- Top Ribbon of the S: Upper horizontal arm and angled cut -->
    <!-- Path goes from angled cut at top right (344, 95) across to top left bend -->
    <path d="M 344 95 L 366 68 C 366 68 250 66 220 68 C 178 71 164 105 182 142 L 216 160 C 202 136 218 102 248 98 C 274 95 320 95 344 95 Z" 
          fill="url(#goldTopFace)"/>

    <!-- 3D Ribbon Fold (Under-twist shadow creating the folded ribbon illusion) -->
    <path d="M 182 142 C 192 162 216 178 252 182 L 224 164 L 182 142 Z" 
          fill="url(#goldFoldUnder)"/>

    <!-- 3D Ribbon Fold Front Highlight Facet -->
    <path d="M 182 142 C 168 116 182 92 218 84 L 216 106 C 196 112 188 126 196 142 Z" 
          fill="url(#goldFoldFront)"/>

    <!-- The Large S-Swoop and Shopping Cart Outer Frame -->
    <!-- This continuous path sweeps from the top fold, diagonally down-right, arches into the cart base,
         and loops up into the front cart rim and speed line anchor -->
    <path d="M 216 160 
             C 256 168 322 188 344 226 
             C 368 268 354 312 318 330 
             C 288 344 238 342 224 336 
             C 214 331 208 320 208 308 
             L 204 200 
             C 204 191 211 184 220 184 
             C 229 184 236 191 236 200 
             L 238 304 
             C 246 312 284 316 306 306 
             C 326 296 334 270 320 242 
             C 304 212 254 198 216 182 
             Z" 
          fill="url(#goldSwoop)"/>
  </g>
</svg>`;
}

// 2. Full Brand Logo: Emblem + "SellerFlow" + "BUY • SELL • GROW" (matching the user's uploaded image)
function getFullLogoSvg({ width = 600, height = 600 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="${width}" height="${height}">
  <defs>
    <linearGradient id="fullBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>

    <linearGradient id="goldTopFace" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="35%" stop-color="#ffd000"/>
      <stop offset="75%" stop-color="#f5a623"/>
      <stop offset="100%" stop-color="#ffb81c"/>
    </linearGradient>

    <linearGradient id="goldFoldUnder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5a623"/>
      <stop offset="40%" stop-color="#c97200"/>
      <stop offset="85%" stop-color="#804100"/>
      <stop offset="100%" stop-color="#612f00"/>
    </linearGradient>

    <linearGradient id="goldFoldFront" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffec82"/>
      <stop offset="45%" stop-color="#ffbe1a"/>
      <stop offset="100%" stop-color="#e28c00"/>
    </linearGradient>

    <linearGradient id="goldSwoop" x1="20%" y1="10%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="30%" stop-color="#ffb81c"/>
      <stop offset="70%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <linearGradient id="goldBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="50%" stop-color="#ffb81c"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <linearGradient id="goldWheel" x1="30%" y1="20%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#ffea79"/>
      <stop offset="45%" stop-color="#ffb81c"/>
      <stop offset="85%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <linearGradient id="goldWordmark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffea79"/>
      <stop offset="50%" stop-color="#ffb81c"/>
      <stop offset="100%" stop-color="#e58e00"/>
    </linearGradient>

    <radialGradient id="goldGlow" cx="50%" cy="40%" r="45%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.14"/>
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Black Background -->
  <rect width="600" height="600" fill="url(#fullBg)"/>

  <!-- Ambient Glow -->
  <circle cx="300" cy="220" r="180" fill="url(#goldGlow)"/>

  <!-- Centered Emblem (Scaled) -->
  <g transform="translate(44, 10)">
    <!-- 3 Speed Lines -->
    <rect x="154" y="184" width="60" height="15" rx="7.5" fill="url(#goldBar)"/>
    <rect x="154" y="214" width="46" height="15" rx="7.5" fill="url(#goldBar)"/>
    <rect x="172" y="244" width="36" height="15" rx="7.5" fill="url(#goldBar)"/>

    <!-- Inside Shopping Cart Grille Bars -->
    <rect x="236" y="214" width="76" height="14" rx="7" fill="url(#goldBar)"/>
    <rect x="244" y="242" width="60" height="14" rx="7" fill="url(#goldBar)"/>

    <!-- Cart Wheels -->
    <circle cx="247" cy="307" r="14.5" fill="url(#goldWheel)"/>
    <circle cx="295" cy="307" r="14.5" fill="url(#goldWheel)"/>

    <!-- Top Ribbon -->
    <path d="M 344 95 L 366 68 C 366 68 250 66 220 68 C 178 71 164 105 182 142 L 216 160 C 202 136 218 102 248 98 C 274 95 320 95 344 95 Z" 
          fill="url(#goldTopFace)"/>

    <!-- 3D Fold Shadow -->
    <path d="M 182 142 C 192 162 216 178 252 182 L 224 164 L 182 142 Z" 
          fill="url(#goldFoldUnder)"/>

    <!-- Fold Front Facet -->
    <path d="M 182 142 C 168 116 182 92 218 84 L 216 106 C 196 112 188 126 196 142 Z" 
          fill="url(#goldFoldFront)"/>

    <!-- S Swoop & Cart Body -->
    <path d="M 216 160 
             C 256 168 322 188 344 226 
             C 368 268 354 312 318 330 
             C 288 344 238 342 224 336 
             C 214 331 208 320 208 308 
             L 204 200 
             C 204 191 211 184 220 184 
             C 229 184 236 191 236 200 
             L 238 304 
             C 246 312 284 316 306 306 
             C 326 296 334 270 320 242 
             C 304 212 254 198 216 182 
             Z" 
          fill="url(#goldSwoop)"/>
  </g>

  <!-- Typography: "SellerFlow" -->
  <g transform="translate(300, 435)" text-anchor="middle" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">
    <text y="0" font-size="64" font-weight="900" letter-spacing="-1.5">
      <tspan fill="#ffffff">Seller</tspan><tspan fill="url(#goldWordmark)">Flow</tspan>
    </text>
  </g>

  <!-- Subtitle: "BUY  •  SELL  •  GROW" -->
  <g transform="translate(300, 480)" text-anchor="middle" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">
    <text y="0" font-size="16" font-weight="700" letter-spacing="6" fill="#ffffff">
      BUY <tspan fill="url(#goldWordmark)">•</tspan> SELL <tspan fill="url(#goldWordmark)">•</tspan> GROW
    </text>
  </g>
</svg>`;
}

// 3. Compact Logo for Menu Bar (Transparent background, vector mark)
function getNavEmblemSvg({ width = 36, height = 36 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="150 60 225 260" width="${width}" height="${height}" class="sf-brand-logo shrink-0">
  <defs>
    <linearGradient id="navGoldTop" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="35%" stop-color="#ffd000"/>
      <stop offset="75%" stop-color="#f5a623"/>
      <stop offset="100%" stop-color="#ffb81c"/>
    </linearGradient>

    <linearGradient id="navGoldFoldUnder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5a623"/>
      <stop offset="40%" stop-color="#c97200"/>
      <stop offset="100%" stop-color="#733800"/>
    </linearGradient>

    <linearGradient id="navGoldSwoop" x1="20%" y1="10%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="30%" stop-color="#ffb81c"/>
      <stop offset="70%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <linearGradient id="navGoldBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffe46b"/>
      <stop offset="50%" stop-color="#ffb81c"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>

  <!-- 3 Speed Lines -->
  <rect x="154" y="184" width="60" height="15" rx="7.5" fill="url(#navGoldBar)"/>
  <rect x="154" y="214" width="46" height="15" rx="7.5" fill="url(#navGoldBar)"/>
  <rect x="172" y="244" width="36" height="15" rx="7.5" fill="url(#navGoldBar)"/>

  <!-- Inside Cart Grille Bars -->
  <rect x="236" y="214" width="76" height="14" rx="7" fill="url(#navGoldBar)"/>
  <rect x="244" y="242" width="60" height="14" rx="7" fill="url(#navGoldBar)"/>

  <!-- Cart Wheels -->
  <circle cx="247" cy="307" r="14.5" fill="url(#navGoldBar)"/>
  <circle cx="295" cy="307" r="14.5" fill="url(#navGoldBar)"/>

  <!-- Top Ribbon -->
  <path d="M 344 95 L 366 68 C 366 68 250 66 220 68 C 178 71 164 105 182 142 L 216 160 C 202 136 218 102 248 98 C 274 95 320 95 344 95 Z" 
        fill="url(#navGoldTop)"/>

  <!-- 3D Fold Shadow -->
  <path d="M 182 142 C 192 162 216 178 252 182 L 224 164 L 182 142 Z" 
        fill="url(#navGoldFoldUnder)"/>

  <!-- S Swoop & Cart Body -->
  <path d="M 216 160 
           C 256 168 322 188 344 226 
           C 368 268 354 312 318 330 
           C 288 344 238 342 224 336 
           C 214 331 208 320 208 308 
           L 204 200 
           C 204 191 211 184 220 184 
           C 229 184 236 191 236 200 
           L 238 304 
           C 246 312 284 316 306 306 
           C 326 296 334 270 320 242 
           C 304 212 254 198 216 182 
           Z" 
        fill="url(#navGoldSwoop)"/>
</svg>`;
}

async function run() {
  console.log('Generating SellerFlow official brand assets...');

  const iconSvgContent = getEmblemSvg({ width: 512, height: 512, showBg: true, rx: 112 });
  const logoFullSvgContent = getFullLogoSvg({ width: 600, height: 600 });
  const navEmblemSvgContent = getNavEmblemSvg({ width: 36, height: 36 });

  // Write SVGs
  fs.writeFileSync('icon.svg', iconSvgContent, 'utf8');
  fs.writeFileSync('logo-full.svg', logoFullSvgContent, 'utf8');
  fs.writeFileSync('nav-emblem.svg', navEmblemSvgContent, 'utf8');

  // Render PNGs using Resvg
  const resvg512 = new Resvg(iconSvgContent, { fitTo: { mode: 'width', value: 512 } });
  const png512 = resvg512.render().asPng();
  fs.writeFileSync('pwa-512x512.png', png512);

  const resvg192 = new Resvg(iconSvgContent, { fitTo: { mode: 'width', value: 192 } });
  const png192 = resvg192.render().asPng();
  fs.writeFileSync('pwa-192x192.png', png192);

  const resvg180 = new Resvg(iconSvgContent, { fitTo: { mode: 'width', value: 180 } });
  const png180 = resvg180.render().asPng();
  fs.writeFileSync('apple-touch-icon.png', png180);

  // Sync to dist if exists
  if (fs.existsSync('dist')) {
    fs.writeFileSync('dist/icon.svg', iconSvgContent, 'utf8');
    fs.writeFileSync('dist/logo-full.svg', logoFullSvgContent, 'utf8');
    fs.writeFileSync('dist/nav-emblem.svg', navEmblemSvgContent, 'utf8');
    fs.writeFileSync('dist/pwa-512x512.png', png512);
    fs.writeFileSync('dist/pwa-192x192.png', png192);
    fs.writeFileSync('dist/apple-touch-icon.png', png180);
  }

  // Sync to Android assets
  const androidPublic = path.join('android', 'app', 'src', 'main', 'assets', 'public');
  if (fs.existsSync(androidPublic)) {
    fs.writeFileSync(path.join(androidPublic, 'icon.svg'), iconSvgContent, 'utf8');
    fs.writeFileSync(path.join(androidPublic, 'logo-full.svg'), logoFullSvgContent, 'utf8');
    fs.writeFileSync(path.join(androidPublic, 'nav-emblem.svg'), navEmblemSvgContent, 'utf8');
    fs.writeFileSync(path.join(androidPublic, 'pwa-512x512.png'), png512);
    fs.writeFileSync(path.join(androidPublic, 'pwa-192x192.png'), png192);
    fs.writeFileSync(path.join(androidPublic, 'apple-touch-icon.png'), png180);
  }

  console.log('✓ All official SellerFlow logo icons & high-res PNGs generated and synchronized!');
}

run().catch(err => {
  console.error('Error generating brand assets:', err);
  process.exit(1);
});
