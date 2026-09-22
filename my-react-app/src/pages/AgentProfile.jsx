import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { PropertyCard } from '../components/properties/PropertyCard';
import { listingsService } from '../services/api';
import { 
  ShieldCheck, 
  Building2, 
  Calendar, 
  ArrowLeft, 
  Home, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import './AgentProfile.css';

export default function AgentProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [agentData, setAgentData] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchAgentProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listingsService.getAgentProfile(userId);
        if (isMounted) {
          setAgentData(data.agent);
          setListings(Array.isArray(data.listings) ? data.listings : []);
        }
      } catch (err) {
        console.error('Failed to load agent profile:', err);
        if (isMounted) {
          setError(err.message || 'Agent profile could not be found.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAgentProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="agent-profile-page">
          <div className="agent-profile-loading">
            <div className="loader"></div>
            <p>Loading agent profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !agentData) {
    return (
      <>
        <Navbar />
        <div className="agent-profile-page">
          <div className="agent-profile-error-box">
            <AlertCircle size={48} className="error-icon" />
            <h2>Agent Profile Unavailable</h2>
            <p>{error || 'The requested agent or seller profile could not be found.'}</p>
            <button onClick={() => navigate('/properties')} className="back-btn">
              <ArrowLeft size={16} /> Return to Marketplace
            </button>
          </div>
        </div>
      </>
    );
  }

  const memberSinceYear = agentData.memberSince
    ? new Date(agentData.memberSince).getFullYear()
    : new Date().getFullYear();

  const roleTitle = agentData.role === 'seller' ? 'Verified Seller' : 'Real Estate Agent';
  const listingCount = agentData.publishedCount ?? listings.length;

  return (
    <>
      <Navbar />
      <div className="agent-profile-page">
        {/* Navigation Bar */}
        <div className="agent-profile-nav">
          <button onClick={() => navigate(-1)} className="agent-back-btn" aria-label="Go back">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="agent-breadcrumb">
            <Link to="/properties">Properties</Link>
            <span>/</span>
            <span className="current">{agentData.name}</span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="agent-hero-card">
          <div className="agent-hero-main">
            <div className="agent-avatar-container">
              {agentData.avatar ? (
                <img 
                  src={agentData.avatar} 
                  alt={agentData.name} 
                  className="agent-avatar-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="agent-avatar-fallback">
                  {agentData.name ? agentData.name[0].toUpperCase() : 'A'}
                </div>
              )}
              {agentData.verified && (
                <div className="agent-avatar-verified-badge" title="Identity Verified by SuDomus">
                  <ShieldCheck size={18} />
                </div>
              )}
            </div>

            <div className="agent-hero-info">
              <div className="agent-title-row">
                <h1 className="agent-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {agentData.name}
                  {agentData.verified && (
                    <ShieldCheck size={24} color="#10b981" title="Verified Agent" />
                  )}
                </h1>
                {agentData.verified ? (
                  <span className="agent-verified-pill">
                    <CheckCircle2 size={15} /> Verified Agent
                  </span>
                ) : (
                  <span className="agent-standard-pill">
                    Member
                  </span>
                )}
              </div>

              <p className="agent-role-subtitle">
                <Building2 size={16} />
                <span>{roleTitle} • SuDomus Partner</span>
              </p>

              {agentData.bio && (
                <p className="agent-bio-text">{agentData.bio}</p>
              )}

              <div className="agent-meta-stats">
                <div className="meta-stat-item">
                  <span className="meta-stat-value">{listingCount}</span>
                  <span className="meta-stat-label">Properties Listed</span>
                </div>
                <div className="meta-stat-divider" />
                <div className="meta-stat-item">
                  <Calendar size={18} className="meta-icon" />
                  <span className="meta-stat-label">Member since {memberSinceYear}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Published Listings Section */}
        <div className="agent-listings-section">
          <div className="agent-listings-header">
            <div>
              <h2 className="section-title">Properties Listed by {agentData.name}</h2>
              <p className="section-subtitle">
                Showing {listings.length} publicly available {listings.length === 1 ? 'property' : 'properties'}
              </p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="agent-empty-listings">
              <Home size={40} className="empty-icon" />
              <h3>No Active Properties</h3>
              <p>{agentData.name} does not have any publicly listed properties at this time.</p>
              <button onClick={() => navigate('/properties')} className="browse-all-btn">
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="agent-listings-grid">
              {listings.map((listing) => (
                <PropertyCard key={listing.id} property={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
