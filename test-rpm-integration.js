// Test RPM API Integration
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.REACT_APP_RPM_API_KEY;
const APP_ID = process.env.REACT_APP_RPM_APP_ID || '68389f8fa2bcefc234512570';

console.log('🔧 Testing RPM API Integration...');
console.log('📋 Configuration:');
console.log('  - API Key:', API_KEY ? '✅ Present' : '❌ Missing');
console.log('  - App ID:', APP_ID);
console.log('  - Subdomain: xr-cupid.readyplayer.me');

if (!API_KEY) {
  console.log('\n❌ API Key not found in .env.local');
  console.log('Please add: REACT_APP_RPM_API_KEY=your_api_key');
  process.exit(1);
}

// Test API call
async function testRPMAPI() {
  try {
    console.log('\n🚀 Testing avatar creation...');
    
    const response = await fetch('https://api.readyplayer.me/v1/avatars', {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'X-APP-ID': APP_ID
      },
      body: JSON.stringify({
        bodyType: 'halfbody',
        gender: 'male',
        assets: {
          skin: 'beige-01',
          hair: 'short-01',
          hairColor: 'brown',
          eyes: 'brown',
          outfit: 'casual-shirt-01'
        }
      })
    });

    console.log('📡 API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Avatar created successfully!');
      console.log('🎭 Avatar ID:', data.id);
      console.log('🔗 Avatar URL:', `https://models.readyplayer.me/${data.id}.glb`);
      console.log('🖼️  Image URL:', `https://models.readyplayer.me/${data.id}.png`);
    } else {
      const error = await response.text();
      console.log('❌ API Error:', response.status, response.statusText);
      console.log('📝 Error Details:', error);
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
  }
}

testRPMAPI();
