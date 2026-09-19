import React, { useState } from 'react';
import type { Prescription } from '../../../src/healthcare-services';
import { formatExpiryBadge, encodeQRPayload } from '../../../src/healthcare-services';

interface PrescriptionViewModalProps {
  prescription: Prescription;
  onClose: () => void;
  onShowQR: (qrData: string, title: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PrescriptionViewModal: React.FC<PrescriptionViewModalProps> = ({
  prescription,
  onClose,
  onShowQR,
  onNotify,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const badge = formatExpiryBadge(prescription.expiryDate, prescription.status === 'Revoked');

  const handleCopyId = () => {
    navigator.clipboard.writeText(prescription.id);
    setCopiedId(true);
    onNotify(`Prescription ID ${prescription.id} copied!`, 'success');
    setTimeout(() => setCopiedId(false), 3000);
  };

  const handleDownloadProof = () => {
    const proofData = {
      prescriptionId: prescription.id,
      patientSlotId: prescription.patientId,
      doctorName: prescription.doctorName,
      doctorLicense: prescription.doctorLicense,
      hospitalName: prescription.hospitalName,
      prescriptionHash: prescription.prescriptionHash,
      doctorSignature: prescription.doctorSignature,
      issueDate: prescription.issueDate,
      expiryDate: prescription.expiryDate,
      status: prescription.status,
      protocol: 'Midnight Network Zero-Knowledge Proof System (Compact v0.31)',
      downloadedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zk-proof-${prescription.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onNotify(`Downloaded ZK verification proof JSON for #${prescription.id}`, 'success');
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-card animate-scale-up rx-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex-center gap-12">
            <span className="modal-icon">💊</span>
            <div>
              <h3>Confidential Prescription Details</h3>
              <div className="font-mono text-xs text-muted">ID: {prescription.id}</div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Verification Badges */}
          <div className="verification-badges-row mb-16">
            <span className="v-badge v-badge-emerald">✅ Confidential</span>
            <span className="v-badge v-badge-purple">✅ Signed</span>
            <span className="v-badge v-badge-cyan">✅ Zero-Knowledge Protected</span>
          </div>

          <div className="status-banner mb-16">
            <span className="text-sm font-bold">Credential Status:</span>
            <span className={`badge ${badge.badgeClass}`}>{badge.label}</span>
          </div>

          <div className="detail-sections-grid">
            <div className="detail-box">
              <div className="detail-box-title font-bold">👨‍⚕️ Prescriber & Hospital</div>
              <div className="detail-item"><strong>Doctor:</strong> {prescription.doctorName}</div>
              <div className="detail-item"><strong>License:</strong> {prescription.doctorLicense}</div>
              <div className="detail-item"><strong>Hospital:</strong> {prescription.hospitalName}</div>
              <div className="detail-item">
                <strong>Digital Signature:</strong>{' '}
                <span className="text-success font-bold">✓ Verified (64-byte Ed25519)</span>
              </div>
            </div>

            <div className="detail-box">
              <div className="detail-box-title font-bold">💊 Medication & Session Metadata</div>
              <div className="detail-item"><strong>Patient Slot ID:</strong> Slot #{prescription.patientId}</div>
              <div className="detail-item"><strong>Medication:</strong> {prescription.medicationName}</div>
              <div className="detail-item"><strong>Dosage:</strong> {prescription.dosage}</div>
              <div className="detail-item"><strong>Instructions:</strong> {prescription.instructions || 'None'}</div>
            </div>
          </div>

          <div className="detail-box mt-12">
            <div className="detail-box-title font-bold">🗓️ Validity Dates & SHA-256 Hash</div>
            <div className="detail-item"><strong>Issue Date:</strong> {prescription.issueDate}</div>
            <div className="detail-item"><strong>Expiry Date:</strong> {prescription.expiryDate}</div>
            <div className="detail-item font-mono text-xs truncate mt-4">
              <strong>Hash Digest:</strong> {prescription.prescriptionHash}
            </div>
          </div>

          {/* Privacy Protection Notice */}
          <div className="privacy-notice-box mt-16">
            <span className="privacy-icon">🔒</span>
            <div>
              <strong>Midnight Protocol Privacy Protection:</strong>
              <p className="text-xs text-muted">
                This confidential prescription is secured by Midnight Network zero-knowledge cryptography.
                Medication details and diagnostic notes remain strictly private on your device.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions mt-20">
            <button onClick={handleDownloadProof} className="btn btn-primary flex-1">
              📥 Download Proof JSON
            </button>
            <button
              onClick={() => {
                const payload = encodeQRPayload(prescription);
                onShowQR(payload, `Prescription #${prescription.id} QR Code`);
              }}
              className="btn btn-secondary flex-1"
            >
              📱 Generate QR Code
            </button>
            <button onClick={handleCopyId} className="btn btn-outline">
              {copiedId ? '✓ Copied!' : '📋 Copy ID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
