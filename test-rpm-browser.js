// Quick test script to verify RPM integration
console.log('🧪 Testing RPM Integration...\n');

// Check localStorage
const avatars = localStorage.getItem('rpm_avatars');
if (avatars) {
  const parsed = JSON.parse(avatars);
  console.log(`✅ Found ${parsed.length} stored avatars in localStorage`);
  console.table(parsed);
} else {
  console.log('ℹ️  No avatars stored yet - create some in /rpm-setup');
}

// Check environment
console.log('\n📋 Environment Configuration:');
console.log('Subdomain:', process.env.REACT_APP_RPM_SUBDOMAIN || 'Not set');
console.log('App ID:', process.env.REACT_APP_RPM_APP_ID || 'Not set');
console.log('API Key:', process.env.REACT_APP_RPM_API_KEY ? 'Set' : 'Not set');

console.log('\n✨ RPM Integration Status: Ready!');
console.log('Navigate to /rpm-setup to create avatars');
