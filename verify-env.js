const fs = require('fs');
const path = require('path');

console.log('Checking environment file setup...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const stats = fs.statSync(envPath);
  console.log('✓ .env.local exists');
  console.log(`  Size: ${stats.size} bytes`);
  console.log(`  Modified: ${stats.mtime}`);
  
  // Read first few bytes to check for RTF header
  const buffer = fs.readFileSync(envPath);
  const firstBytes = buffer.toString('utf8', 0, Math.min(20, buffer.length));
  
  if (firstBytes.includes('{\\rtf')) {
    console.log('\n❌ ERROR: .env.local appears to be an RTF file!');
    console.log('   RTF files cannot be used for environment variables.');
  } else {
    console.log('✓ File format appears to be plain text');
  }
} else {
  console.log('❌ .env.local not found');
}

// Now load and check variables
console.log('\nLoading environment variables...');
require('dotenv').config({ path: '.env.local' });

const humeVars = {
  'REACT_APP_HUME_API_KEY': process.env.REACT_APP_HUME_API_KEY,
  'REACT_APP_HUME_SECRET_KEY': process.env.REACT_APP_HUME_SECRET_KEY,
  'REACT_APP_HUME_CLIENT_ID': process.env.REACT_APP_HUME_CLIENT_ID,
  'REACT_APP_HUME_CLIENT_SECRET': process.env.REACT_APP_HUME_CLIENT_SECRET,
};

console.log('\nHume-related variables:');
Object.entries(humeVars).forEach(([key, value]) => {
  if (value) {
    // Show first 10 chars and length
    const preview = value.substring(0, 10) + '...';
    console.log(`✓ ${key}: ${preview} (${value.length} chars)`);
  } else {
    console.log(`  ${key}: not set`);
  }
});

// Check for common issues
console.log('\nChecking for common issues...');

// Check for quotes in values
Object.entries(humeVars).forEach(([key, value]) => {
  if (value && (value.includes('"') || value.includes("'"))) {
    console.log(`⚠️  WARNING: ${key} contains quotes - this may cause issues`);
  }
});

// Check for spaces
Object.entries(humeVars).forEach(([key, value]) => {
  if (value && (value.startsWith(' ') || value.endsWith(' '))) {
    console.log(`⚠️  WARNING: ${key} has leading/trailing spaces`);
  }
});

console.log('\nIf you edited .env.local with TextEdit or another rich text editor:');
console.log('1. Open Terminal');
console.log('2. Run: nano .env.local');
console.log('3. Re-enter your variables as plain text');
console.log('4. Save with Ctrl+O, then exit with Ctrl+X');
