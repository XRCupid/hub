import React from 'react';
import AngelMascot from './AngelMascot';

const ConferenceSetup = ({ mode = 'host-display' }) => {
  return (
    <div className="component-container">
      <div className="text-center">
        <AngelMascot size="medium" variant="wink" animate={true} />
        <h2 className="misregistered" data-text="Conference Mode">
          Conference Mode
        </h2>
        <p className="lead-text">Mode: {mode}</p>
        <p>Conference setup component is under development</p>
        <button className="button button-primary">Launch Demo</button>
      </div>
    </div>
  );
};

export default ConferenceSetup;
