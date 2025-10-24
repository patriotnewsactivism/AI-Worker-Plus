const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const publicIconsDir = path.join(__dirname, 'public', 'icons');
const publicScreenshotsDir = path.join(__dirname, 'public', 'screenshots');

if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

if (!fs.existsSync(publicScreenshotsDir)) {
  fs.mkdirSync(publicScreenshotsDir, { recursive: true });
}

// Generate icons of different sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating icons...');

// Use a simple colored square as icon if no source image is available
// In a real scenario, you would use your actual app icon
sizes.forEach(size => {
  const iconPath = path.join(publicIconsDir, `icon-${size}x${size}.png`);
  execSync(`convert -size ${size}x${size} xc:#8B5CF6 ${iconPath}`);
  console.log(`Generated ${iconPath}`);
});

// Generate screenshots
const screenshotSizes = [
  { name: 'mobile-1.png', width: 375, height: 667 },
  { name: 'mobile-2.png', width: 375, height: 667 }
];

console.log('Generating screenshots...');

screenshotSizes.forEach(screenshot => {
  const screenshotPath = path.join(publicScreenshotsDir, screenshot.name);
  execSync(`convert -size ${screenshot.width}x${screenshot.height} xc:#0F172A ${screenshotPath}`);
  console.log(`Generated ${screenshotPath}`);
});

console.log('Icon and screenshot generation complete!');