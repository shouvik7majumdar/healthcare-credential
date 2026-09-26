'use client';

import React, { useState } from 'react';
import { useMedProofData } from '../../context/MedProofDataContext';
import { CREDENTIAL_CATEGORY_LABELS, OffChainCredential } from '../../types/medproof';
import { MEDPROOF_CONFIG } from '../../lib/config';

export default function CredentialsExplorerPage() {
  const { credentials, systemStatus } = useMedProofData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REVOKED'>('ALL');
  const [selectedCred, setSelectedCred] = useState<OffChainCredential | null>(null);

  const totalRegistered = credentials.length;
  const validCount = credentials.filter(c => c.status === 'VALID').length;
  const revokedCount = credentials.filter(c => c.status === 'REVOKED').length;

  const filtered = credentials.filter(c => {
    if (statusFilter === 'VALID' && c.status !== 'VALID') return false;
    if (statusFilter === 'REVOKED' && c.status !== 'REVOKED') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const catLabel = (CREDENTIAL_CATEGORY_LABELS[c.category] || '').toLowerCase();
    return (
      c.commitment.toLowerCase().includes(q) ||
      c.issuerProviderCommitment.toLowerCase().includes(q) ||
      catLabel.includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
            Public Transparency Explorer
          </h1>
          <span className="badge badge-teal">Zero-PHI Ledger</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '760px' }}>
          Public view of verified credential commitments on Midnight Preprod. Observability without privacy sacrifice:
          only 32-byte cryptographic hashes are exposed to the public ledger. No patient identities, diagnoses, medications,
          or clinical notes exist in public state.
        </p>
      </div>

      {/* Summary Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Registered Commitments</span>
            <span style={{ fontSize: '16px' }}>🔍</span>
          </div>
          <div className="metric-value">{totalRegistered}</div>
          <div className="metric-sub">
            <span className="metric-badge badge-session">Indexed & Session</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>issuedCredentials</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Public State</span>
            <span style={{ fontSize: '16px' }}>🟢</span>
          </div>
          <div className="metric-value">{validCount}</div>
          <div className="metric-sub">
            <span className="metric-badge badge-session">Valid Status</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unrevoked</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Revoked Public State</span>
            <span style={{ fontSize: '16px' }}>🔴</span>
          </div>
          <div className="metric-value">{revokedCount}</div>
          <div className="metric-sub">
            <span className="metric-badge badge-session">revokedCredentials</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Permanently invalid</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Contract Epoch</span>
            <span style={{ fontSize: '16px' }}>⏱️</span>
          </div>
          <div className="metric-value">Epoch #1</div>
          <div className="metric-sub">
            <span className="metric-badge badge-network">Preprod Time</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>currentEpoch</span>
          </div>
        </div>
      </div>

      {/* Transparency Guarantee Banner */}
      <div style={{
        padding: '16px 20px',
        background: '#E8FBF7',
        border: '1px solid var(--color-ocean)',
        borderRadius: '10px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--accent-teal)' }}>
          <span>🛡️ Verified Confidential Architecture</span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Under HIPAA and GDPR requirements, medical ledgers must never store Protected Health Information (PHI).
          MedProof achieves strict compliance by decoupling public ledger commitments (<code className="mono">Bytes&lt;32&gt;</code>)
          from private witness preimages. Only zero-knowledge proofs are presented to verifiers.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Contract: <code className="mono" style={{ color: 'var(--text-primary)' }}>{MEDPROOF_CONFIG.contractAddress.substring(0, 14)}...{MEDPROOF_CONFIG.contractAddress.substring(MEDPROOF_CONFIG.contractAddress.length - 8)}</code></span>
          <span>Network: <strong style={{ color: 'var(--accent-teal)' }}>{systemStatus.network}</strong></span>
          <span>Indexer State: <strong style={{ color: systemStatus.indexerOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{systemStatus.indexerOnline ? 'ONLINE' : 'STANDBY'}</strong></span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div className="tabs-nav" style={{ margin: 0 }}>
            <button
              className={`tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              ALL COMMITMENTS ({totalRegistered})
            </button>
            <button
              className={`tab-btn ${statusFilter === 'VALID' ? 'active' : ''}`}
              onClick={() => setStatusFilter('VALID')}
            >
              VALID ({validCount})
            </button>
            <button
              className={`tab-btn ${statusFilter === 'REVOKED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('REVOKED')}
            >
              REVOKED ({revokedCount})
            </button>
          </div>

          <div style={{ flex: '1', minWidth: '260px', maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Filter by commitment, issuer PK, or category..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* Public Commitments Table */}
      <div className="glass-card">
        <div className="glass-card-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Public State Registry</h3>
          <span className="badge badge-teal">issuedCredentials Map</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <p>No credential commitments match the specified filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Public Credential Commitment</th>
                  <th>Issuing Provider Commitment</th>
                  <th>Category</th>
                  <th>Expiration</th>
                  <th>Single-Use</th>
                  <th>Ledger Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cred) => (
                  <tr key={cred.id}>
                    <td className="mono" style={{ color: 'var(--accent-teal)', fontWeight: 500 }}>
                      <span title={cred.commitment}>
                        {cred.commitment.substring(0, 14)}...{cred.commitment.substring(cred.commitment.length - 6)}
                      </span>
                    </td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                      <span title={cred.issuerProviderCommitment}>
                        {cred.issuerProviderCommitment.substring(0, 12)}...
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>
                        {CREDENTIAL_CATEGORY_LABELS[cred.category] || `Category ${cred.category}`}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '12px' }}>
                        Epoch #{cred.expirationEpoch}
                      </span>
                    </td>
                    <td>
                      {cred.isSingleUse ? (
                        <span className="badge badge-purple" style={{ fontSize: '10px' }}>Enforced</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Multi-use</span>
                      )}
                    </td>
                    <td>
                      {cred.status === 'VALID' ? (
                        <span className="badge badge-emerald">VALID</span>
                      ) : (
                        <span className="badge badge-rose">REVOKED</span>
                      )}
                      {cred.isDemo && (
                        <span className="badge badge-amber" style={{ fontSize: '10px', marginLeft: '6px' }}>
                          EXAMPLE RECORD
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => setSelectedCred(cred)}
                      >
                        Inspect Public State
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Public State Inspector Modal */}
      {selectedCred && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(9, 38, 44, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '640px', width: '100%', border: '1px solid var(--border-subtle)' }}>
            <div className="glass-card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>
                  Public State Inspection (Zero PHI)
                </h3>
                <span className="badge badge-teal">Public Ledger Surface</span>
              </div>
              <button
                onClick={() => setSelectedCred(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Public Credential Commitment (Bytes&lt;32&gt;)
                </div>
                <div className="mono" style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px', color: 'var(--accent-teal)', fontSize: '12px', wordBreak: 'break-all' }}>
                  {selectedCred.commitment}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Issuing Provider Commitment (Bytes&lt;32&gt;)
                </div>
                <div className="mono" style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', wordBreak: 'break-all' }}>
                  {selectedCred.issuerProviderCommitment}
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category</div>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>
                    {CREDENTIAL_CATEGORY_LABELS[selectedCred.category] || `Category ${selectedCred.category}`}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expiration Epoch</div>
                  <div className="mono" style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>
                    Epoch #{selectedCred.expirationEpoch}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: 'var(--accent-rose)' }}>🚫 What is deliberately OMITTED from this public view:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0, color: 'var(--text-secondary)' }}>
                  <li>Patient Identity &amp; Record ID</li>
                  <li>Diagnosis Code &amp; Medical History</li>
                  <li>Medication Name, Strength, &amp; Dosage Instructions</li>
                  <li>Client Private Preimage Secrets &amp; Salts</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedCred(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
