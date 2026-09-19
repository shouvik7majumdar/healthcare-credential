import React, { useEffect, useState } from 'react';

interface LedgerStateProps {
  contractAddress: string;
  network: string;
  verificationCount: bigint | null;
  contractActive: boolean | null;
  onStateLoaded: (count: bigint, active: boolean) => void;
}

export function LedgerState({ contractAddress, network, verificationCount, contractActive, onStateLoaded }: LedgerStateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchState = async () => {
    if (!contractAddress) return;
    setIsLoading(true);
    setError('');
    try {
      // In production: query via indexer GraphQL
      // For local devnet, we simulate with the known contract state
      await new Promise(r => setTimeout(r, 800));

      // Simulated state - in production would call:
      // const response = await fetch(`${indexerUrl}/api/v4/graphql`, { ... });
      onStateLoaded(verificationCount ?? 0n, contractActive ?? true);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ledger state');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contractAddress) fetchState();
    const interval = setInterval(fetchState, 30000);
    return () => clearInterval(interval);
  }, [contractAddress]);

  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: '16px' }}>
        <span className="card-title-icon">📊</span>
        Public Ledger State
        <button
          id="refresh-ledger-btn"
          className="btn btn-sm btn-outline"
          onClick={fetchState}
          disabled={isLoading}
          style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '12px' }}
        >
          {isLoading ? <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} /> : '↻'}
        </button>
      </div>

      {!contractAddress ? (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>No contract address configured.</strong>
            <br />Set <code>VITE_CONTRACT_ADDRESS</code> in <code>.env.local</code>
          </div>
        </div>
      ) : (
        <>
          <div id="ledger-state-display">
            <div className="ledger-item">
              <div>
                <div className="ledger-key">verificationCount</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Public aggregate — visible on-chain</div>
              </div>
              {isLoading && verificationCount === null ? (
                <div className="skeleton skeleton-value" style={{ width: '60px' }} />
              ) : (
                <div className="ledger-value gradient-text" id="verification-count">
                  {verificationCount !== null ? verificationCount.toString() : '0'}
                </div>
              )}
            </div>

            <div className="ledger-item">
              <div>
                <div className="ledger-key">contractActive</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Contract operational status</div>
              </div>
              {isLoading && contractActive === null ? (
                <div className="skeleton skeleton-value" style={{ width: '60px' }} />
              ) : (
                <div className="ledger-value" id="contract-active-status" style={{ color: contractActive !== false ? 'var(--accent-teal)' : '#fc8181' }}>
                  {contractActive !== false ? 'true' : 'false'}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Contract Address — Midnight Preview Testnet</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
              {contractAddress}
            </div>
            <a
              href="https://explorer.preview.midnight.network/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', color: 'var(--accent-teal)', textDecoration: 'none', borderBottom: '1px solid var(--accent-teal)' }}
            >
              🔗 View on Midnight Explorer (Paste address in search bar) →
            </a>
          </div>

          {lastUpdated && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginTop: '12px' }}>
              <span className="alert-icon">❌</span>
              <div>{error}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}