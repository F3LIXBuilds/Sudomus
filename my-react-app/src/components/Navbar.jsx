import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import './Navbar.css';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeDropdown();
    closeMenu();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get initials from profile name
  const getInitials = () => {
    if (!profile?.name) return '?';
    const parts = profile.name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const isAgentOrSeller = user && (
    user.role === 'agent' || 
    user.role === 'seller' || 
    profile?.user_type === 'agent' || 
    profile?.user_type === 'seller'
  );

  const dashboardPath = isAgentOrSeller ? '/agent-dashboard' : '/dashboard';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          {/* Animated SuDomus SVG Logo */}
          <svg
            width="180"
            height="60"
            viewBox="0 0 180 60"
            xmlns="http://www.w3.org/2000/svg"
            className="sudomus-logo"
          >
            <defs>
              <linearGradient id="sdGradient" x1="0" y1="0" x2="100%" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Monogram (S + D shaped house) */}
            <path
              d="M20 45 L20 25 Q30 15 40 25 L40 45 Z"
              fill="none"
              stroke="url(#sdGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="80"
              strokeDashoffset="80"
              filter="url(#glow)"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="80"
                to="0"
                dur="1s"
                begin="0s"
                fill="freeze"
              />
            </path>

            <path
              d="M25 35 Q30 30 35 35"
              fill="none"
              stroke="url(#sdGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="30"
              strokeDashoffset="30"
              filter="url(#glow)"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="30"
                to="0"
                dur="0.8s"
                begin="0.5s"
                fill="freeze"
              />
            </path>

            {/* Wordmark */}
            <text
              x="60"
              y="42"
              fontFamily="Poppins, sans-serif"
              fontSize=""
              fontWeight="600"
              fill="url(#sdGradient)"
              opacity="0"
              className="logo-text"
            >
              SuDomus
              <animate
                attributeName="opacity"
                from="0"
                to="1"
                dur="1s"
                begin="0.9s"
                fill="freeze"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 5"
                to="0 0"
                dur="1s"
                begin="0.9s"
                fill="freeze"
              />
            </text>
          </svg>
        </Link>

        {/* Hamburger Menu Button */}
        <button
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          <Link to="/properties" className="nav-link" onClick={closeMenu}>Properties</Link>
          <Link to="/ai" className="nav-link" onClick={closeMenu}>AI Assistant</Link>
          <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>

          {user ? (
            /* ── Logged-in: show profile avatar + dropdown ── */
            <div className="nav-avatar-wrapper" ref={dropdownRef}>
              <button
                className="nav-avatar"
                onClick={toggleDropdown}
                aria-label="Profile menu"
                title={profile?.name || 'Profile'}
              >
                {getInitials()}
              </button>

              {isDropdownOpen && (
                <div className="avatar-dropdown">
                  <div className="avatar-dropdown-header">
                    <span className="avatar-dropdown-name">{profile?.name || 'User'}</span>
                    <span className="avatar-dropdown-email">{profile?.email || ''}</span>
                  </div>
                  <div className="avatar-dropdown-divider" />
                  <Link
                    to={dashboardPath}
                    className="avatar-dropdown-item"
                    onClick={closeDropdown}
                  >
                    <Home size={16} className="dropdown-icon" />
                    Dashboard
                  </Link>
                  <button
                    className="avatar-dropdown-item avatar-dropdown-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} className="dropdown-icon" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Logged-out: show Login + Get Started ── */
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
              <Link to="/signup" className="nav-button" onClick={closeMenu}>Get Started</Link>
            </>
          )}
        </div>

        {/* Overlay */}
        <div className={`nav-overlay ${isMenuOpen ? 'active' : ''}`} onClick={closeMenu}></div>
      </div>
    </nav>
  );
}