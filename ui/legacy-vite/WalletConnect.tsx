import React, { useState, useEffect, useCallback } from 'react';
import type { WalletState } from '../types';
import { requestLaceConnection, getLaceWalletProvider } from '../wallet-service';

interface WalletConnectProps {
  wallet: WalletState | null;
  onConnect: (wallet: WalletState) => void;
  onDisconnect: () => void;
  onError: (msg: string) => void;
}

export function WalletConnect({ wallet, onConnect, onDisconnect, onError }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSeconds, setConnectSeconds] = useState(0);
  const [isLaceInstalled, setIsLaceInstalled] = useState<boolean | null>(null);

  const checkLace = useCallback(() => {
    const provider = getLaceWalletProvider();
    const installed = Boolean(provider);
    setIsLaceInstalled(installed);
    return installed;
  }, []);

  useEffect(() => {
    checkLace();
    const interval = setInterval(checkLace, 2000);
    return () => clearInterval(interval);
  }, [checkLace]);

  // Connecting timer to show helpful tips if extension popup is delayed
  useEffect(() => {
    let timer: any;
    if (isConnecting) {
      setConnectSeconds(0);
      timer = setInterval(() => setConnectSeconds(s => s + 1), 1000);
    } else {
      setConnectSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isConnecting]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const connectedWallet = await requestLaceConnection(12000);
      localStorage.setItem('midnight_wallet_connected', 'true');
      onConnect(connectedWallet);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Lace wallet';
      onError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [onConnect, onError]);

  const disconnect = useCallback(() => {
    localStorage.removeItem('midnight_wallet_connected');
    onDisconnect();
  }, [onDisconnect]);

  // Auto-reconnect if session exists
  useEffect(() => {
    const wasConnected = localStorage.getItem('midnight_wallet_connected') === 'true';
    if (wasConnected && !wallet && isLaceInstalled) {
      connect().catch(() => localStorage.removeItem('midnight_wallet_connected'));
    }
  }, [wallet, isLaceInstalled, connect]);

  const connectDevnetFallback = () => {
    setIsConnecting(false);
    const devnetWallet: WalletState = {
      address: 'mn_addr_undeployed1h3ssm5ru2t6eqy4g3she78zlxn96e36ms6pq996aduvmateh9p9sk96u7s',
      coinPublicKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      network: import.meta.env.VITE_NETWORK || 'undeployed',
      isConnected: true,
    };
    onConnect(devnetWallet);
  };

  if (!wallet) {
    return (
      <div className="card animate-slide-up">
        <div className="card-title">
          <span className="card-title-icon">👛</span>
          Connect Lace Wallet
        </div>

        {isLaceInstalled === false ? (
          <div className="alert alert-warning mb-4" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Lace Extension Not Detected</strong>
              <br />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                Please install the <strong>Midnight Lace Wallet Extension</strong> to interact with the Midnight Network.
              </span>
            </div>
          </div>
        ) : (
          <div className="alert alert-info mb-4" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">ℹ️</span>
            <div>
              Connect your authentic <strong>Lace wallet</strong> to issue or verify confidential prescriptions.
              Your private keys and health data never leave your device.
            </div>
          </div>
        )}

        {isConnecting && connectSeconds >= 2 && (
          <div className="alert alert-warning mb-4" style={{ marginBottom: '16px', fontSize: '13px' }}>
            <span className="alert-icon">💡</span>
            <div>
              <strong>Action Required in Browser Toolbar:</strong>
              <br />
              If Chrome blocked the auto-popup, please click the <strong>Lace Wallet extension icon</strong> in your browser's extensions bar (puzzle icon) to approve the connection.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            id="wallet-connect-btn"
            className="btn btn-primary btn-lg w-full"
            onClick={connect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <><span className="spinner" style={{ borderTopColor: 'white' }} /> Awaiting Approval ({connectSeconds}s)...</>
            ) : (
              <><span>💊</span> Connect Lace Wallet</>
            )}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: isConnecting ? '1fr 1fr' : '1fr 1fr', gap: '10px', marginTop: '4px' }}>
            {isConnecting ? (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setIsConnecting(false)}
              >
                ✕ Cancel Request
              </button>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const found = checkLace();
                  if (found) connect();
                  else onError('Lace extension not detected on window object yet. Check Chrome extension permissions.');
                }}
              >
                🔄 Re-scan Extension
              </button>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={connectDevnetFallback}
            >
              🧪 Devnet Wallet
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          <a
            href="https://www.lace.io/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}
          >
            Download Midnight Lace Wallet Extension →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-title">
        <span className="card-title-icon">✅</span>
        Wallet Connected
      </div>

      <div className="wallet-section">
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connected Address</div>
          <div className="wallet-addr" id="wallet-address-display">{wallet.address}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Network</div>
            <div style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{wallet.network}</div>
          </div>
          <div className="tag tag-green">Connected</div>
        </div>

        <button
          id="wallet-disconnect-btn-card"
          className="btn btn-danger w-full"
          onClick={disconnect}
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}