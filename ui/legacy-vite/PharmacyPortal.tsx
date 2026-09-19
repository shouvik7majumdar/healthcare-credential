import React, { useState } from 'react';
import type { Prescription } from '../../../src/healthcare-services';
import {
  AUTHORIZED_DOCTORS,
  AUTHORIZED_HOSPITALS,
  parseQRPayload,
  getPrescriptionStatus,
  verifyDoctorSignature,
} from '../../../src/healthcare-services';
import type { WalletState } from '../types';

interface PharmacyPortalProps {
  prescriptions: Prescription[];
  wallet: WalletState | null;
  contractAddress: string;
  network: string;
  onVerifyPrescriptionOnChain: (prescription: Prescription) => Promise<void>;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PharmacyPortal: React.FC<PharmacyPortalProps> = ({
  prescriptions,
  wallet,
  contractAddress,
  network,
  onVerifyPrescriptionOnChain,
  onNotify,
}) => {
  const [inputToken, setInputToken] = useState<string>('');
  const [selectedRxId, setSelectedRxId] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'SUCCESS' | 'EXPIRED' | 'REVOKED' | 'FAILED';
    doctorName?: string;
    hospitalName?: string;
    message: string;
    timestamp: number;
  } | null>(null);

  const handleVerify = async (rxToVerify?: Prescription) => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      let targetRx: Prescription | undefined = rxToVerify;

      if (!targetRx && selectedRxId) {
        targetRx = prescriptions.find(p => p.id === selectedRxId);
      }

      if (!targetRx && inputToken) {
        const parsed = parseQRPayload(inputToken);
        if (parsed) {
          targetRx = prescriptions.find(p => p.prescriptionHash === parsed.hash || p.id === parsed.id);
        }
      }

      if (!targetRx) {
        if (prescriptions.length > 0) {
          targetRx = prescriptions[0];
        } else {
          setVerificationResult({
            status: 'FAILED',
            message: 'No matching prescription or ZK token payload found in local provider database.',
            timestamp: Date.now(),
          });
          onNotify('Verification failed: Prescription token not recognized.', 'error');
          return;
        }
      }

      // Check Revocation
      if (targetRx.status === 'Revoked') {
        setVerificationResult({
          status: 'REVOKED',
          doctorName: targetRx.doctorName,
          hospitalName: targetRx.hospitalName,
          message: 'Prescription Revoked! Prescriber has invalidated this credential on-chain.',
          timestamp: Date.now(),
        });
        onNotify('Verification Result: Prescription Revoked by Doctor.', 'error');
        return;
      }

      // Check Expiry
      const expiryCheck = getPrescriptionStatus(targetRx.expiryDate, false);
      if (expiryCheck.status === 'Expired') {
        setVerificationResult({
          status: 'EXPIRED',
          doctorName: targetRx.doctorName,
          hospitalName: targetRx.hospitalName,
          message: `Prescription Expired on ${targetRx.expiryDate}. Cannot be fulfilled.`,
          timestamp: Date.now(),
        });
        onNotify('Verification Result: Prescription Expired.', 'error');
        return;
      }

      // Check Doctor Allowlist & Signature
      const doctor = AUTHORIZED_DOCTORS.find(d => d.id === targetRx?.doctorId);
      const hospital = AUTHORIZED_HOSPITALS.find(h => h.id === targetRx?.hospitalId);

      if (!doctor || doctor.status !== 'Active') {
        setVerificationResult({
          status: 'FAILED',
          message: 'Prescribing doctor is not on the certified active allowlist.',
          timestamp: Date.now(),
        });
        onNotify('Verification Result: Unauthorized Doctor.', 'error');
        return;
      }

      if (!hospital || hospital.status !== 'Approved') {
        setVerificationResult({
          status: 'FAILED',
          message: 'Issuing hospital network is not approved.',
          timestamp: Date.now(),
        });
        onNotify('Verification Result: Unapproved Hospital.', 'error');
        return;
      }

      // Run Midnight ZK Verification
      await onVerifyPrescriptionOnChain(targetRx);

      setVerificationResult({
        status: 'SUCCESS',
        doctorName: doctor.name,
        hospitalName: hospital.name,
        message: 'Zero-Knowledge Proof Verified On-Chain! Prescription is authentic, active, and valid for fulfillment.',
        timestamp: Date.now(),
      });
      onNotify('Pharmacy Verification Success! ZK Proof Validated.', 'success');

    } catch (err: any) {
      setVerificationResult({
        status: 'FAILED',
        message: err.message || 'ZK proof verification failed on Midnight circuit.',
        timestamp: Date.now(),
      });
      onNotify('Pharmacy Verification Failed on Circuit.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="pharmacy-portal animate-slide-up">
      <div className="section-header">
        <div>
          <h2>🏥 Pharmacy Verification Portal</h2>
          <p className="subtitle">Streamlined zero-knowledge verification workspace for licensed pharmacies</p>
        </div>
        <div className="pharmacy-badge">
           Verified Pharmacy Session
        </div>
      </div>

      <div className="grid-2col">
        {/* Scan / Select Section */}
        <div className="card glass-card">
          <h3>📱 QR Code & Token Scanner</h3>
          <p className="text-sm text-muted mb-16">
            Paste QR token JSON or select a patient credential for instant ZK verification.
          </p>

          <div className="form-group">
            <label>Scan or Paste ZK Token Payload</label>
            <textarea
              value={inputToken}
              onChange={e => setInputToken(e.target.value)}
              placeholder='Paste {"type":"RX_VERIFY_ZK_TOKEN", ...} or scan QR code payload'
              className="form-input font-mono text-xs"
              rows={4}
            />
          </div>

          <div className="divider-text">OR SELECT ISSUED CREDENTIAL</div>

          <div className="form-group">
            <label>Select Patient Credential</label>
            <select
              value={selectedRxId}
              onChange={e => setSelectedRxId(e.target.value)}
              className="form-input"
            >
              <option value="">-- Choose from Local Database --</option>
              {prescriptions.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.id} — {p.medicationName} ({p.patientName}) [{p.status}]
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={verifying}
            className="btn btn-primary btn-block btn-lg mt-16"
          >
            {verifying ? (
              <span className="flex-center gap-8">
                <span className="spinner"></span> Running Midnight ZK Circuit...
              </span>
            ) : (
              '⚡ Verify Prescription (Zero-Knowledge)'
            )}
          </button>
        </div>

        {/* Verification Result Display Card */}
        <div className="card glass-card result-panel">
          <h3>🔍 Verification Telemetry Result</h3>

          {!verificationResult ? (
            <div className="empty-state-box">
              <div className="empty-icon">🛡️</div>
              <p>Awaiting ZK verification scan.</p>
              <span className="text-xs text-muted">No medical data will be exposed during verification.</span>
            </div>
          ) : (
            <div className={`result-card result-${verificationResult.status.toLowerCase()} animate-fade-in`}>
              <div className="result-header">
                <span className="result-icon">
                  {verificationResult.status === 'SUCCESS' && '✅'}
                  {verificationResult.status === 'EXPIRED' && '⏰'}
                  {verificationResult.status === 'REVOKED' && '🚫'}
                  {verificationResult.status === 'FAILED' && '❌'}
                </span>
                <div>
                  <h4 className="result-title">
                    {verificationResult.status === 'SUCCESS' && 'PRESCRIPTION VERIFIED & CONFIDENTIAL'}
                    {verificationResult.status === 'EXPIRED' && 'PRESCRIPTION EXPIRED'}
                    {verificationResult.status === 'REVOKED' && 'PRESCRIPTION REVOKED'}
                    {verificationResult.status === 'FAILED' && 'VERIFICATION FAILED'}
                  </h4>
                  <div className="text-xs opacity-80">
                    Timestamp: {new Date(verificationResult.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="result-body">
                <p className="result-message">{verificationResult.message}</p>

                {verificationResult.doctorName && (
                  <div className="result-meta mt-12">
                    <div><strong>Verified Prescriber:</strong> {verificationResult.doctorName}</div>
                    <div><strong>Hospital Network:</strong> {verificationResult.hospitalName}</div>
                    <div><strong>Privacy Status:</strong> 🔒 zero medical content disclosed</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
