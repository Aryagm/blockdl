// Debug Conv2D double comma issue

// Simple simulation of Conv2D codeGen function
function conv2DCodeGen(params) {
  const filters = params.filters || 32;
  const kernel_size = params.kernel_size || '(3,3)';
  const strides = params.strides || '(1,1)';
  const padding = params.padding || 'same';
  const multiplier = params.multiplier || 1;
  
  const layerCode = `Conv2D(${filters}, kernel_size=${kernel_size}, strides=${strides}, padding='${padding}')`;
  
  if (multiplier === 1) {
    return layerCode;
  } else if (multiplier <= 5) {
    // For small multipliers, generate individual layers
    return Array(multiplier).fill(layerCode).join(',\n    ');
  } else {
    // For large multipliers, use a loop for cleaner code
    return `# Add ${multiplier} Conv2D layers with ${filters} filters
*[${layerCode} for _ in range(${multiplier})]`;
  }
}

// Test different scenarios
console.log('=== Conv2D Code Generation Test ===');
console.log('\n1. Single Conv2D layer (multiplier = 1):');
const single = conv2DCodeGen({ filters: 32, multiplier: 1 });
console.log(JSON.stringify(single));

console.log('\n2. Conv2D with multiplier = 3:');
const multi3 = conv2DCodeGen({ filters: 32, multiplier: 3 });
console.log(JSON.stringify(multi3));

console.log('\n3. Conv2D with multiplier = 7:');
const multi7 = conv2DCodeGen({ filters: 32, multiplier: 7 });
console.log(JSON.stringify(multi7));

// Simulate how generateKerasCode processes this (FIXED VERSION)
function simulateGenerateKerasCode(layerCode) {
  const modelLines = [];
  
  if (layerCode) {
    // Handle multi-line layer code (for multiplier > 5)
    const lines = layerCode.split('\n');
    if (lines.length > 1) {
      // Multi-line code: add comment first, then the layer code
      lines.forEach((line, index) => {
        if (index === 0) {
          // First line is the comment
          modelLines.push(`    ${line}`);
        } else {
          // Subsequent lines - check if it's spread operator syntax
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('*[') && trimmedLine.endsWith(']')) {
            // Spread operator syntax - don't add comma
            modelLines.push(`    ${line}`);
          } else {
            // Regular layer code - add comma only if it doesn't already end with one
            const hasComma = trimmedLine.endsWith(',');
            modelLines.push(`    ${line}${hasComma ? '' : ','}`);
          }
        }
      });
    } else {
      // Single line code - check if it's spread operator syntax
      const trimmedCode = layerCode.trim();
      if (trimmedCode.startsWith('*[') && trimmedCode.endsWith(']')) {
        // Spread operator syntax - don't add comma
        modelLines.push(`    ${layerCode}`);
      } else {
        // Regular layer code - add comma
        modelLines.push(`    ${layerCode},`);
      }
    }
  }
  
  return modelLines;
}

console.log('\n=== How generateKerasCode processes these (FIXED) ===');
console.log('\n1. Single layer processing:');
console.log(simulateGenerateKerasCode(single));

console.log('\n2. Multi-layer (multiplier 3) processing:');
console.log(simulateGenerateKerasCode(multi3));

console.log('\n3. Multi-layer (multiplier 7) processing:');
console.log(simulateGenerateKerasCode(multi7));
