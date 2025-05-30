// Create a test avatar for RPM testing
export const createTestAvatar = () => {
  // Sample RPM avatar URLs with proper parameters for facial expressions
  const testAvatars = [
    {
      id: 'test-avatar-1',
      name: 'Test Avatar 1',
      url: 'https://models.readyplayer.me/64f9b0e8d7f7d3b8f8c7d5e4.glb?morphTargets=ARKit&textureAtlas=1024',
      createdAt: new Date().toISOString()
    },
    {
      id: 'test-avatar-2', 
      name: 'Test Avatar 2',
      url: 'https://models.readyplayer.me/64f9b0e8d7f7d3b8f8c7d5e5.glb?morphTargets=ARKit&textureAtlas=1024',
      createdAt: new Date().toISOString()
    }
  ];
  
  // Store in localStorage
  localStorage.setItem('rpm_avatars', JSON.stringify(testAvatars));
  console.log('✅ Created test avatars in localStorage');
  console.log('Navigate to /rpm-test to test them');
  
  return testAvatars;
};

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).createTestAvatar = createTestAvatar;
}
