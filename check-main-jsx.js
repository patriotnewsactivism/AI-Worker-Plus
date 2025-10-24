const fs = require('fs');

// Read the main.jsx file
const mainJsxContent = fs.readFileSync('src/main.jsx', 'utf8');
console.log('main.jsx content:');
console.log(mainJsxContent);

// Check if there are any obvious issues
if (mainJsxContent.includes('ReactDOM.createRoot')) {
  console.log('✓ Using createRoot (React 18+)');
} else if (mainJsxContent.includes('ReactDOM.render')) {
  console.log('✓ Using render (React 17 or older)');
} else {
  console.log('⚠ No ReactDOM rendering method found');
}

if (mainJsxContent.includes('./App')) {
  console.log('✓ Importing App component');
} else {
  console.log('⚠ Not importing App component');
}