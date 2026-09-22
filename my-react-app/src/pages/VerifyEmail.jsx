import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import './VerifyEmail.css';
import config from '../config';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('VERIFYING'); // VERIFYING, SUCCESS, ERROR
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      setMessage('Verification link is invalid or missing token.');
      return;
    }
    
    const verifyToken = async () => {
      try {
        const response = await fetch(`${config.API_URL}/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus('SUCCESS');
          setMessage('Email verified successfully. Your SuDomus account is now verified.');
        } else {
          setStatus('ERROR');
          setMessage(data.message || 'Verification link is invalid or has expired.');
        }
      } catch (error) {
        setStatus('ERROR');
        setMessage('Network error occurred. Please try again.');
      }
    };
    
    verifyToken();
  }, [token]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        {status === 'VERIFYING' && (
          <div className="verify-email-content">
            <Loader className="verify-icon spinning" size={64} />
            <h2>Verifying Email</h2>
            <p>{message}</p>
          </div>
        )}
        
        {status === 'SUCCESS' && (
          <div className="verify-email-content success">
            <CheckCircle className="verify-icon success-icon" size={64} />
            <h2>Verification Complete</h2>
            <p>{message}</p>
            <button className="verify-btn" onClick={() => navigate('/login')}>
              Continue to Login
            </button>
          </div>
        )}
        
        {status === 'ERROR' && (
          <div className="verify-email-content error">
            <XCircle className="verify-icon error-icon" size={64} />
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <button className="verify-btn secondary" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
