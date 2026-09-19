import React, { useState } from 'react';
import type { Prescription } from '../../../src/healthcare-services';
import {
  AUTHORIZED_DOCTORS,
  AUTHORIZED_HOSPITALS,
  calculatePrescriptionHash,
  generateDoctorSignature,
  getPrescriptionStatus,
} from '../../../src/healthcare-services';
import { PrescriptionViewModal } from './PrescriptionViewModal';

interface DoctorPortalProps {
  prescriptions: Prescription[];
  onIssuePrescription: (prescription: Prescription) => void;
  onRevokePrescription: (id: string, reason: string) => void;
  onShowQR: (qrData: string, title: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  prescriptions,
  onIssuePrescription,
  onRevokePrescription,
  onShowQR,
  onNotify,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(AUTHORIZED_DOCTORS[0].id);
  const [patientName, setPatientName] = useState<string>('Alex Rivera');
  const [patientId, setPatientId] = useState<number>(105);
  const [medicationName, setMedicationName] = useState<string>('Amoxicillin 500mg');
  const [dosage, setDosage] = useState<string>('1 capsule every 8 hours (10 days)');
  const [instructions, setInstructions] = useState<string>('Take after meals with full glass of water.');

  // Default dates: issue today, expiry +30 days
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultExpiryStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [issueDate, setIssueDate] = useState<string>(todayStr);
  const [expiryDate, setExpiryDate] = useState<string>(defaultExpiryStr);

  // Success Confirmation State & Modal State
  const [lastIssuedRx, setLastIssuedRx] = useState<Prescription | null>(null);
  const [viewingRx, setViewingRx] = useState<Prescription | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Expired' | 'Revoked'>('All');

  const doctor = AUTHORIZED_DOCTORS.find(d => d.id === selectedDoctorId) || AUTHORIZED_DOCTORS[0];
  const hospital = AUTHORIZED_HOSPITALS.find(h => h.id === doctor.hospitalId) || AUTHORIZED_HOSPITALS[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !medicationName || !dosage) {
      onNotify('Please complete all required prescription fields.', 'error');
      return;
    }

    const rxCount = prescriptions.length + 1;
    const formattedId = `RX-${String(rxCount).padStart(6, '0')}`;

    const hash = calculatePrescriptionHash({
      patientId,
      medicationName,
      dosage,
      doctorId: doctor.id,
      issueDate,
      expiryDate,
    });

    const sig = generateDoctorSignature(hash, doctor.publicKey);

    const newRx: Prescription = {
      id: formattedId,
      patientId,
      patientName,
      medicationName,
      dosage,
      instructions,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorLicense: doctor.licenseNumber,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      issueDate,
      expiryDate,
      prescriptionHash: hash,
      doctorSignature: sig,
      status: 'Valid',
      createdAt: Date.now(),
    };

    onIssuePrescription(newRx);
    setLastIssuedRx(newRx);
    onNotify(`Confidential Prescription #${formattedId} issued & signed!`, 'success');
  };

  // Filtered prescription list
  const filteredPrescriptions = prescriptions.filter(rx => {
    const { status } = getPrescriptionStatus(rx.expiryDate, rx.status === 'Revoked');

    // Filter by status
    if (filterStatus === 'Active' && status !== 'Valid') return false;
    if (filterStatus === 'Expired' && status !== 'Expired') return false;
    if (filterStatus === 'Revoked' && status !== 'Revoked') return false;

    // Search by ID or Patient Slot
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = rx.id.toLowerCase().includes(term);
      const matchSlot = String(rx.patientId).includes(term);
      const matchMed = rx.medicationName.toLowerCase().includes(term);
      const matchDoc = rx.doctorName.toLowerCase().includes(term);
      return matchId || matchSlot || matchMed || matchDoc;
    }

    return true;
  });

  return (
    <div className="doctor-portal animate-slide-up">
      <div className="section-header">
        <div>
          <h2>👨‍⚕️ Authorized Doctor Portal & Hospital Allowlist</h2>
          <p className="subtitle">Issue digitally signed confidential credentials & manage revocations</p>
        </div>
        <div className="allowlist-tag">
          🔒 Certified Prescriber Environment
        </div>
      </div>

      {/* Success Confirmation Card Banner */}
      {lastIssuedRx && (
        <div className="card glass-card success-issuance-banner mb-24 animate-scale-up">
          <div className="banner-header">
            <span className="banner-icon">✅</span>
            <div>
              <h3 className="text-success">Confidential Prescription Successfully Issued</h3>
              <div className="text-xs text-muted">Secured on Midnight Network via Zero-Knowledge Proofs</div>
            </div>
            <button className="close-btn" onClick={() => setLastIssuedRx(null)}>×</button>
          </div>

          <div className="issuance-details-grid mt-16">
            <div className="detail-chip">
              <span className="chip-label">Prescription ID</span>
              <span className="chip-value font-mono font-bold text-cyan">{lastIssuedRx.id}</span>
            </div>
            <div className="detail-chip">
              <span className="chip-label">Doctor</span>
              <span className="chip-value">{lastIssuedRx.doctorName}</span>
            </div>
            <div className="detail-chip">
              <span className="chip-label">Patient Slot</span>
              <span className="chip-value font-bold">Slot #{lastIssuedRx.patientId}</span>
            </div>
            <div className="detail-chip">
              <span className="chip-label">Issue Date</span>
              <span className="chip-value">{lastIssuedRx.issueDate}</span>
            </div>
            <div className="detail-chip">
              <span className="chip-label">Expiry Date</span>
              <span className="chip-value">{lastIssuedRx.expiryDate}</span>
            </div>
            <div className="detail-chip">
              <span className="chip-label">Digital Signature</span>
              <span className="chip-value text-success font-bold">Verified ✓</span>
            </div>
          </div>

          <div className="banner-actions mt-16">
            <button
              onClick={() => setViewingRx(lastIssuedRx)}
              className="btn btn-primary btn-sm"
            >
              👁 View Prescription
            </button>
            <span className="v-badge v-badge-emerald">✅ Confidential</span>
            <span className="v-badge v-badge-purple">✅ Signed</span>
            <span className="v-badge v-badge-cyan">✅ Zero-Knowledge Protected</span>
          </div>
        </div>
      )}

      <div className="grid-2col">
        {/* Issue Prescription Form */}
        <div className="card glass-card">
          <div className="card-header">
            <h3>✍️ Issue Confidential Prescription</h3>
            <span className="badge badge-primary">Digital Signature Active</span>
          </div>

          <form onSubmit={handleCreate} className="prescription-form">
            <div className="form-group">
              <label>Select Authorized Doctor</label>
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                className="form-input"
              >
                {AUTHORIZED_DOCTORS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialisation} ({d.hospitalName})
                  </option>
                ))}
              </select>
            </div>

            <div className="doctor-details-box">
              <div><strong>License:</strong> {doctor.licenseNumber}</div>
              <div><strong>Hospital:</strong> {doctor.hospitalName} ({hospital.licenseCode})</div>
              <div className="font-mono text-muted text-xs truncate"><strong>Public Key:</strong> {doctor.publicKey}</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Patient Name (Stays Private)</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="form-input"
                  placeholder="Patient Full Name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Circuit Patient Slot ID</label>
                <input
                  type="number"
                  value={patientId}
                  onChange={e => setPatientId(Number(e.target.value))}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Medication Name (Stays Private)</label>
              <input
                type="text"
                value={medicationName}
                onChange={e => setMedicationName(e.target.value)}
                className="form-input"
                placeholder="e.g. Amoxicillin 500mg"
                required
              />
            </div>

            <div className="form-group">
              <label>Dosage & Frequency</label>
              <input
                type="text"
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                className="form-input"
                placeholder="e.g. 1 capsule every 8 hours"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Special Instructions</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="form-input"
                rows={2}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              🔐 Issue & Sign Confidential Prescription
            </button>
          </form>
        </div>

        {/* Hospital Allowlist */}
        <div className="flex-column gap-20">
          <div className="card glass-card">
            <h3>🏥 Approved Hospital Network Allowlist</h3>
            <div className="allowlist-list">
              {AUTHORIZED_HOSPITALS.map(h => (
                <div key={h.id} className="allowlist-item">
                  <div className="allowlist-info">
                    <span className="allowlist-name">{h.name}</span>
                    <span className="allowlist-city">{h.city} • Code: {h.licenseCode}</span>
                  </div>
                  <span className="badge badge-success">✓ {h.status} ({h.verifiedDoctorsCount} Doctors)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass-card">
            <h3>🔒 Zero-Knowledge Security Policy</h3>
            <p className="text-muted text-sm">
              All credentials issued via RxVerify automatically include cryptographic signatures and local SHA-256 digests.
              No prescription content is published to the blockchain.
            </p>
          </div>
        </div>
      </div>

      {/* "My Issued Prescriptions" Section */}
      <div className="card glass-card mt-32">
        <div className="section-header mb-16">
          <div>
            <h3>📋 My Issued Prescriptions</h3>
            <p className="subtitle">All confidential prescriptions issued during the current session</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="filter-toolbar mb-20">
          <div className="form-group search-input-group flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="🔍 Search by Prescription ID, Patient Slot, Medication, or Doctor..."
              className="form-input"
            />
          </div>

          <div className="filter-button-group">
            {(['All', 'Active', 'Expired', 'Revoked'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              >
                {status === 'All' && 'All'}
                {status === 'Active' && '🟢 Active'}
                {status === 'Expired' && '🟡 Expired'}
                {status === 'Revoked' && '🔴 Revoked'}
              </button>
            ))}
          </div>
        </div>

        {/* Prescription List Table */}
        {filteredPrescriptions.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">💊</div>
            <h4>No confidential prescriptions have been issued yet.</h4>
            <p className="text-xs text-muted mt-4">
              {searchTerm || filterStatus !== 'All'
                ? 'No prescriptions match your active search filter.'
                : 'Fill in the form above to issue your first signed prescription.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Prescription ID</th>
                  <th>Doctor</th>
                  <th>Patient Slot</th>
                  <th>Medication</th>
                  <th>Issue / Expiry</th>
                  <th>Current Status</th>
                  <th>Verification Badges</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map(rx => {
                  const { status } = getPrescriptionStatus(rx.expiryDate, rx.status === 'Revoked');

                  return (
                    <tr key={rx.id}>
                      <td className="font-mono font-bold text-cyan">{rx.id}</td>
                      <td className="font-medium">{rx.doctorName}</td>
                      <td>
                        <span className="slot-badge">Slot #{rx.patientId}</span>
                      </td>
                      <td>{rx.medicationName}</td>
                      <td className="text-xs text-muted">
                        {rx.issueDate} → {rx.expiryDate}
                      </td>
                      <td>
                        {status === 'Valid' && <span className="status-pill status-active">🟢 Active</span>}
                        {status === 'Expired' && <span className="status-pill status-expired">🟡 Expired</span>}
                        {status === 'Revoked' && <span className="status-pill status-revoked">🔴 Revoked</span>}
                      </td>
                      <td>
                        <div className="v-badges-compact">
                          <span className="v-tag" title="Confidential">✅ Confidential</span>
                          <span className="v-tag" title="Signed">✅ Signed</span>
                          <span className="v-tag" title="Zero-Knowledge Protected">✅ ZK</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex-row gap-8">
                          <button
                            onClick={() => setViewingRx(rx)}
                            className="btn btn-secondary btn-sm"
                          >
                            👁 View
                          </button>
                          {status !== 'Revoked' && (
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for revocation:', 'Treatment complete / Prescriber update') || 'Doctor update';
                                onRevokePrescription(rx.id, reason);
                                onNotify(`Prescription #${rx.id} revoked!`, 'info');
                              }}
                              className="btn btn-danger btn-sm"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Prescription Modal */}
      {viewingRx && (
        <PrescriptionViewModal
          prescription={viewingRx}
          onClose={() => setViewingRx(null)}
          onShowQR={onShowQR}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
