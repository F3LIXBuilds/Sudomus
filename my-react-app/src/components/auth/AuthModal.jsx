import React, { useState } from 'react';
import './AuthModal.css';

export function AuthModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button onClick={onClose} className="auth-modal-close">X</button>
        <h2 className="auth-modal-title">Welcome</h2>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === 'login' ? 'auth-tab-active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`auth-tab ${activeTab === 'signup' ? 'auth-tab-active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-form">
          {activeTab === 'login' && (
            <>
              <input type="email" placeholder="Email" className="auth-input" />
              <input type="password" placeholder="Password" className="auth-input" />
              <button className="auth-submit-button">Login</button>
            </>
          )}
          {activeTab === 'signup' && (
            <>
              <input type="text" placeholder="Name" className="auth-input" />
              <input type="email" placeholder="Email" className="auth-input" />
              <input type="password" placeholder="Password" className="auth-input" />
              <button className="auth-submit-button">Sign Up</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
