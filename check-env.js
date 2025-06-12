require('dotenv').config({ path: '.env.local' });

console.log('Checking Hume environment variables...\n');

const requiredVars = [
  'REACT_APP_HUME_API_KEY',
  'REACT_APP_HUME_SECRET_KEY'
];

const optionalVars = [
  'REACT_APP_HUME_CONFIG_ID',
  'REACT_APP_HUME_CLIENT_ID',
  'REACT_APP_HUME_CLIENT_SECRET'
];

console.log('REQUIRED Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✓ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`✗ ${varName}: NOT SET`);
  }
});

console.log('\nOPTIONAL Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`  ${varName}: not set`);
  }
});

console.log('\n⚠️  Missing REACT_APP_HUME_SECRET_KEY!');
console.log('\nTo fix this, add the following to your .env.local file:');
console.log('REACT_APP_HUME_SECRET_KEY=your_hume_secret_key_here');
console.log('\nYou can find your secret key in the Hume AI dashboard:');
console.log('1. Go to https://beta.hume.ai/');
console.log('2. Sign in to your account');
console.log('3. Go to Settings → API Keys');
console.log('4. Copy your Secret Key');
console.log('5. Add it to .env.local');
console.log('6. Restart your development server');
