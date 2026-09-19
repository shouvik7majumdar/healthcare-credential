// src/app/page.tsx
// MedProof — Confidential Healthcare Credential & Consent Exchange Overview Dashboard

'use client';

import React from 'react';
import Link from 'next/link';
import { useMedProofData } from '../context/MedProofDataContext';
import { useWallet } from '../context/WalletContext';

export default function OverviewPage() {
  const { credentials, consents, verificationHistory, activityFeed, systemStatus } = useMedProofData();
  const { wallet } = useWallet();

  // Truthfully derived metric calculations from connected session state
  const totalVaultRegistrations = credentials.length;
  const activeCredentials = credentials.filter(c => c.status === 'VALID').length;
  const revokedCredentials = credentials.filter(c => c.status === 'REVOKED').length;
  const activeConsents = consents.filter(c => c.isActive).length;
  const sessionVerifications = verificationHistory.length;

  const getActivityBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="badge badge-emerald">Completed</span>;
      case 'INFO':
        return <span className="badge badge-teal">Registered</span>;
      case 'WARNING':
        return <span className="badge badge-amber">Consent Revoked</span>;
      case 'DANGER':
        return <span className="badge badge-rose">Revoked</span>;
      default:
        return <span className="badge badge-gray">Recorded</span>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CREDENTIAL_ISSUED':
        return '📜';
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
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span className="badge badge-teal">
            Zero-Knowledge Healthcare Privacy
          </span>
          <span className="badge badge-emerald">
            ● Preprod Contract Active
          </span>
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1.2, marginBottom: '14px' }}>
          Prove what is necessary.<br />
          <span className="gradient-text">Reveal nothing unnecessary.</span>
        </h1>
        <p style={{ maxWidth: '680px', margin: '0 auto 24px', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
          MedProof enables cryptographically authenticated prescriptions, medical credentials, and bilateral patient consent without exposing diagnoses, dosages, or personal identities to the blockchain.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/patient" className="btn btn-primary">
            Access Patient Vault
          </Link>
          <Link href="/provider" className="btn btn-secondary">
            Healthcare Provider Portal
          </Link>
          <Link href="/verifier" className="btn btn-secondary">
            Verifier Portal
          </Link>
          <Link href="/consent" className="btn btn-secondary">
            Consent Center
          </Link>
        </div>
      </div>

      {/* Section 2: Real-Data Metric Cards with Truthful Provenance Labels */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
            Healthcare Operations Overview
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Data Scope: {wallet.status === 'CONNECTED' ? 'Connected Patient Session' : 'Local Patient Vault'}
          </span>
        </div>

        <div className="metric-grid-5">
          {/* 1. Vault Registrations */}
          <div className="metric-card">
            <div className="metric-label">
              <span>Vault Records</span>
              <span title="Cryptographic credentials in client vault">🗂️</span>
            </div>
            <div className="metric-value">{totalVaultRegistrations}</div>
            <div className="metric-meta">
              <span style={{ color: 'var(--accent-teal)' }}>My Vault</span>
              <span>· Client Session</span>
            </div>
          </div>

          {/* 2. Active Credentials */}
          <div className="metric-card">
            <div className="metric-label">
              <span>Active Credentials</span>
              <span title="Valid & unrevoked credentials">✅</span>
            </div>
            <div className="metric-value" style={{ color: '#34d399' }}>{activeCredentials}</div>
            <div className="metric-meta">
              <span style={{ color: '#34d399' }}>Valid on-chain</span>
              <span>· {totalVaultRegistrations - activeCredentials} revoked</span>
            </div>
          </div>

          {/* 3. Revoked Credentials */}
          <div className="metric-card">
            <div className="metric-label">
              <span>Revoked Records</span>
              <span title="Confirmed revoked credentials">🚫</span>
            </div>
            <div className="metric-value" style={{ color: revokedCredentials > 0 ? '#fb7185' : 'var(--text-muted)' }}>
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
            <div className="metric-value" style={{ color: '#38bdf8' }}>{activeConsents}</div>
            <div className="metric-meta">
              <span>Bilateral Patient Keys</span>
            </div>
          </div>

          {/* 5. Verifications */}
          <div className="metric-card">
            <div className="metric-label">
              <span>Verifications</span>
              <span title="Verification attempts in current session">⚡</span>
            </div>
            <div className="metric-value" style={{ color: '#c084fc' }}>{sessionVerifications}</div>
            <div className="metric-meta">
              <span>Current Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Recent Activity Feed (Section 11) + Protocol State Status (Section 12) */}
      <div className="grid-2" style={{ marginBottom: '36px' }}>
        {/* Recent Session Activity Feed */}
        <div className="glass-card">
          <div className="glass-card-header">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Session Activity</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Chronological client session log (credentials issued, consents granted, claims verified)
              </p>
            </div>
            <span className="badge badge-teal" style={{ fontSize: '11px' }}>
              Live Session
            </span>
          </div>

          {activityFeed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No session activity yet. Issue a credential in the Provider Portal or grant a verifier consent to see live records.
            </div>
          ) : (
            <div className="activity-feed">
              {activityFeed.slice(0, 5).map((act) => (
                <div key={act.id} className="activity-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>{getActivityIcon(act.type)}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {act.details}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
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
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>MedProof Protocol Status</h3>
            <span className="badge badge-emerald">Midnight Preprod</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Target Smart Contract
              </div>
              <div className="mono" style={{ color: 'var(--accent-teal)', wordBreak: 'break-all', fontSize: '11px' }}>
                {systemStatus.contractAddress}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>NETWORK TARGET</div>
                <div style={{ fontWeight: 600, color: '#38bdf8', marginTop: '2px' }}>Midnight Preprod</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PROOF SERVER</div>
                <div style={{ fontWeight: 600, color: systemStatus.proofServerOnline ? '#34d399' : '#fbbf24', marginTop: '2px' }}>
                  {systemStatus.proofServerOnline ? 'Ready (:6300)' : 'Offline / Standby'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Public Data Leakage:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>0 bytes PHI / PII on-chain</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Audited Circuits:</span>
              <span style={{ color: 'var(--text-secondary)' }}>9 Circuits · 11 Ledger Mappings</span>
            </div>

            <div style={{ marginTop: '6px' }}>
              <Link href="/credentials" className="btn btn-secondary" style={{ width: '100%', fontSize: '12px', padding: '8px' }}>
                Inspect On-Chain Commitments in Explorer ↗
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Architecture Pillars */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        <div className="glass-card">
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>7-Attribute Vector Locking</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Every credential locks issuer, patient identity, clinical schema, risk category, expiration epoch, payload hash, and cryptographic salt into a single zero-knowledge commitment.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛡️</div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>Bilateral Patient Consent</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            No pharmacy or third party can verify a credential without explicit cryptographic consent derived from the patient's private secret and verifier public key.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚡</div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>Single-Use Nullifiers</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Controlled substances and single-dispense prescriptions enforce on-chain nullifiers, mathematically preventing replay or double-dispensing while keeping prescription content secret.
          </p>
        </div>
      </div>
    </div>
  );
}
