const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSVGtoPNG() {
  const publicDir = path.join(__dirname, '..', 'public');
  const sizes = [192, 512];

  for (const size of sizes) {
    const svgPath = path.join(publicDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(publicDir, `icon-${size}x${size}.png`);

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);

      console.log(`✓ Converted icon-${size}x${size}.svg to PNG`);
    } catch (error) {
      console.error(`✗ Error converting ${size}x${size}:`, error.message);
    }
  }

  console.log('\n✅ PNG icons generated successfully!');
}

convertSVGtoPNG().catch(console.error);
