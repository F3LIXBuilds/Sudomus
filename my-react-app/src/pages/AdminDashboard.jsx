import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/api';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (user?.role !== 'admin') {
    return <div className="admin-access-denied">Access Denied</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <Navbar />
      <div className="admin-dashboard-layout">
        <aside className="admin-sidebar">
          <h2>Admin Panel</h2>
          <nav>
            <button 
              className={activeTab === 'overview' ? 'active' : ''} 
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={activeTab === 'listings' ? 'active' : ''} 
              onClick={() => setActiveTab('listings')}
            >
              Listings Queue
            </button>
            <button 
              className={activeTab === 'verification' ? 'active' : ''} 
              onClick={() => setActiveTab('verification')}
            >
              Verification Queue
            </button>
            <button 
              className={activeTab === 'audit' ? 'active' : ''} 
              onClick={() => setActiveTab('audit')}
            >
              Activity Log
            </button>
          </nav>
        </aside>

        <main className="admin-main-content">
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'listings' && <AdminListings />}
          {activeTab === 'verification' && <AdminVerification />}
          {activeTab === 'audit' && <AdminAuditLog />}
        </main>
      </div>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getStats();
        setStats(res);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="admin-loading">Loading stats...</div>;
  if (!stats) return <div className="admin-error">Failed to load stats.</div>;

  return (
    <div className="admin-overview">
      <h2>Platform Overview</h2>
      
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3>Total Users</h3>
          <p className="admin-stat-value">{stats.users.total_users}</p>
          <div className="admin-stat-details">
            <span>Agents: {stats.users.total_agents}</span>
            <span>Sellers: {stats.users.total_sellers}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <h3>Listings</h3>
          <p className="admin-stat-value">{stats.listings.total_listings}</p>
          <div className="admin-stat-details">
            <span>Published: {stats.listings.published_listings}</span>
            <span>Pending Review: {stats.listings.pending_review}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <h3>Verification</h3>
          <p className="admin-stat-value">{stats.verification.pending_kyc}</p>
          <p className="admin-stat-label">Pending KYC</p>
        </div>

        <div className="admin-stat-card">
          <h3>Activity</h3>
          <div className="admin-stat-details">
            <span>Views: {stats.activity.total_views}</span>
            <span>Favorites: {stats.activity.total_favorites}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getListings();
      setListings(res);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminService.approveListing(id);
      alert('Listing approved successfully');
      fetchListings();
    } catch {
      alert('Failed to approve listing');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await adminService.rejectListing(id, rejectReason);
      alert('Listing rejected successfully');
      setRejectId(null);
      setRejectReason('');
      fetchListings();
    } catch {
      alert('Failed to reject listing');
    }
  };

  if (loading) return <div className="admin-loading">Loading listings...</div>;

  return (
    <div className="admin-listings">
      <h2>Listings Queue</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(l => (
              <tr key={l.id}>
                <td>{l.title} <span className="admin-meta">({l.property_type} - {l.listing_type})</span></td>
                <td>{l.owner_name} <br/><small>{l.owner_email}</small></td>
                <td><span className={`admin-badge status-${l.status}`}>{l.status}</span></td>
                <td><span className={`admin-badge ver-${l.verification_status}`}>{l.verification_status}</span></td>
                <td>
                  <div className="admin-actions">
                    <button className="btn-approve" onClick={() => handleApprove(l.id)}>Approve</button>
                    <button className="btn-reject" onClick={() => setRejectId(l.id)}>Reject</button>
                    {rejectId === l.id && (
                      <div className="admin-reject-box">
                        <textarea 
                          placeholder="Reason for rejection..." 
                          value={rejectReason} 
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <button onClick={() => handleReject(l.id)}>Confirm Reject</button>
                        <button className="btn-cancel" onClick={() => setRejectId(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminVerification() {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchKycs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getKycs();
      setKycs(res);
    } catch (err) {
      console.error('Failed to load KYCs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycs();
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminService.approveKyc(id);
      alert('KYC approved successfully');
      fetchKycs();
    } catch {
      alert('Failed to approve KYC');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await adminService.rejectKyc(id, rejectReason);
      alert('KYC rejected successfully');
      setRejectId(null);
      setRejectReason('');
      fetchKycs();
    } catch {
      alert('Failed to reject KYC');
    }
  };

  if (loading) return <div className="admin-loading">Loading verification queue...</div>;

  return (
    <div className="admin-verification">
      <h2>Verification Queue</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Document</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kycs.map(k => (
              <tr key={k.id}>
                <td>{k.name} <br/><small>{k.email}</small></td>
                <td>{k.role}</td>
                <td>
                  <a href={k.document_url} target="_blank" rel="noreferrer">View {k.document_type}</a>
                </td>
                <td><span className={`admin-badge ver-${k.status}`}>{k.status}</span></td>
                <td>{new Date(k.uploaded_at).toLocaleDateString()}</td>
                <td>
                  <div className="admin-actions">
                    <button className="btn-approve" onClick={() => handleApprove(k.id)}>Approve</button>
                    <button className="btn-reject" onClick={() => setRejectId(k.id)}>Reject</button>
                    {rejectId === k.id && (
                      <div className="admin-reject-box">
                        <textarea 
                          placeholder="Reason for rejection..." 
                          value={rejectReason} 
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <button onClick={() => handleReject(k.id)}>Confirm Reject</button>
                        <button className="btn-cancel" onClick={() => setRejectId(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await adminService.getAuditLogs();
        setLogs(res);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="admin-loading">Loading audit logs...</div>;

  return (
    <div className="admin-audit">
      <h2>Activity Log</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.admin_name} <br/><small>{log.admin_email}</small></td>
                <td><strong>{log.action}</strong></td>
                <td>{log.target_type} ({log.target_id.slice(0, 8)}...)</td>
                <td>{log.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
