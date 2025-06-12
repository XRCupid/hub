const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('This script will help you add the missing REACT_APP_HUME_SECRET_KEY to your .env.local file.\n');

// First, let's check what we currently have
require('dotenv').config({ path: '.env.local' });

const currentSecret = process.env.REACT_APP_HUME_CLIENT_SECRET;
if (currentSecret) {
  console.log('Found existing secret in REACT_APP_HUME_CLIENT_SECRET');
  console.log('Preview:', currentSecret.substring(0, 10) + '...');
  
  rl.question('\nDo you want to copy this value to REACT_APP_HUME_SECRET_KEY? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      // Read current file
      const envPath = path.join(__dirname, '.env.local');
      let content = fs.readFileSync(envPath, 'utf8');
      
      // Check if REACT_APP_HUME_SECRET_KEY already exists
      if (content.includes('REACT_APP_HUME_SECRET_KEY=')) {
        console.log('\nREACT_APP_HUME_SECRET_KEY already exists in the file.');
        console.log('Please manually edit it if you need to update the value.');
      } else {
        // Add the new line after REACT_APP_HUME_API_KEY if it exists
        if (content.includes('REACT_APP_HUME_API_KEY=')) {
          const lines = content.split('\n');
          const newLines = [];
          let added = false;
          
          for (const line of lines) {
            newLines.push(line);
            if (line.startsWith('REACT_APP_HUME_API_KEY=') && !added) {
              newLines.push(`REACT_APP_HUME_SECRET_KEY=${currentSecret}`);
              added = true;
            }
          }
          
          if (!added) {
            // If we couldn't find API_KEY, just add at the end
            newLines.push(`REACT_APP_HUME_SECRET_KEY=${currentSecret}`);
          }
          
          content = newLines.join('\n');
        } else {
          // Just append to the end
          content += `\nREACT_APP_HUME_SECRET_KEY=${currentSecret}\n`;
        }
        
        // Write back
        fs.writeFileSync(envPath, content);
        console.log('\n✅ Successfully added REACT_APP_HUME_SECRET_KEY to .env.local');
        console.log('\nNext steps:');
        console.log('1. Restart your development server (Ctrl+C and npm start)');
        console.log('2. Try connecting to Hume again');
      }
    } else {
      console.log('\nTo manually add the secret key:');
      console.log('1. Run: nano .env.local');
      console.log('2. Add this line: REACT_APP_HUME_SECRET_KEY=your_secret_key_here');
      console.log('3. Save with Ctrl+O and exit with Ctrl+X');
    }
    
    rl.close();
  });
} else {
  console.log('No existing secret found in REACT_APP_HUME_CLIENT_SECRET');
  console.log('\nYou need to get your secret key from your Hume dashboard:');
  console.log('1. Go to https://beta.hume.ai/');
  console.log('2. Sign in to your account');
  console.log('3. Go to Settings → API Keys');
  console.log('4. Copy your Secret Key');
  console.log('\nThen run: nano .env.local');
  console.log('And add: REACT_APP_HUME_SECRET_KEY=your_secret_key_here');
  
  rl.close();
}
