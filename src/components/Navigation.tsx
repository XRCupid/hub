import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Navigation.css';
import RisographHeart from './RisographHeart';

interface NavDropdownProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

const NavDropdown: React.FC<NavDropdownProps> = ({ title, icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => {
      setIsOpen(false);
    }, 100); // Small delay to allow moving to dropdown
    setTimeoutId(id);
  };

  return (
    <div 
      className="nav-dropdown" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="nav-dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon && <span className="nav-icon">{icon}</span>}
        {title}
        <span className="dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="nav-dropdown-menu">
          {children}
        </div>
      )}
    </div>
  );
};

const Navigation: React.FC = () => {
  return (
    <nav className="main-navigation">
      <div className="logo risograph-logo">
        <NavLink to="/" className="logo-link">
          <span className="logo-text offset-text">XRCupid</span>
          <RisographHeart size={24} className="logo-heart" animated />
        </NavLink>
      </div>
      
      <div className="nav-links-group">
        {/* Core Experience - Always Visible */}
        <NavLink to="/coach-call" className={({ isActive }) => isActive ? "nav-link primary active" : "nav-link primary"}>
          <span className="nav-icon">💬</span>
          Talk to Coach
        </NavLink>
        
        <NavLink to="/dating-simulation" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="nav-icon">💕</span>
          Practice Dates
        </NavLink>
        
        {/* Skills & Training */}
        <NavDropdown title="Skills Training" icon="🎯">
          <NavLink to="/training-hub" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
            <strong>🎓 Training Hub</strong>
          </NavLink>
          <hr className="dropdown-divider" />
          <NavLink to="/skills-dashboard" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
            Skills Overview
          </NavLink>
          <NavLink to="/chat-practice" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
            Chat Practice
          </NavLink>
          <NavLink to="/rizz-training" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
            Conversation Skills
          </NavLink>
          <NavLink to="/phone-training" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
            Phone Training
          </NavLink>
          <NavLink to="/conversation-toolkit" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
            Conversation Toolkit
          </NavLink>
          <NavLink to="/skill-tree" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
            Skill Tree Overview
          </NavLink>
          <NavLink to="/sample-lessons" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
            Sample Lessons
          </NavLink>
        </NavDropdown>
        
        {/* Dev Tools - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <NavDropdown title="Dev Tools" icon="🔧">
            <NavLink to="/animation-test" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
              Animation Tester
            </NavLink>
            <NavLink to="/morph-target-test" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
              Morph Targets
            </NavLink>
            <NavLink to="/avatar-inspector" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
              Avatar Inspector
            </NavLink>
            <NavLink to="/face-puppeting" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
              Face Puppeting
            </NavLink>
            <NavLink to="/simple-face-tracking" className={({ isActive }) => isActive ? "dropdown-link active" : "dropdown-link"}>
              Face Tracking Demo
            </NavLink>
            <hr className="dropdown-divider" />
            <button 
              className="dropdown-link"
              onClick={() => (window as any).diagnostics?.runFullDiagnostic()}
            >
              Run Diagnostics
            </button>
            <button 
              className="dropdown-link"
              onClick={() => (window as any).performanceMonitor?.runQuickTest()}
            >
              Performance Test
            </button>
          </NavDropdown>
        )}
      </div>
      
      {/* User Profile & Avatar */}
      <div className="nav-user-section">
        <NavLink to="/avatar-setup" className="avatar-setup-link">
          <span className="nav-icon">👤</span>
          Customize Avatar
        </NavLink>
        <RisographHeart />
      </div>
    </nav>
  );
};

export default Navigation;
