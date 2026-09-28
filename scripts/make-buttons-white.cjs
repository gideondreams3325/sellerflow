const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace dark button background classes with clean white styles
  content = content.replace(/class="([^"]*)\bbg-\[#1c1c1c\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-gray-50 border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#161616\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-gray-50 border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#19191c\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-gray-50 border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#18181f\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-gray-50 border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#1f1f23\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-gray-50 border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#181820\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-gray-50 border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#1c1c24\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-gray-100 border border-gray-200 text-gray-800${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#1a1a22\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-gray-100 border border-gray-200 text-gray-800${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#1e170c\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white hover:bg-amber-50/60 border border-amber-300 text-amber-800${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#121215\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#0f0f0f\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#0c0c0e\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white border border-gray-200 text-gray-900${after}"`;
  });

  content = content.replace(/class="([^"]*)\bbg-\[#0c0c0c\]([^"]*)"/g, (match, before, after) => {
    return `class="${before}bg-white border border-gray-200 text-gray-900${after}"`;
  });

  // Replace remaining border-[#444] with border-gray-200
  content = content.replace(/border-\[#444\]/g, 'border-gray-200');
  content = content.replace(/border-\[#2c2c2c\]/g, 'border-gray-200');
  content = content.replace(/border-\[#2b2b2b\]/g, 'border-gray-200');
  content = content.replace(/border-\[#282830\]/g, 'border-gray-200');
  content = content.replace(/border-\[#26262a\]/g, 'border-gray-200');
  content = content.replace(/border-\[#26262c\]/g, 'border-gray-200');
  content = content.replace(/border-\[#272730\]/g, 'border-gray-200');
  content = content.replace(/border-\[#242424\]/g, 'border-gray-200');

  // Replace CSS styling for sf-dash-card, admin-tab, admin-subtab, sf-result-card, sf-search-tab
  content = content.replace(
    /\.sf-dash-card\{[^}]+\}/g,
    `.sf-dash-card{position:relative;overflow:hidden;border:1px solid #e5e7eb;border-radius:20px;background:#ffffff!important;color:#111111!important;padding:18px;transition:all .22s cubic-bezier(0.16,1,0.3,1);text-align:left;display:flex;flex-direction:column;justify-content:space-between;min-height:138px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}`
  );

  content = content.replace(
    /\.sf-dash-card:hover\{[^}]+\}/g,
    `.sf-dash-card:hover{border-color:rgba(245,185,66,0.65);background:#ffffff!important;transform:translateY(-2px);box-shadow:0 10px 25px -5px rgba(0,0,0,0.06)}`
  );

  content = content.replace(
    /\.admin-tab\{[^}]+\}/g,
    `.admin-tab{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:12px;font-size:12.5px;font-weight:700;white-space:nowrap;transition:all .18s cubic-bezier(0.16,1,0.3,1);cursor:pointer;background:#ffffff;color:#4b5563;border:1px solid #e5e7eb;position:relative}`
  );

  content = content.replace(
    /\.admin-tab:hover\{[^}]+\}/g,
    `.admin-tab:hover{background:#f9fafb;border-color:#d1d5db;color:#111827;transform:translateY(-1px)}`
  );

  content = content.replace(
    /\.admin-subtab\{[^}]+\}/g,
    `.admin-subtab{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;font-size:12px;font-weight:700;white-space:nowrap;transition:all .15s ease;cursor:pointer;background:#ffffff;color:#4b5563;border:1px solid #e5e7eb}`
  );

  content = content.replace(
    /\.admin-subtab:hover\{[^}]+\}/g,
    `.admin-subtab:hover{border-color:#d1d5db;color:#111827;background:#f9fafb}`
  );

  content = content.replace(
    /\.admin-subtab\.active\{[^}]+\}/g,
    `.admin-subtab.active{background:rgba(245,185,66,0.15);border-color:rgba(245,185,66,0.8);color:#b45309;box-shadow:0 2px 10px rgba(245,185,66,0.15)}`
  );

  content = content.replace(
    /\.sf-result-card\{[^}]+\}/g,
    `.sf-result-card{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:#ffffff;min-width:0;transition:all .18s ease;text-align:left;width:100%}`
  );

  content = content.replace(
    /\.sf-result-card:hover\{[^}]+\}/g,
    `.sf-result-card:hover{border-color:#f5b942;background:#f9fafb;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.06)}`
  );

  content = content.replace(
    /\.sf-search-tab:not\(\.active\)\{[^}]+\}/g,
    `.sf-search-tab:not(.active){background:#ffffff;color:#4b5563;border:1px solid #e5e7eb}`
  );

  content = content.replace(
    /\.sf-search-tab:not\(\.active\):hover\{[^}]+\}/g,
    `.sf-search-tab:not(.active):hover{border-color:#d1d5db;color:#111827;background:#f9fafb}`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated to white buttons in:', filePath);
}

updateFile(path.join(__dirname, '../index.html'));
updateFile(path.join(__dirname, '../admin/index.html'));
updateFile(path.join(__dirname, '../admin/app.js'));
