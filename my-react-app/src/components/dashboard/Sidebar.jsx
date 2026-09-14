import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';
import {
  Home,
  Wallet,
  User,
  FileCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';

export function Sidebar({ activeTab, onTabChange, userType, isCollapsed, onToggle, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
    ...(userType === 'agent' ? [{ id: 'kyc', label: 'KYC Verification', icon: FileCheck }] : [])
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="header-content">
              <h2 className="sidebar-title">Dashboard</h2>
              <p className="sidebar-subtitle">{userType}</p>
            </div>
          )}
          {/* On mobile, we might want a close button or just rely on overlay/toggle */}
          <button className="collapse-toggle" onClick={onToggle} aria-label="Toggle Sidebar">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={20} className="nav-icon" />
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-nav-item"
            onClick={() => navigate('/')}
            title={isCollapsed ? 'Back to Home' : ''}
            style={{ marginBottom: '0.5rem' }}
          >
            <ArrowLeft size={20} className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Back to Home</span>}
          </button>
          <button 
            className="sidebar-signout-button" 
            title={isCollapsed ? 'Sign Out' : ''}
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
