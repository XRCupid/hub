import React, { useState, useCallback } from 'react';
import { MockHumeEVI, mockHumeProsodyData, mockEmotionSets } from '../utils/mockHumeData';

interface TestModeToggleProps {
  onMockMessage?: (message: any) => void;
  onMockProsody?: (emotions: any[]) => void;
  onMockVisemes?: (visemes: any) => void;
}

export const TestModeToggle: React.FC<TestModeToggleProps> = ({
  onMockMessage,
  onMockProsody,
  onMockVisemes
}) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mockEVI, setMockEVI] = useState<MockHumeEVI | null>(null);

  const handleTestModeToggle = useCallback(() => {
    if (!isTestMode) {
      // Start test mode
      console.log('🧪 Enabling Test Mode - Using Mock Hume Data');
      
      const evi = new MockHumeEVI((message) => {
        console.log('🎭 Mock message received:', message);
        if (onMockMessage) {
          onMockMessage(message);
        }
        
        // Extract prosody for emotions
        if (message.prosody && onMockProsody) {
          onMockProsody(message.prosody);
        }
        
        // Extract timeline for visemes
        if (message.timeline && onMockVisemes) {
          // Convert timeline to viseme format
          const visemes = message.timeline.reduce((acc: any, item: any) => {
            if (item.type === 'phoneme') {
              // Map phonemes to basic visemes
              switch (item.value) {
                case 'eh':
                case 'ae':
                  acc.jawOpen = 0.0; // FIXED: was 0.6 - this was causing mouth stuck open
                  break;
                case 'ow':
                case 'aw':
                  acc.mouthFunnel = 0.7;
                  break;
                case 'iy':
                case 'ih':
                  acc.mouthSmileLeft = 0.3;
                  acc.mouthSmileRight = 0.3;
                  break;
                default:
                  acc.jawOpen = Math.max(acc.jawOpen || 0, 0.0); // FIXED: was 0.2 - forcing minimum jaw open
              }
            }
            return acc;
          }, {});
          
          onMockVisemes(visemes);
        }
      });
      
      setMockEVI(evi);
      evi.start();
      setIsTestMode(true);
      setIsExpanded(true); // Auto-expand when starting test mode
    } else {
      // Stop test mode
      console.log('🧪 Disabling Test Mode');
      if (mockEVI) {
        mockEVI.stop();
      }
      setMockEVI(null);
      setIsTestMode(false);
      setIsExpanded(false);
    }
  }, [isTestMode, mockEVI, onMockMessage, onMockProsody, onMockVisemes]);

  const handleTestEmotion = useCallback((emotionSetKey: string) => {
    if (onMockProsody) {
      const emotionSet = mockEmotionSets[emotionSetKey as keyof typeof mockEmotionSets];
      if (emotionSet) {
        console.log(`🧪 Testing emotion set: ${emotionSetKey}`, emotionSet);
        onMockProsody(emotionSet);
      }
    }
  }, [onMockProsody]);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px', // Moved to left side
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      zIndex: 1000,
      fontSize: '12px',
      width: isExpanded ? '280px' : '160px',
      maxHeight: isExpanded ? '70vh' : 'auto',
      overflowY: isExpanded ? 'auto' : 'hidden',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h4 style={{ margin: '0', fontSize: '13px' }}>🧪 Test Mode</h4>
        {isTestMode && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        )}
      </div>
      
      <button
        onClick={handleTestModeToggle}
        style={{
          background: isTestMode ? '#ff4444' : '#44ff44',
          color: 'white',
          border: 'none',
          padding: '6px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%',
          fontSize: '11px',
          marginBottom: isTestMode && isExpanded ? '10px' : '0'
        }}
      >
        {isTestMode ? '🛑 Stop' : '▶️ Start Test'}
      </button>

      {isTestMode && isExpanded && (
        <div>
          <p style={{ margin: '5px 0', fontSize: '11px', fontWeight: 'bold' }}>
            🎭 Test Emotions:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
            {Object.keys(mockEmotionSets).map(emotionKey => (
              <button
                key={emotionKey}
                onClick={() => handleTestEmotion(emotionKey)}
                style={{
                  background: '#555',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  textTransform: 'capitalize',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#777'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#555'}
              >
                {getEmotionEmoji(emotionKey)} {emotionKey}
              </button>
            ))}
          </div>
          
          <div style={{ fontSize: '9px', opacity: 0.7, lineHeight: '1.2', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
            <strong>🎯 Look for:</strong><br/>
            • <strong>Joy:</strong> Big smile + raised brows<br/>
            • <strong>Anger:</strong> Furrowed brows + flared nostrils<br/>
            • <strong>Sad:</strong> Frown + puppy dog eyes<br/>
            • <strong>Surprise:</strong> Wide eyes + dramatic brows<br/>
            • <strong>Fear:</strong> Wide eyes + worried brows<br/>
            • <strong>Disgust:</strong> Nose sneer + lip curl
          </div>
        </div>
      )}
      
      {isTestMode && !isExpanded && (
        <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '5px' }}>
          Click ▼ to expand controls
        </div>
      )}
    </div>
  );
};

function getEmotionEmoji(emotion: string): string {
  const emojiMap: Record<string, string> = {
    happy: '😊',
    sad: '😢', 
    angry: '😠',
    surprised: '😲',
    scared: '😨',
    disgusted: '🤢',
    confused: '😕',
    content: '😌'
  };
  return emojiMap[emotion] || '😐';
}
