import React from 'react';

export function PrivacyModel() {
  return (
    <section className="section animate-slide-up" style={{ marginTop: '8px' }}>
      <div className="privacy-section">
        <div className="privacy-title">
          <span>🔒</span> Privacy Model
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fc8181', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>👁️</span> What observers CAN see
            </div>
            <div className="privacy-row">
              <span className="privacy-row-label">Verification count</span>
              <span className="privacy-row-value public">Public</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-row-label">Contract status</span>
              <span className="privacy-row-value public">Public</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-row-label">Patient slot ID</span>
              <span className="privacy-row-value public">Disclosed</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-teal)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔒</span> What observers CANNOT see
            </div>
            <div className="privacy-row">
              <span className="privacy-row-label">Prescription content</span>
              <span className="privacy-row-value private">Private</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-row-label">Prescription hash</span>
              <span className="privacy-row-value private">Private</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-row-label">Doctor signature</span>
              <span className="privacy-row-value private">Private</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-row-label">Patient identity</span>
              <span className="privacy-row-value private">Private</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(52, 211, 153, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(52, 211, 153, 0.1)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent-teal)' }}>How it works: </strong>
          Your prescription is hashed with SHA-256 locally in your browser. A Compact ZK circuit proves
          the hash is non-zero (prescription exists) and the doctor signature is valid, without revealing
          either value. Only the <code>verificationCount</code> is updated on the public ledger.
        </div>
      </div>
    </section>
  );
}