// Script to verify PWA functionality
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying PWA Implementation...\n');

// Check manifest.json
try {
    const manifestPath = path.join(__dirname, 'public', 'manifest.json');
    const manifestData = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);
    
    console.log('✅ Manifest file exists and is valid JSON');
    console.log(`  Name: ${manifest.name}`);
    console.log(`  Short name: ${manifest.short_name}`);
    console.log(`  Display: ${manifest.display}`);
    console.log(`  Theme color: ${manifest.theme_color}`);
    console.log(`  Background color: ${manifest.background_color}`);
    
    if (manifest.icons && manifest.icons.length > 0) {
        console.log(`  Icons: ${manifest.icons.length} sizes available`);
    } else {
        console.log('  ⚠️  No icons found');
    }
    
    if (manifest.screenshots && manifest.screenshots.length > 0) {
        console.log(`  Screenshots: ${manifest.screenshots.length} available`);
    } else {
        console.log('  ⚠️  No screenshots found');
    }
} catch (error) {
    console.log('❌ Manifest validation failed:', error.message);
    process.exit(1);
}

// Check service worker
const swPath = path.join(__dirname, 'public', 'sw.js');
if (fs.existsSync(swPath)) {
    console.log('✅ Service worker file exists');
} else {
    console.log('❌ Service worker file not found');
}

// Check icons directory
const iconsDir = path.join(__dirname, 'public', 'icons');
if (fs.existsSync(iconsDir)) {
    const icons = fs.readdirSync(iconsDir);
    console.log(`✅ Icons directory exists with ${icons.length} files`);
    
    const requiredSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
    const missingIcons = [];
    
    requiredSizes.forEach(size => {
        const iconFile = `icon-${size}.png`;
        if (!icons.includes(iconFile)) {
            missingIcons.push(iconFile);
        }
    });
    
    if (missingIcons.length > 0) {
        console.log(`  ⚠️  Missing icons: ${missingIcons.join(', ')}`);
    } else {
        console.log('  ✅ All required icon sizes present');
    }
} else {
    console.log('❌ Icons directory not found');
}

// Check screenshots directory
const screenshotsDir = path.join(__dirname, 'public', 'screenshots');
if (fs.existsSync(screenshotsDir)) {
    const screenshots = fs.readdirSync(screenshotsDir);
    console.log(`✅ Screenshots directory exists with ${screenshots.length} files`);
} else {
    console.log('❌ Screenshots directory not found');
}

// Check vite.config.js for static copy plugin
try {
    const viteConfigPath = path.join(__dirname, 'vite.config.js');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    if (viteConfig.includes('viteStaticCopy')) {
        console.log('✅ vite-plugin-static-copy configured');
    } else {
        console.log('❌ vite-plugin-static-copy not found in vite.config.js');
    }
} catch (error) {
    console.log('❌ Could not read vite.config.js:', error.message);
}

// Check registration in main.jsx
try {
    const mainPath = path.join(__dirname, 'src', 'main.jsx');
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    if (mainContent.includes('registerSW') && mainContent.includes('setupInstallPrompt')) {
        console.log('✅ Service worker registration found in main.jsx');
    } else {
        console.log('❌ Service worker registration not found in main.jsx');
    }
} catch (error) {
    console.log('❌ Could not read main.jsx:', error.message);
}

console.log('\n✅ PWA verification completed!');