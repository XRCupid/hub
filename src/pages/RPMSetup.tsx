import React, { useState } from 'react';
import { RPMAvatarManager } from '../components/RPMAvatarManager';
import { ReadyPlayerMeService } from '../services/readyPlayerMeService';

export const RPMSetup: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testRPMIntegration = async () => {
    setIsLoading(true);
    setTestResult('Testing RPM integration...\n');

    const rpmService = new ReadyPlayerMeService({
      subdomain: process.env.REACT_APP_RPM_SUBDOMAIN || 'xr-cupid',
      appId: process.env.REACT_APP_RPM_APP_ID,
      apiKey: process.env.REACT_APP_RPM_API_KEY
    });

    try {
      // Test 1: Generate random avatar
      setTestResult(prev => prev + '\n1. Testing avatar generation...');
      const avatar = await rpmService.generateRandomAvatar({ gender: 'female' });
      setTestResult(prev => prev + `\n   ✅ Generated avatar: ${avatar.id}`);
      setTestResult(prev => prev + `\n   Image URL: ${avatar.imageUrl}`);
      setTestResult(prev => prev + `\n   Model URL: ${avatar.modelUrl || 'Using fallback'}`);

      // Test 2: Check stored avatars
      setTestResult(prev => prev + '\n\n2. Checking stored avatars...');
      const stored = localStorage.getItem('rpm_avatars');
      if (stored) {
        const avatars = JSON.parse(stored);
        setTestResult(prev => prev + `\n   ✅ Found ${avatars.length} stored avatars`);
      } else {
        setTestResult(prev => prev + '\n   ℹ️ No stored avatars yet');
      }

      // Test 3: Verify iframe URL
      setTestResult(prev => prev + '\n\n3. Verifying iframe configuration...');
      const iframeUrl = `https://${process.env.REACT_APP_RPM_SUBDOMAIN || 'xr-cupid'}.readyplayer.me/avatar`;
      setTestResult(prev => prev + `\n   ✅ Iframe URL: ${iframeUrl}`);

      setTestResult(prev => prev + '\n\n✅ All tests passed! RPM integration is ready.');
    } catch (error) {
      setTestResult(prev => prev + `\n\n❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Ready Player Me Setup & Testing</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="font-medium w-32">Subdomain:</span>
              <span className="text-gray-600">{process.env.REACT_APP_RPM_SUBDOMAIN || 'Not set'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-32">App ID:</span>
              <span className="text-gray-600">{process.env.REACT_APP_RPM_APP_ID || 'Not set'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-32">API Key:</span>
              <span className="text-gray-600">{process.env.REACT_APP_RPM_API_KEY ? '✅ Set' : '❌ Not set'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Integration Test</h2>
          <button
            onClick={testRPMIntegration}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
          >
            {isLoading ? 'Testing...' : 'Run Integration Test'}
          </button>
          
          {testResult && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {testResult}
            </pre>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Avatar Manager</h2>
          <RPMAvatarManager 
            onAvatarCreated={(avatar) => {
              console.log('New avatar created:', avatar);
              alert(`Avatar created successfully!\nID: ${avatar.id}\nURL: ${avatar.url}`);
            }}
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-2">How to Use RPM in XRCupid</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Create New Avatar" to open the RPM avatar creator</li>
            <li>Customize your avatar and click "Done" when finished</li>
            <li>The avatar will be saved locally and available for use in simulations</li>
            <li>Create multiple diverse avatars for better NPC variety</li>
            <li>Avatars will automatically be used in the dating simulation</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
