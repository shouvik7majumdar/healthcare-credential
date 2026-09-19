import React from 'react';
import type { Prescription, VerificationLog } from '../../../src/healthcare-services';
import { AUTHORIZED_DOCTORS, AUTHORIZED_HOSPITALS, getPrescriptionStatus } from '../../../src/healthcare-services';

interface AnalyticsDashboardProps {
  prescriptions: Prescription[];
  logs: VerificationLog[];
  verificationCount: bigint | null;
  contractActive: boolean | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  prescriptions,
  logs,
  verificationCount,
  contractActive,
}) => {
  // Compute analytics
  const totalIssued = prescriptions.length;

  let totalValid = 0;
  let totalExpired = 0;
  let totalRevoked = 0;

  prescriptions.forEach(p => {
    const { status } = getPrescriptionStatus(p.expiryDate, p.status === 'Revoked');
    if (status === 'Valid') totalValid++;
    else if (status === 'Expired') totalExpired++;
    else if (status === 'Revoked') totalRevoked++;
  });

  const totalVerifications = verificationCount !== null ? Number(verificationCount) : logs.filter(l => l.type === 'Verified').length;
  const activeDoctorsCount = AUTHORIZED_DOCTORS.filter(d => d.status === 'Active').length;
  const authorizedHospitalsCount = AUTHORIZED_HOSPITALS.filter(h => h.status === 'Approved').length;

  return (
    <div className="analytics-dashboard animate-fade-in">
      <div className="section-header">
        <div>
          <h2>📊 Healthcare Telemetry & ZK Analytics</h2>
          <p className="subtitle">Real-time confidential verification metrics across Midnight Network</p>
        </div>
        <div className="status-indicator-badge">
          <span className={`dot ${contractActive ? 'dot-active' : 'dot-inactive'}`}></span>
          {contractActive ? 'Midnight Preview Testnet Connected' : 'Ledger Syncing...'}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="stat-card metric-card hover-glow">
          <div className="metric-header">
            <span className="metric-icon">📜</span>
            <span className="metric-tag tag-blue">Total Issued</span>
          </div>
          <div className="metric-value">{totalIssued}</div>
          <div className="metric-footer">Active Patient Credentials</div>
        </div>

        <div className="stat-card metric-card hover-glow">
          <div className="metric-header">
            <span className="metric-icon">🛡️</span>
            <span className="metric-tag tag-emerald">Verified (ZK)</span>
          </div>
          <div className="metric-value gradient-text">{totalVerifications}</div>
          <div className="metric-footer">On-Chain Proof Completions</div>
        </div>

        <div className="stat-card metric-card hover-glow">
          <div className="metric-header">
            <span className="metric-icon">⏰</span>
            <span className="metric-tag tag-amber">Expired</span>
          </div>
          <div className="metric-value text-warning">{totalExpired}</div>
          <div className="metric-footer">Auto-Expired Prescriptions</div>
        </div>

        <div className="stat-card metric-card hover-glow">
          <div className="metric-header">
            <span className="metric-icon">🚫</span>
            <span className="metric-tag tag-rose">Revoked</span>
          </div>
          <div className="metric-value text-danger">{totalRevoked}</div>
          <div className="metric-footer">Doctor Revoked Credentials</div>
        </div>

        <div className="stat-card metric-card hover-glow">
          <div className="metric-header">
            <span className="metric-icon">👨‍⚕️</span>
            <span className="metric-tag tag-purple">Active Doctors</span>
          </div>
          <div className="metric-value">{activeDoctorsCount}</div>
          <div className="metric-footer">Authorized Prescribers</div>
        </div>

        <div className="stat-card metric-card hover-glow">
          <div className="metric-header">
            <span className="metric-icon">🏥</span>
            <span className="metric-tag tag-cyan">Hospitals</span>
          </div>
          <div className="metric-value">{authorizedHospitalsCount}</div>
          <div className="metric-footer">Approved Networks</div>
        </div>
      </div>

      <div className="system-health-banner">
        <div className="health-item">
          <span className="health-label">ZK Proof Prover Engine</span>
          <span className="health-value text-success">● Preview Proof Server Active (proof-server.preview.midnight.network)</span>
        </div>
        <div className="health-item">
          <span className="health-label">Data Privacy Level</span>
          <span className="health-value text-purple">● Zero Medical Exposure (Level 3)</span>
        </div>
        <div className="health-item">
          <span className="health-label">Compact Circuit Security</span>
          <span className="health-value text-cyan">● Witness Proof Verification Active</span>
        </div>
      </div>
    </div>
  );
};
