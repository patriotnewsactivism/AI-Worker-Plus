// Test script to validate manifest.json
const fs = require('fs');

try {
    const manifestData = fs.readFileSync('./public/manifest.json', 'utf8');
    const manifest = JSON.parse(manifestData);
    
    console.log('Manifest file is valid JSON');
    console.log('Name:', manifest.name);
    console.log('Short name:', manifest.short_name);
    console.log('Display mode:', manifest.display);
    console.log('Theme color:', manifest.theme_color);
    console.log('Background color:', manifest.background_color);
    
    if (manifest.icons && manifest.icons.length > 0) {
        console.log('Icons found:', manifest.icons.length);
        manifest.icons.forEach(icon => {
            console.log(`  - ${icon.sizes} (${icon.type})`);
        });
    } else {
        console.log('No icons found in manifest');
    }
    
    if (manifest.screenshots && manifest.screenshots.length > 0) {
        console.log('Screenshots found:', manifest.screenshots.length);
    } else {
        console.log('No screenshots found in manifest');
    }
    
    console.log('Manifest validation completed successfully');
} catch (error) {
    console.error('Manifest validation failed:', error.message);
}