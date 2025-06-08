import React from 'react';

export const TestComponent: React.FC = () => {
  console.log('TestComponent is rendering!');
  
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'red',
      color: 'white',
      fontSize: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999
    }}>
      TEST COMPONENT IS VISIBLE!
    </div>
  );
};
