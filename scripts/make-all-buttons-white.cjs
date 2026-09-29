const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Walkthrough highlight cards (Screenshot 1)
  content = content.replace(
    /bg-\[#14141c\]\s+border\s+border-\[#262636\]/g,
    'bg-white border border-gray-200 shadow-sm hover:border-gold'
  );

  // 2. Store Theme Presets & Customizer (Screenshot 2)
  content = content.replace(
    /sf-theme-preset-card\s+p-2\.5\s+rounded-xl\s+bg-\[#16161b\]\s+border\s+\$\{isActive\s*\?\s*'is-active border-gold bg-\[#1d1b15\]'\s*:\s*'border-\[#292933\]'\}/g,
    "sf-theme-preset-card p-2.5 rounded-xl bg-white border ${isActive ? 'is-active border-gold bg-amber-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'} shadow-sm"
  );
  content = content.replace(
    /sf-theme-preset-card\s+p-2\.5\s+rounded-xl\s+bg-\[[^\]]+\]\s+border\s+\$\{[^}]+\}/g,
    "sf-theme-preset-card p-2.5 rounded-xl bg-white border ${isActive ? 'is-active border-gold bg-amber-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'} shadow-sm"
  );

  // 3. Customizer sections and inputs
  content = content.replace(/bg-\[#121217\]\s+border\s+border-\[#252530\]/g, 'bg-white border border-gray-200 shadow-sm');
  content = content.replace(/bg-\[#181822\]\s+border\s+border-\[#353545\]/g, 'bg-white border border-gray-200');
  content = content.replace(/bg-\[#171720\]\s+border\s+border-\[#2c2c3c\]/g, 'bg-gray-50 border border-gray-200');
  content = content.replace(/bg-\[#111116\]\s+border\s+border-\[#3a3a4c\]/g, 'bg-white border border-gray-200');
  content = content.replace(/bg-\[#1d1d26\]\s+border\s+border-\[#3a3a4c\]/g, 'bg-amber-50 border border-amber-200 text-amber-900');
  content = content.replace(/border-\[#2b2b35\]/g, 'border-gray-200');

  // 4. General dark backgrounds in buttons, pills, cards, badges
  const darkBgReplacements = [
    // Background colors
    { from: /bg-\[#050505\]/g, to: 'bg-white' },
    { from: /bg-\[#080808\]/g, to: 'bg-white' },
    { from: /bg-\[#0a0a0a\]/g, to: 'bg-white' },
    { from: /bg-\[#0c0c0c\]/g, to: 'bg-white' },
    { from: /bg-\[#0c0c0e\]/g, to: 'bg-white' },
    { from: /bg-\[#0c0c10\]/g, to: 'bg-white' },
    { from: /bg-\[#0d0d0d\]/g, to: 'bg-white' },
    { from: /bg-\[#0d0d10\]/g, to: 'bg-white' },
    { from: /bg-\[#0d0d11\]/g, to: 'bg-white' },
    { from: /bg-\[#0d0d12\]/g, to: 'bg-white' },
    { from: /bg-\[#0e0e0e\]/g, to: 'bg-white' },
    { from: /bg-\[#0e0e12\]/g, to: 'bg-white' },
    { from: /bg-\[#0f0f0f\]/g, to: 'bg-white' },
    { from: /bg-\[#0f0f12\]/g, to: 'bg-white' },
    { from: /bg-\[#101012\]/g, to: 'bg-white' },
    { from: /bg-\[#101014\]/g, to: 'bg-white' },
    { from: /bg-\[#111113\]/g, to: 'bg-white' },
    { from: /bg-\[#111114\]/g, to: 'bg-white' },
    { from: /bg-\[#111116\]/g, to: 'bg-white' },
    { from: /bg-\[#121212\]/g, to: 'bg-white' },
    { from: /bg-\[#121214\]/g, to: 'bg-white' },
    { from: /bg-\[#121215\]/g, to: 'bg-white' },
    { from: /bg-\[#121216\]/g, to: 'bg-white' },
    { from: /bg-\[#121217\]/g, to: 'bg-white' },
    { from: /bg-\[#131313\]/g, to: 'bg-white' },
    { from: /bg-\[#131316\]/g, to: 'bg-white' },
    { from: /bg-\[#141414\]/g, to: 'bg-white' },
    { from: /bg-\[#141416\]/g, to: 'bg-white' },
    { from: /bg-\[#141417\]/g, to: 'bg-white' },
    { from: /bg-\[#141418\]/g, to: 'bg-white' },
    { from: /bg-\[#14141a\]/g, to: 'bg-white' },
    { from: /bg-\[#14141c\]/g, to: 'bg-white' },
    { from: /bg-\[#14141e\]/g, to: 'bg-white' },
    { from: /bg-\[#151515\]/g, to: 'bg-white' },
    { from: /bg-\[#151518\]/g, to: 'bg-white' },
    { from: /bg-\[#15151c\]/g, to: 'bg-white' },
    { from: /bg-\[#15151e\]/g, to: 'bg-white' },
    { from: /bg-\[#161616\]/g, to: 'bg-white' },
    { from: /bg-\[#161618\]/g, to: 'bg-white' },
    { from: /bg-\[#161619\]/g, to: 'bg-white' },
    { from: /bg-\[#16161a\]/g, to: 'bg-white' },
    { from: /bg-\[#16161b\]/g, to: 'bg-white' },
    { from: /bg-\[#16161d\]/g, to: 'bg-white' },
    { from: /bg-\[#171719\]/g, to: 'bg-white' },
    { from: /bg-\[#17171e\]/g, to: 'bg-white' },
    { from: /bg-\[#171720\]/g, to: 'bg-white' },
    { from: /bg-\[#181818\]/g, to: 'bg-white' },
    { from: /bg-\[#18181b\]/g, to: 'bg-white' },
    { from: /bg-\[#18181c\]/g, to: 'bg-white' },
    { from: /bg-\[#18181e\]/g, to: 'bg-white' },
    { from: /bg-\[#18181f\]/g, to: 'bg-white' },
    { from: /bg-\[#181820\]/g, to: 'bg-white' },
    { from: /bg-\[#181822\]/g, to: 'bg-white' },
    { from: /bg-\[#191919\]/g, to: 'bg-white' },
    { from: /bg-\[#19191c\]/g, to: 'bg-white' },
    { from: /bg-\[#19191d\]/g, to: 'bg-white' },
    { from: /bg-\[#191920\]/g, to: 'bg-white' },
    { from: /bg-\[#191922\]/g, to: 'bg-white' },
    { from: /bg-\[#1a1a1a\]/g, to: 'bg-white' },
    { from: /bg-\[#1a1a1d\]/g, to: 'bg-white' },
    { from: /bg-\[#1a1a1e\]/g, to: 'bg-white' },
    { from: /bg-\[#1a1a20\]/g, to: 'bg-white' },
    { from: /bg-\[#1a1a22\]/g, to: 'bg-white' },
    { from: /bg-\[#1a1a24\]/g, to: 'bg-white' },
    { from: /bg-\[#1c1c1c\]/g, to: 'bg-white' },
    { from: /bg-\[#1c1c20\]/g, to: 'bg-white' },
    { from: /bg-\[#1c1c22\]/g, to: 'bg-white' },
    { from: /bg-\[#1c1c24\]/g, to: 'bg-white' },
    { from: /bg-\[#1d1b15\]/g, to: 'bg-white' },
    { from: /bg-\[#1d1d24\]/g, to: 'bg-white' },
    { from: /bg-\[#1d1d26\]/g, to: 'bg-white' },
    { from: /bg-\[#1e1e22\]/g, to: 'bg-white' },
    { from: /bg-\[#1e1e24\]/g, to: 'bg-white' },
    { from: /bg-\[#1e1e28\]/g, to: 'bg-white' },
    { from: /bg-\[#1f1f1f\]/g, to: 'bg-white' },
    { from: /bg-\[#1f1f23\]/g, to: 'bg-white' },
    { from: /bg-\[#202020\]/g, to: 'bg-white' },
    { from: /bg-\[#202024\]/g, to: 'bg-white' },
    { from: /bg-\[#202026\]/g, to: 'bg-white' },
    { from: /bg-\[#202028\]/g, to: 'bg-white' },
    { from: /bg-\[#20202a\]/g, to: 'bg-white' },
    { from: /bg-\[#20202c\]/g, to: 'bg-white' },
    { from: /bg-\[#222228\]/g, to: 'bg-white' },
    { from: /bg-\[#22222a\]/g, to: 'bg-white' },
    { from: /bg-\[#22222d\]/g, to: 'bg-white' },
    { from: /bg-\[#231b0f\]/g, to: 'bg-white' },
    { from: /bg-\[#24242c\]/g, to: 'bg-white' },
    { from: /bg-\[#242430\]/g, to: 'bg-white' },
    { from: /bg-\[#252525\]/g, to: 'bg-white' },
    { from: /bg-\[#25252d\]/g, to: 'bg-white' },
    { from: /bg-\[#25252f\]/g, to: 'bg-white' },
    { from: /bg-\[#26262e\]/g, to: 'bg-white' },
    { from: /bg-\[#262634\]/g, to: 'bg-white' },
    { from: /bg-\[#27272e\]/g, to: 'bg-white' },
    { from: /bg-\[#28282e\]/g, to: 'bg-white' },
    { from: /bg-\[#282832\]/g, to: 'bg-white' },
    { from: /bg-\[#282834\]/g, to: 'bg-white' },
    { from: /bg-\[#2c2c2c\]/g, to: 'bg-white' },
    { from: /bg-\[#2e2e2e\]/g, to: 'bg-white' }
  ];

  for (const r of darkBgReplacements) {
    content = content.replace(r.from, r.to);
  }

  // 5. CSS variables in SF_STORE_THEME_PRESETS
  content = content.replace(/surfaceColor:\s*'#[0-2][0-9a-fA-F]{5}'/g, "surfaceColor: '#ffffff'");
  content = content.replace(/cardBgColor:\s*'#[0-2][0-9a-fA-F]{5}'/g, "cardBgColor: '#ffffff'");

  // 6. Fix CSS in <style>
  content = content.replace(
    /--sf-theme-surface:\s*#[0-2][0-9a-fA-F]{5}/g,
    '--sf-theme-surface: #ffffff'
  );
  content = content.replace(
    /--sf-theme-card-bg:\s*#[0-2][0-9a-fA-F]{5}/g,
    '--sf-theme-card-bg: #ffffff'
  );

  content = content.replace(
    /\.sf-theme-preset-card\{[^}]+\}/g,
    `.sf-theme-preset-card{transition:all .18s ease;cursor:pointer;background:#ffffff!important;border:1px solid #e5e7eb!important;color:#111111!important;box-shadow:0 1px 3px rgba(0,0,0,0.04)}`
  );
  content = content.replace(
    /\.sf-theme-preset-card:hover\{[^}]+\}/g,
    `.sf-theme-preset-card:hover{transform:translateY(-2px);border-color:#f5b942!important;background:#f9fafb!important;box-shadow:0 6px 16px rgba(0,0,0,0.06)}`
  );
  content = content.replace(
    /\.sf-theme-preset-card\.is-active\{[^}]+\}/g,
    `.sf-theme-preset-card.is-active{border-color:#f5b942!important;background:#fef3c7!important;color:#b45309!important;box-shadow:0 0 0 2px rgba(245,185,66,0.4),0 4px 14px rgba(245,185,66,0.15)!important}`
  );

  content = content.replace(
    /\.terms-box\{[^}]+\}/g,
    `.terms-box{max-height:340px;overflow:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;line-height:1.7;color:#111111}`
  );

  content = content.replace(
    /\.page-selector-item\{[^}]+\}/g,
    `.page-selector-item{min-height:84px;border:1px solid #e5e7eb;border-radius:18px;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:10px;color:#111111;min-width:0;transition:all .16s ease}`
  );

  content = content.replace(
    /\.page-selector-item:hover\{[^}]+\}/g,
    `.page-selector-item:hover{border-color:#f5b942;background:#f9fafb}`
  );

  content = content.replace(
    /\.page-selector-card\{[^}]+\}/g,
    `.page-selector-card{width:min(680px,100%);max-height:88vh;overflow:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;padding:16px;box-shadow:0 25px 80px rgba(0,0,0,0.12);color:#111111}`
  );

  content = content.replace(
    /\.back-page-btn\{[^}]+\}/g,
    `.back-page-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e7eb;background:#ffffff;border-radius:12px;padding:8px 12px;color:#111111;margin-bottom:12px;transition:all .15s ease}`
  );

  content = content.replace(
    /\.sound-chip\{[^}]+\}/g,
    `.sound-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #e5e7eb;background:#ffffff;border-radius:999px;padding:7px 10px;font-size:12px;color:#111111}`
  );

  content = content.replace(
    /\.policy-hero\{[^}]+\}/g,
    `.policy-hero{background:linear-gradient(145deg,#ffffff,#f9fafb);border:1px solid #e5e7eb;border-radius:24px;min-width:0;color:#111111}`
  );

  content = content.replace(
    /\.comment-sheet\{[^}]+\}/g,
    `.comment-sheet{position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:min(760px,100%);max-height:72vh;z-index:180;background:rgba(255,255,255,0.98);backdrop-filter:blur(18px);border:1px solid #e5e7eb;border-bottom:0;border-radius:24px 24px 0 0;box-shadow:0 -20px 70px rgba(0,0,0,0.15);padding:16px;padding-bottom:max(18px,env(safe-area-inset-bottom));overflow:auto;color:#111111}`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed:', filePath);
}

processFile(path.join(__dirname, '../index.html'));
processFile(path.join(__dirname, '../admin/index.html'));
processFile(path.join(__dirname, '../admin/app.js'));
