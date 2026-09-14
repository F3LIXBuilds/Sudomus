import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/dashboard/Sidebar';
import { WalletManager } from '../components/wallet/WalletManager';
import { PropertyCard } from '../components/properties/PropertyCard';
import {
  Home,
  Wallet,
  TrendingUp,
  Link,
  Search,
  PlusCircle,
  Settings,
  Bell,
  Menu,
  X,
  MessageSquare,
  Calendar,
  History
} from 'lucide-react';
import { dashboardService } from '../services/api';
import { ProfileSettings } from '../components/profile/ProfileSettings';
import './Dashboard.css';

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const data = await dashboardService.getBuyerDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (
        user.role === 'agent' || 
        user.role === 'seller' || 
        profile?.user_type === 'agent' || 
        profile?.user_type === 'seller'
      ) {
        navigate('/agent-dashboard');
      } else {
        fetchDashboardData();
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) return null;
  if (!user) return null;

  const userProperties = dashboardData?.savedProperties || [];
  const recentlyViewed = dashboardData?.recentlyViewed || [];
  const recommendedListings = dashboardData?.recommendedListings || [];
  const notifications = dashboardData?.notifications || [];
  const messages = dashboardData?.messages || [];
  const upcomingViewings = dashboardData?.upcomingViewings || [];
  const profileSummary = { ...(dashboardData?.profileSummary || {}), ...(profile || {}) };

  const stats = [
    {
      icon: <Home size={22} />,
      label: 'Saved Properties',
      value: userProperties.length,
      trend: null
    },
    {
      icon: <History size={22} />,
      label: 'Recently Viewed',
      value: recentlyViewed.length,
      trend: null
    },
    {
      icon: <MessageSquare size={22} />,
      label: 'Messages',
      value: messages.length,
      trend: null
    },
    {
      icon: <Calendar size={22} />,
      label: 'Viewings',
      value: upcomingViewings.length,
      trend: null
    }
  ];

  const quickActions = [
    {
      icon: <Search size={20} />,
      title: 'Browse Properties',
      desc: 'Explore available listings',
      onClick: () => navigate('/properties')
    },
    {
      icon: <Wallet size={20} />,
      title: 'Connect Wallet',
      desc: 'Link your crypto wallet',
      onClick: () => setActiveTab('wallet')
    },
    {
      icon: <PlusCircle size={20} />,
      title: 'List a Property',
      desc: 'Add your own listing',
      onClick: () => setActiveTab('properties')
    },
    {
      icon: <Settings size={20} />,
      title: 'Edit Profile',
      desc: 'Update your information',
      onClick: () => setActiveTab('profile')
    }
  ];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        if (dashboardLoading) {
          return (
            <div className="dashboard-content">
              <div className="dashboard-loading">Loading dashboard...</div>
            </div>
          );
        }
        return (
          <div className="dashboard-content">
            {/* Welcome */}
            <div className="welcome-section">
              <div>
                <h1 className="welcome-title">
                  Welcome back, <span className="welcome-name">{profileSummary?.name || user?.email?.split('@')[0] || 'User'}!</span>
                </h1>
                <p className="welcome-subtitle">Here's what's happening with your SuDomus account today.</p>
              </div>
              <span className="date-display">{today}</span>
            </div>

            {/* Profile summary banner */}
            <div className="profile-summary-banner" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#a0aec0', textTransform: 'uppercase', fontWeight: '600' }}>Account Level</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{profileSummary?.role || profileSummary?.user_type || 'Buyer'}</span>
                  <span style={{ fontSize: '0.75rem', background: profileSummary?.kyc_status === 'approved' ? '#10b981' : '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                    KYC: {profileSummary?.kyc_status || 'not verified'}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#a0aec0', textTransform: 'uppercase', fontWeight: '600' }}>Connected Wallet</span>
                <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '0.9rem', color: '#e2e8f0' }}>
                  {profileSummary?.wallet_address 
                    ? `${profileSummary.wallet_address.slice(0, 8)}...${profileSummary.wallet_address.slice(-8)}`
                    : 'No wallet connected'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-info">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2 className="section-heading">Quick Actions</h2>
              <div className="actions-grid">
                {quickActions.map((a, i) => (
                  <button className="action-card" key={i} onClick={a.onClick}>
                    <div className="action-icon-box">{a.icon}</div>
                    <div className="action-text">
                      <h3>{a.title}</h3>
                      <p>{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Three-column Dashboard section for Saved, Recently Viewed, and Recommended */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              
              {/* Saved Properties */}
              <div style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)' }}>
                <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Home size={18} /> Saved Properties</span>
                  <button onClick={() => setActiveTab('properties')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.9rem' }}>View All</button>
                </h3>
                {userProperties.length === 0 ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No saved properties yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {userProperties.slice(0, 3).map(property => (
                      <div key={property.id} onClick={() => navigate(`/properties/${property.id}`)} style={{ display: 'flex', gap: '12px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                        <img src={property.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80'} alt={property.title} style={{ width: '80px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80'; }} />
                        <div>
                          <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{property.title}</h4>
                          <p style={{ fontSize: '0.8rem', color: '#a0aec0', margin: '2px 0 0 0' }}>{property.city}, {property.state}</p>
                          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>₦{parseFloat(property.price).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recently Viewed */}
              <div style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)' }}>
                <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} /> Recently Viewed
                </h3>
                {recentlyViewed.length === 0 ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No recently viewed properties.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recentlyViewed.slice(0, 3).map(property => (
                      <div key={property.id} onClick={() => navigate(`/properties/${property.id}`)} style={{ display: 'flex', gap: '12px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                        <img src={property.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80'} alt={property.title} style={{ width: '80px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80'; }} />
                        <div>
                          <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{property.title}</h4>
                          <p style={{ fontSize: '0.8rem', color: '#a0aec0', margin: '2px 0 0 0' }}>{property.city}, {property.state}</p>
                          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>₦{parseFloat(property.price).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Listings */}
              <div style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)' }}>
                <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} /> Recommended Listings
                </h3>
                {recommendedListings.length === 0 ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No recommendations available.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recommendedListings.slice(0, 3).map(property => (
                      <div key={property.id} onClick={() => navigate(`/properties/${property.id}`)} style={{ display: 'flex', gap: '12px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                        <img src={property.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80'} alt={property.title} style={{ width: '80px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80'; }} />
                        <div>
                          <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{property.title}</h4>
                          <p style={{ fontSize: '0.8rem', color: '#a0aec0', margin: '2px 0 0 0' }}>{property.city}, {property.state}</p>
                          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>₦{parseFloat(property.price).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Grid for Notifications, Messages, and Upcoming Viewings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              
              {/* Notifications */}
              <div style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)' }}>
                <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} /> Notifications
                </h3>
                {notifications.length === 0 ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No new notifications.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.slice(0, 5).map(notif => (
                      <div key={notif.id} style={{ padding: '0.75rem', borderRadius: '8px', background: notif.is_read ? 'rgba(255,255,255,0.01)' : 'rgba(99,102,241,0.05)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: notif.is_read ? '500' : 'bold' }}>{notif.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#a0aec0', margin: '2px 0 0 0' }}>{notif.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)' }}>
                <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} /> Messages
                </h3>
                {messages.length === 0 ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No conversations started yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {messages.slice(0, 5).map(msg => (
                      <div key={msg.id} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{msg.sender_name}</span>
                          <span style={{ color: '#a0aec0' }}>{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0 }}>"{msg.message}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Viewings */}
              <div style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)' }}>
                <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} /> Upcoming Viewings
                </h3>
                {upcomingViewings.length === 0 ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No viewings scheduled.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {upcomingViewings.slice(0, 5).map(appt => (
                      <div key={appt.id} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 'bold', textTransform: 'uppercase' }}>{appt.status}</span>
                        <h4 style={{ margin: '2px 0 0 0', fontSize: '0.9rem' }}>{appt.listing_title}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a0aec0', marginTop: '6px' }}>
                          <span>Agent: {appt.agent_name}</span>
                          <span>{new Date(appt.appointment_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        );

      case 'properties':
        return (
          <div className="dashboard-content">
            <h2 className="dashboard-title">Saved Properties</h2>
            {userProperties.length > 0 ? (
              <div className="properties-grid">
                {userProperties.map(property => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    onFavoriteChange={(propId, isFav) => {
                      if (!isFav) {
                        setDashboardData(prev => prev ? ({
                          ...prev,
                          savedProperties: prev.savedProperties.filter(p => p.id !== propId)
                        }) : prev);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-box"><Home size={36} color="#6366f1" /></div>
                <h3 className="empty-title">No Properties Yet</h3>
                <p className="empty-desc">Start exploring and save your favorite properties!</p>
                <button className="primary-button" onClick={() => navigate('/properties')}>
                  Browse Properties
                </button>
              </div>
            )}
          </div>
        );

      case 'wallet':
        return (
          <div className="dashboard-content">
            <h2 className="dashboard-title">Wallet Management</h2>
            <WalletManager />
          </div>
        );

      case 'profile':
        return (
          <ProfileSettings
            onProfileUpdated={(updatedUser) => {
              setDashboardData(prev => prev ? ({
                ...prev,
                profileSummary: {
                  ...prev.profileSummary,
                  name: updatedUser.name
                }
              }) : prev);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setMobileOpen(false); }}
        userType={profile?.user_type}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(prev => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className={`dashboard-main ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Mobile Header */}
        <div className="mobile-header">
          <div className="mobile-brand">
            <Home size={20} className="mobile-brand-icon" style={{ color: '#8b5cf6' }} />
            <span className="mobile-brand-text">SuDomus</span>
          </div>
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
