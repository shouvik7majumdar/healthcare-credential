'use client';

import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import type { DirectTestResult } from '../../services/lace-wallet-service';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const {
    wallet,
    hasProvider,
    selectedWallet,
    discoveredWallets,
    diagnostics,
    targetNetworkId,
    setTargetNetworkId,
    connect,
    disconnect,
    cancelConnection,
    clearError,
    retryWalletData,
    rescanProviders,
    runDirectTest,
  } = useWallet();

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [directTestRunning, setDirectTestRunning] = useState(false);
  const [directTestResult, setDirectTestResult] = useState<DirectTestResult | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      await connect(targetNetworkId);
      onClose();
    } catch {
      // Wallet state machine reflects the error/rejection automatically
    }
  };

  const isChannelShutdown = Boolean(
    wallet.status === 'UNAVAILABLE' || (
      wallet.errorMessage && (
        wallet.errorMessage.toLowerCase().includes('shutdown') ||
        wallet.errorMessage.toLowerCase().includes('feature-flags') ||
        wallet.errorMessage.toLowerCase().includes('object can no longer be used') ||
        wallet.errorMessage.toLowerCase().includes('side panel')
      )
    )
  );

  const handleReloadAndReconnect = () => {
    try {
      sessionStorage.setItem('medproof_auto_connect', 'true');
      sessionStorage.setItem('medproof_target_network', targetNetworkId);
    } catch {}
    window.location.reload();
  };

  const handleCancel = () => {
    cancelConnection();
    onClose();
  };

  const handleRunDirectTest = async () => {
    setDirectTestRunning(true);
    try {
      const result = await runDirectTest(targetNetworkId);
      setDirectTestResult(result);
    } catch (err: any) {
      setDirectTestResult({
        success: false,
        elapsedMs: 0,
        networkId: targetNetworkId,
        providerId: selectedWallet?.id || 'unknown',
        methods: [],
        errorMessage: err?.message || String(err),
      });
    } finally {
      setDirectTestRunning(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 38, 44, 0.55)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="glass-card" style={{ maxWidth: '520px', width: '100%', position: 'relative' }}>
        <button
          onClick={handleCancel}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '18px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Connect Midnight Lace Wallet
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          MedProof authenticates healthcare credentials and signs zero-knowledge transactions via the official Midnight Lace DApp connector.
        </p>

        {/* Network Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
            Target Midnight Network:
          </label>
          <select
            value={targetNetworkId}
            onChange={e => setTargetNetworkId(e.target.value)}
            disabled={false}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          >
            <option value="auto">Auto-Detect Active Network (Recommended)</option>
            <option value="preprod">preprod (Midnight Preprod Testnet — Default)</option>
            <option value="undeployed">undeployed (Midnight Local DevNet #0)</option>
            <option value="preview">preview (Midnight Preview Testnet)</option>
            <option value="testnet">testnet (Midnight Testnet)</option>
            <option value="devnet">devnet (Midnight DevNet)</option>
          </select>
        </div>

        {/* Provider Detection Status */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              {selectedWallet ? selectedWallet.name : 'Midnight Lace Extension'}
            </span>
            {hasProvider ? (
              <span className="badge badge-emerald">Detected</span>
            ) : (
              <span className="badge badge-amber">Not Detected</span>
            )}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: hasProvider ? '10px' : '0' }}>
            {hasProvider
              ? 'Lace provider discovered via standard DApp Connector injection. Ready for cryptographic authorization.'
              : 'The Lace extension was not found on this browser tab yet. Please ensure it is installed, unlocked, and enabled.'}
          </div>

          {hasProvider && selectedWallet && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}>
              <div>API Version: <span className="mono" style={{ color: 'var(--color-ocean-dark)' }}>{selectedWallet.apiVersion}</span></div>
              <div>Method: <span className="mono" style={{ color: 'var(--color-ocean-dark)' }}>{selectedWallet.supportsConnect ? 'connect()' : 'enable()'}</span></div>
              <div style={{ gridColumn: 'span 2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Provider ID: <span className="mono" style={{ color: 'var(--text-muted)' }}>{selectedWallet.id}</span>
              </div>
            </div>
          )}
        </div>

        {/* In-Flight Connecting / Awaiting Approval Guidance */}
        {wallet.status === 'CONNECTING' && (
          <div style={{
            background: 'rgba(14, 165, 233, 0.15)',
            border: '2px solid #85D1DB',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '16px',
            color: '#ffffff',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#85D1DB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', animation: 'pulse 1.5s infinite' }}>🔔</span>
                Action Required in Google Chrome
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '10px', padding: '2px 8px' }}>
                Awaiting Approval
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#042025', marginBottom: '12px', lineHeight: 1.4 }}>
              MedProof sent an authorization request to Midnight Lace. Because Chrome extensions run securely in their own sandbox, you must approve the connection inside Lace:
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.45)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '12px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <span style={{ background: '#85D1DB', color: '#052428', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>1</span>
                <div>Look at the <strong>top-right</strong> corner of your Chrome browser.</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <span style={{ background: '#85D1DB', color: '#052428', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>2</span>
                <div>Click the <strong>🧩 (Extensions) puzzle piece icon</strong> next to the address bar.</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <span style={{ background: '#85D1DB', color: '#052428', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>3</span>
                <div>Click <strong>Lace</strong> (or Midnight Lace) from the dropdown list.</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ background: '#85D1DB', color: '#052428', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>4</span>
                <div>The Lace <strong>Side Panel</strong> opens on the right. If locked, enter your password, then click <strong>Authorize</strong>.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Don&apos;t see the Side Panel?
              </span>
              <button
                onClick={() => {
                  // Cancel must be synchronous, then connect immediately — no setTimeout
                  // Any delay (even 1ms setTimeout) can break the user-gesture chain required
                  // by Chrome extension popup creation (chrome.windows.create)
                  cancelConnection();
                  handleConnect();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#85D1DB',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Reset &amp; Retry Handshake
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Locked Wallet Guidance */}
        {wallet.status === 'LOCKED' && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#fef3c7',
            lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔒</span> Midnight Lace Needs to be Unlocked or Refreshed
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Midnight Lace needs to be unlocked or refreshed. Unlock Lace and retry the connection.
            </div>
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '6px',
              padding: '12px 14px',
              fontSize: '12px',
              color: '#fde68a',
              marginBottom: '12px',
            }}>
              <strong>To unlock or refresh Lace:</strong><br />
              1. Look at your Chrome extensions bar (top-right of browser).<br />
              2. Click the <strong>Midnight Lace icon</strong> (or click the 🧩 puzzle piece and select Lace).<br />
              3. Enter your password to unlock the wallet (or switch/refresh account).<br />
              4. Return here and click <strong>Retry Connection</strong> below.
            </div>
          </div>
        )}

        {/* Standard Error Notice Alert (hidden when LOCKED) */}
        {wallet.status !== 'LOCKED' && (wallet.status === 'ERROR' || wallet.status === 'REJECTED' || wallet.status === 'UNAVAILABLE' || wallet.status === 'WRONG_NETWORK' || wallet.errorMessage) && wallet.status !== 'CONNECTING' && wallet.status !== 'WAITING_FOR_LACE' && (
          isChannelShutdown ? (
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#fef3c7',
              lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px' }}>⚠️ Midnight Lace is Unavailable</span>
                <button
                  onClick={clearError}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '11px', opacity: 0.8 }}
                >
                  Dismiss
                </button>
              </div>
              <div style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>
                Midnight Lace is not available right now. Please open the Lace Side Panel and keep it open while using MedProof.
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#fde68a',
                marginBottom: '12px',
              }}>
                <strong>To connect:</strong><br />
                1. Click the <strong>Midnight Lace</strong> icon in your Chrome extensions bar to open the Side Panel.<br />
                2. Ensure your wallet is unlocked on <strong>Preprod</strong>.<br />
                3. Click <strong>Retry Connection</strong> below.
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConnect}
                style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600 }}
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div style={{
              background: wallet.status === 'REJECTED' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${wallet.status === 'REJECTED' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: wallet.status === 'REJECTED' ? '#fde68a' : '#fca5a5',
              lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>⚠️ Connection Notice:</span>
                <button
                  onClick={clearError}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '11px', opacity: 0.8 }}
                >
                  Dismiss
                </button>
              </div>
              <div>{wallet.errorMessage || 'Failed to complete Lace authorization.'}</div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                💡 Tip: Midnight Lace is active on <strong>preprod</strong>. Ensure the dropdown above is on <strong>preprod</strong> or <strong>Auto-Detect</strong>, then click <strong>Approve Connection in Lace</strong>.
              </div>
            </div>
          )
        )}

        {/* Waiting for Lace Banner */}
        {(wallet.status === 'CONNECTING' || wallet.status === 'WAITING_FOR_LACE') && (
          <div style={{
            background: '#E0F7FA',
            border: '1px solid var(--color-ocean)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#042025',
            lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--color-ocean-dark)', marginBottom: '4px' }}>
              ⏳ Awaiting Authorization in Midnight Lace
            </div>
            <div>
              Midnight Lace has initiated an authorization request. Please review and click <strong>Authorize</strong> in the Lace popup window (or Chrome toolbar) to complete connection.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {hasProvider ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={() => { cancelConnection(); handleConnect(); }}
              disabled={false}
              style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600 }}
            >
              {wallet.status === 'CONNECTING'
                ? '⚁ Click to Connect (Lace Unlocked)'
                : wallet.status === 'LOCKED'
                  ? 'Retry Connection'
                  : isChannelShutdown
                    ? '🔄 Reload Page & Reconnect'
                    : (wallet.status === 'ERROR' || wallet.status === 'REJECTED')
                      ? 'Retry Connection in Lace'
                      : 'Approve Connection in Lace'}
            </button>
            {isChannelShutdown && wallet.status !== 'CONNECTING' && (
              <button
                className="btn btn-secondary"
                onClick={handleConnect}
                style={{ padding: '12px 16px', fontSize: '13px' }}
                title="Retry without page reload"
              >
                Retry
              </button>
            )}
            {wallet.status === 'CONNECTING' ? (
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                style={{ padding: '12px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={rescanProviders}
              style={{ width: '100%', padding: '12px', textAlign: 'center' }}
            >
              🔄 Re-scan For Lace Provider
            </button>
            <a
              href="https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', textAlign: 'center', fontSize: '12px', opacity: 0.8 }}
            >
              Install Midnight Lace Extension ↗
            </a>
          </div>
        )}

        {/* Step 7 Diagnostic Action & Runtime Diagnostics */}
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
            }}
          >
            {showDiagnostics ? '▼ Hide Diagnostics & Direct Test' : '▶ Show Diagnostics & Direct Provider Test'}
          </button>

          {showDiagnostics && (
            <div style={{
              marginTop: '10px',
              background: '#F0FBF9',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-card)' }}>
                <div>window.midnight present: <span style={{ color: diagnostics.windowMidnightPresent ? '#34d399' : '#f87171' }}>{diagnostics.windowMidnightPresent ? 'YES' : 'NO'}</span></div>
                <div>Discovered Providers: <span style={{ color: '#85D1DB' }}>{discoveredWallets.length}</span></div>
                <div>Injected Keys: <span style={{ color: 'var(--text-muted)' }}>{diagnostics.providerKeys.length > 0 ? diagnostics.providerKeys.join(', ') : '(none)'}</span></div>
                <div>Scan Count: {diagnostics.scanCount} (Last: {diagnostics.lastScanTime})</div>
              </div>

              {/* Step 7 Direct Test Trigger */}
              <div style={{ marginTop: '6px' }}>
                <div style={{ fontWeight: 600, color: '#042025', marginBottom: '6px' }}>
                  Step 7: Direct Provider connect() Test:
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={handleRunDirectTest}
                  disabled={directTestRunning || !hasProvider}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '11px', marginBottom: '8px' }}
                >
                  {directTestRunning ? '⏳ Calling provider.connect()...' : `Run Direct provider.connect('${targetNetworkId}') Test`}
                </button>

                {directTestResult && (
                  <div style={{
                    padding: '8px',
                    borderRadius: '4px',
                    background: directTestResult.success ? 'rgba(182, 242, 209, 0.09)' : 'rgba(244, 63, 94, 0.1)',
                    border: `1px solid ${directTestResult.success ? 'rgba(182, 242, 209, 0.30)' : 'rgba(244, 63, 94, 0.3)'}`,
                  }}>
                    <div>Status: <span style={{ color: directTestResult.success ? '#34d399' : '#f87171' }}>{directTestResult.success ? 'SUCCESS (RESOLVED)' : 'ERROR / REJECTED'}</span></div>
                    <div>Elapsed Time: {directTestResult.elapsedMs}ms</div>
                    <div>Network: {directTestResult.networkId}</div>
                    {directTestResult.methods.length > 0 && (
                      <div>ConnectedAPI Methods ({directTestResult.methods.length}): {directTestResult.methods.slice(0, 5).join(', ')}...</div>
                    )}
                    {directTestResult.errorMessage && (
                      <div style={{ color: '#f87171' }}>Error: {directTestResult.errorMessage}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
