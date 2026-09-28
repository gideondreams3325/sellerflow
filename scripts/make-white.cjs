const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace dark background classes with white/light equivalents
  content = content.replace(/bg-black(\/\d+)?/g, 'bg-white');
  content = content.replace(/bg-zinc-950/g, 'bg-white');
  content = content.replace(/bg-zinc-900/g, 'bg-white');
  content = content.replace(/bg-zinc-800/g, 'bg-gray-100');
  content = content.replace(/bg-neutral-900/g, 'bg-white');
  content = content.replace(/bg-gray-900/g, 'bg-white');
  content = content.replace(/bg-\[#050505\]/g, 'bg-white');
  content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-white');
  content = content.replace(/bg-\[#0d0d0d\]/g, 'bg-white');
  content = content.replace(/bg-\[#101010\]/g, 'bg-gray-50');
  content = content.replace(/bg-\[#111111\]/g, 'bg-white');
  content = content.replace(/bg-\[#111\]/g, 'bg-white');
  content = content.replace(/bg-\[#141414\]/g, 'bg-white');
  content = content.replace(/bg-\[#141416\]/g, 'bg-white');
  content = content.replace(/bg-\[#151515\]/g, 'bg-gray-50');
  content = content.replace(/bg-\[#171717\]/g, 'bg-gray-50');
  content = content.replace(/bg-\[#181818\]/g, 'bg-gray-50');
  content = content.replace(/bg-\[#18181c\]/g, 'bg-white');
  content = content.replace(/bg-\[#191919\]/g, 'bg-gray-50');
  content = content.replace(/bg-\[#1a1a1a\]/g, 'bg-gray-50');
  content = content.replace(/bg-\[#1e1e1e\]/g, 'bg-gray-100');
  content = content.replace(/bg-\[#202020\]/g, 'bg-gray-100');
  content = content.replace(/bg-\[#222\]/g, 'bg-gray-100');
  content = content.replace(/bg-\[#242424\]/g, 'bg-gray-100');
  content = content.replace(/bg-\[#262626\]/g, 'bg-gray-200');

  // Replace dark text classes with dark gray/black equivalents
  content = content.replace(/text-white/g, 'text-gray-900');
  content = content.replace(/text-zinc-100/g, 'text-gray-900');
  content = content.replace(/text-zinc-200/g, 'text-gray-800');
  content = content.replace(/text-zinc-300/g, 'text-gray-700');
  content = content.replace(/text-zinc-400/g, 'text-gray-600');
  content = content.replace(/text-zinc-500/g, 'text-gray-500');

  // Replace dark border classes with light border equivalents
  content = content.replace(/border-zinc-800/g, 'border-gray-200');
  content = content.replace(/border-zinc-700/g, 'border-gray-200');
  content = content.replace(/border-\[#262626\]/g, 'border-gray-200');
  content = content.replace(/border-\[#292929\]/g, 'border-gray-200');
  content = content.replace(/border-\[#303030\]/g, 'border-gray-200');
  content = content.replace(/border-\[#333\]/g, 'border-gray-200');
  content = content.replace(/border-white\/10/g, 'border-gray-200');
  content = content.replace(/border-white\/5/g, 'border-gray-200');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed:', filePath);
}

processFile(path.join(__dirname, '../index.html'));
processFile(path.join(__dirname, '../admin/index.html'));
console.log('White theme transformation completed.');
