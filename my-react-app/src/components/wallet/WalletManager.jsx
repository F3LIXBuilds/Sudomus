import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './WalletManager.css';

export function WalletManager() {
  const { profile, updateProfile } = useAuth();
  const [connected, setConnected] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState(profile?.wallet_address || '');

  const handleLinkWallet = () => {
    const mockPublicKey = 'ABCDE12345ABCDE12345';
    setWalletAddress(mockPublicKey);
    updateProfile({ wallet_address: mockPublicKey });
    setConnected(true);
  };

  const handleUnlinkWallet = () => {
    setWalletAddress(null);
    updateProfile({ wallet_address: null });
    setConnected(false);
  };

  return (
    <div className="wallet-manager">
      <div className="wallet-status-card">
        <h3 className="wallet-status-title">Wallet Status</h3>
        <div className="wallet-status-info">
          <div className="status-item">
            <span className="status-label">Connection:</span>
            <span className={`status-value ${connected ? 'status-connected' : 'status-disconnected'}`}>
              {connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          {walletAddress && (
            <div className="status-item">
              <span className="status-label">Wallet Address:</span>
              <span className="status-address">{walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</span>
            </div>
          )}
        </div>

        <div className="wallet-actions">
          {!connected ? (
            <button onClick={handleLinkWallet} className="wallet-connect-button">Connect Wallet</button>
          ) : (
            <>
              <button onClick={handleUnlinkWallet} className="wallet-unlink-button">Unlink Wallet</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
