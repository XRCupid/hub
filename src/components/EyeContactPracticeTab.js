import React from 'react';
import EyeContactPracticeView from './EyeContactPracticeView';

function EyeContactPracticeTab() {
  return (
    <div className="content-card">
      <h2>Eye Contact Practice</h2>
      <EyeContactPracticeView sourceType="webcam" />
    </div>
  );
}

export default EyeContactPracticeTab;
