require('dotenv').config();

const apiKey = process.env.REACT_APP_HUME_API_KEY;
const configId = process.env.REACT_APP_HUME_CONFIG_ID || '9c6f9d9b-1699-41bb-b335-9925bba5d6d9';

console.log('Testing Hume connection...');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}... (${apiKey.length} chars)` : 'NOT SET');
console.log('Config ID:', configId);

async function testConnection() {
  try {
    const response = await fetch('https://api.hume.ai/v0/evi/configs', {
      headers: {
        'X-Hume-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Full response:', JSON.stringify(data, null, 2));
      
      // Check different possible response structures
      const configs = data.configs_page || data.configs || data.data || [];
      console.log('Found configs:', configs.length);
      
      if (Array.isArray(configs)) {
        configs.forEach(c => {
          console.log(`- ${c.id}: ${c.name || 'Unnamed'}`);
        });
        
        const hasConfig = configs.some(c => c.id === configId);
        console.log(`\nConfig ID ${configId} exists:`, hasConfig);
      }
    } else {
      const error = await response.text();
      console.error('Error response:', error);
    }
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

if (!apiKey) {
  console.error('ERROR: REACT_APP_HUME_API_KEY is not set in .env file!');
} else {
  testConnection();
}
