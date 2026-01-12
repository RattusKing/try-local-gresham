const sharp = require('sharp');
const path = require('path');

async function generatePWAIcons() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo.jpeg');
  const publicDir = path.join(__dirname, '..', 'public');

  const sizes = [
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' }
  ];

  console.log('🎨 Generating PWA icons from Try Local logo...\n');

  for (const { size, name } of sizes) {
    try {
      // For maskable icons, we need safe zone padding (20%)
      // But we want to keep the logo intact and centered
      const paddingPercent = 0.15; // 15% padding for safe zone
      const logoSize = Math.round(size * (1 - paddingPercent * 2));
      const padding = Math.round(size * paddingPercent);

      // Resize the logo maintaining aspect ratio
      const resizedLogo = await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 248, g: 250, b: 251, alpha: 1 } // Match website background
        })
        .toBuffer();

      // Create final icon with padding and rounded corners
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 248, g: 250, b: 251, alpha: 1 }
        }
      })
        .composite([{
          input: resizedLogo,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(path.join(publicDir, name));

      console.log(`✅ Generated ${name} (${size}x${size}px)`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }

  console.log('\n🎉 PWA icons generation complete!');
}

generatePWAIcons().catch(console.error);
