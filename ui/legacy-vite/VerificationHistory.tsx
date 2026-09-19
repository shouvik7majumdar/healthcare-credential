import React from 'react';
import type { VerificationLog } from '../../../src/healthcare-services';

interface VerificationHistoryProps {
  logs: VerificationLog[];
  onClearLogs?: () => void;
}

export const VerificationHistory: React.FC<VerificationHistoryProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="verification-history animate-slide-up">
      <div className="section-header">
        <div>
          <h2>📜 Confidential Verification History Log</h2>
          <p className="subtitle">Audit trail of zero-knowledge proof evaluations, credential issuances, and revocations</p>
        </div>
        {logs.length > 0 && onClearLogs && (
          <button onClick={onClearLogs} className="btn btn-outline btn-sm">
            Clear Audit Log
          </button>
        )}
      </div>

      <div className="card glass-card">
        {logs.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">📜</div>
            <p>No verification activity recorded yet.</p>
            <span className="text-xs text-muted">Issuing or verifying a prescription will generate zero-knowledge audit events here.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Prescription ID</th>
                  <th>Role</th>
                  <th>ZK Status</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-muted">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${
                        log.type === 'Verified' ? 'badge-success' :
                        log.type === 'Issued' ? 'badge-primary' :
                        log.type === 'Revoked' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-xs">{log.prescriptionId}</td>
                    <td>
                      <span className="role-tag">{log.verifierRole}</span>
                    </td>
                    <td>
                      <span className={`zk-status-pill ${
                        log.zkStatus === 'Proof Valid' ? 'zk-valid' :
                        log.zkStatus === 'Revoked' ? 'zk-revoked' : 'zk-failed'
                      }`}>
                        {log.zkStatus === 'Proof Valid' && '🔒 Proof Valid'}
                        {log.zkStatus === 'Proof Failed' && '❌ Proof Failed'}
                        {log.zkStatus === 'Revoked' && '🚫 Revoked'}
                        {log.zkStatus === 'Token Expired' && '⏰ Expired'}
                      </span>
                    </td>
                    <td className="text-sm">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
