// Simple browser test for YAML loading
console.log('🚀 Starting YAML loading test...');

async function testBrowserYAMLLoading() {
  try {
    // Step 1: Test fetch
    console.log('📡 Testing fetch...');
    const response = await fetch('/layers-enhanced.yaml');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    
    const yamlContent = await response.text();
    console.log('✅ YAML content size:', yamlContent.length);
    
    // Step 2: Test module imports
    console.log('📦 Testing imports...');
    const { initializeLayerDefs } = await import('./src/lib/yaml-layer-loader.js');
    const { getLayerTypes } = await import('./src/lib/layer-defs.js');
    console.log('✅ Modules imported successfully');
    
    // Step 3: Test initialization
    console.log('🔧 Initializing layer definitions...');
    await initializeLayerDefs();
    console.log('✅ Layer definitions initialized');
    
    // Step 4: Test layer types
    const layerTypes = getLayerTypes();
    console.log(`🎯 Found ${layerTypes.length} layer types:`);
    layerTypes.slice(0, 5).forEach(layer => {
      console.log(`  - ${layer.type}: ${layer.description}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testBrowserYAMLLoading().then(success => {
  console.log(success ? '🎉 All tests passed!' : '💥 Tests failed!');
});
