import React from 'react';

const DougieTest: React.FC = () => {
  console.log('[DougieTest] Rendering simple test...');
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'red',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: 'white', fontSize: '48px' }}>
        DOUGIE TEST WORKS!
      </h1>
      <button 
        style={{
          position: 'absolute',
          top: '120px',
          left: '20px',
          padding: '20px',
          backgroundColor: 'yellow',
          color: 'black',
          border: 'none',
          fontSize: '20px',
          fontWeight: 'bold',
          zIndex: 10000
        }}
        onClick={() => alert('Button clicked!')}
      >
        CLICK ME
      </button>
    </div>
  );
};

export default DougieTest;
