// Test script for RPM avatars
export const testRPMAvatars = () => {
  console.log('🧪 Testing RPM Avatar Integration...');
  
  // Check if we have stored avatars
  const storedAvatars = localStorage.getItem('rpm_avatars');
  if (!storedAvatars) {
    console.log('❌ No avatars found in localStorage. Please create some at /rpm-setup first.');
    return;
  }
  
  try {
    const avatars = JSON.parse(storedAvatars);
    console.log(`✅ Found ${avatars.length} stored avatars:`);
    avatars.forEach((avatar: any, index: number) => {
      console.log(`  ${index + 1}. ${avatar.name || 'Unnamed'} - ${avatar.url}`);
    });
    
    // Test avatar URL format
    const testUrl = avatars[0]?.url;
    if (testUrl) {
      const isValidRPMUrl = testUrl.includes('models.readyplayer.me') || testUrl.includes('readyplayer.me');
      console.log(`✅ Avatar URL format: ${isValidRPMUrl ? 'Valid RPM URL' : 'Custom URL'}`);
      
      // Check if URL has proper parameters
      const hasQuality = testUrl.includes('quality=');
      const hasMorphTargets = testUrl.includes('morphTargets=');
      const hasTextureAtlas = testUrl.includes('textureAtlas=');
      
      console.log('📋 URL Parameters:');
      console.log(`  - Quality parameter: ${hasQuality ? '✅' : '❌'}`);
      console.log(`  - Morph targets: ${hasMorphTargets ? '✅' : '❌'}`);
      console.log(`  - Texture atlas: ${hasTextureAtlas ? '✅' : '❌'}`);
      
      if (!hasMorphTargets) {
        console.log('⚠️  Warning: Avatar URL should include morphTargets=ARKit for facial expressions');
        console.log('   Suggested URL format: ' + testUrl + (testUrl.includes('?') ? '&' : '?') + 'morphTargets=ARKit&textureAtlas=1024');
      }
    }
    
    // Test RPM configuration
    console.log('\n📋 RPM Configuration:');
    console.log(`  - Subdomain: ${process.env.REACT_APP_RPM_SUBDOMAIN || '❌ Not set'}`);
    console.log(`  - App ID: ${process.env.REACT_APP_RPM_APP_ID || '❌ Not set'}`);
    console.log(`  - API Key: ${process.env.REACT_APP_RPM_API_KEY ? '✅ Set' : '❌ Not set'}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Navigate to /rpm-test to test avatar features');
    console.log('2. Test facial expressions, visemes, and animations');
    console.log('3. Check console for any loading errors');
    
    return avatars;
  } catch (error) {
    console.error('❌ Error parsing stored avatars:', error);
  }
};

// Auto-run if called directly
if (typeof window !== 'undefined') {
  (window as any).testRPMAvatars = testRPMAvatars;
}
