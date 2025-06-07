// Quick debug script to test YAML loading
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testYamlLoading() {
  try {
    console.log('🔍 Testing YAML loading...');
    
    // Check if YAML file exists
    const yamlPath = path.join(__dirname, 'public', 'layers-enhanced.yaml');
    console.log('📁 YAML file path:', yamlPath);
    console.log('📄 YAML file exists:', fs.existsSync(yamlPath));
    
    if (fs.existsSync(yamlPath)) {
      const yamlContent = fs.readFileSync(yamlPath, 'utf8');
      console.log('📏 YAML file size:', yamlContent.length, 'characters');
      console.log('🔍 First 200 characters:', yamlContent.substring(0, 200));
    }
    
    // Test fetch to the development server
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n🌐 Testing fetch to dev server...');
    const response = await fetch('http://localhost:5173/layers-enhanced.yaml');
    console.log('📡 Response status:', response.status);
    console.log('📦 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const content = await response.text();
      console.log('✅ Fetched content size:', content.length, 'characters');
      console.log('🔍 First 200 characters:', content.substring(0, 200));
    } else {
      console.log('❌ Failed to fetch YAML file');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testYamlLoading();
