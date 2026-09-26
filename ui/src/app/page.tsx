// ui/src/app/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useMedProofData } from '../context/MedProofDataContext';
import { useWallet } from '../context/WalletContext';
import { ActivityFeedItem } from '../types/medproof';

export default function Home() {
  const {
    credentials,
    consents,
    systemStatus,
    activityFeed,
  } = useMedProofData();
  const { wallet } = useWallet();

  const totalVaultRegistrations = credentials.length;
  const activeCredentials = credentials.filter((c) => c.status === 'VALID').length;
  const revokedCredentials = credentials.filter((c) => c.status === 'REVOKED').length;
  const activeConsents = consents.filter((cs) => cs.isActive).length;
  const sessionVerifications = activityFeed.filter(
    (a) => a.type === 'VERIFICATION_SUCCESS' || a.type === 'VERIFICATION_FAILED'
  ).length;

  const getActivityBadge = (status: ActivityFeedItem['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="badge badge-emerald">● Confirmed</span>;
      case 'DANGER':
        return <span className="badge badge-rose">● Revoked</span>;
      case 'WARNING':
        return <span className="badge badge-amber">● Pending</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CREDENTIAL_ISSUED':
        return '📋';
      case 'CREDENTIAL_REVOKED':
        return '🚫';
      case 'CONSENT_GRANTED':
        return '🛡️';
      case 'CONSENT_REVOKED':
        return '🔒';
      case 'VERIFICATION_SUCCESS':
        return '✅';
      case 'VERIFICATION_FAILED':
        return '❌';
      default:
        return '⚡';
    }
  };

  return (
    <div className="page-container">
      {/* Clinical Hero Header with Atmospheric Deep Sapphire Lighting */}
      <section style={{ textAlign: 'center', marginBottom: '44px', paddingTop: '16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '18px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span className="badge badge-indigo">
            🛡️ Zero-Knowledge Healthcare Privacy
          </span>
          <span className="badge badge-emerald">
            ● Midnight Preprod Verified
          </span>
          <span className="badge badge-blue">
            🔐 9 Compact zk-Circuits
          </span>
        </div>

        <h1
          style={{
            fontSize: '42px',
            fontWeight: 800,
            lineHeight: 1.18,
            marginBottom: '16px',
            letterSpacing: '-0.5px',
          }}
        >
          Your healthcare credentials.<br />
          <span className="gradient-text">Your data. Your choice.</span>
        </h1>

        <p
          style={{
            maxWidth: '700px',
            margin: '0 auto 28px',
            color: 'var(--text-secondary)',
            fontSize: '16px',
            lineHeight: 1.6,
          }}
        >
          MedProof enables authenticated prescriptions, clinical records, and bilateral patient consent without exposing diagnoses, dosages, or personal identities to the public blockchain.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/patient" className="btn btn-primary">
            🗂️ Access Patient Vault
          </Link>
          <Link href="/provider" className="btn btn-secondary">
            🏥 Healthcare Provider Portal
          </Link>
          <Link href="/verifier" className="btn btn-secondary">
            🔍 Verifier Workstation
          </Link>
          <Link href="/consent" className="btn btn-secondary">
            🛡️ Consent Center
          </Link>
        </div>
      </section>

      {/* Section: Operational Metrics with Explicit Truthful Provenance */}
      <section style={{ marginBottom: '36px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.2px',
              }}
            >
              Healthcare Operations Overview
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Real-time cryptographic audit trail of active session state
            </p>
          </div>
          <span className="badge badge-gray" style={{ fontSize: '11px' }}>
            Data Scope: {wallet.status === 'CONNECTED' ? 'Connected Patient Session' : 'Local Client Session'}
          </span>
        </div>

        <div className="metric-grid-5">
          {/* 1. Vault Records */}
          <div className="metric-card">
            <div className="metric-label">
              <span>Vault Records</span>
              <span title="Cryptographic credentials in client vault">🗂️</span>
            </div>
            <div className="metric-value">{totalVaultRegistrations}</div>
            <div className="metric-meta">
              <span style={{ color: '#85D1DB', fontWeight: 600 }}>My Vault</span>
              <span>· Client Session</span>
            </div>
          </div>

          {/* 2. Active Credentials */}
          <div className="metric-card">
            <div className="metric-label">
              <span>Active Credentials</span>
              <span title="Valid & unrevoked credentials">✅</span>
            </div>
            <div className="metric-value" style={{ color: '#2eb87e' }}>
              {activeCredentials}
            </div>
            <div className="metric-meta">
              <span>issuedCredentials Map</span>
            </div>
          </div>

          {/* 3. Revoked Records */}
          <div className="metric-card">
            <div className="metric-label">
              <span>Revoked Records</span>
              <span title="Revoked on-chain commitments">🚫</span>
            </div>
            <div className="metric-value" style={{ color: '#f87171' }}>
              {revokedCredentials}
            </div>
            <div className="metric-meta">
              <span>revokedCredentials Map</span>
            </div>
          </div>

          {/* 4. Active Consents */}
          <div className="metric-card">
            <div className="metric-label">
              <span>Active Consents</span>
              <span title="Authorized verifier consents">🛡️</span>
            </div>
            <div className="metric-value" style={{ color: '#B3EBF2' }}>
              {activeConsents}
            </div>
            <div className="metric-meta">
              <span>Bilateral Patient Keys</span>
            </div>
          </div>

          {/* 5. Verifications */}
          <div className="metric-card">
            <div className="metric-label">
              <span>ZK Verifications</span>
              <span title="Verification attempts in current session">⚡</span>
            </div>
            <div className="metric-value" style={{ color: '#B3EBF2' }}>
              {sessionVerifications}
            </div>
            <div className="metric-meta">
              <span>Current Session</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Selective Disclosure & Privacy Boundary Architecture */}
      <section
        className="glass-card"
        style={{ marginBottom: '36px', background: 'rgba(10, 18, 42, 0.88)' }}
      >
        <div className="glass-card-header">
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Zero-Knowledge Privacy Boundary Architecture
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              How MedProof cryptographically segregates sensitive PHI from public on-chain state
            </p>
          </div>
          <span className="badge badge-indigo">Poseidon SNARK Circuit</span>
        </div>

        <div className="privacy-boundary-container">
          {/* Column 1: Client Private State */}
          <div className="privacy-column privacy-column-private">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#c7d2fe' }}>
                Client Private Witness
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              STRICTLY CLIENT-SIDE (NEVER SHARED)
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <li>• Patient 256-bit Secret Seed</li>
              <li>• Medical Diagnoses &amp; Notes</li>
              <li>• Drug Names &amp; Specific Dosages</li>
              <li>• Cryptographic Nonces &amp; Salts</li>
            </ul>
          </div>

          {/* Arrow 1 */}
          <div className="privacy-arrow" style={{ textAlign: 'center', color: '#B3EBF2', fontSize: '20px', fontWeight: 700 }}>
            →
          </div>

          {/* Column 2: Local ZK Prover */}
          <div className="privacy-column privacy-column-proven">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#85D1DB' }}>
                Compact ZK Circuit
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              PROOFS GENERATED LOCALLY (:6300)
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <li>• Proves Doctor Authorization</li>
              <li>• Evaluates Active Patient Consent</li>
              <li>• Validates Expiration &ge; Epoch</li>
              <li>• Enforces Single-Use Nullifiers</li>
            </ul>
          </div>

          {/* Arrow 2 */}
          <div className="privacy-arrow" style={{ textAlign: 'center', color: '#2eb87e', fontSize: '20px', fontWeight: 700 }}>
            →
          </div>

          {/* Column 3: Public Ledger */}
          <div className="privacy-column privacy-column-public">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>🌐</span>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#2eb87e' }}>
                Midnight Preprod Ledger
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              PUBLIC ON-CHAIN STATE (ZERO PHI)
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <li>• 7-Vector Poseidon Commitments</li>
              <li>• Authorized Doctor Commitments</li>
              <li>• Consumed Dispense Nullifiers</li>
              <li>• 0 Bytes Sensitive Medical Data</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Grid: Recent Activity Feed + Protocol Status */}
      <section className="grid-2" style={{ marginBottom: '36px' }}>
        {/* Recent Session Activity Feed */}
        <div className="glass-card">
          <div className="glass-card-header">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Session Activity</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Chronological client session log (credentials, consents, verifications)
              </p>
            </div>
            <span className="badge badge-blue" style={{ fontSize: '11px' }}>
              Live Session
            </span>
          </div>

          {activityFeed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No session activity yet. Issue a credential in the Provider Portal or grant a verifier consent to record live transactions.
            </div>
          ) : (
            <div className="activity-feed">
              {activityFeed.slice(0, 5).map((act) => (
                <div key={act.id} className="activity-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{getActivityIcon(act.type)}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {act.details}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ marginBottom: '4px' }}>{getActivityBadge(act.status)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {act.identifierShort} · {act.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Protocol Status & Infrastructure */}
        <div className="glass-card">
          <div className="glass-card-header">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>MedProof Protocol Status</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Live Midnight Preprod network &amp; contract connectivity
              </p>
            </div>
            <span className="badge badge-emerald">Midnight Preprod</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                Canonical Smart Contract Address
              </div>
              <div
                className="mono"
                style={{
                  color: '#85D1DB',
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {systemStatus.contractAddress}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                style={{
                  background: 'var(--bg-input)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  NETWORK TARGET
                </div>
                <div style={{ fontWeight: 700, color: '#85D1DB', marginTop: '3px' }}>
                  Midnight Preprod
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-input)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  PROOF SERVER
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: systemStatus.proofServerOnline ? '#34d399' : '#fbbf24',
                    marginTop: '3px',
                  }}
                >
                  {systemStatus.proofServerOnline ? 'Ready (:6300)' : 'Offline / Standby'}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '10px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Public Data Leakage:</span>
              <span style={{ color: '#2eb87e', fontWeight: 700 }}>0 bytes PHI / PII on-chain</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Audited Circuits:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>9 Circuits · 11 Ledger Mappings</span>
            </div>

            <div style={{ marginTop: '4px' }}>
              <Link
                href="/credentials"
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '12px', padding: '9px' }}
              >
                Inspect On-Chain Commitments in Explorer ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Architecture Pillars */}
      <section className="grid-3" style={{ marginBottom: '32px' }}>
        <div className="glass-card">
          <div style={{ fontSize: '26px', marginBottom: '12px' }}>🔒</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            7-Attribute Vector Locking
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Every credential locks issuer, patient identity, clinical schema, risk category, expiration epoch, payload hash, and cryptographic salt into a single zero-knowledge commitment.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '26px', marginBottom: '12px' }}>🛡️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Bilateral Patient Consent
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            No pharmacy or third party can verify a credential without explicit cryptographic consent derived from the patient's private secret and verifier public key.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '26px', marginBottom: '12px' }}>⚡</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Single-Use Nullifiers
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Controlled substances and single-dispense prescriptions enforce on-chain nullifiers, mathematically preventing replay or double-dispensing while keeping prescription content secret.
          </p>
        </div>
      </section>
    </div>
  );
}
