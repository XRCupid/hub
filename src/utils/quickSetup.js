// Quick setup script to get XRCupid functioning
// Run this in the browser console to set up test data

function setupXRCupid() {
  // Add test RPM avatars
  const testAvatars = [
    {
      id: 'user-avatar-1',
      url: 'https://models.readyplayer.me/6406e1e5d1b7fd03bbea74f1.glb',
      gender: 'male',
      name: 'User Avatar'
    },
    {
      id: 'npc-sarah',
      url: 'https://models.readyplayer.me/6406e2a3d1b7fd03bbea7537.glb',
      gender: 'female',
      name: 'Sarah'
    },
    {
      id: 'npc-emma',
      url: 'https://models.readyplayer.me/6406e2a3d1b7fd03bbea7537.glb',
      gender: 'female',
      name: 'Emma'
    }
  ];
  
  localStorage.setItem('rpm_avatars', JSON.stringify(testAvatars));
  console.log('✅ Test avatars added to localStorage');
  
  // Set up user preferences
  const userPrefs = {
    preferredGender: 'female',
    ageRange: { min: 25, max: 35 },
    interests: ['travel', 'music', 'technology']
  };
  
  localStorage.setItem('user_preferences', JSON.stringify(userPrefs));
  console.log('✅ User preferences configured');
  
  // Enable debug mode
  localStorage.setItem('debug_mode', 'true');
  console.log('✅ Debug mode enabled');
  
  console.log('\n🎉 XRCupid setup complete!');
  console.log('Please refresh the page to see changes.');
  console.log('\nNext steps:');
  console.log('1. Navigate to /avatar-test to verify avatars');
  console.log('2. Go to /dating-coach-demo to test the simulation');
  console.log('3. Click "Video Date" to start a session');
}

// Run the setup
setupXRCupid();
