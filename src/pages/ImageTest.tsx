import React from 'react';

const ImageTest: React.FC = () => {
  // Log debug info to console
  console.log('Image Test Debug Info:', {
    PUBLIC_URL: process.env.PUBLIC_URL,
    NODE_ENV: process.env.NODE_ENV,
    location: window.location
  });
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1>Image Loading Test</h1>
      
      <h2>Local Images:</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div>
          <h3>Angel Cupid (PNG)</h3>
          <img 
            src="/assets/angel-cupid.png" 
            alt="Angel Cupid" 
            style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid #ccc' }}
            onError={(e) => console.error('Failed to load angel-cupid.png', e)}
            onLoad={() => console.log('Successfully loaded angel-cupid.png')}
          />
        </div>
        
        <div>
          <h3>Logo (from manifest)</h3>
          <img 
            src="/logo192.png" 
            alt="Logo" 
            style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid #ccc' }}
            onError={(e) => console.error('Failed to load logo192.png', e)}
            onLoad={() => console.log('Successfully loaded logo192.png')}
          />
        </div>
        
        <div>
          <h3>Process.env PUBLIC_URL Test</h3>
          <img 
            src={`${process.env.PUBLIC_URL}/logo192.png`} 
            alt="Logo with PUBLIC_URL" 
            style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid #ccc' }}
            onError={(e) => console.error('Failed to load logo with PUBLIC_URL', e)}
            onLoad={() => console.log('Successfully loaded logo with PUBLIC_URL')}
          />
        </div>
      </div>
      
      <h2>Additional Path Tests:</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h3>Relative Path (./):</h3>
          <img 
            src="./assets/angel-cupid.png" 
            alt="Relative Path" 
            style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid #ccc' }}
            onError={(e) => console.error('Failed with ./assets/angel-cupid.png')}
            onLoad={() => console.log('Success with ./assets/angel-cupid.png')}
          />
        </div>
        
        <div>
          <h3>No Leading Slash:</h3>
          <img 
            src="assets/angel-cupid.png" 
            alt="No Slash" 
            style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid #ccc' }}
            onError={(e) => console.error('Failed with assets/angel-cupid.png')}
            onLoad={() => console.log('Success with assets/angel-cupid.png')}
          />
        </div>
        
        <div>
          <h3>Direct logo192.png:</h3>
          <img 
            src="logo192.png" 
            alt="Direct Logo" 
            style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid #ccc' }}
            onError={(e) => console.error('Failed with logo192.png')}
            onLoad={() => console.log('Success with logo192.png')}
          />
        </div>
      </div>
      
      <h2>Debug Info:</h2>
      <pre style={{ background: 'white', padding: '10px', borderRadius: '5px' }}>
        {JSON.stringify({
          PUBLIC_URL: process.env.PUBLIC_URL,
          NODE_ENV: process.env.NODE_ENV,
          location: {
            href: window.location.href,
            origin: window.location.origin,
            pathname: window.location.pathname
          }
        }, null, 2)}
      </pre>
    </div>
  );
};

export default ImageTest;
