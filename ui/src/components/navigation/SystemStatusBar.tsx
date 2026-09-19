// src/components/navigation/SystemStatusBar.tsx
// Persistent, subtle system status indicator showing real-time network, contract, indexer, and proof server health

'use client';

import React, { useState } from 'react';
import { useMedProofData } from '../../context/MedProofDataContext';
import { useWallet } from '../../context/WalletContext';

export function SystemStatusBar() {
  const { systemStatus, refreshSystemStatus } = useMedProofData();
  const { wallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const shortAddr = (addr: string | null) => {
    if (!addr) return 'None';
    if (addr.length <= 14) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  const copyContract = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(systemStatus.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSystemStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <footer className="system-status-bar" role="contentinfo" aria-label="System Blockchain Status">
      <div className="system-status-items">
        {/* Network Target */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="status-dot status-dot-green" title="Active Network" />
          <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>NETWORK:</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{systemStatus.network}</span>
        </div>

        {/* Contract Address */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>CONTRACT:</span>
          <button
            onClick={copyContract}
            title="Click to copy canonical contract address"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
            }}
          >
            <span>{shortAddr(systemStatus.contractAddress)}</span>
            <span style={{ color: copied ? '#34d399' : 'var(--text-muted)', fontSize: '10px' }}>
              {copied ? '✓ Copied' : '📋'}
            </span>
          </button>
        </div>

        {/* Midnight Lace Wallet */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className={`status-dot ${wallet.status === 'CONNECTED' ? 'status-dot-green' : 'status-dot-amber'}`}
            title={wallet.status === 'CONNECTED' ? 'Lace Connected' : 'Lace Disconnected'}
          />
          <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>LACE:</span>
          <span style={{ color: wallet.status === 'CONNECTED' ? '#34d399' : '#fbbf24', fontWeight: 500 }}>
            {wallet.status === 'CONNECTED' ? shortAddr(wallet.address) : 'Disconnected'}
          </span>
        </div>

        {/* Indexer Status */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className={`status-dot ${systemStatus.indexerOnline ? 'status-dot-green' : 'status-dot-amber'}`}
            title="GraphQL Preprod Indexer"
          />
          <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>INDEXER:</span>
          <span style={{ color: systemStatus.indexerOnline ? '#34d399' : 'var(--text-muted)' }}>
            {systemStatus.indexerOnline ? 'Online' : 'Unreachable'}
          </span>
        </div>

        {/* Proof Server Status */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className={`status-dot ${systemStatus.proofServerOnline ? 'status-dot-green' : 'status-dot-amber'}`}
            title="Midnight Local Proof Server (:6300)"
          />
          <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>PROOF SERVER:</span>
          <span style={{ color: systemStatus.proofServerOnline ? '#34d399' : '#fbbf24' }}>
            {systemStatus.proofServerOnline ? 'Ready (:6300)' : 'Offline / Standby'}
          </span>
        </div>
      </div>

      {/* Sync Refresh Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
          Checked: {systemStatus.lastChecked}
        </span>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          title="Re-check network and service endpoints"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            fontSize: '10px',
            padding: '2px 6px',
            cursor: 'pointer',
          }}
        >
          {isRefreshing ? 'Checking...' : '🔄'}
        </button>
      </div>
    </footer>
  );
}
