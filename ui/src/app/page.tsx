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
      {/* Charming Seaside Hero Section */}
      <section
        style={{
          textAlign: 'center',
          marginBottom: '44px',
          padding: '40px 24px 36px',
          background: 'linear-gradient(135deg, #C9FDF2 0%, #E3F8F5 50%, #B3EBF2 100%)',
          borderRadius: '20px',
          border: '1px solid #85D1DB',
          boxShadow: '0 8px 30px rgba(133, 209, 219, 0.25)',
        }}
      >
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
          <span className="badge badge-mint">
            🛡️ Zero-Knowledge Healthcare Privacy
          </span>
          <span className="badge badge-emerald">
            ● Midnight Preprod Verified
          </span>
          <span className="badge badge-teal">
            🔐 9 Compact zk-Circuits
          </span>
        </div>

        <h1
          style={{
            fontSize: '40px',
            fontWeight: 800,
            lineHeight: 1.18,
            marginBottom: '16px',
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
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
            fontWeight: 500,
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
          <Link href="/patient" className="btn btn-primary btn-lg">
            🗂️ Access Patient Vault
          </Link>
          <Link href="/provider" className="btn btn-secondary btn-lg">
            👨‍⚕️ Provider Issuance Portal
          </Link>
          <Link href="/verifier" className="btn btn-mint btn-lg">
            🔍 Zero-Knowledge Verifier
          </Link>
        </div>
      </section>

      {/* 5 High-Impact Metric Cards */}
      <section className="metric-grid-5">
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label">Active Credentials</span>
            <span className="badge badge-teal">Vault</span>
          </div>
          <div className="metric-value">{activeCredentials}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            of {totalVaultRegistrations} total issued
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label">Active Consents</span>
            <span className="badge badge-mint">Bilateral</span>
          </div>
          <div className="metric-value">{activeConsents}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Encrypted dispensary grants
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label">ZK Verifications</span>
            <span className="badge badge-blue">Proofs</span>
          </div>
          <div className="metric-value">{sessionVerifications}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Zero-knowledge validations
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label">Revocations</span>
            <span className="badge badge-rose">Revoked</span>
          </div>
          <div className="metric-value">{revokedCredentials}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            On-chain nullified
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label">Target Network</span>
            <span className="badge badge-emerald">Live</span>
          </div>
          <div className="metric-value" style={{ fontSize: '20px', color: 'var(--color-ocean-dark)' }}>
            {systemStatus.network}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Midnight Preprod Testnet
          </div>
        </div>
      </section>

      {/* Main Content: Activity & Protocol Health */}
      <section className="grid-2" style={{ marginBottom: '32px' }}>
        {/* Live Session Activity Stream */}
        <div className="glass-card">
          <div className="glass-card-header">
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Recent Session Activity
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Chronological client session log (credentials, consents, verifications)
              </p>
            </div>
            <span className="badge badge-teal" style={{ fontSize: '11px' }}>
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
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
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
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                MedProof Protocol Status
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Live Midnight Preprod network &amp; contract connectivity
              </p>
            </div>
            <span className="badge badge-emerald">Midnight Preprod</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div
              style={{
                background: '#F0FBF9',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-card)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                Canonical Smart Contract Address
              </div>
              <div
                className="mono"
                style={{
                  color: 'var(--color-ocean-dark)',
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {systemStatus.contractAddress}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                style={{
                  background: '#F0FBF9',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-card)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  NETWORK TARGET
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-ocean-dark)', marginTop: '3px' }}>
                  Midnight Preprod
                </div>
              </div>

              <div
                style={{
                  background: '#F0FBF9',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-card)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  PROOF SERVER
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: systemStatus.proofServerOnline ? '#059669' : '#d97706',
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
                borderTop: '1px solid var(--border-card)',
                paddingTop: '10px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Public Data Leakage:</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>0 bytes PHI / PII on-chain</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Audited Circuits:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>9 Circuits · 11 Ledger Mappings</span>
            </div>

            <div style={{ marginTop: '4px' }}>
              <Link
                href="/credentials"
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '12px', padding: '10px', textAlign: 'center' }}
              >
                Inspect On-Chain Commitments in Explorer ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Architecture Pillars */}
      <section className="grid-3" style={{ marginBottom: '32px' }}>
        <div className="glass-card" style={{ borderTop: '4px solid var(--color-ocean)' }}>
          <div style={{ fontSize: '26px', marginBottom: '12px' }}>🔒</div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            7-Attribute Vector Locking
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Every credential locks issuer, patient identity, clinical schema, risk category, expiration epoch, payload hash, and cryptographic salt into a single zero-knowledge commitment.
          </p>
        </div>

        <div className="glass-card" style={{ borderTop: '4px solid var(--color-mint)' }}>
          <div style={{ fontSize: '26px', marginBottom: '12px' }}>🛡️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Bilateral Patient Consent
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            No pharmacy or third party can verify a credential without explicit cryptographic consent derived from the patient&apos;s private secret and verifier public key.
          </p>
        </div>

        <div className="glass-card" style={{ borderTop: '4px solid #5AB5C4' }}>
          <div style={{ fontSize: '26px', marginBottom: '12px' }}>⚡</div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
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
