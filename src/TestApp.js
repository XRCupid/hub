import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function TestApp() {
  return (
    <Router>
      <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
        <h1>XRCupid Test App</h1>
        <Routes>
          <Route path="/" element={<div>Home Page Works</div>} />
          <Route path="/test" element={<div>Test Route Works</div>} />
          <Route path="/investor-demo" element={<div>Investor Demo Route Works</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default TestApp;
