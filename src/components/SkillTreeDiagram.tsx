import React, { useState } from 'react';
import { CURRICULUM_STRUCTURE, ETHICAL_PRINCIPLES } from '../config/curriculumStructure';
import './SkillTreeDiagram.css';

export const SkillTreeDiagram: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const coachColors = {
    grace: '#ff69b4',
    posie: '#ff1493',
    rizzo: '#dc143c'
  };

  const coachIcons = {
    grace: '👑',
    posie: '🌸',
    rizzo: '💋'
  };

  const renderModuleNode = (module: any, coach: string, level: string, index: number) => {
    const yOffset = level === 'foundation' ? 0 : level === 'intermediate' ? 200 : 400;
    const xOffset = index * 250;
    
    return (
      <g key={`${coach}-${module.id}`} transform={`translate(${xOffset}, ${yOffset})`}>
        <rect
          className={`skill-node ${coach}`}
          width="200"
          height="120"
          rx="10"
          fill={`${coachColors[coach as keyof typeof coachColors]}20`}
          stroke={coachColors[coach as keyof typeof coachColors]}
          strokeWidth="2"
          onClick={() => setSelectedNode({ ...module, coach, level })}
          style={{ cursor: 'pointer' }}
        />
        <text x="100" y="30" textAnchor="middle" className="module-title">
          {module.title}
        </text>
        <text x="100" y="50" textAnchor="middle" className="module-subtitle">
          {module.lessons.length} lessons
        </text>
        {module.keySkills && module.keySkills.slice(0, 2).map((skill: string, idx: number) => (
          <text key={idx} x="100" y={70 + idx * 20} textAnchor="middle" className="skill-preview">
            • {skill.length > 20 ? skill.substring(0, 20) + '...' : skill}
          </text>
        ))}
      </g>
    );
  };

  const renderConnections = (coach: string) => {
    const modules = [
      ...CURRICULUM_STRUCTURE[coach as keyof typeof CURRICULUM_STRUCTURE].modules.foundation,
      ...CURRICULUM_STRUCTURE[coach as keyof typeof CURRICULUM_STRUCTURE].modules.intermediate,
      ...CURRICULUM_STRUCTURE[coach as keyof typeof CURRICULUM_STRUCTURE].modules.advanced
    ];

    const connections: JSX.Element[] = [];
    
    // Foundation to Intermediate connections
    CURRICULUM_STRUCTURE[coach as keyof typeof CURRICULUM_STRUCTURE].modules.foundation.forEach((fModule: any, fIdx: number) => {
      CURRICULUM_STRUCTURE[coach as keyof typeof CURRICULUM_STRUCTURE].modules.intermediate.forEach((iModule: any, iIdx: number) => {
        connections.push(
          <line
            key={`${fModule.id}-${iModule.id}`}
            x1={fIdx * 250 + 100}
            y1={120}
            x2={iIdx * 250 + 100}
            y2={200}
            stroke={`${coachColors[coach as keyof typeof coachColors]}40`}
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        );
      });
    });

    // Intermediate to Advanced connections
    CURRICULUM_STRUCTURE[coach as keyof typeof CURRICULUM_STRUCTURE].modules.intermediate.forEach((iModule: any, iIdx: number) => {
      CURRICULUM_STRUCTURE[coach as keyof typeof CURRICULUM_STRUCTURE].modules.advanced.forEach((aModule: any, aIdx: number) => {
        connections.push(
          <line
            key={`${iModule.id}-${aModule.id}`}
            x1={iIdx * 250 + 100}
            y1={320}
            x2={aIdx * 250 + 100}
            y2={400}
            stroke={`${coachColors[coach as keyof typeof coachColors]}40`}
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        );
      });
    });

    return connections;
  };

  const renderCoachTree = (coach: string, xOffset: number) => {
    const curriculum = CURRICULUM_STRUCTURE[coach as keyof typeof CURRICULUM_STRUCTURE];
    
    return (
      <g transform={`translate(${xOffset}, 100)`}>
        {/* Coach Header */}
        <g transform="translate(300, -80)">
          <rect
            width="200"
            height="60"
            rx="30"
            fill={coachColors[coach as keyof typeof coachColors]}
            className="coach-header"
          />
          <text x="100" y="25" textAnchor="middle" className="coach-name">
            {coachIcons[coach as keyof typeof coachIcons]} {coach.charAt(0).toUpperCase() + coach.slice(1)}
          </text>
          <text x="100" y="45" textAnchor="middle" className="coach-tagline">
            {coach === 'grace' ? 'Sophistication & Style' : 
             coach === 'posie' ? 'Embodied Connection' : 
             'Bold Confidence'}
          </text>
        </g>

        {/* Level Labels */}
        <text x="-80" y="60" className="level-label">Foundation</text>
        <text x="-80" y="260" className="level-label">Intermediate</text>
        <text x="-80" y="460" className="level-label">Advanced</text>

        {/* Connections */}
        {renderConnections(coach)}

        {/* Modules */}
        {curriculum.modules.foundation.map((module: any, idx: number) => renderModuleNode(module, coach, 'foundation', idx))}
        {curriculum.modules.intermediate.map((module: any, idx: number) => renderModuleNode(module, coach, 'intermediate', idx))}
        {curriculum.modules.advanced.map((module: any, idx: number) => renderModuleNode(module, coach, 'advanced', idx))}
      </g>
    );
  };

  const totalModules = Object.values(CURRICULUM_STRUCTURE).reduce((total, coach) => 
    total + coach.modules.foundation.length + coach.modules.intermediate.length + coach.modules.advanced.length, 0
  );

  const totalLessons = Object.values(CURRICULUM_STRUCTURE).reduce((total, coach) => {
    const coachLessons = [...coach.modules.foundation, ...coach.modules.intermediate, ...coach.modules.advanced]
      .reduce((sum, module) => sum + module.lessons.length, 0);
    return total + coachLessons;
  }, 0);

  return (
    <div className="skill-tree-diagram">
      <div className="diagram-header">
        <h1>XRCupid Complete Skill Tree</h1>
        <p className="subtitle">A comprehensive curriculum for ethical, effective dating</p>
        
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number">3</div>
            <div className="stat-label">Expert Coaches</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalModules}</div>
            <div className="stat-label">Training Modules</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalLessons}+</div>
            <div className="stat-label">Individual Lessons</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">15-20min</div>
            <div className="stat-label">Per Session</div>
          </div>
        </div>
      </div>

      <div className="diagram-controls">
        <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}>Zoom Out</button>
        <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
        <button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}>Zoom In</button>
        <button onClick={() => setZoomLevel(1)}>Reset</button>
      </div>

      <div className="tree-container">
        <svg 
          width="3000" 
          height="800" 
          viewBox="0 0 3000 800"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {renderCoachTree('grace', 0)}
          {renderCoachTree('posie', 1000)}
          {renderCoachTree('rizzo', 2000)}
        </svg>
      </div>

      {selectedNode && (
        <div className="module-detail-panel">
          <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
          <div className="panel-header" style={{ backgroundColor: coachColors[selectedNode.coach as keyof typeof coachColors] }}>
            <h3>{selectedNode.title}</h3>
            <p>Level: {selectedNode.level} | Coach: {selectedNode.coach}</p>
          </div>
          <div className="panel-content">
            <div className="description">{selectedNode.description}</div>
            
            <h4>Lessons Included:</h4>
            <ul className="lessons-list">
              {selectedNode.lessons.map((lesson: string, idx: number) => (
                <li key={idx}>{lesson}</li>
              ))}
            </ul>

            {selectedNode.keySkills && (
              <>
                <h4>Key Skills Developed:</h4>
                <div className="skills-tags">
                  {selectedNode.keySkills.map((skill: string, idx: number) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </>
            )}

            {selectedNode.practiceScenarios && (
              <>
                <h4>Practice Scenarios:</h4>
                <ul className="scenarios-list">
                  {selectedNode.practiceScenarios.map((scenario: string, idx: number) => (
                    <li key={idx}>{scenario}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      <div className="ethical-framework">
        <h2>Built on Ethical Principles</h2>
        <div className="principles-grid">
          {Object.entries(ETHICAL_PRINCIPLES).map(([key, description], idx) => (
            <div key={idx} className="principle-card">
              <div className="principle-icon">
                {key === 'authenticity' ? '🎯' :
                 key === 'consent' ? '🤝' :
                 key === 'balance' ? '⚖️' :
                 key === 'growth' ? '🌱' :
                 '🙏'}
              </div>
              <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="investor-callout">
        <h2>Investment Opportunity</h2>
        <p>
          XRCupid represents a paradigm shift in dating education. Our comprehensive curriculum 
          combines cutting-edge AI coaching with proven psychological principles to create 
          meaningful connections while maintaining the highest ethical standards.
        </p>
        <div className="key-differentiators">
          <div className="differentiator">
            <h3>🎯 Personalized Learning</h3>
            <p>AI-driven coaching adapts to each user's learning style and progress</p>
          </div>
          <div className="differentiator">
            <h3>📊 Performance-Based</h3>
            <p>Real dating metrics unlock advanced training modules</p>
          </div>
          <div className="differentiator">
            <h3>🛡️ Ethics-First</h3>
            <p>Built-in safeguards against toxic dating behaviors</p>
          </div>
          <div className="differentiator">
            <h3>🚀 Scalable Platform</h3>
            <p>AR/XR ready for the future of digital dating</p>
          </div>
        </div>
      </div>
    </div>
  );
};
