const fs = require('fs');
const path = require('path');

function replaceAllRemainingDark(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Amber/Gold tinted notices -> clean white with amber border and dark text
  content = content.replace(/bg-\[#1e1c14\]/g, 'bg-amber-50/60');
  content = content.replace(/bg-\[#252219\]/g, 'bg-amber-50');
  content = content.replace(/bg-\[#1a1812\]/g, 'bg-amber-50/60');
  content = content.replace(/bg-\[#181610\]/g, 'bg-amber-50/70');
  content = content.replace(/bg-\[#171410\]/g, 'bg-amber-50/60');
  content = content.replace(/bg-\[#20180d\]/g, 'bg-amber-50');
  content = content.replace(/bg-\[#1a1710\]/g, 'bg-amber-50/70');
  content = content.replace(/bg-\[#1b150c\]/g, 'bg-amber-50/80');
  content = content.replace(/bg-\[#2d2212\]/g, 'bg-amber-100');
  content = content.replace(/border-\[#3e2e15\]/g, 'border-amber-200');
  content = content.replace(/border-\[#523d1d\]/g, 'border-amber-300');
  content = content.replace(/border-\[#483517\]/g, 'border-amber-300');

  // Emerald/Green tinted notices -> clean white with emerald border and dark text
  content = content.replace(/bg-\[#131715\]/g, 'bg-emerald-50/70');
  content = content.replace(/bg-\[#111915\]/g, 'bg-emerald-50/70');
  content = content.replace(/bg-\[#10251a\]/g, 'bg-emerald-50');
  content = content.replace(/bg-\[#0f1110\]/g, 'bg-emerald-50/60');
  content = content.replace(/bg-\[#121f17\]/g, 'bg-emerald-50');
  content = content.replace(/bg-\[#182a1f\]/g, 'bg-emerald-100');

  // Red/Danger tinted notices -> clean white with rose border
  content = content.replace(/bg-\[#191111\]/g, 'bg-rose-50');
  content = content.replace(/bg-\[#1e1010\]/g, 'bg-rose-50');
  content = content.replace(/bg-\[#1a1212\]/g, 'bg-rose-50');

  // Sky/Info tinted notices -> clean white with sky border
  content = content.replace(/bg-\[#141318\]/g, 'bg-sky-50');
  content = content.replace(/bg-\[#2b2b2b\]/g, 'bg-gray-300');

  // Fix borders
  content = content.replace(/border-emerald-900\/50/g, 'border-emerald-200');
  content = content.replace(/border-emerald-950\/80/g, 'border-emerald-200');
  content = content.replace(/border-emerald-800\/60/g, 'border-emerald-200');
  content = content.replace(/border-green-800/g, 'border-emerald-200');
  content = content.replace(/border-amber-900\/40/g, 'border-amber-200');
  content = content.replace(/border-sky-900\/40/g, 'border-sky-200');
  content = content.replace(/border-red-900\/40/g, 'border-rose-200');
  content = content.replace(/border-\[#3d3d3d\]/g, 'border-gray-300');
  content = content.replace(/border-\[#383838\]/g, 'border-gray-300');
  content = content.replace(/border-\[#3e3e3e\]/g, 'border-gray-300');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated remaining dark styles in:', filePath);
}

replaceAllRemainingDark(path.join(__dirname, '../index.html'));
replaceAllRemainingDark(path.join(__dirname, '../admin/index.html'));
replaceAllRemainingDark(path.join(__dirname, '../admin/app.js'));
