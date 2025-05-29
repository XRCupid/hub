import React, { useState, useEffect } from 'react';
import { UserPreferences, AvatarGenerator, GeneratedProfile, PersonalityType, BodyType, AvatarStyle, Gender } from '../utils/avatarGenerator';

interface UserPreferencesProps {
  onPreferencesChange: (preferences: UserPreferences) => void;
  onProfilesGenerated: (profiles: GeneratedProfile[]) => void;
  className?: string;
}

export const UserPreferencesComponent: React.FC<UserPreferencesProps> = ({
  onPreferencesChange,
  onProfilesGenerated,
  className = ''
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    interestedIn: 'all',
    ageRange: [22, 35],
    styles: ['realistic'],
    ethnicities: [],
    bodyTypes: [],
    personalityTypes: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update parent when preferences change
  useEffect(() => {
    onPreferencesChange(preferences);
  }, [preferences, onPreferencesChange]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = <T extends string>(
    array: T[],
    value: T,
    setter: (newArray: T[]) => void
  ) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const handlePersonalityToggle = (personality: string) => {
    const typedPersonality = personality as PersonalityType;
    if (preferences.personalityTypes.includes(typedPersonality)) {
      setPreferences(prev => ({
        ...prev,
        personalityTypes: prev.personalityTypes.filter(p => p !== typedPersonality)
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        personalityTypes: [...prev.personalityTypes, typedPersonality]
      }));
    }
  };

  const handleBodyTypeToggle = (bodyType: string) => {
    const typedBodyType = bodyType as BodyType;
    if (preferences.bodyTypes.includes(typedBodyType)) {
      setPreferences(prev => ({
        ...prev,
        bodyTypes: prev.bodyTypes.filter(bt => bt !== typedBodyType)
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        bodyTypes: [...prev.bodyTypes, typedBodyType]
      }));
    }
  };

  const handleStyleToggle = (style: string) => {
    const typedStyle = style as AvatarStyle;
    if (preferences.styles.includes(typedStyle)) {
      setPreferences(prev => ({
        ...prev,
        styles: prev.styles.filter(s => s !== typedStyle)
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        styles: [...prev.styles, typedStyle]
      }));
    }
  };

  const generateProfiles = async () => {
    setIsGenerating(true);
    
    try {
      // Generate diverse profiles based on preferences
      const profiles = await AvatarGenerator.generateProfiles(preferences, 12);
      onProfilesGenerated(profiles);
      
      console.log(`🎭 Generated ${profiles.length} diverse profiles based on your preferences:`, {
        interestedIn: preferences.interestedIn,
        ageRange: preferences.ageRange,
        diversityMetrics: {
          genders: [...new Set(profiles.map((p: any) => p.gender))],
          ethnicities: [...new Set(profiles.map((p: any) => p.ethnicity))],
          personalities: [...new Set(profiles.map((p: any) => p.personalityType))]
        }
      });
      
    } catch (error) {
      console.error('Failed to generate profiles:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`user-preferences ${className}`}>
      <div className="preferences-header">
        <h3>🎯 Dating Preferences</h3>
        <p>Customize your dating simulation experience</p>
      </div>

      {/* Primary Preferences */}
      <div className="preference-section">
        <label className="preference-label">
          <span>I'm interested in:</span>
          <select 
            value={preferences.interestedIn}
            onChange={(e) => updatePreference('interestedIn', e.target.value as any)}
            className="preference-select"
          >
            <option value="all">Everyone</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="nonbinary">Non-binary people</option>
          </select>
        </label>

        <label className="preference-label">
          <span>Age range:</span>
          <div className="age-range">
            <input
              type="number"
              min="18"
              max="65"
              value={preferences.ageRange[0]}
              onChange={(e) => updatePreference('ageRange', [parseInt(e.target.value), preferences.ageRange[1]])}
              className="age-input"
            />
            <span>to</span>
            <input
              type="number"
              min="18"
              max="65"
              value={preferences.ageRange[1]}
              onChange={(e) => updatePreference('ageRange', [preferences.ageRange[0], parseInt(e.target.value)])}
              className="age-input"
            />
          </div>
        </label>
      </div>

      {/* Advanced Preferences Toggle */}
      <button 
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '▼' : '▶'} Advanced Preferences
      </button>

      {showAdvanced && (
        <div className="advanced-preferences">
          {/* Personality Types */}
          <div className="preference-group">
            <h4>Personality Types</h4>
            <div className="checkbox-grid">
              {['outgoing', 'shy', 'intellectual', 'artistic', 'adventurous', 'romantic'].map(type => (
                <label key={type} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.personalityTypes.includes(type as PersonalityType)}
                    onChange={() => handlePersonalityToggle(type)}
                  />
                  <span className="checkbox-text">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </label>
              ))}
            </div>
            {preferences.personalityTypes.length === 0 && (
              <p className="preference-hint">Leave empty for all personality types</p>
            )}
          </div>

          {/* Ethnicities */}
          <div className="preference-group">
            <h4>Cultural Backgrounds</h4>
            <div className="checkbox-grid">
              {['Western', 'Latino', 'Asian', 'African', 'Middle Eastern'].map(ethnicity => (
                <label key={ethnicity} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.ethnicities.includes(ethnicity)}
                    onChange={() => toggleArrayValue(
                      preferences.ethnicities,
                      ethnicity,
                      (newArray) => updatePreference('ethnicities', newArray)
                    )}
                  />
                  <span className="checkbox-text">{ethnicity}</span>
                </label>
              ))}
            </div>
            {preferences.ethnicities.length === 0 && (
              <p className="preference-hint">Leave empty for all backgrounds</p>
            )}
          </div>

          {/* Body Types */}
          <div className="preference-group">
            <h4>Body Types</h4>
            <div className="checkbox-grid">
              {['slim', 'average', 'athletic', 'curvy'].map(bodyType => (
                <label key={bodyType} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.bodyTypes.includes(bodyType as BodyType)}
                    onChange={() => handleBodyTypeToggle(bodyType)}
                  />
                  <span className="checkbox-text">{bodyType.charAt(0).toUpperCase() + bodyType.slice(1)}</span>
                </label>
              ))}
            </div>
            {preferences.bodyTypes.length === 0 && (
              <p className="preference-hint">Leave empty for all body types</p>
            )}
          </div>

          {/* Avatar Styles */}
          <div className="preference-group">
            <h4>Avatar Styles</h4>
            <div className="checkbox-grid">
              {['realistic', 'cartoon', 'stylized'].map(style => (
                <label key={style} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.styles.includes(style as AvatarStyle)}
                    onChange={() => handleStyleToggle(style)}
                  />
                  <span className="checkbox-text">{style.charAt(0).toUpperCase() + style.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="generate-section">
        <button 
          className="generate-btn"
          onClick={generateProfiles}
          disabled={isGenerating}
        >
          {isGenerating ? '🎭 Generating Profiles...' : '✨ Generate Dating Profiles'}
        </button>
        <p className="generate-hint">
          Creates 12 diverse profiles based on your preferences
        </p>
      </div>

      <style>{`
        .user-preferences {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          margin: 0 auto;
        }

        .preferences-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .preferences-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 24px;
        }

        .preferences-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .preference-section {
          margin-bottom: 20px;
        }

        .preference-label {
          display: block;
          margin-bottom: 16px;
        }

        .preference-label span {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .preference-select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          background: white;
        }

        .age-range {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .age-input {
          width: 80px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          text-align: center;
        }

        .advanced-toggle {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f8f9fa;
          cursor: pointer;
          font-weight: 500;
          color: #333;
          margin-bottom: 16px;
          text-align: left;
        }

        .advanced-toggle:hover {
          background: #e9ecef;
        }

        .advanced-preferences {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          background: #fafafa;
        }

        .preference-group {
          margin-bottom: 24px;
        }

        .preference-group h4 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 16px;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .checkbox-label:hover {
          background: rgba(74, 144, 226, 0.1);
        }

        .checkbox-text {
          font-size: 14px;
          color: #333;
        }

        .preference-hint {
          margin: 8px 0 0 0;
          font-size: 12px;
          color: #666;
          font-style: italic;
        }

        .generate-section {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .generate-btn {
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
        }

        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
        }

        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .generate-hint {
          margin: 12px 0 0 0;
          font-size: 14px;
          color: #666;
        }

        @media (max-width: 768px) {
          .user-preferences {
            padding: 16px;
            margin: 16px;
          }

          .checkbox-grid {
            grid-template-columns: 1fr;
          }

          .age-range {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .age-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default UserPreferencesComponent;
