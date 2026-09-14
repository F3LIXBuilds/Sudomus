import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle2, AlertCircle, Edit2, LogOut } from 'lucide-react';
import './ProfileSettings.css';

export function ProfileSettings({ onProfileUpdated }) {
  const { user, profile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentDisplayName = profile?.name || user?.name || '';

  // Keep local input in sync when profile updates and user is not actively editing
  useEffect(() => {
    if (!isEditing) {
      setNameInput(currentDisplayName);
    }
  }, [currentDisplayName, isEditing]);

  const handleStartEdit = () => {
    setNameInput(currentDisplayName);
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setNameInput(currentDisplayName);
    setErrorMsg('');
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMsg('Name must be 100 characters or less.');
      return;
    }

    // If unchanged, simply close edit mode
    if (trimmedName === currentDisplayName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await updateProfile({ name: trimmedName });
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully.');
      if (onProfileUpdated && typeof onProfileUpdated === 'function') {
        onProfileUpdated(updatedUser);
      }
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard-content">
      <h2 className="dashboard-title">Profile Settings</h2>

      {successMsg && (
        <div className="profile-alert profile-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="profile-alert profile-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="profile-section">
        <h3 className="profile-section-title">Personal Information</h3>

        {isEditing ? (
          <form onSubmit={handleSave}>
            <div className="profile-details">
              <div className="profile-detail">
                <label htmlFor="profile-name-input" className="detail-label">
                  Name
                </label>
                <div>
                  <input
                    id="profile-name-input"
                    type="text"
                    className="profile-input"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    disabled={isSaving}
                    placeholder="Enter your name"
                    autoFocus
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="profile-detail">
                <span className="detail-label">Email</span>
                <span className="detail-value text-muted">
                  {user?.email}
                  <span className="detail-note">(Cannot be changed)</span>
                </span>
              </div>

              <div className="profile-detail">
                <span className="detail-label">User Type</span>
                <span className="detail-value capitalize">
                  {profile?.user_type || user?.role || 'user'}
                </span>
              </div>

              {profile?.wallet_address && (
                <div className="profile-detail">
                  <span className="detail-label">Wallet</span>
                  <span className="detail-value wallet-address">
                    {profile.wallet_address.slice(0, 8)}...{profile.wallet_address.slice(-8)}
                  </span>
                </div>
              )}
            </div>

            <div className="profile-buttons-row">
              <button
                type="submit"
                className="save-profile-button"
                disabled={isSaving}
                id="save-profile-btn"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="cancel-profile-button"
                onClick={handleCancel}
                disabled={isSaving}
                id="cancel-profile-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-details">
              <div className="profile-detail">
                <span className="detail-label">Name</span>
                <span className="detail-value">{currentDisplayName || 'Not set'}</span>
              </div>

              <div className="profile-detail">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>

              <div className="profile-detail">
                <span className="detail-label">User Type</span>
                <span className="detail-value capitalize">
                  {profile?.user_type || user?.role || 'user'}
                </span>
              </div>

              {profile?.wallet_address && (
                <div className="profile-detail">
                  <span className="detail-label">Wallet</span>
                  <span className="detail-value wallet-address">
                    {profile.wallet_address.slice(0, 8)}...{profile.wallet_address.slice(-8)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="edit-profile-button"
              onClick={handleStartEdit}
              id="edit-profile-btn"
            >
              <Edit2 size={16} /> Edit Profile
            </button>
          </>
        )}
      </div>

      <div className="profile-section" style={{ marginTop: '1.5rem' }}>
        <h3 className="profile-section-title">Account Actions</h3>
        <button
          type="button"
          className="logout-button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          id="profile-logout-btn"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default ProfileSettings;
