import React, { useState, useEffect } from 'react';
import { DateTrackingPreferences, DeviceInfo, SessionContext, CoachTrackingProfile, NPCTrackingRequirements } from '../services/UnifiedTrackingCoordinator';
import { CoachProfile, getCoachById } from '../config/coachConfig';
import { NPCPersonalities, NPCPersonality } from '../config/NPCPersonalities';

interface TrackingPreferencesSelectorProps {
  coachId?: string;
  npcId?: string;
  activityType: 'speed-date' | 'coach-session' | 'practice' | 'skill-building';
  onPreferencesSelected: (preferences: DateTrackingPreferences) => void;
  onCancel?: () => void;
}

interface FocusAreaInfo {
  id: string;
  label: string;
  description: string;
  icon: string;
  processingLoad: number;
  batteryImpact: 'low' | 'medium' | 'high';
  privacyLevel: 'local' | 'hybrid' | 'cloud';
  requiredBy?: string[]; // Which coaches/NPCs require this
  recommendedFor?: string[]; // What scenarios this helps with
}

const FOCUS_AREAS: FocusAreaInfo[] = [
  {
    id: 'eye-contact',
    label: 'Eye Contact Tracking',
    description: 'Monitors gaze patterns, eye contact duration, and attention focus',
    icon: '👁️',
    processingLoad: 6,
    batteryImpact: 'medium',
    privacyLevel: 'hybrid',
    requiredBy: ['aria', 'confident-sarah'],
    recommendedFor: ['confidence-building', 'conversation-skills', 'charisma']
  },
  {
    id: 'posture',
    label: 'Posture & Body Language',
    description: 'Analyzes body positioning, openness, and physical confidence',
    icon: '🧍',
    processingLoad: 7,
    batteryImpact: 'high',
    privacyLevel: 'local',
    requiredBy: ['posie', 'zara'],
    recommendedFor: ['physical-presence', 'confidence', 'first-impressions']
  },
  {
    id: 'facial-expressions',
    label: 'Facial Expressions',
    description: 'Tracks micro-expressions, emotions, and authenticity markers',
    icon: '😊',
    processingLoad: 5,
    batteryImpact: 'medium',
    privacyLevel: 'local',
    requiredBy: ['zara', 'shy-emma'],
    recommendedFor: ['emotional-intelligence', 'authenticity', 'empathy']
  },
  {
    id: 'gestures',
    label: 'Hand Gestures',
    description: 'Monitors hand movements, gesture patterns, and expressiveness',
    icon: '🤲',
    processingLoad: 4,
    batteryImpact: 'low',
    privacyLevel: 'local',
    requiredBy: ['intellectual-maya'],
    recommendedFor: ['storytelling', 'engagement', 'expressiveness']
  },
  {
    id: 'voice-only',
    label: 'Voice Analysis Only',
    description: 'Focus purely on voice prosody and conversation analysis',
    icon: '🎤',
    processingLoad: 2,
    batteryImpact: 'low',
    privacyLevel: 'hybrid',
    requiredBy: [],
    recommendedFor: ['conversation-flow', 'voice-training', 'minimal-tracking']
  }
];

const PERFORMANCE_MODES = [
  {
    id: 'battery-save',
    label: 'Battery Saver',
    description: 'Minimal tracking for longer sessions',
    icon: '🔋',
    maxFocusAreas: 2,
    processingReduction: 0.5
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Good balance of insights and performance',
    icon: '⚖️',
    maxFocusAreas: 3,
    processingReduction: 0.7
  },
  {
    id: 'maximum-insight',
    label: 'Maximum Insight',
    description: 'Full tracking for detailed feedback',
    icon: '🔍',
    maxFocusAreas: 5,
    processingReduction: 1.0
  }
];

export const TrackingPreferencesSelector: React.FC<TrackingPreferencesSelectorProps> = ({
  coachId,
  npcId,
  activityType,
  onPreferencesSelected,
  onCancel
}) => {
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [performanceMode, setPerformanceMode] = useState<'battery-save' | 'balanced' | 'maximum-insight'>('balanced');
  const [coachGuidance, setCoachGuidance] = useState(true);
  const [realTimeAnalytics, setRealTimeAnalytics] = useState(true);
  const [privacyMode, setPrivacyMode] = useState<'local-only' | 'cloud-assisted' | 'full-cloud'>('local-only');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Get coach and NPC info
  const coach = coachId ? getCoachById(coachId) : null;
  const npc = npcId ? NPCPersonalities[npcId] : null;
  
  // Device capabilities detection (simplified for demo)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    platform: 'desktop',
    performance: 'high',
    networkQuality: 'excellent',
    hasWebGL: true,
    hasWebAssembly: true,
    cameraQuality: 'hd',
    processingPower: 8
  });

  // Auto-select recommended areas based on coach/NPC
  useEffect(() => {
    const recommendedAreas = getRecommendedFocusAreas();
    if (recommendedAreas.length > 0 && selectedFocusAreas.length === 0) {
      setSelectedFocusAreas(recommendedAreas);
    }
  }, [coachId, npcId]);

  const getRecommendedFocusAreas = (): string[] => {
    const recommended: string[] = [];
    
    // Coach requirements
    if (coach) {
      FOCUS_AREAS.forEach(area => {
        if (area.requiredBy?.includes(coachId!)) {
          recommended.push(area.id);
        }
      });
    }
    
    // NPC requirements
    if (npc) {
      FOCUS_AREAS.forEach(area => {
        if (area.requiredBy?.includes(npcId!)) {
          recommended.push(area.id);
        }
      });
    }
    
    // Activity type defaults
    if (activityType === 'speed-date') {
      recommended.push('eye-contact', 'facial-expressions');
    } else if (activityType === 'coach-session') {
      recommended.push('posture', 'facial-expressions');
    }
    
    return [...new Set(recommended)];
  };

  const toggleFocusArea = (areaId: string) => {
    const currentMode = PERFORMANCE_MODES.find(m => m.id === performanceMode)!;
    
    if (selectedFocusAreas.includes(areaId)) {
      setSelectedFocusAreas(prev => prev.filter(id => id !== areaId));
    } else if (selectedFocusAreas.length < currentMode.maxFocusAreas) {
      setSelectedFocusAreas(prev => [...prev, areaId]);
    }
  };

  const calculateProcessingLoad = (): number => {
    return selectedFocusAreas.reduce((total, areaId) => {
      const area = FOCUS_AREAS.find(a => a.id === areaId);
      return total + (area?.processingLoad || 0);
    }, 0);
  };

  const getBatteryImpact = (): 'low' | 'medium' | 'high' => {
    const impacts = selectedFocusAreas.map(areaId => {
      const area = FOCUS_AREAS.find(a => a.id === areaId);
      return area?.batteryImpact || 'low';
    });
    
    if (impacts.includes('high')) return 'high';
    if (impacts.includes('medium')) return 'medium';
    return 'low';
  };

  const handleConfirm = () => {
    const preferences: DateTrackingPreferences = {
      focusAreas: selectedFocusAreas as any[],
      performanceMode,
      coachGuidance,
      realTimeAnalytics,
      privacyMode
    };
    
    onPreferencesSelected(preferences);
  };

  const currentPerformanceMode = PERFORMANCE_MODES.find(m => m.id === performanceMode)!;
  const processingLoad = calculateProcessingLoad();
  const batteryImpact = getBatteryImpact();

  return (
    <div className="tracking-preferences-selector">
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="header">
            <h2>Choose Your Tracking Focus</h2>
            <p>
              {coach && `Training with ${coach.name}`}
              {npc && ` • Dating ${npc.name}`}
              {` • ${activityType.replace('-', ' ')}`}
            </p>
          </div>

          {/* Context Information */}
          {(coach || npc) && (
            <div className="context-info">
              {coach && (
                <div className="coach-context">
                  <h4>👨‍🏫 Coach Focus: {coach.specialty.join(', ')}</h4>
                  <p>{coach.description}</p>
                </div>
              )}
              {npc && (
                <div className="npc-context">
                  <h4>💕 Dating Context: {npc.name}</h4>
                  <p>{npc.personality} • {npc.conversationStyle}</p>
                </div>
              )}
            </div>
          )}

          {/* Performance Mode Selection */}
          <div className="performance-mode-section">
            <h3>Performance Mode</h3>
            <div className="performance-modes">
              {PERFORMANCE_MODES.map(mode => (
                <div 
                  key={mode.id}
                  className={`performance-mode ${performanceMode === mode.id ? 'selected' : ''}`}
                  onClick={() => setPerformanceMode(mode.id as any)}
                >
                  <div className="mode-icon">{mode.icon}</div>
                  <div className="mode-info">
                    <h4>{mode.label}</h4>
                    <p>{mode.description}</p>
                    <small>Max {mode.maxFocusAreas} focus areas</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Areas Selection */}
          <div className="focus-areas-section">
            <h3>What Should We Track?</h3>
            <div className="focus-areas-grid">
              {FOCUS_AREAS.map(area => {
                const isSelected = selectedFocusAreas.includes(area.id);
                const isRecommended = getRecommendedFocusAreas().includes(area.id);
                const canSelect = isSelected || selectedFocusAreas.length < currentPerformanceMode.maxFocusAreas;
                
                return (
                  <div 
                    key={area.id}
                    className={`focus-area ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''} ${!canSelect ? 'disabled' : ''}`}
                    onClick={() => canSelect && toggleFocusArea(area.id)}
                  >
                    <div className="area-header">
                      <span className="area-icon">{area.icon}</span>
                      <h4>{area.label}</h4>
                      {isRecommended && <span className="recommended-badge">✨ Recommended</span>}
                    </div>
                    <p>{area.description}</p>
                    <div className="area-metadata">
                      <span className={`battery-impact ${area.batteryImpact}`}>
                        🔋 {area.batteryImpact} impact
                      </span>
                      <span className={`privacy-level ${area.privacyLevel}`}>
                        🔒 {area.privacyLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Impact Summary */}
          <div className="session-impact">
            <h3>Session Impact</h3>
            <div className="impact-metrics">
              <div className="metric">
                <span className="metric-label">Processing Load:</span>
                <div className={`metric-bar processing-${processingLoad > 15 ? 'high' : processingLoad > 8 ? 'medium' : 'low'}`}>
                  <div className="metric-fill" style={{ width: `${Math.min(processingLoad * 5, 100)}%` }}></div>
                </div>
              </div>
              <div className="metric">
                <span className="metric-label">Battery Impact:</span>
                <span className={`impact-badge ${batteryImpact}`}>{batteryImpact}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Selected Areas:</span>
                <span>{selectedFocusAreas.length} / {currentPerformanceMode.maxFocusAreas}</span>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="advanced-section">
            <button 
              className="toggle-advanced"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▼' : '▶'} Advanced Options
            </button>
            
            {showAdvanced && (
              <div className="advanced-options">
                <div className="option">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={coachGuidance} 
                      onChange={(e) => setCoachGuidance(e.target.checked)}
                    />
                    Real-time coach guidance
                  </label>
                </div>
                <div className="option">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={realTimeAnalytics} 
                      onChange={(e) => setRealTimeAnalytics(e.target.checked)}
                    />
                    Live analytics feedback
                  </label>
                </div>
                <div className="option">
                  <label>Privacy Mode:</label>
                  <select 
                    value={privacyMode} 
                    onChange={(e) => setPrivacyMode(e.target.value as any)}
                  >
                    <option value="local-only">Local processing only</option>
                    <option value="cloud-assisted">Cloud-assisted analysis</option>
                    <option value="full-cloud">Full cloud processing</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="actions">
            <button className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button 
              className="confirm-btn" 
              onClick={handleConfirm}
              disabled={selectedFocusAreas.length === 0}
            >
              Start Session ({selectedFocusAreas.length} focus areas)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPreferencesSelector;
