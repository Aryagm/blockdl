// Test the enhanced validation system in browser environment
// This creates a simple HTML page to test the enhanced validation

const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Validation Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; border: 1px solid #f5c6cb; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; }
    </style>
</head>
<body>
    <h1>Enhanced Shape Validation Test</h1>
    <div id="test-results"></div>
    
    <script type="module">
        async function testEnhancedValidation() {
            const resultsDiv = document.getElementById('test-results');
            
            try {
                // Import enhanced validation
                const { computeEnhancedLayerShape } = await import('./src/lib/enhanced-shape-computation.ts');
                resultsDiv.innerHTML += '<div class="test-result success">✅ Enhanced validation module loaded successfully</div>';
                
                // Test Dense layer with 3D input (should give warning)
                const denseResult = computeEnhancedLayerShape('Dense', [[28, 28, 1]], { units: 128 });
                if (denseResult.warning) {
                    resultsDiv.innerHTML += '<div class="test-result warning">⚠️ Dense 3D Warning: ' + denseResult.warning + '</div>';
                } else {
                    resultsDiv.innerHTML += '<div class="test-result error">❌ Dense 3D warning not detected</div>';
                }
                
                // Test Conv2D with 1D input (should give error)
                const convResult = computeEnhancedLayerShape('Conv2D', [[784]], { filters: 32, kernel_size: '(3,3)' });
                if (convResult.error) {
                    resultsDiv.innerHTML += '<div class="test-result error">🛑 Conv2D 1D Error: ' + convResult.error + '</div>';
                } else {
                    resultsDiv.innerHTML += '<div class="test-result error">❌ Conv2D 1D error not detected</div>';
                }
                
                // Test valid Dense layer
                const validResult = computeEnhancedLayerShape('Dense', [[784]], { units: 10 });
                if (validResult.shape && !validResult.error) {
                    resultsDiv.innerHTML += '<div class="test-result success">✅ Valid Dense computation: ' + JSON.stringify(validResult.shape) + '</div>';
                } else {
                    resultsDiv.innerHTML += '<div class="test-result error">❌ Valid Dense computation failed</div>';
                }
                
            } catch (error) {
                resultsDiv.innerHTML += '<div class="test-result error">❌ Import failed: ' + error.message + '</div>';
                console.error('Test error:', error);
            }
        }
        
        testEnhancedValidation();
    </script>
</body>
</html>
`;

const fs = require('fs');
const path = require('path');

// Write test file
const testPath = path.join(__dirname, 'public', 'test-enhanced-validation.html');
fs.writeFileSync(testPath, testHtml);

console.log('🧪 Enhanced validation test page created at: test-enhanced-validation.html');
console.log('🌐 Access it at: http://localhost:5174/test-enhanced-validation.html');
