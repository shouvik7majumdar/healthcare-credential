import React, { useState } from 'react';
import type { Prescription, ProofToken } from '../../../src/healthcare-services';
import { formatExpiryBadge, createProofToken, encodeQRPayload } from '../../../src/healthcare-services';
import type { WalletState } from '../types';

interface PatientDashboardProps {
  prescriptions: Prescription[];
  wallet: WalletState | null;
  contractAddress: string;
  network: string;
  onVerifyPrescriptionOnChain: (prescription: Prescription) => Promise<void>;
  onShowQR: (qrData: string, title: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  prescriptions,
  wallet,
  contractAddress,
  network,
  onVerifyPrescriptionOnChain,
  onShowQR,
  onNotify,
}) => {
  const [activeTabRx, setActiveTabRx] = useState<string | null>(null);
  const [shareDuration, setShareDuration] = useState<number>(60); // 60 mins default
  const [activeProofToken, setActiveProofToken] = useState<ProofToken | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleGenerateShareToken = (rx: Prescription) => {
    const token = createProofToken(rx, shareDuration);
    setActiveProofToken(token);
    const payload = encodeQRPayload(token);
    onShowQR(payload, `Temporary ZK Proof Token (${shareDuration} mins)`);
    onNotify(`Temporary ZK proof token generated! Expires in ${shareDuration} minutes.`, 'success');
  };

  return (
    <div className="patient-dashboard animate-slide-up">
      <div className="section-header">
        <div>
          <h2>😷 Patient Prescription Management Dashboard</h2>
          <p className="subtitle">View private credentials, generate zero-knowledge proofs, and share temporary tokens</p>
        </div>
        <div className="patient-privacy-tag">
          🔒 Private Off-Chain Storage Active
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <div className="card glass-card empty-state-box">
          <div className="empty-icon">💊</div>
          <h3>No Prescriptions Found</h3>
          <p>You have no active prescriptions in your local private wallet state.</p>
          <p className="text-sm text-muted">Use the <strong>Doctor Portal</strong> to issue your first signed prescription.</p>
        </div>
      ) : (
        <div className="patient-grid">
          {prescriptions.map(rx => {
            const badge = formatExpiryBadge(rx.expiryDate, rx.status === 'Revoked');
            const isVerifying = verifyingId === rx.id;

            return (
              <div key={rx.id} className="card glass-card prescription-card hover-glow">
                <div className="rx-card-header">
                  <span className="rx-med-name">{rx.medicationName}</span>
                  <span className={`badge ${badge.badgeClass}`}>{badge.label}</span>
                </div>

                <div className="rx-card-body">
                  <div className="rx-detail-row">
                    <span className="rx-label">Dosage:</span>
                    <span className="rx-value">{rx.dosage}</span>
                  </div>

                  <div className="rx-detail-row">
                    <span className="rx-label">Patient:</span>
                    <span className="rx-value">{rx.patientName} (Slot #{rx.patientId})</span>
                  </div>

                  <div className="rx-detail-row">
                    <span className="rx-label">Prescriber:</span>
                    <span className="rx-value">{rx.doctorName}</span>
                  </div>

                  <div className="rx-detail-row">
                    <span className="rx-label">Hospital:</span>
                    <span className="rx-value">{rx.hospitalName}</span>
                  </div>

                  <div className="rx-detail-row">
                    <span className="rx-label">Issued / Expires:</span>
                    <span className="rx-value">{rx.issueDate} → {rx.expiryDate}</span>
                  </div>

                  <div className="rx-hash-box">
                    <div className="text-xs text-muted font-mono truncate">
                      <strong>Hash:</strong> {rx.prescriptionHash}
                    </div>
                  </div>
                </div>

                <div className="rx-card-actions">
                  <button
                    onClick={async () => {
                      setVerifyingId(rx.id);
                      try {
                        await onVerifyPrescriptionOnChain(rx);
                      } finally {
                        setVerifyingId(null);
                      }
                    }}
                    disabled={isVerifying || rx.status === 'Revoked'}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    {isVerifying ? (
                      <span className="flex-center gap-8">
                        <span className="spinner"></span> Proving ZK...
                      </span>
                    ) : (
                      '🔐 Verify On-Chain'
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const payload = encodeQRPayload(rx);
                      onShowQR(payload, `Prescription #${rx.id} ZK Payload`);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    📱 QR Code
                  </button>

                  <button
                    onClick={() => handleGenerateShareToken(rx)}
                    className="btn btn-outline btn-sm"
                  >
                    ⏳ Anonymous Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Duration Control */}
      <div className="card glass-card mt-24">
        <h3>⏳ Anonymous Temporary ZK Proof Link Configurator</h3>
        <p className="text-muted text-sm mb-16">
          Generate temporary proofs that automatically expire after a set duration. Third-party verifiers can confirm prescription authenticity without access to full details.
        </p>

        <div className="flex-row gap-16 align-center">
          <label className="font-bold text-sm">Token Validity Duration:</label>
          <select
            value={shareDuration}
            onChange={e => setShareDuration(Number(e.target.value))}
            className="form-input width-auto"
          >
            <option value={15}>15 Minutes (Quick Pharmacy Check)</option>
            <option value={60}>1 Hour (Standard Access)</option>
            <option value={1440}>24 Hours (Day Pass)</option>
          </select>
          <span className="text-xs text-muted">Proofs auto-invalidate when timer expires.</span>
        </div>
      </div>
    </div>
  );
};
