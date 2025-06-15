import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HeartIcon, SparkleIcon, WingedHeartIcon, RadiatingHeartIcon, HeartArrowIcon, BowIcon } from './RisographIcons';
import './Navigation.css';

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Primary features - always visible
  const primaryFeatures = [
    { path: '/dating-simulation', label: 'XR Dating Sim', icon: <HeartIcon size={20} /> },
    { path: '/coach-call', label: 'AI Coach', icon: <SparkleIcon size={20} /> },
    { path: '/avatar-creation-hub', label: 'Avatar Studio', icon: <SparkleIcon size={20} /> },
    { path: '/dashboard', label: 'Dashboard', icon: <WingedHeartIcon size={20} /> }
  ];

  // NEW: Phase 1 Curriculum System - Our recently implemented features
  const curriculumFeatures = [
    { path: '/training-hub', label: 'Training Hub', icon: <SparkleIcon size={20} />, description: 'NPC scenarios & coach lessons' },
    { path: '/interactive-curriculum-overview', label: 'Curriculum Navigator', icon: <WingedHeartIcon size={20} />, description: 'Browse foundation to advanced modules' },
    { path: '/sample-lessons', label: 'Sample Lessons', icon: <RadiatingHeartIcon size={20} />, description: 'Example lesson structure' },
    { path: '/enhanced-coach', label: 'Coach Sessions', icon: <HeartArrowIcon size={20} />, description: 'Grace, Posie & Rizzo coaching' },
    { path: '/conversation-toolkit', label: 'Conversation Tools', icon: <BowIcon size={20} />, description: 'Communication skills practice' }
  ];

  // Secondary features - shown in expanded menu
  const secondaryFeatures = [
    { path: '/conference-booth', label: 'Conference Demo', icon: <WingedHeartIcon size={18} /> },
    { path: '/facial-analysis', label: 'Facial Analysis', icon: <HeartArrowIcon size={18} /> },
    { path: '/eye-contact', label: 'Eye Contact', icon: <SparkleIcon size={18} /> },
    { path: '/posture', label: 'Posture Training', icon: <BowIcon size={18} /> },
    { path: '/gestures', label: 'Gestures', icon: <WingedHeartIcon size={18} /> },
    { path: '/chat-simulation', label: 'Chat Practice', icon: <HeartIcon size={18} /> }
  ];

  return (
    <>
      <nav className={`risograph-nav ${scrolled ? 'scrolled' : ''} ${showAllFeatures ? 'expanded' : ''}`}>
        <div className="nav-glow"></div>
        <div className="nav-container">
          {/* Logo */}
          <NavLink to="/" className="nav-logo">
            <div className="logo-icon-wrapper">
              <WingedHeartIcon size={35} color="#FF6B9D" />
              <div className="logo-pulse"></div>
            </div>
            <div className="logo-text">
              <span className="logo-main">XRCupid</span>
              <span className="logo-sub">AI Dating Coach</span>
            </div>
          </NavLink>

          {/* Primary Navigation */}
          <div className="nav-center">
            <div className="nav-links">
              {primaryFeatures.map((item) => (
                <NavLink 
                  key={item.path}
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-link-content">
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  <div className="nav-link-bg"></div>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Menu Toggle & CTA */}
          <div className="nav-actions">
            <button 
              className="menu-toggle"
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              aria-label="Toggle all features"
            >
              <span className="menu-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
              <span className="menu-label">All Features</span>
            </button>
            
            <NavLink to="/dating-simulation" className="cta-button">
              <span className="cta-text">Try Free</span>
              <div className="cta-sparkles">
                <SparkleIcon size={15} />
                <SparkleIcon size={12} />
                <SparkleIcon size={10} />
              </div>
            </NavLink>
          </div>
        </div>

        {/* Expanded Features Menu */}
        {showAllFeatures && (
          <div className="expanded-menu">
            <div className="expanded-menu-container">
              <div className="menu-section">
                <h3>Practice Modules</h3>
                <div className="menu-grid">
                  {secondaryFeatures.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                      onClick={() => setShowAllFeatures(false)}
                    >
                      <span className="menu-item-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
              
              <div className="menu-section">
                <h3>Phase 1 Curriculum</h3>
                <div className="menu-grid">
                  {curriculumFeatures.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                      onClick={() => setShowAllFeatures(false)}
                    >
                      <span className="menu-item-icon">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="menu-item-description">{item.description}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
              
              <div className="menu-section">
                <h3>Resources</h3>
                <div className="menu-grid">
                  <NavLink
                    to="/design-showcase"
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => setShowAllFeatures(false)}
                  >
                    <span className="menu-item-icon"><RadiatingHeartIcon size={18} /></span>
                    <span>Design Showcase</span>
                  </NavLink>
                </div>
              </div>
              
              <div className="menu-section">
                <h3>Enhanced Coaching</h3>
                <div className="menu-grid">
                  <NavLink
                    to="/coach-call/grace"
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => setShowAllFeatures(false)}
                  >
                    <span className="menu-item-icon"><HeartArrowIcon size={18} /></span>
                    <span>Coach Grace</span>
                  </NavLink>
                  <NavLink
                    to="/coach-call/rizzo"
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => setShowAllFeatures(false)}
                  >
                    <span className="menu-item-icon"><RadiatingHeartIcon size={18} /></span>
                    <span>Coach Rizzo</span>
                  </NavLink>
                  <NavLink
                    to="/coach-call/posie"
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => setShowAllFeatures(false)}
                  >
                    <span className="menu-item-icon"><HeartIcon size={18} /></span>
                    <span>Coach Posie</span>
                  </NavLink>
                  <NavLink
                    to="/conversation-toolkit"
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => setShowAllFeatures(false)}
                  >
                    <span className="menu-item-icon"><WingedHeartIcon size={18} /></span>
                    <span>Conversation Toolkit</span>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Overlay for expanded menu */}
      {showAllFeatures && (
        <div 
          className="nav-overlay" 
          onClick={() => setShowAllFeatures(false)}
        />
      )}
    </>
  );
};

export default Navigation;
