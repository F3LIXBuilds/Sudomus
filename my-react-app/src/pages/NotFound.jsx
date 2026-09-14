import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Home, Search, AlertTriangle } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="not-found-page">
        <div className="not-found-container">
          <div className="not-found-badge">
            <AlertTriangle size={16} /> 404 // Page Not Found
          </div>

          <div className="not-found-illustration">
            <div className="glow-circle"></div>
            <div className="glitch-number">404</div>
          </div>

          <h1 className="not-found-title">Lost in the Property Metaverse?</h1>
          <p className="not-found-description">
            The property, agent profile, or page you are looking for has moved, expired,
            or exists on a different block. Let's get you back on track.
          </p>

          <div className="not-found-actions">
            <Link to="/properties" className="btn-primary-explore">
              <Search size={18} /> Explore Marketplace
            </Link>
            <Link to="/" className="btn-secondary-home">
              <Home size={18} /> Return to Home
            </Link>
          </div>

          <div className="not-found-quick-links">
            <span className="quick-links-label">Popular Destinations:</span>
            <div className="quick-links-row">
              <Link to="/properties?type=apartment">Apartments</Link>
              <span className="separator">•</span>
              <Link to="/properties?type=house">Houses</Link>
              <span className="separator">•</span>
              <Link to="/properties?type=land">Land</Link>
              <span className="separator">•</span>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
