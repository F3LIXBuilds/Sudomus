import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/dashboard/Sidebar';
import { 
  Home, 
  Eye, 
  Heart, 
  MessageSquare, 
  Calendar, 
  Bell, 
  FileText, 
  CheckCircle, 
  PlusCircle, 
  Trash2, 
  Edit 
} from 'lucide-react';
import { AgentKYCManager } from '../components/kyc/AgentKYCManager';
import { PropertyForm } from '../components/properties/PropertyForm';
import { PropertyCard } from '../components/properties/PropertyCard';
import { listingsService, dashboardService } from '../services/api';
import { ProfileSettings } from '../components/profile/ProfileSettings';
import './AgentDashboard.css';

export default function AgentDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProperty, setEditingProperty] = useState(null);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const data = await dashboardService.getAgentDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const isAgentOrSeller = user && (
    user.role === 'agent' ||
    user.role === 'seller' ||
    profile?.user_type === 'agent' ||
    profile?.user_type === 'seller'
  );

  // Authorization check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isAgentOrSeller) {
        navigate('/dashboard');
      }
    }
  }, [user, profile, authLoading, navigate, isAgentOrSeller]);

  // Fetch listings function
  const fetchListings = async () => {
    setListingsLoading(true);
    setError('');
    try {
      const data = await listingsService.getMyListings();
      setListings(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch listings.');
    } finally {
      setListingsLoading(false);
    }
  };

  // Fetch on mount / tab change
  useEffect(() => {
    if (user && (profile?.user_type === 'agent' || profile?.user_type === 'seller')) {
      if (activeTab === 'overview') {
        fetchDashboardData();
      } else if (activeTab === 'properties') {
        fetchListings();
      }
    }
  }, [user, profile, activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await listingsService.deleteListing(id);
      setListings(prev => prev.filter(item => item.id !== id));
      alert('Listing deleted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to delete listing.');
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setActiveTab('create-property');
  };

  const handleCreateNewClick = () => {
    setEditingProperty(null);
    setActiveTab('create-property');
  };

  if (authLoading) return null;
  if (!user || (profile?.user_type !== 'agent' && profile?.user_type !== 'seller')) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="agent-dashboard-content">
            <div className="dashboard-header">
              <h2 className="dashboard-title">Dashboard Overview</h2>
              <button onClick={handleCreateNewClick} className="create-property-button">
                + Add New Property
              </button>
            </div>

            {dashboardLoading ? (
              <div className="dashboard-loading">Loading analytics...</div>
            ) : !dashboardData ? (
              <div className="dashboard-error-banner">Failed to load dashboard data.</div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon"><Home size={22} /></div>
                    <div className="stat-info">
                      <div className="stat-value">{dashboardData.stats.totalListings}</div>
                      <div className="stat-label">Total Listings</div>
                      <div className="stat-subtext" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>
                        <span className="badge-pub">{dashboardData.stats.publishedListings} Published</span> • 
                        <span className="badge-draft"> {dashboardData.stats.draftListings} Drafts</span>
                        {dashboardData.stats.pendingListings !== undefined && (
                          <> • <span className="badge-pending" style={{ color: '#fbbf24' }}>{dashboardData.stats.pendingListings} Pending</span></>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon"><Eye size={22} /></div>
                    <div className="stat-info">
                      <div className="stat-value">{dashboardData.stats.totalViews}</div>
                      <div className="stat-label">Total Views</div>
                      <div className="stat-subtext" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Across active properties</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon"><Heart size={22} /></div>
                    <div className="stat-info">
                      <div className="stat-value">{dashboardData.stats.favorites}</div>
                      <div className="stat-label">Favorites</div>
                      <div className="stat-subtext" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Buyer bookmarks</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon"><MessageSquare size={22} /></div>
                    <div className="stat-info">
                      <div className="stat-value">{dashboardData.stats.messages}</div>
                      <div className="stat-label">Messages</div>
                      <div className="stat-subtext" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Inquiries from buyers</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon"><Calendar size={22} /></div>
                    <div className="stat-info">
                      <div className="stat-value">{dashboardData.stats.appointments}</div>
                      <div className="stat-label">Appointments</div>
                      <div className="stat-subtext" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Visits scheduled</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon"><Bell size={22} /></div>
                    <div className="stat-info">
                      <div className="stat-value">{dashboardData.stats.notifications}</div>
                      <div className="stat-label">Notifications</div>
                      <div className="stat-subtext" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Unread updates</div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Split Sections */}
                <div className="dashboard-sections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                  
                  {/* Recent Listings */}
                  <div className="dashboard-section-box" style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)' }}>
                    <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Home size={18} /> Recent Listings</span>
                      <button onClick={() => setActiveTab('properties')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.9rem' }}>View All</button>
                    </h3>
                    {dashboardData.recentListings.length === 0 ? (
                      <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No listings created yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {dashboardData.recentListings.map(listing => (
                          <div key={listing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{listing.title}</h4>
                              <p style={{ fontSize: '0.85rem', color: '#a0aec0', margin: '4px 0 0 0' }}>
                                {listing.city}, {listing.state} • <span style={{ color: '#10b981', fontWeight: '500' }}>₦{parseFloat(listing.price).toLocaleString()}</span>
                              </p>
                              <span className={`status-badge status-${listing.status}`} style={{ display: 'inline-block', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', marginTop: '6px' }}>
                                {listing.status}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleEdit(listing)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <Edit size={14} /> Edit
                              </button>
                              <button onClick={() => handleDelete(listing.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Messages */}
                  <div className="dashboard-section-box" style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)' }}>
                    <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} /> Recent Messages
                    </h3>
                    {dashboardData.recentMessages.length === 0 ? (
                      <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No messages received yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {dashboardData.recentMessages.map(msg => (
                          <div key={msg.id} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{msg.sender_name}</span>
                              <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{new Date(msg.created_at).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0 }}>"{msg.message}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="dashboard-section-box" style={{ background: 'var(--card-bg, #1a1f2c)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color, #2d3748)', marginTop: '1.5rem' }}>
                  <h3 className="section-heading" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} /> Upcoming Appointments
                  </h3>
                  {dashboardData.upcomingAppointments.length === 0 ? (
                    <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>No upcoming viewings scheduled.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {dashboardData.upcomingAppointments.map(appt => (
                        <div key={appt.id} style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6366f1', fontWeight: 'bold' }}>{appt.status}</span>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{appt.listing_title}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#a0aec0', marginTop: '4px' }}>
                            <span>Buyer: {appt.buyer_name}</span>
                            <span>{new Date(appt.appointment_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      case 'properties':
        return (
          <div className="agent-dashboard-content">
            <div className="dashboard-header">
              <h2 className="dashboard-title">My Listings</h2>
              <button onClick={handleCreateNewClick} className="create-property-button">
                + Add New Property
              </button>
            </div>

            {error && <div className="dashboard-error-banner">{error}</div>}

            {listingsLoading ? (
              <div className="dashboard-loading">Loading listings...</div>
            ) : listings.length === 0 ? (
              <div className="dashboard-empty-state">
                <p>You haven't listed any properties yet.</p>
                <button onClick={handleCreateNewClick} className="primary-action-btn">
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="properties-grid">
                {listings.map(property => {
                  const mappedProperty = {
                    ...property,
                    image: '/api/placeholder/400/300',
                    area: property.land_size ? `${property.land_size} sq ft` : '0 sq ft'
                  };
                  return (
                    <div key={property.id} className="dashboard-property-card-container">
                      <PropertyCard property={mappedProperty} />
                      <div className="property-actions-bar">
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <span className={`status-badge status-${property.status}`}>
                            {property.status}
                          </span>
                          <span className={`status-badge status-${property.verification_status || 'pending'}`} style={{
                            backgroundColor: property.verification_status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: property.verification_status === 'rejected' ? '#dc2626' : '#4b5563'
                          }}>
                            Verification: {property.verification_status || 'pending'}
                          </span>
                        </div>
                        <div className="action-buttons">
                          <button onClick={() => handleEdit(property)} className="edit-btn">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(property.id)} className="delete-btn">
                            Delete
                          </button>
                        </div>
                      </div>
                      {property.verification_status === 'rejected' && property.rejection_reason && (
                        <div style={{ padding: '12px', marginTop: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#dc2626', fontSize: '0.9rem' }}>
                          <strong>Action Required:</strong> {property.rejection_reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'create-property':
        return (
          <div className="agent-dashboard-content">
            <h2 className="dashboard-title">{editingProperty ? 'Edit Property Listing' : 'List New Property'}</h2>
            <PropertyForm
              property={editingProperty}
              onSuccess={() => {
                setEditingProperty(null);
                setActiveTab('properties');
              }}
              onCancel={() => {
                setEditingProperty(null);
                setActiveTab('properties');
              }}
            />
          </div>
        );
      case 'kyc':
        return (
          <div className="agent-dashboard-content">
            <h2 className="dashboard-title">KYC Verification</h2>
            <AgentKYCManager />
          </div>
        );
      case 'profile':
        return <ProfileSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType={profile?.user_type}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(prev => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main className={`dashboard-main ${isCollapsed ? 'collapsed' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
}

