import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate
} from "react-router-dom";

// Import only the essential components for testing
import { InteractiveCurriculumOverview } from './components/InteractiveCurriculumOverview';
import { SampleLessons } from './components/SampleLessons';
import TrainingHub from './pages/TrainingHub';
import FunctionalCoachDemo from './components/FunctionalCoachDemo';
import InteractiveNPCDate from './components/InteractiveNPCDate';

// Simple navigation component
const SimpleNavigation = () => (
  <nav style={{ 
    padding: '1rem', 
    backgroundColor: '#f8f9fa', 
    borderBottom: '1px solid #dee2e6',
    marginBottom: '2rem'
  }}>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <NavLink to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
        Home
      </NavLink>
      <NavLink to="/functional-coach" style={{ textDecoration: 'none', color: '#007bff' }}>
        🎯 Live Coach Chat
      </NavLink>
      <NavLink to="/npc-dating" style={{ textDecoration: 'none', color: '#007bff' }}>
        💕 Practice Dating
      </NavLink>
      <NavLink to="/training-hub" style={{ textDecoration: 'none', color: '#007bff' }}>
        Training Hub
      </NavLink>
      <NavLink to="/curriculum" style={{ textDecoration: 'none', color: '#007bff' }}>
        Curriculum Navigator
      </NavLink>
      <NavLink to="/sample-lessons" style={{ textDecoration: 'none', color: '#007bff' }}>
        Sample Lessons
      </NavLink>
    </div>
  </nav>
);

// Simple home page
const HomePage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>🎯 XRCupid Curriculum System - Phase 1</h1>
    <p style={{ fontSize: '1.2rem', color: '#666' }}>Interactive dating coaching that actually works!</p>
    
    <div style={{ backgroundColor: '#e8f5e8', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
      <h2>🔥 NEW: Fully Functional Features!</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '2px solid #28a745' }}>
          <h3>🎯 Live Coach Chat</h3>
          <p>Actually talk to Grace, Posie, or Rizzo! Get real coaching advice and interactive lessons.</p>
          <NavLink to="/functional-coach" style={{ color: '#007bff', fontWeight: 'bold' }}>
            Try Coach Chat →
          </NavLink>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '2px solid #dc3545' }}>
          <h3>💕 Practice Dating</h3>
          <p>Interactive NPC dating scenarios with real-time scoring and feedback!</p>
          <NavLink to="/npc-dating" style={{ color: '#007bff', fontWeight: 'bold' }}>
            Start Practice Date →
          </NavLink>
        </div>
      </div>
    </div>

    <h2>📚 What You Can Test:</h2>
    <ul style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
      <li><strong>🎯 Live Coach Chat</strong> - Have actual conversations with AI coaches who give personalized advice</li>
      <li><strong>💕 Practice Dating</strong> - Date NPCs (Emma, Alex, Jordan) with real scoring and feedback</li>
      <li><strong>🏋️ Training Hub</strong> - Browse coaching modules and practice scenarios</li>
      <li><strong>🗺️ Curriculum Navigator</strong> - Explore the structured learning path</li>
      <li><strong>📖 Sample Lessons</strong> - View example lesson content and structure</li>
    </ul>
    
    <h2>👥 Your Coaches:</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
      <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
        <h3>🌸 Grace</h3>
        <p><strong>Specialty:</strong> Emotional Intelligence & refined romance</p>
        <p>Your elegant guide to charm, conversation, and emotional connection.</p>
      </div>
      <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
        <h3>🌺 Posie</h3>
        <p><strong>Specialty:</strong> Body Language & Presence</p>
        <p>Teaches authentic embodiment and creating magnetic connections.</p>
      </div>
      <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
        <h3>🔥 Rizzo</h3>
        <p><strong>Specialty:</strong> Magnetic Confidence & authenticity</p>
        <p>Helps you unleash irresistible energy and bold confidence.</p>
      </div>
    </div>
    
    <div style={{ backgroundColor: '#fff3cd', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
      <h3>🚀 Start Here:</h3>
      <p style={{ fontSize: '1.1rem' }}>
        1. Click <strong>"🎯 Live Coach Chat"</strong> to talk to a coach<br/>
        2. Try <strong>"💕 Practice Dating"</strong> for hands-on scenarios<br/>
        3. Explore other sections to see the full curriculum system
      </p>
    </div>
  </div>
);

function SimpleApp() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <SimpleNavigation />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/functional-coach" element={<FunctionalCoachDemo />} />
          <Route path="/npc-dating" element={<InteractiveNPCDate />} />
          <Route path="/training-hub" element={<TrainingHub />} />
          <Route path="/curriculum" element={<InteractiveCurriculumOverview />} />
          <Route path="/sample-lessons" element={<SampleLessons />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default SimpleApp;
