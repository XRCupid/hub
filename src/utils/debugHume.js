// Debug Hume credentials
export function debugHumeCredentials() {
  console.log('=== HUME CREDENTIALS DEBUG ===');
  
  const env = {
    apiKey: process.env.REACT_APP_HUME_API_KEY,
    secretKey: process.env.REACT_APP_HUME_SECRET_KEY,
    configIdGrace: process.env.REACT_APP_HUME_CONFIG_ID_GRACE,
    configIdDefault: process.env.REACT_APP_HUME_CONFIG_ID,
  };
  
  console.log('API Key:', env.apiKey ? `${env.apiKey.substring(0, 15)}...` : 'NOT SET');
  console.log('Secret Key:', env.secretKey ? `${env.secretKey.substring(0, 15)}...` : 'NOT SET');
  console.log('Grace Config ID:', env.configIdGrace);
  console.log('Default Config ID:', env.configIdDefault);
  
  // Check if the config ID being used matches what we expect
  const expectedConfigId = 'bfd6db39-f0ea-46c3-a64b-e902d8cec212';
  console.log('Expected Config ID:', expectedConfigId);
  console.log('Grace Config matches expected?', env.configIdGrace === expectedConfigId);
  
  return env;
}

// Auto-expose to window
if (typeof window !== 'undefined') {
  window.debugHumeCredentials = debugHumeCredentials;
}
