import React from 'react';
import type { WalletState, TabType } from '../types';

interface HeaderProps {
  network: string;
  wallet: WalletState | null;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onConnectWallet: () => void;
  onDisconnect: () => void;
}

export function Header({ network, wallet, activeTab, onSelectTab, onConnectWallet, onDisconnect }: HeaderProps) {
  const networkColors: Record<string, string> = {
    undeployed: '#34d399',
    preview: '#fb923c',
    preprod: '#a78bfa',
    mainnet: '#4da6ff',
  };
  const dotColor = networkColors[network] || '#34d399';

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <div className="logo" onClick={() => onSelectTab('analytics')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">💊</div>
            <div>
              <div className="logo-text">RxVerify</div>
              <div className="logo-sub">Midnight Confidential Healthcare</div>
            </div>
          </div>

          <nav className="header-nav">
            <button
              className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => onSelectTab('analytics')}
            >
              📊 Telemetry
            </button>
            <button
              className={`nav-tab ${activeTab === 'doctor' ? 'active' : ''}`}
              onClick={() => onSelectTab('doctor')}
            >
              👨‍⚕️ Doctor Portal
            </button>
            <button
              className={`nav-tab ${activeTab === 'patient' ? 'active' : ''}`}
              onClick={() => onSelectTab('patient')}
            >
              😷 Patient View
            </button>
            <button
              className={`nav-tab ${activeTab === 'pharmacy' ? 'active' : ''}`}
              onClick={() => onSelectTab('pharmacy')}
            >
              🏥 Pharmacy Portal
            </button>
            <button
              className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => onSelectTab('history')}
            >
              📜 Audit History
            </button>
            <button
              className={`nav-tab ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => onSelectTab('privacy')}
            >
              🔒 Privacy Model
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="network-badge">
              <div className="network-dot" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
              <span style={{ color: dotColor, fontWeight: 500 }}>{network}</span>
            </div>

            {wallet ? (
              <button
                id="wallet-disconnect-btn"
                className="btn btn-sm btn-outline"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            ) : (
              <button
                id="header-connect-btn"
                className="btn btn-sm btn-primary"
                onClick={onConnectWallet}
              >
                👛 Connect Lace
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}