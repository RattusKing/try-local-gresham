const fs = require('fs');
const path = require('path');

// Simple SVG icon generator for Try Local Gresham
// Creates a branded icon with "TL" text on orange background

function generateSVGIcon(size) {
  const fontSize = Math.floor(size * 0.45);
  const strokeWidth = Math.floor(size * 0.02);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#ff7a00" rx="${size * 0.15}"/>

  <!-- Optional gradient overlay for depth -->
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff7a00;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff5500;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad${size})" rx="${size * 0.15}"/>

  <!-- "TL" Text -->
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central"
  >TL</text>

  <!-- Subtle border for polish -->
  <rect
    width="${size - strokeWidth}"
    height="${size - strokeWidth}"
    x="${strokeWidth / 2}"
    y="${strokeWidth / 2}"
    fill="none"
    stroke="rgba(255,255,255,0.2)"
    stroke-width="${strokeWidth}"
    rx="${size * 0.15}"
  />
</svg>`;
}

// Generate icons
const publicDir = path.join(__dirname, '..', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG files (we'll use these as base)
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(publicDir, filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filename}`);
});

console.log('\n📱 SVG icons generated successfully!');
console.log('Note: For production, convert these SVGs to PNG using:');
console.log('  - Online tools like CloudConvert, or');
console.log('  - CLI: brew install librsvg && rsvg-convert icon-192x192.svg -o icon-192x192.png');
