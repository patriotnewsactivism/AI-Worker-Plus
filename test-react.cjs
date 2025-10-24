const fs = require('fs');
const path = require('path');

// Create a simple test HTML file that loads the React app
const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test React App</title>
</head>
<body>
    <div id="root"></div>
    <script>
        // Check if React is loaded
        setTimeout(() => {
            if (typeof React === 'undefined') {
                document.body.innerHTML = '<h1>React not loaded</h1><p>Check console for errors</p>';
            } else {
                document.body.innerHTML = '<h1>React loaded successfully</h1>';
            }
        }, 1000);
    </script>
</body>
</html>
`;

fs.writeFileSync('test-react.html', testHtml);
console.log('Created test-react.html');