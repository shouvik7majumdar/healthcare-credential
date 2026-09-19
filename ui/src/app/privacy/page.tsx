'use client';

import React from 'react';
import { MEDPROOF_CONFIG } from '../../lib/config';

export default function PrivacyArchitecturePage() {
  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
            MedProof Privacy Architecture &amp; Cryptographic Model
          </h1>
          <span className="badge badge-teal">Zero-Knowledge Trust Model</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px' }}>
          How MedProof combines Midnight zero-knowledge SNARK circuits, Compact smart contracts, and client-side secret
          witnesses to enforce strict HIPAA &amp; GDPR compliance without compromising on-chain integrity.
        </p>
      </div>

      {/* Visual Workflow Diagram */}
      <div className="glass-card" style={{ marginBottom: '32px', padding: '24px' }}>
        <div className="glass-card-header" style={{ marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>
              Confidential End-to-End Information Flow
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              From clinical issuance to zero-knowledge verification at the dispensary
            </p>
          </div>
          <span className="badge badge-network">5-Step Pipeline</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          position: 'relative'
        }}>
          {/* Step 1 */}
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>👨‍⚕️</span>
              <span className="badge badge-teal">Step 1</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Healthcare Provider</div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Authorized physician signs prescription and calculates 7-attribute commitment.
            </p>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--accent-teal)', marginTop: 'auto' }}>
              issueCredential circuit
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <span className="badge badge-teal">Step 2</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Confidential Handshake</div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              32-byte commitment is anchored to Midnight ledger. Sensitive clinical payload stays off-chain.
            </p>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--accent-teal)', marginTop: 'auto' }}>
              issuedCredentials map
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <span className="badge badge-teal">Step 3</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Patient Private Vault</div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Patient receives private preimages and grants cryptographic consent to specific verifiers.
            </p>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--accent-teal)', marginTop: 'auto' }}>
              grantConsent circuit
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <span className="badge badge-teal">Step 4</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>ZK-SNARK Prover</div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Midnight Proof Server generates zero-knowledge proof of validity without revealing secrets.
            </p>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--accent-teal)', marginTop: 'auto' }}>
              Compact circuit proof
            </div>
          </div>

          {/* Step 5 */}
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>🏥</span>
              <span className="badge badge-teal">Step 5</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Healthcare Verifier</div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Pharmacy receives on-chain mathematical verification. Nothing unnecessary was revealed.
            </p>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--accent-teal)', marginTop: 'auto' }}>
              verifyCredential circuit
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Privacy Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* WHAT IS PRIVATE */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-teal)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '22px' }}>🔒</span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--accent-teal)' }}>
                WHAT IS PRIVATE
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Strictly in Client-Side Patient Vault</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Protected Health Information (PHI) and clinical secrets that never touch the blockchain:
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            <li><strong>Patient Identity:</strong> Alex Mercer, legal name, date of birth, MRN</li>
            <li><strong>Medication Specifics:</strong> Compound names, dosages, frequencies, routes</li>
            <li><strong>Diagnosis &amp; Notes:</strong> ICD-10 diagnostic codes, practitioner instructions</li>
            <li><strong>Preimage Witnesses:</strong> <code className="mono">patientSecret</code>, <code className="mono">salt</code></li>
            <li><strong>Payload JSON:</strong> Full clinical text object and plaintext preimages</li>
          </ul>
        </div>

        {/* WHAT IS PUBLIC */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '22px' }}>🌐</span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--accent-blue)' }}>
                WHAT IS PUBLIC
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Visible on Midnight Preprod Public Ledger</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Only cryptographic commitments and operational flags exist on-chain:
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            <li><strong>Credential Commitments:</strong> 32-byte hashes in <code className="mono">issuedCredentials</code></li>
            <li><strong>Provider Identities:</strong> Public key commitments in <code className="mono">authorizedProviders</code></li>
            <li><strong>Revocation Indicators:</strong> Boolean state in <code className="mono">revokedCredentials</code></li>
            <li><strong>Consent IDs:</strong> 32-byte hashes in <code className="mono">activeConsents</code></li>
            <li><strong>Single-Use Nullifiers:</strong> Spent nullifier hashes in <code className="mono">dispensedNullifiers</code></li>
            <li><strong>Contract Epoch:</strong> Operational counter in <code className="mono">currentEpoch</code></li>
          </ul>
        </div>

        {/* WHAT IS PROVEN */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '22px' }}>✅</span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--accent-emerald)' }}>
                WHAT IS PROVEN
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mathematical Circuit Invariants Verified</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            When a verifier invokes <code className="mono">verifyCredential</code>, the circuit proves:
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            <li>Credential commitment was registered by an authorized provider</li>
            <li>Prover possesses valid preimages forming the 7-attribute commitment</li>
            <li>Credential category matches the verifier's required category constraint</li>
            <li>Credential has not expired: <code className="mono">expirationEpoch &gt;= currentEpoch</code></li>
            <li>Credential is not marked revoked on the ledger</li>
            <li>Patient granted consent to this specific verifier public key</li>
            <li>If single-use, the nullifier has never been previously spent</li>
          </ul>
        </div>

        {/* WHAT IS NEVER REVEALED */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '22px' }}>🚫</span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--accent-rose)' }}>
                WHAT IS NEVER REVEALED
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mathematically Impossible by ZK Construction</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Zero-knowledge soundness guarantees the verifier learns nothing beyond validity:
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            <li>Verifier never learns medical diagnosis or clinical rationale</li>
            <li>Verifier cannot view other credentials in the patient's vault</li>
            <li>Verifier cannot discover the patient's private secret witness</li>
            <li>Verifier cannot forge proofs or query other dispensaries</li>
            <li>Ledger observers cannot link separate dispensations to one identity</li>
            <li>No private preimage can be inverted from on-chain commitments</li>
          </ul>
        </div>
      </div>

      {/* The 7-Attribute Commitment Formula */}
      <div className="glass-card" style={{ marginBottom: '28px' }}>
        <div className="glass-card-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            The 7-Attribute Commitment Specification
          </h3>
          <span className="badge badge-teal">Poseidon Vector Hash</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
          In <code className="mono">contracts/medproof.compact</code>, credential integrity is cryptographically sealed by hashing
          7 distinct attributes together into a single 32-byte curve element. Changing any single character of the prescription
          or swapping the patient secret alters the commitment entirely:
        </p>
        <div className="mono" style={{
          background: 'var(--bg-input)',
          padding: '18px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          color: 'var(--accent-teal)',
          fontSize: '12px',
          lineHeight: '1.8',
          overflowX: 'auto'
        }}>
          credentialCommitment = persistentHash([<br />
          &nbsp;&nbsp;issuerProviderCommitment,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>// Attestation from authorized doctor</span><br />
          &nbsp;&nbsp;patientCommitment = persistentHash([patientSecret, &quot;PATIENT_ID&quot;]),<br />
          &nbsp;&nbsp;schemaHash = persistentHash(schemaId),&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>// Prescription format V1</span><br />
          &nbsp;&nbsp;categoryHash = persistentHash(category),&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>// Category 1-4 standard</span><br />
          &nbsp;&nbsp;epochHash = persistentHash(expirationEpoch),&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>// Time boundary check</span><br />
          &nbsp;&nbsp;payloadHash = SHA256(clinicalJSON),&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>// Sealed clinical details</span><br />
          &nbsp;&nbsp;salt&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>// 256-bit cryptographic entropy</span><br />
          ])
        </div>
      </div>

      {/* Deployment & Audit Verification */}
      <div className="glass-card">
        <div className="glass-card-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            Security Audit &amp; Preprod Verification
          </h3>
          <span className="badge badge-emerald">Audited &amp; Deployed</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          fontSize: '13px'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Midnight Preprod Deployment:</div>
            <div className="mono" style={{ color: 'var(--accent-teal)', wordBreak: 'break-all' }}>
              {MEDPROOF_CONFIG.contractAddress}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Independent Adversarial Audit:</div>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
              Phase 2D Verified (0 Critical / 0 High Findings)
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Regulatory Alignment:</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              HIPAA Privacy Rule (Zero PHI) &amp; GDPR Right to Erasure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
