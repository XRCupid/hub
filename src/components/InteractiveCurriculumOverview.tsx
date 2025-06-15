import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { CURRICULUM_STRUCTURE, ETHICAL_PRINCIPLES, CurriculumModule, Lesson } from '../config/curriculumStructure';
import './InteractiveCurriculumOverview.css';

interface ComputerVisionFeature {
  name: string;
  description: string;
  metrics: string[];
  technology: string;
  icon: string;
}

const COMPUTER_VISION_FEATURES: ComputerVisionFeature[] = [
  {
    name: 'Posture Analysis',
    description: 'Real-time posture tracking with 33 3D body points',
    metrics: ['Spine alignment', 'Shoulder position', 'Open vs closed stance', 'Leaning indicators'],
    technology: 'MediaPipe Pose',
    icon: '🧍'
  },
  {
    name: 'Eye Contact Training',
    description: 'Gaze tracking without calibration using iris landmarks',
    metrics: ['Eye contact duration', 'Gaze patterns', 'Blink rate', 'Focus consistency'],
    technology: 'MediaPipe Face Mesh',
    icon: '👁️'
  },
  {
    name: 'Facial Expression Analysis',
    description: 'Emotion detection and micro-expression tracking',
    metrics: ['Smile genuineness', 'Eyebrow movements', 'Emotional congruence', 'Expression timing'],
    technology: 'MediaPipe Face Mesh + ML5',
    icon: '😊'
  },
  {
    name: 'Gesture Recognition',
    description: 'Hand gesture tracking and expressiveness analysis',
    metrics: ['Gesture frequency', 'Hand openness', 'Movement fluidity', 'Gesture appropriateness'],
    technology: 'MediaPipe Hands',
    icon: '👋'
  },
  {
    name: 'Voice & Speech Analysis',
    description: 'Vocal tone, pace, and emotion analysis',
    metrics: ['Speaking pace', 'Vocal variety', 'Emotional tone', 'Pause patterns'],
    technology: 'Hume AI Voice',
    icon: '🎤'
  },
  {
    name: 'Proximity & Space',
    description: 'Personal space awareness and movement tracking',
    metrics: ['Distance maintenance', 'Approach patterns', 'Body orientation', 'Mirroring behavior'],
    technology: 'MediaPipe Holistic',
    icon: '📏'
  }
];

interface ExtendedModule extends CurriculumModule {
  computerVisionFeatures?: string[];
  coach?: string;
}

export const InteractiveCurriculumOverview: React.FC = () => {
  const [selectedCoach, setSelectedCoach] = useState<'all' | 'grace' | 'posie' | 'rizzo' | 'max'>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'foundation' | 'intermediate' | 'advanced'>('all');
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<{lesson: Lesson, moduleTitle: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCVFeatures, setShowCVFeatures] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [userProgress] = useState({
    completedModules: ['foundation-conversation', 'foundation-body-language'],
    completedLessons: new Set(['active-listening', 'confident-posture'])
  });

  // Since we don't have coach-specific modules in our simplified structure,
  // let's assign coaches to modules based on their content
  const assignCoachToModule = (module: CurriculumModule): string => {
    const titleLower = module.title.toLowerCase();
    if (titleLower.includes('emotional') || titleLower.includes('empathy')) {
      return 'grace';
    } else if (titleLower.includes('confidence') || titleLower.includes('communication')) {
      return 'rizzo';
    } else {
      return 'grace'; // default coach
    }
  };

  const coachInfo = {
    grace: {
      name: 'Coach Grace',
      title: 'Sophistication & Style Expert',
      color: '#ff69b4',
      icon: '👑',
      focus: 'Elegance, conversation mastery, and social sophistication',
      cvFeatures: ['Posture Analysis', 'Gesture Recognition', 'Facial Expression Analysis']
    },
    posie: {
      name: 'Coach Posie',
      title: 'Embodiment & Connection Specialist',
      color: '#ff1493',
      icon: '🌸',
      focus: 'Body language, emotional intelligence, and authentic presence',
      cvFeatures: ['Proximity & Space', 'Eye Contact Training', 'Facial Expression Analysis']
    },
    rizzo: {
      name: 'Coach Rizzo',
      title: 'Confidence & Charisma Coach',
      color: '#dc143c',
      icon: '💋',
      focus: 'Bold confidence, flirtation dynamics, and magnetic presence',
      cvFeatures: ['Voice & Speech Analysis', 'Gesture Recognition', 'Eye Contact Training']
    }
  };

  // Get all modules with CV features mapped
  const getAllModules = () => {
    const modules: CurriculumModule[] = [];
    
    // Use the simplified structure directly
    ['foundation', 'intermediate', 'advanced'].forEach(level => {
      const levelModules = CURRICULUM_STRUCTURE[level as 'foundation' | 'intermediate' | 'advanced'];
      if (levelModules && Array.isArray(levelModules)) {
        levelModules.forEach((module: CurriculumModule) => {
          modules.push({
            ...module,
            level,
            lessons: module.lessons || []
          });
        });
      }
    });
    
    return modules;
  };

  // Add CV features to modules
  const getModulesWithCVFeatures = (modules: CurriculumModule[]): ExtendedModule[] => {
    return modules.map(module => {
      const cvFeatures: string[] = [];
      
      // Analyze module content to determine relevant CV features
      const titleLower = module.title.toLowerCase();
      if (titleLower.includes('body language') || titleLower.includes('posture')) {
        cvFeatures.push('Posture Analysis');
      }
      if (titleLower.includes('eye contact') || titleLower.includes('gaze')) {
        cvFeatures.push('Eye Contact Training');
      }
      if (titleLower.includes('expression') || titleLower.includes('emotion')) {
        cvFeatures.push('Facial Expression Analysis');
      }
      if (titleLower.includes('gesture') || titleLower.includes('hand')) {
        cvFeatures.push('Gesture Recognition');
      }
      if (titleLower.includes('voice') || titleLower.includes('conversation')) {
        cvFeatures.push('Voice & Speech Analysis');
      }
      if (titleLower.includes('space') || titleLower.includes('proximity')) {
        cvFeatures.push('Proximity & Space');
      }
      
      return {
        ...module,
        computerVisionFeatures: cvFeatures,
        coach: assignCoachToModule(module)
      };
    });
  };

  const modules = getModulesWithCVFeatures(getAllModules());

  const filteredModules = modules.filter(module => {
    const matchesCoach = selectedCoach === 'all' || module.coach === selectedCoach;
    const matchesLevel = selectedLevel === 'all' || module.level === selectedLevel;
    const matchesSearch = searchTerm === '' || 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.lessons?.some((lesson: any) => 
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return matchesCoach && matchesLevel && matchesSearch;
  });

  // Debug log
  console.log('InteractiveCurriculumOverview rendering');

  // Debug curriculum structure
  useEffect(() => {
    console.log('CURRICULUM_STRUCTURE:', CURRICULUM_STRUCTURE);
    console.log('Filtered modules:', filteredModules);
  }, [filteredModules]);

  const getTotalStats = () => {
    const allModules = getAllModules();
    const totalLessons = allModules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
    const totalExercises = allModules.reduce((sum, module) => 
      sum + (module.lessons?.reduce((lSum: number, lesson: any) => 
        lSum + (lesson.exercises?.length || 0), 0) || 0), 0
    );
    
    return {
      modules: allModules.length,
      lessons: totalLessons,
      exercises: totalExercises,
      cvFeatures: COMPUTER_VISION_FEATURES.length
    };
  };

  const stats = getTotalStats();

  const toggleLessonExpansion = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const handleLessonClick = (lesson: Lesson, moduleTitle: string) => {
    setSelectedLesson({ lesson, moduleTitle });
  };

  return (
    <div ref={containerRef} className="curriculum-overview">
      {/* Lesson Overlay Modal */}
      {selectedLesson && (
        <div className="lesson-overlay" onClick={() => setSelectedLesson(null)}>
          <div className="lesson-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedLesson(null)}>×</button>
            <h2>{selectedLesson.lesson.title}</h2>
            <p className="module-context">From: {selectedLesson.moduleTitle}</p>
            <div className="lesson-content">
              <div className="lesson-details">
                <div className="detail-item">
                  <strong>Duration:</strong> {selectedLesson.lesson.duration}
                </div>
                <div className="detail-item">
                  <strong>Type:</strong> {selectedLesson.lesson.type}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="curriculum-header">
        <h1>XRCupid Complete Training Curriculum</h1>
        <p className="subtitle">Master the art of authentic connection with AI-powered coaching and computer vision feedback</p>
        
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{Object.keys(coachInfo).length}</div>
            <div className="stat-label">Expert Coaches</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{stats.modules}</div>
            <div className="stat-label">Training Modules</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{stats.lessons}</div>
            <div className="stat-label">Interactive Lessons</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-value">{stats.cvFeatures}</div>
            <div className="stat-label">CV Analysis Tools</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="curriculum-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search modules, lessons, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <div className="filter-group">
            <label>Coach:</label>
            <button 
              className={selectedCoach === 'all' ? 'active' : ''}
              onClick={() => setSelectedCoach('all')}
            >
              All Coaches
            </button>
            {Object.entries(coachInfo).map(([key, info]) => (
              <button
                key={key}
                className={selectedCoach === key ? 'active' : ''}
                style={selectedCoach === key ? { backgroundColor: info.color } : {}}
                onClick={() => setSelectedCoach(key as any)}
              >
                {info.icon} {info.name}
              </button>
            ))}
          </div>
          
          <div className="filter-group">
            <label>Level:</label>
            <button 
              className={selectedLevel === 'all' ? 'active' : ''}
              onClick={() => setSelectedLevel('all')}
            >
              All Levels
            </button>
            <button 
              className={selectedLevel === 'foundation' ? 'active' : ''}
              onClick={() => setSelectedLevel('foundation')}
            >
              🌱 Foundation
            </button>
            <button 
              className={selectedLevel === 'intermediate' ? 'active' : ''}
              onClick={() => setSelectedLevel('intermediate')}
            >
              🌿 Intermediate
            </button>
            <button 
              className={selectedLevel === 'advanced' ? 'active' : ''}
              onClick={() => setSelectedLevel('advanced')}
            >
              🌳 Advanced
            </button>
          </div>
          
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={showCVFeatures}
                onChange={(e) => setShowCVFeatures(e.target.checked)}
              />
              Show CV Features
            </label>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="curriculum-content">
        {/* Modules Grid */}
        <div className="modules-grid">
          {filteredModules.map((module) => {
            const moduleCoach = module.coach || 'grace'; // default coach
            const coach = coachInfo[moduleCoach as keyof typeof coachInfo] || coachInfo.grace;
            
            return (
              <div 
                key={module.id}
                className="module-card"
                style={{ borderColor: coach.color }}
              >
                <div className="module-header">
                  <span className="coach-badge" style={{ backgroundColor: coach.color }}>
                    {coach.icon} {moduleCoach}
                  </span>
                  <span className="level-badge">
                    {module.level === 'foundation' ? '🌱' : module.level === 'intermediate' ? '🌿' : '🌳'} {module.level}
                  </span>
                </div>
                
                <h3>{module.title}</h3>
                <p className="module-description">{module.description || 'Click to view details'}</p>
                
                <div className="module-stats">
                  <p className="module-lessons">{module.lessons.length} lessons</p>
                  <p className="module-duration">
                    {module.lessons.reduce((total, lesson) => total + lesson.duration, 0)} min total
                  </p>
                </div>
                
                {showCVFeatures && module.computerVisionFeatures && module.computerVisionFeatures.length > 0 && (
                  <div className="cv-features-mini">
                    {module.computerVisionFeatures.slice(0, 3).map((feature: string, idx: number) => (
                      <span key={idx} className="cv-badge">
                        {COMPUTER_VISION_FEATURES.find(f => f.name === feature)?.icon} {feature}
                      </span>
                    ))}
                    {module.computerVisionFeatures.length > 3 && (
                      <span className="cv-badge">+{module.computerVisionFeatures.length - 3} more</span>
                    )}
                  </div>
                )}
                
                <div className="lessons">
                  <h4>Lessons:</h4>
                  {module.lessons.map((lesson, idx) => (
                    <div key={idx} className="lesson-item">
                      <div 
                        className="lesson-header"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLessonClick(lesson, module.title);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="lesson-title">{lesson.title}</span>
                        <span className="lesson-duration">{lesson.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      {/* Computer Vision Features Overview */}
      {showCVFeatures && (
        <div className="cv-overview-section">
          <h2>Computer Vision Analysis Features</h2>
          <p className="cv-subtitle">State-of-the-art tracking technology provides real-time feedback on your non-verbal communication</p>
          
          <div className="cv-features-grid">
            {COMPUTER_VISION_FEATURES.map((feature) => (
              <div key={feature.name} className="cv-overview-card">
                <div className="cv-icon-large">{feature.icon}</div>
                <h3>{feature.name}</h3>
                <p>{feature.description}</p>
                <div className="cv-tech-badge">{feature.technology}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Ethical Principles Footer */}
      <div className="ethics-footer">
        <h3>Our Ethical Foundation</h3>
        <div className="ethics-grid">
          {Object.entries(ETHICAL_PRINCIPLES).map(([key, value]) => (
            <div key={key} className="ethics-card">
              <h4>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
