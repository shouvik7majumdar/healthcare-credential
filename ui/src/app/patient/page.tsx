// src/app/patient/page.tsx
// MedProof Patient Vault — Zero-Knowledge Health Wallet & Confidential Registration Manager

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMedProofData } from '../../context/MedProofDataContext';
import { CredentialCategory, OffChainCredential, CREDENTIAL_CATEGORY_LABELS } from '../../types/medproof';

export default function PatientVaultPage() {
  const { credentials, consents } = useMedProofData();

  // Filters & State
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showRegistrationActivity, setShowRegistrationActivity] = useState(false);

  // Modals
  const [selectedCredForDetails, setSelectedCredForDetails] = useState<OffChainCredential | null>(null);
  const [selectedCredForPrivacy, setSelectedCredForPrivacy] = useState<OffChainCredential | null>(null);

  // Vault Overview Counters
  const totalCount = credentials.length;
  const activeCount = credentials.filter(c => c.status === 'VALID').length;
  const revokedCount = credentials.filter(c => c.status === 'REVOKED').length;
  const expiredCount = credentials.filter(c => c.status === 'EXPIRED').length;

  // Filtered credentials
  const filteredCredentials = useMemo(() => {
    return credentials.filter((cred) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && cred.status !== 'VALID') return false;
      if (activeTab === 'REVOKED' && cred.status !== 'REVOKED') return false;

      // Category filter
      if (selectedCategory !== 'ALL' && String(cred.category) !== selectedCategory) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMed = cred.medication.toLowerCase().includes(q);
        const matchPrescriber = cred.prescriberName.toLowerCase().includes(q);
        const matchCommitment = cred.commitment.toLowerCase().includes(q);
        const matchPatient = cred.patientName.toLowerCase().includes(q);
        if (!matchMed && !matchPrescriber && !matchCommitment && !matchPatient) return false;
      }

      return true;
    });
  }, [credentials, activeTab, selectedCategory, searchQuery]);

  // Check consent status for a commitment
  const getConsentStatus = (commitment: string) => {
    const consent = consents.find(
      c => c.credentialCommitment.toLowerCase() === commitment.toLowerCase() && c.isActive
    );
    return consent ? { hasConsent: true, verifierName: consent.verifierName } : { hasConsent: false };
  };

  const formatShortHash = (h: string) => {
    if (!h) return '';
    if (h.length <= 16) return h;
    return `${h.substring(0, 8)}...${h.substring(h.length - 6)}`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-teal">Client-Side Zero-Knowledge Wallet</span>
            <span className="badge badge-emerald">Encrypted Off-Chain</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Patient Confidential Vault</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '650px' }}>
            Your clinical data (diagnoses, dosages, clinical notes) remains entirely inside your device. Only 32-byte cryptographic commitments and nullifier roots exist on Midnight Preprod.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/consent" className="btn btn-secondary" style={{ fontSize: '13px' }}>
            Manage Consents ↗
          </Link>
          <Link href="/provider" className="btn btn-primary" style={{ fontSize: '13px' }}>
            Issue New Credential ↗
          </Link>
        </div>
      </div>

      {/* Section 3: Vault Overview Counters */}
      <div className="metric-grid-5" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-label">
            <span>Total Credentials</span>
            <span>🗂️</span>
          </div>
          <div className="metric-value">{totalCount}</div>
          <div className="metric-meta">Vault Records</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Active &amp; Valid</span>
            <span>✅</span>
          </div>
          <div className="metric-value" style={{ color: '#34d399' }}>{activeCount}</div>
          <div className="metric-meta">Satisfies ZK Circuits</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Revoked</span>
            <span>🚫</span>
          </div>
          <div className="metric-value" style={{ color: revokedCount > 0 ? '#fb7185' : 'var(--text-muted)' }}>
            {revokedCount}
          </div>
          <div className="metric-meta">Nullified / Suspended</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Expired / Pending</span>
            <span>⏳</span>
          </div>
          <div className="metric-value" style={{ color: expiredCount > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
            {expiredCount}
          </div>
          <div className="metric-meta">Epoch Validated</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>On-Chain Leakage</span>
            <span>🛡️</span>
          </div>
          <div className="metric-value" style={{ color: '#00f2fe', fontSize: '24px' }}>0 Bytes</div>
          <div className="metric-meta">Mathematical Privacy</div>
        </div>
      </div>

      {/* Section 4: Expandable "Vault Registration Activity" Panel */}
      <div className="glass-card" style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => setShowRegistrationActivity(!showRegistrationActivity)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>{showRegistrationActivity ? '▼' : '▶'}</span>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Vault Registration Activity</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Cryptographic breakdown of registered commitments on Midnight Preprod
              </p>
            </div>
          </div>
          <span className="badge badge-teal" style={{ fontSize: '11px' }}>
            {showRegistrationActivity ? 'Hide Activity Table' : 'Show Registered Commitments'}
          </span>
        </div>

        {showRegistrationActivity && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                background: 'rgba(0, 242, 254, 0.06)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                color: '#e0f2fe',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              ℹ️ <strong>Vault Registration Assurance:</strong> Vault registration represents a credential record controlled by the connected patient. Sensitive clinical contents remain off-chain in encrypted client memory; only 32-byte cryptographic commitments are matched on the Midnight ledger.
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Commitment Identifier</th>
                    <th>Credential Type</th>
                    <th>Issuing Provider</th>
                    <th>Status</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((c) => (
                    <tr key={c.id}>
                      <td className="mono" style={{ color: 'var(--accent-teal)' }}>
                        {formatShortHash(c.commitment)}
                      </td>
                      <td>
                        {c.category === CredentialCategory.STANDARD_PRESCRIPTION && 'Cat 1: Standard Rx'}
                        {c.category === CredentialCategory.CONTROLLED_SUBSTANCE && 'Cat 2: Controlled Substance'}
                        {c.category === CredentialCategory.CHRONIC_CARE && 'Cat 3: Chronic Care'}
                        {c.category === CredentialCategory.EMERGENCY_ACCESS && 'Cat 4: Emergency Access'}
                      </td>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>
                        {formatShortHash(c.issuerProviderCommitment)}
                      </td>
                      <td>
                        {c.status === 'VALID' ? (
                          <span className="badge badge-emerald">Registered (Valid)</span>
                        ) : (
                          <span className="badge badge-rose">Revoked</span>
                        )}
                      </td>
                      <td>
                        {c.isDemo ? (
                          <span className="badge badge-amber" style={{ fontSize: '10px' }}>EXAMPLE RECORD</span>
                        ) : (
                          <span className="badge badge-teal" style={{ fontSize: '10px' }}>USER CREATED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Tabs & Search Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        {/* Tabs: ALL / ACTIVE / REVOKED */}
        <div className="tabs-nav" style={{ marginBottom: 0 }}>
          <button
            className={`tab-btn ${activeTab === 'ALL' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Credentials ({totalCount})
          </button>
          <button
            className={`tab-btn ${activeTab === 'ACTIVE' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`tab-btn ${activeTab === 'REVOKED' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('REVOKED')}
          >
            Revoked ({revokedCount})
          </button>
        </div>

        {/* Search & Category Select */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
          >
            <option value="ALL">All Categories</option>
            <option value={String(CredentialCategory.STANDARD_PRESCRIPTION)}>Cat 1: Standard Rx</option>
            <option value={String(CredentialCategory.CONTROLLED_SUBSTANCE)}>Cat 2: Controlled Substance</option>
            <option value={String(CredentialCategory.CHRONIC_CARE)}>Cat 3: Chronic Care</option>
            <option value={String(CredentialCategory.EMERGENCY_ACCESS)}>Cat 4: Emergency Access</option>
          </select>

          <input
            type="text"
            className="form-input"
            placeholder="Search medication, doctor, hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Credential Cards List */}
      {filteredCredentials.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No Matching Credentials Found
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto 16px' }}>
            Try adjusting your search criteria or switch tabs to view active or revoked records.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => { setActiveTab('ALL'); setSearchQuery(''); setSelectedCategory('ALL'); }}
            style={{ fontSize: '12px' }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredCredentials.map((cred) => {
            const consentStatus = getConsentStatus(cred.commitment);

            return (
              <div key={cred.id} className="glass-card">
                <div className="glass-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-teal">
                      {CREDENTIAL_CATEGORY_LABELS[cred.category]}
                    </span>
                    {cred.status === 'VALID' ? (
                      <span className="badge badge-emerald">● Status: Valid</span>
                    ) : (
                      <span className="badge badge-rose">● Status: Revoked</span>
                    )}
                    {cred.isSingleUse && (
                      <span className="badge badge-purple" title="Single-use nullifier enforces single dispense">
                        ⚡ Single-Use Nullifier
                      </span>
                    )}
                    {cred.isDemo && (
                      <span className="badge badge-amber" title="Initial example credential for local testing">
                        EXAMPLE RECORD
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Expires Epoch {cred.expirationEpoch} · {cred.issuedAtTime || 'Pre-configured'}
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '16px' }}>
                  {/* Left: Private Clinical Information */}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                      Private Clinical Information (Off-Chain Client Storage)
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {cred.medication}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Dosage: <strong>{cred.dosage}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {cred.instructions}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Prescriber: {cred.prescriberName}
                    </div>
                  </div>

                  {/* Right: Cryptographic Vector Locking Information */}
                  <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                      Public On-Chain Commitment (Midnight Preprod)
                    </div>
                    <div className="mono" style={{ color: 'var(--accent-teal)', wordBreak: 'break-all', fontSize: '12px', marginBottom: '12px' }}>
                      {cred.commitment}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Verifier Consent:</span>
                      {consentStatus.hasConsent ? (
                        <span className="badge badge-emerald">Granted to {consentStatus.verifierName}</span>
                      ) : (
                        <span className="badge badge-amber">No Active Consent</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: View Credential, View Privacy Details, Grant Consent, Verify */}
                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedCredForDetails(cred)}
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                  >
                    📄 View Full Credential
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedCredForPrivacy(cred)}
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                  >
                    🔒 View Privacy Details
                  </button>
                  <Link
                    href="/consent"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                  >
                    🛡️ Manage Consent
                  </Link>
                  <Link
                    href={`/verifier?commitment=${encodeURIComponent(cred.commitment)}&cat=${cred.category}`}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '8px 14px', marginLeft: 'auto' }}
                  >
                    ⚡ Test ZK Verification
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Full Credential View */}
      {selectedCredForDetails && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-card" style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setSelectedCredForDetails(null)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-teal">{CREDENTIAL_CATEGORY_LABELS[selectedCredForDetails.category]}</span>
              {selectedCredForDetails.isDemo && <span className="badge badge-amber">EXAMPLE RECORD</span>}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
              {selectedCredForDetails.medication}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', marginBottom: '20px' }}>
              <div><strong>Patient Name:</strong> {selectedCredForDetails.patientName} ({selectedCredForDetails.patientId})</div>
              <div><strong>Dosage &amp; Frequency:</strong> {selectedCredForDetails.dosage}</div>
              <div><strong>Clinical Instructions:</strong> {selectedCredForDetails.instructions}</div>
              <div><strong>Diagnosis Code:</strong> {selectedCredForDetails.diagnosisCode}</div>
              <div><strong>Prescribing Physician:</strong> {selectedCredForDetails.prescriberName}</div>
              <div><strong>Expiration Epoch:</strong> Epoch {selectedCredForDetails.expirationEpoch}</div>
              <div><strong>Nullifier Policy:</strong> {selectedCredForDetails.isSingleUse ? 'Single-use nullifier required' : 'Multi-use valid until expiration'}</div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              🔒 <strong>Privacy Assurance:</strong> This clinical information is held strictly in local client memory and is never transmitted to the Midnight blockchain.
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setSelectedCredForDetails(null)}
              style={{ width: '100%', marginTop: '16px', fontSize: '13px' }}
            >
              Close Credential View
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Privacy Details & Cryptographic Audit */}
      {selectedCredForPrivacy && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-card" style={{ maxWidth: '640px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setSelectedCredForPrivacy(null)}
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

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Cryptographic Commitment &amp; Privacy Audit
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Comparison of off-chain client secrets vs. public on-chain ledger records for <code>{selectedCredForPrivacy.medication}</code>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: '#fca5a5', marginBottom: '8px' }}>
                  🔒 Off-Chain Private Witness (Never on Chain)
                </div>
                <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px', color: '#e0e7ff' }}>
                  <li>• Patient Name: {selectedCredForPrivacy.patientName}</li>
                  <li>• Medication: {selectedCredForPrivacy.medication}</li>
                  <li>• Dosage: {selectedCredForPrivacy.dosage}</li>
                  <li>• Secret Salt: {formatShortHash(selectedCredForPrivacy.salt)}</li>
                  <li>• Patient Secret: {formatShortHash(selectedCredForPrivacy.patientSecret)}</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: '#34d399', marginBottom: '8px' }}>
                  🌐 Public Ledger Record (Midnight Preprod)
                </div>
                <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px', color: '#e0e7ff' }}>
                  <li>• Commitment: {formatShortHash(selectedCredForPrivacy.commitment)}</li>
                  <li>• Provider Commitment: {formatShortHash(selectedCredForPrivacy.issuerProviderCommitment)}</li>
                  <li>• Category Hash: persistentHash({selectedCredForPrivacy.category})</li>
                  <li>• Expiration Epoch: {selectedCredForPrivacy.expirationEpoch}</li>
                  <li>• Registered: <code>issuedCredentials[c] = true</code></li>
                </ul>
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Proof Mechanism: Compact Zero-Knowledge circuit <code>verifyCredential</code> proves satisfiability of the 7-attribute commitment vector without revealing any of the private witnesses.
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setSelectedCredForPrivacy(null)}
              style={{ width: '100%', marginTop: '16px', fontSize: '13px' }}
            >
              Close Privacy Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
