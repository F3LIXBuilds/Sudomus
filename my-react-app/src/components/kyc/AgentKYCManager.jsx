import React, { useState, useEffect } from 'react';
import { kycService } from '../../services/api';
import {
  CheckCircle,
  Circle,
  FileCheck2,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  Building2
} from 'lucide-react';
import './AgentKYCManager.css';

export function AgentKYCManager() {
  const [currentTier, setCurrentTier] = useState(1);
  const [kycStatus, setKycStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kycData, setKycData] = useState({
    tier1: { completed: false, businessName: '', businessType: '' },
    tier2: { completed: false, phone: '', email: '' },
    tier3: { completed: false, idDocument: null, businessLicense: null }
  });

  const tiers = [
    { id: 1, title: 'Basic Registration', description: 'Business information and contact details' },
    { id: 2, title: 'Contact Verification', description: 'Phone and email confirmation' },
    { id: 3, title: 'Document Verification', description: 'ID and business license upload' }
  ];

  const fetchKycStatus = async () => {
    try {
      const records = await kycService.getMyKyc();
      if (records && records.length > 0) {
        const hasPending = records.some(r => r.status === 'pending');
        const hasRejected = records.some(r => r.status === 'rejected');
        const approvedRecords = records.filter(r => r.status === 'approved');
        
        if (hasPending) {
          setKycStatus('pending');
        } else if (hasRejected) {
          setKycStatus('rejected');
        } else if (approvedRecords.length >= 2) {
          setKycStatus('approved');
        } else {
          setKycStatus(null);
        }
      } else {
        setKycStatus(null);
      }
    } catch (err) {
      console.error("Failed to fetch KYC status", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const handleTierSubmit = async (tierData) => {
    const tierKey = `tier${currentTier}`;
    setKycData(prev => ({
      ...prev,
      [tierKey]: { ...prev[tierKey], ...tierData, completed: true }
    }));
    
    if (currentTier < 3) {
      setCurrentTier(currentTier + 1);
    } else {
      setIsLoading(true);
      await fetchKycStatus();
    }
  };

  return (
    <div className="kyc-manager">
      <header className="kyc-header">
        <div className="kyc-header-icon"><ShieldCheck size={24} /></div>
        <div>
          <p className="kyc-eyebrow">Trust &amp; safety</p>
          <h2>KYC Verification</h2>
          <p className="kyc-subtitle">Complete your verification to build trust with buyers and sellers on SuDomus.</p>
        </div>
      </header>

      <div className="kyc-progress">
        {tiers.map(tier => (
          <React.Fragment key={tier.id}>
            <div className="kyc-tier">
            <div className={`tier-indicator ${kycData[`tier${tier.id}`].completed ? 'tier-completed' : ''} ${currentTier === tier.id ? 'tier-current' : ''}`}>
              {kycData[`tier${tier.id}`].completed ? <CheckCircle size={20} /> : <Circle size={20} />}
            </div>
            <div className="tier-info">
              <h4 className="tier-title">{tier.title}</h4>
              <p className="tier-description">{tier.description}</p>
            </div>
            </div>
            {tier.id < tiers.length && <span className={`tier-connector ${kycData[`tier${tier.id}`].completed ? 'connector-completed' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="kyc-forms">
        {isLoading ? (
          <div className="kyc-status-card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>Loading status...</div>
        ) : kycStatus === 'pending' ? (
          <div className="kyc-status-card pending" style={{ padding: '2rem', backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: '1px solid #f59e0b' }}>
            <h3 className="form-title" style={{ color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={20} /> KYC Submitted</h3>
            <p className="form-description" style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>Your Tier 3 verification has been submitted successfully and is currently pending review. You don't need to submit anything else at this time.</p>
            <div className="status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: '500', fontSize: '0.875rem' }}><Circle size={14} fill="currentColor" /> Status: Pending Review</div>
          </div>
        ) : kycStatus === 'approved' ? (
          <div className="kyc-status-card approved" style={{ padding: '2rem', backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: '1px solid #10b981' }}>
            <h3 className="form-title" style={{ color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={20} /> Verified</h3>
            <p className="form-description" style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>Your identity and business have been successfully verified. You now have full access to SuDomus features.</p>
            <div className="status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#d1fae5', color: '#047857', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: '500', fontSize: '0.875rem' }}><CheckCircle size={14} /> Status: Verified</div>
          </div>
        ) : (
          <>
            {kycStatus === 'rejected' && (
              <div className="kyc-status-card rejected" style={{ padding: '2rem', backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: '1px solid #ef4444', marginBottom: '1.5rem' }}>
                <h3 className="form-title" style={{ color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Action Required</h3>
                <p className="form-description" style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>Your previous KYC submission was rejected. Please review your documents and submit them again.</p>
                <div className="status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: '500', fontSize: '0.875rem' }}>Status: Action Required</div>
              </div>
            )}
            {currentTier === 1 && <Tier1Form onSubmit={handleTierSubmit} data={kycData.tier1} />}
            {currentTier === 2 && <Tier2Form onSubmit={handleTierSubmit} data={kycData.tier2} />}
            {currentTier === 3 && <Tier3Form onSubmit={handleTierSubmit} data={kycData.tier3} />}
          </>
        )}
      </div>
    </div>
  );
}

function Tier1Form({ onSubmit, data }) {
  const [formData, setFormData] = useState(data);
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="kyc-form">
      <div className="form-heading">
        <div className="form-heading-icon"><Building2 size={20} /></div>
        <div>
          <h3 className="form-title">Basic Business Information</h3>
          <p className="form-description">Tell us about the business you represent.</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="field-label">Business name
          <input type="text" placeholder="e.g. SuDomus Realty" value={formData.businessName} onChange={(e)=>setFormData({...formData,businessName:e.target.value})} className="form-input" required/>
        </label>
        <label className="field-label">Business type
          <input type="text" placeholder="e.g. Real estate agency" value={formData.businessType} onChange={(e)=>setFormData({...formData,businessType:e.target.value})} className="form-input" required/>
        </label>
      </div>
      <button type="submit" className="form-submit-button">Continue to Tier 2</button>
    </form>
  );
}

function Tier2Form({ onSubmit, data }) {
  const [formData, setFormData] = useState(data);
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="kyc-form">
      <div className="form-heading">
        <div className="form-heading-icon"><Phone size={20} /></div>
        <div>
          <h3 className="form-title">Contact Verification</h3>
          <p className="form-description">Confirm the contact details buyers can use to reach you.</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="field-label">Phone number
          <div className="input-with-icon"><Phone size={17} /><input type="tel" placeholder="+234 800 000 0000" value={formData.phone} onChange={(e)=>setFormData({...formData,phone:e.target.value})} className="form-input" required/></div>
        </label>
        <label className="field-label">Business email
          <div className="input-with-icon"><Mail size={17} /><input type="email" placeholder="you@business.com" value={formData.email} onChange={(e)=>setFormData({...formData,email:e.target.value})} className="form-input" required/></div>
        </label>
      </div>
      <button type="submit" className="form-submit-button">Continue to Tier 3</button>
    </form>
  );
}

function Tier3Form({ onSubmit, data }) {
  const [formData, setFormData] = useState(data);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (field, file) => {
    setFormData(prev => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.idDocument || !formData.businessLicense) {
      setError('Please upload both required documents.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      await kycService.uploadDocument(
        'government_id',
        formData.idDocument
      );

      await kycService.uploadDocument(
        'business_license',
        formData.businessLicense
      );

      onSubmit({
        ...formData,
        completed: true,
      });
    } catch (err) {
      console.error('KYC submission failed:', err);
      setError(err.message || 'Failed to submit KYC documents.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="kyc-form">
      <div className="form-heading">
        <div className="form-heading-icon"><FileCheck2 size={20} /></div>
        <div>
          <h3 className="form-title">Document Verification</h3>
          <p className="form-description">Securely submit the documents needed to verify your business.</p>
        </div>
      </div>

      {error && (
        <div className="kyc-error" role="alert">
          <Circle size={16} />
          {error}
        </div>
      )}

      <div className="file-upload-section">
        <label className="file-upload-label">
          <span className="upload-title"><FileText size={19} /> Government-issued ID</span>
          <span className="upload-description">Upload a valid government-issued identification document.</span>
          <span className="upload-meta">JPG, PNG, WEBP or PDF <span aria-hidden="true">·</span> Max 5MB</span>

          <div className="file-upload-area">
            <Upload size={24} />
            <span className="upload-action">Choose file</span>

            {formData.idDocument && (
              <span className="file-name">
                {formData.idDocument.name}
              </span>
            )}
          </div>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) =>
              handleFileUpload(
                'idDocument',
                e.target.files?.[0] || null
              )
            }
            className="file-input"
            required
          />
        </label>
      </div>

      <div className="file-upload-section">
        <label className="file-upload-label">
          <span className="upload-title"><FileCheck2 size={19} /> Business license</span>
          <span className="upload-description">Upload the current license or registration for your business.</span>
          <span className="upload-meta">JPG, PNG, WEBP or PDF <span aria-hidden="true">·</span> Max 5MB</span>

          <div className="file-upload-area">
            <Upload size={24} />
            <span className="upload-action">Choose file</span>

            {formData.businessLicense && (
              <span className="file-name">
                {formData.businessLicense.name}
              </span>
            )}
          </div>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) =>
              handleFileUpload(
                'businessLicense',
                e.target.files?.[0] || null
              )
            }
            className="file-input"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        className="form-submit-button"
        disabled={uploading}
      >
        {uploading
          ? 'Uploading documents...'
          : 'Complete KYC Verification'}
      </button>
    </form>
  );
}