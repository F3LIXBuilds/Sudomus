import React, { useState } from 'react';
import { CheckCircle, Circle, Upload } from 'lucide-react';
import './AgentKYCManager.css';

export function AgentKYCManager() {
  const [currentTier, setCurrentTier] = useState(1);
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

  const handleTierSubmit = (tierData) => {
    const tierKey = `tier${currentTier}`;
    setKycData(prev => ({
      ...prev,
      [tierKey]: { ...prev[tierKey], ...tierData, completed: true }
    }));
    
    if (currentTier < 3) setCurrentTier(currentTier + 1);
  };

  return (
    <div className="kyc-manager">
      <div className="kyc-progress">
        {tiers.map(tier => (
          <div key={tier.id} className="kyc-tier">
            <div className={`tier-indicator ${kycData[`tier${tier.id}`].completed ? 'tier-completed' : ''} ${currentTier === tier.id ? 'tier-current' : ''}`}>
              {kycData[`tier${tier.id}`].completed ? <CheckCircle size={20} /> : <Circle size={20} />}
            </div>
            <div className="tier-info">
              <h4 className="tier-title">{tier.title}</h4>
              <p className="tier-description">{tier.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="kyc-forms">
        {currentTier === 1 && <Tier1Form onSubmit={handleTierSubmit} data={kycData.tier1} />}
        {currentTier === 2 && <Tier2Form onSubmit={handleTierSubmit} data={kycData.tier2} />}
        {currentTier === 3 && <Tier3Form onSubmit={handleTierSubmit} data={kycData.tier3} />}
      </div>
    </div>
  );
}

function Tier1Form({ onSubmit, data }) {
  const [formData, setFormData] = useState(data);
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="kyc-form">
      <h3 className="form-title">Basic Business Information</h3>
      <div className="form-grid">
        <input type="text" placeholder="Business Name" value={formData.businessName} onChange={(e)=>setFormData({...formData,businessName:e.target.value})} className="form-input" required/>
        <input type="text" placeholder="Business Type" value={formData.businessType} onChange={(e)=>setFormData({...formData,businessType:e.target.value})} className="form-input" required/>
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
      <h3 className="form-title">Contact Verification</h3>
      <div className="form-grid">
        <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e)=>setFormData({...formData,phone:e.target.value})} className="form-input" required/>
        <input type="email" placeholder="Business Email" value={formData.email} onChange={(e)=>setFormData({...formData,email:e.target.value})} className="form-input" required/>
      </div>
      <button type="submit" className="form-submit-button">Continue to Tier 3</button>
    </form>
  );
}

function Tier3Form({ onSubmit, data }) {
  const [formData, setFormData] = useState(data);
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  const handleFileUpload = (field, file) => setFormData({...formData,[field]:file});

  return (
    <form onSubmit={handleSubmit} className="kyc-form">
      <h3 className="form-title">Document Verification</h3>

      <div className="file-upload-section">
        <label className="file-upload-label">
          Government Issued ID
          <div className="file-upload-area">
            <Upload size={24}/>
            <span>Upload ID Document</span>
            {formData.idDocument && <span className="file-name">{formData.idDocument.name}</span>}
          </div>
          <input type="file" onChange={(e)=>handleFileUpload('idDocument', e.target.files[0])} className="file-input" required/>
        </label>
      </div>

      <div className="file-upload-section">
        <label className="file-upload-label">
          Business License
          <div className="file-upload-area">
            <Upload size={24}/>
            <span>Upload Business License</span>
            {formData.businessLicense && <span className="file-name">{formData.businessLicense.name}</span>}
          </div>
          <input type="file" onChange={(e)=>handleFileUpload('businessLicense', e.target.files[0])} className="file-input" required/>
        </label>
      </div>

      <button type="submit" className="form-submit-button">Complete KYC Verification</button>
    </form>
  );
}
