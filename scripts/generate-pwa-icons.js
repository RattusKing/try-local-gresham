const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generatePWAIcons() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo.jpeg');
  const publicDir = path.join(__dirname, '..', 'public');

  // Icon sizes to generate
  const sizes = [
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' }
  ];

  console.log('🎨 Generating PWA icons from Try Local logo...\n');

  for (const { size, name } of sizes) {
    try {
      // Create a square canvas with white background
      // For maskable icons, we add 20% padding (safe zone)
      const paddingPercent = 0.2;
      const logoSize = Math.round(size * (1 - paddingPercent * 2));
      const padding = Math.round(size * paddingPercent);

      // First, resize the logo
      const resizedLogo = await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toBuffer();

      // Create the final icon with padding
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([{
          input: resizedLogo,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(path.join(publicDir, name));

      console.log(`✅ Generated ${name} (${size}x${size}px with safe zone)`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }

  console.log('\n🎉 PWA icons generation complete!');
}

generatePWAIcons().catch(console.error);
