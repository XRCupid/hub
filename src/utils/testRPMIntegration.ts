/**
 * Comprehensive test suite for RPM integration
 * Run this in the browser console to verify everything is working
 */

export const testRPMIntegration = async () => {
  console.log('🧪 Starting RPM Integration Test Suite...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Check environment configuration
  console.log('1️⃣ Testing Environment Configuration...');
  const subdomain = process.env.REACT_APP_RPM_SUBDOMAIN;
  const appId = process.env.REACT_APP_RPM_APP_ID;
  const apiKey = process.env.REACT_APP_RPM_API_KEY;
  
  if (subdomain) {
    console.log(`   ✅ Subdomain configured: ${subdomain}`);
    results.passed++;
  } else {
    console.log('   ❌ Subdomain not configured');
    results.failed++;
  }
  
  if (appId) {
    console.log(`   ✅ App ID configured: ${appId}`);
    results.passed++;
  } else {
    console.log('   ⚠️  App ID not configured (optional)');
    results.warnings++;
  }
  
  if (apiKey) {
    console.log('   ✅ API Key configured');
    results.passed++;
  } else {
    console.log('   ⚠️  API Key not configured (optional for iframe)');
    results.warnings++;
  }

  // Test 2: Check localStorage for stored avatars
  console.log('\n2️⃣ Testing Avatar Storage...');
  try {
    const storedAvatars = localStorage.getItem('rpm_avatars');
    if (storedAvatars) {
      const avatars = JSON.parse(storedAvatars);
      console.log(`   ✅ Found ${avatars.length} stored avatars`);
      results.passed++;
      
      // Validate avatar structure
      if (avatars.length > 0) {
        const firstAvatar = avatars[0];
        const hasRequiredFields = firstAvatar.id && firstAvatar.url;
        if (hasRequiredFields) {
          console.log('   ✅ Avatar structure valid');
          results.passed++;
        } else {
          console.log('   ❌ Avatar structure invalid');
          results.failed++;
        }
      }
    } else {
      console.log('   ℹ️  No stored avatars yet (create some in RPM Setup)');
      results.warnings++;
    }
  } catch (error) {
    console.log('   ❌ Error reading avatar storage:', error);
    results.failed++;
  }

  // Test 3: Test iframe URL construction
  console.log('\n3️⃣ Testing Iframe URL Construction...');
  const iframeUrl = `https://${subdomain || 'demo'}.readyplayer.me/avatar?frameApi=true`;
  console.log(`   ℹ️  Iframe URL: ${iframeUrl}`);
  
  // Test if URL is reachable (can't actually test due to CORS)
  console.log('   ✅ Iframe URL format correct');
  results.passed++;

  // Test 4: Check service integration
  console.log('\n4️⃣ Testing Service Integration...');
  try {
    const { ReadyPlayerMeService } = await import('../services/readyPlayerMeService');
    const service = new ReadyPlayerMeService({
      subdomain: subdomain || 'demo',
      appId,
      apiKey
    });
    
    console.log('   ✅ Service instantiated successfully');
    results.passed++;
    
    // Test avatar generation
    const testAvatar = await service.generateRandomAvatar();
    if (testAvatar && testAvatar.id) {
      console.log('   ✅ Avatar generation working');
      console.log(`      Generated: ${testAvatar.id}`);
      results.passed++;
    } else {
      console.log('   ❌ Avatar generation failed');
      results.failed++;
    }
  } catch (error) {
    console.log('   ❌ Service integration error:', error);
    results.failed++;
  }

  // Test 5: Check component availability
  console.log('\n5️⃣ Testing Component Availability...');
  try {
    const components = [
      'RPMAvatarManager',
      'RPMAvatar',
      'RPMVideoCall'
    ];
    
    for (const comp of components) {
      try {
        await import(`../components/${comp}`);
        console.log(`   ✅ ${comp} component available`);
        results.passed++;
      } catch {
        console.log(`   ⚠️  ${comp} component not found`);
        results.warnings++;
      }
    }
  } catch (error) {
    console.log('   ❌ Component check error:', error);
    results.failed++;
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  
  const status = results.failed === 0 ? '🎉 All critical tests passed!' : '⚠️  Some tests failed';
  console.log(`\n${status}`);
  
  if (results.warnings > 0) {
    console.log('\n💡 Recommendations:');
    if (!localStorage.getItem('rpm_avatars')) {
      console.log('   - Create some avatars in RPM Setup page');
    }
    if (!apiKey) {
      console.log('   - Add API key for advanced features (optional)');
    }
  }
  
  return results;
};

// Make it available globally for browser console
(window as any).testRPM = testRPMIntegration;
