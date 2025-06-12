console.log('Environment variables:');
console.log('- REACT_APP_HUME_API_KEY:', 
  process.env.REACT_APP_HUME_API_KEY ? 'Set' : 'Not set');
console.log('- REACT_APP_HUME_SECRET_KEY:', 
  process.env.REACT_APP_HUME_SECRET_KEY ? 'Set' : 'Not set');
console.log('- NODE_ENV:', process.env.NODE_ENV);

// Check for any Hume-related environment variables
console.log('\nAll Hume-related environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('HUME') || key.includes('hume'))
  .forEach(key => {
    console.log(`- ${key}: ${key.endsWith('KEY') ? '***' + process.env[key].slice(-4) : process.env[key]}`);
  });
