import React, { useState, useEffect } from 'react';
import { CURRICULUM_STRUCTURE } from '../config/curriculumStructure';

export const InteractiveCurriculumOverviewSimple: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<any>(null);

  console.log('CURRICULUM_STRUCTURE in Simple:', CURRICULUM_STRUCTURE);

  // Get all modules in a flat array
  const getAllModules = () => {
    const modules: any[] = [];
    console.log('Getting all modules...');
    Object.entries(CURRICULUM_STRUCTURE).forEach(([coach, curriculum]) => {
      console.log(`Processing coach ${coach}:`, curriculum);
      
      // Check if curriculum has modules property
      if (curriculum.modules) {
        ['foundation', 'intermediate', 'advanced'].forEach(level => {
          const levelModules = curriculum.modules[level as keyof typeof curriculum.modules];
          if (levelModules && Array.isArray(levelModules)) {
            levelModules.forEach(module => {
              modules.push({ ...module, coach, level });
            });
          }
        });
      }
    });
    console.log('Total modules found:', modules.length);
    return modules;
  };

  const allModules = getAllModules();

  return (
    <div style={{ 
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '100vw',
      height: '100vh',
      padding: '20px', 
      backgroundColor: '#0a0a15', 
      color: 'white',
      overflow: 'auto',
      zIndex: 999999,
      boxSizing: 'border-box'
    }}>
      <h1 style={{ color: 'white', fontSize: '32px', marginBottom: '20px' }}>XRCupid Training Curriculum (Simple View)</h1>
      <p style={{ color: 'yellow', fontSize: '20px' }}>Total Modules: {allModules.length}</p>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Module List */}
        <div style={{ flex: 1 }}>
          <h2>Modules</h2>
          {allModules.map((module, index) => (
            <div 
              key={`${module.coach}-${module.id}-${index}`}
              onClick={() => setSelectedModule(module)}
              style={{ 
                padding: '10px', 
                marginBottom: '10px', 
                backgroundColor: selectedModule?.id === module.id ? '#2a2a3e' : '#1a1a2e',
                cursor: 'pointer',
                border: '1px solid #333'
              }}
            >
              <h3 style={{ margin: 0, color: 'white' }}>{module.title}</h3>
              <p style={{ margin: '5px 0', color: '#ccc' }}>
                Coach: {module.coach} | Level: {module.level}
              </p>
              <p style={{ margin: 0, color: '#999' }}>
                {module.lessons?.length || 0} lessons
              </p>
            </div>
          ))}
        </div>
        
        {/* Module Detail */}
        {selectedModule && (
          <div style={{ 
            flex: 1, 
            padding: '20px', 
            backgroundColor: '#1a1a2e',
            position: 'sticky',
            top: '20px',
            height: 'fit-content'
          }}>
            <button 
              onClick={() => setSelectedModule(null)}
              style={{ float: 'right', padding: '5px 10px' }}
            >
              Close
            </button>
            <h2 style={{ color: 'white' }}>{selectedModule.title}</h2>
            <p style={{ color: '#ccc' }}>
              Coach: {selectedModule.coach} | Level: {selectedModule.level}
            </p>
            {selectedModule.description && (
              <p style={{ color: '#aaa' }}>{selectedModule.description}</p>
            )}
            
            <h3 style={{ color: 'white' }}>Lessons:</h3>
            {selectedModule.lessons?.map((lesson: any, idx: number) => (
              <div key={lesson.id || idx} style={{ marginBottom: '10px' }}>
                <h4 style={{ color: 'white', margin: '5px 0' }}>
                  {idx + 1}. {lesson.title}
                </h4>
                {lesson.content && (
                  <p style={{ color: '#999', margin: '5px 0' }}>{lesson.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
