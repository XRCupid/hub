import React, { useState } from 'react';
import AngelMascot from '../components/AngelMascot';

const DesignShowcase = () => {
  const [mascotSize, setMascotSize] = useState('medium');
  const [mascotVariant, setMascotVariant] = useState('cupid');
  
  return (
    <div className="design-showcase">
      <div className="component-container">
        <h1 className="misregistered" data-text="XRCupid Design System">
          XRCupid Design System
        </h1>
        <p className="lead-text">Risograph-inspired aesthetic with playful, retro vibes</p>
      </div>

      {/* Color Palette */}
      <div className="component-container">
        <h2>Color Palette</h2>
        <div className="color-grid">
          <div className="color-swatch" style={{ background: 'var(--paper)' }}>
            <span>Cream Paper</span>
            <code>#FAF3EA</code>
          </div>
          <div className="color-swatch" style={{ background: 'var(--pink)' }}>
            <span>Bubblegum Pink</span>
            <code>#E5A4B6</code>
          </div>
          <div className="color-swatch" style={{ background: 'var(--purple)' }}>
            <span>Lilac Purple</span>
            <code>#9C8EDB</code>
          </div>
          <div className="color-swatch" style={{ background: 'var(--blue)' }}>
            <span>Sky Blue</span>
            <code>#81B3DE</code>
          </div>
          <div className="color-swatch" style={{ background: 'var(--yellow)' }}>
            <span>Banana Yellow</span>
            <code>#FDE286</code>
          </div>
          <div className="color-swatch" style={{ background: 'var(--deep-blue)', color: 'white' }}>
            <span>Deep Blue</span>
            <code>#3B4063</code>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="component-container">
        <h2>Typography</h2>
        <h1>Heading 1 - Bebas Neue</h1>
        <h2>Heading 2 - Bold & Playful</h2>
        <h3>Heading 3 - Friendly Style</h3>
        <p>Body text uses Noto Sans KR for readability with a warm, approachable feel. This font family supports multiple languages and maintains excellent legibility at all sizes.</p>
        <p className="text-small">Small text for captions and metadata</p>
      </div>

      {/* Buttons */}
      <div className="component-container">
        <h2>Buttons & Interactive Elements</h2>
        <div className="button-showcase">
          <button className="button button-primary">Primary Button</button>
          <button className="button button-secondary">Secondary Button</button>
          <button className="button button-ghost">Ghost Button</button>
          <button className="button button-icon">
            <span>💕</span> With Icon
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="component-container">
        <h2>Cards & Containers</h2>
        <div className="card">
          <h3>Feature Card</h3>
          <p>Cards use thick purple borders with pink shadows to create a layered, print-inspired effect.</p>
          <button className="button button-secondary">Learn More</button>
        </div>
      </div>

      {/* Angel Mascot */}
      <div className="component-container">
        <h2>Angel Mascot Variations</h2>
        <div className="mascot-controls">
          <div className="control-group">
            <label>Size:</label>
            <select value={mascotSize} onChange={(e) => setMascotSize(e.target.value)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="control-group">
            <label>Variant:</label>
            <select value={mascotVariant} onChange={(e) => setMascotVariant(e.target.value)}>
              <option value="cupid">Cupid</option>
              <option value="wink">Wink</option>
              <option value="flying">Flying</option>
            </select>
          </div>
        </div>
        <div className="mascot-showcase">
          <AngelMascot size={mascotSize} variant={mascotVariant} animate={true} />
        </div>
      </div>

      {/* Animations */}
      <div className="component-container">
        <h2>Animations & Effects</h2>
        <div className="animation-grid">
          <div className="animation-box wobble">
            <span>Wobble</span>
          </div>
          <div className="animation-box float">
            <span>Float</span>
          </div>
          <div className="animation-box pulse">
            <span>Pulse</span>
          </div>
        </div>
      </div>

      {/* Form Elements */}
      <div className="component-container">
        <h2>Form Elements</h2>
        <form className="form-showcase">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" className="form-control" placeholder="Enter your name" />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" className="form-control" rows="3" placeholder="Type your message..."></textarea>
          </div>
          <button type="submit" className="button button-primary">Submit</button>
        </form>
      </div>

      <style jsx>{`
        .design-showcase {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-xl);
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-md);
          margin-top: var(--space-lg);
        }

        .color-swatch {
          padding: var(--space-lg);
          border: var(--border-width) solid var(--deep-blue);
          border-radius: var(--border-radius-md);
          text-align: center;
          transition: transform 0.2s;
        }

        .color-swatch:hover {
          transform: translateY(-4px);
        }

        .color-swatch span {
          display: block;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .color-swatch code {
          font-size: var(--font-size-small);
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .button-showcase {
          display: flex;
          gap: var(--space-md);
          flex-wrap: wrap;
          margin-top: var(--space-lg);
        }

        .mascot-controls {
          display: flex;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .control-group label {
          font-weight: 600;
        }

        .control-group select {
          padding: var(--space-sm);
          border: 2px solid var(--purple);
          border-radius: var(--border-radius-md);
          background: white;
          color: var(--deep-blue);
          font-family: var(--font-body);
        }

        .mascot-showcase {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          background: var(--pink-light);
          border-radius: var(--border-radius-lg);
          border: var(--border-width) solid var(--purple);
        }

        .animation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
          margin-top: var(--space-lg);
        }

        .animation-box {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--yellow-light);
          border: var(--border-width) solid var(--purple);
          border-radius: var(--border-radius-md);
          font-weight: 600;
        }

        .form-showcase {
          max-width: 500px;
          margin-top: var(--space-lg);
        }

        .form-group {
          margin-bottom: var(--space-lg);
        }

        .form-group label {
          display: block;
          margin-bottom: var(--space-sm);
          font-weight: 600;
          color: var(--deep-blue);
        }

        .form-control {
          width: 100%;
          padding: var(--space-md);
          border: var(--border-width) solid var(--purple);
          border-radius: var(--border-radius-md);
          background: white;
          color: var(--deep-blue);
          font-family: var(--font-body);
          font-size: var(--font-size-base);
          transition: all 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--pink);
          box-shadow: 0 0 0 3px rgba(229, 164, 182, 0.2);
        }

        textarea.form-control {
          resize: vertical;
          min-height: 100px;
        }
      `}</style>
    </div>
  );
};

export default DesignShowcase;
