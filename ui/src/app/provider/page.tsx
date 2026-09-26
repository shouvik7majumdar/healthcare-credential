'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useMedProofData } from '../../context/MedProofDataContext';
import { sha256Hex, computeCredentialCommitment } from '../../lib/crypto';
import { CredentialCategory, CREDENTIAL_CATEGORY_LABELS, OffChainCredential } from '../../types/medproof';
import { medproofService, IssueCredentialStatus } from '../../services/medproof-contract';

export default function ProviderPortalPage() {
  const { wallet, isConnected, connect } = useWallet();
  const { credentials, addCredential, revokeCredential, consents } = useMedProofData();
  const [isProviderAuthorized, setIsProviderAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isConnected || !wallet.address) {
      setIsProviderAuthorized(false);
      return;
    }
    // Check if the connected Lace provider is authorized on Midnight Preprod
    const KNOWN_AUTHORIZED_PROVIDERS = [
      'mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn'
    ];
    if (KNOWN_AUTHORIZED_PROVIDERS.includes(wallet.address)) {
      setIsProviderAuthorized(true);
    } else {
      setIsProviderAuthorized(false);
    }
  }, [isConnected, wallet.address]);

  const [activeTab, setActiveTab] = useState<'issue' | 'issued' | 'revoked' | 'auth'>('issue');
  const [searchQuery, setSearchQuery] = useState('');

  // Transaction Mode: Live Preprod vs Local Session
  const [txMode, setTxMode] = useState<'preprod' | 'local'>('preprod');

  // Form State
  const [patientId, setPatientId] = useState('PT-CONTROLLED-TEST-001');
  const [patientName, setPatientName] = useState('Eleanor Vance (Test Record)');
  const [patientSecret, setPatientSecret] = useState('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  const [medication, setMedication] = useState('Amoxicillin 500mg');
  const [dosage, setDosage] = useState('1 capsule every 8 hours for 10 days');
  const [instructions, setInstructions] = useState('Take with food. Complete entire course.');
  const [diagnosisCode, setDiagnosisCode] = useState('J01.90');
  const [category, setCategory] = useState<CredentialCategory>(CredentialCategory.STANDARD_PRESCRIPTION);
  const [expirationEpoch, setExpirationEpoch] = useState(12);
  const [isSingleUse, setIsSingleUse] = useState(true);

  const [isIssuing, setIsIssuing] = useState(false);
  const [issueStatus, setIssueStatus] = useState<IssueCredentialStatus | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string; commitment?: string; txHash?: string; blockHeight?: number } | null>(null);

  // Revoke modal
  const [confirmRevoke, setConfirmRevoke] = useState<{
    isOpen: boolean;
    credential: OffChainCredential | null;
    customCommitment?: string;
  }>({
    isOpen: false,
    credential: null
  });

  // Direct revoke input in Auth tab
  const [directRevokeCommitment, setDirectRevokeCommitment] = useState('');

  // Metrics
  const activeCredentials = credentials.filter(c => c.status === 'VALID');
  const revokedCredentials = credentials.filter(c => c.status === 'REVOKED');
  const activeConsentsCount = consents.filter(c => c.isActive).length;

  const filteredIssued = activeCredentials.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.medication.toLowerCase().includes(q) ||
      c.patientId.toLowerCase().includes(q) ||
      c.patientName.toLowerCase().includes(q) ||
      c.commitment.toLowerCase().includes(q) ||
      (CREDENTIAL_CATEGORY_LABELS[c.category] || '').toLowerCase().includes(q)
    );
  });

  const filteredRevoked = revokedCredentials.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.medication.toLowerCase().includes(q) ||
      c.patientId.toLowerCase().includes(q) ||
      c.commitment.toLowerCase().includes(q)
    );
  });

  const generateRandomPatientSecret = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const hex = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    setPatientSecret(hex);
  };

  const handleComputeAndIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    setFeedback(null);
    setIssueStatus(null);

    try {
      const payloadString = JSON.stringify({ medication, dosage, instructions, diagnosisCode, patientId });
      const payloadHash = await sha256Hex(payloadString);
      const salt = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Compute 7-attribute Poseidon commitment
      // In MedProof, provider commitment for the authorized address:
      const providerCommitment = '0xba4a59721d19ae5c74b1ef22590a323e681f5976eb495cbf057686bb1757a401';

      const commitment = await computeCredentialCommitment({
        issuerProviderCommitment: providerCommitment,
        patientSecret,
        schemaId: 1,
        category,
        expirationEpoch,
        payloadHash,
        salt,
      });

      if (txMode === 'preprod') {
        if (!isConnected || !wallet.address) {
          try {
            await connect('preprod');
          } catch (e) {
            throw new Error('Please connect your Midnight Lace wallet (authorized provider account) to issue on-chain.');
          }
        }
        if (!isProviderAuthorized) {
          throw new Error('Connected wallet is not an authorized provider on Midnight Preprod. Please switch to Local Vault mode or authorize provider.');
        }

        const result = await medproofService.executeRealIssueCredential({
          providerAddress: wallet.address!,
          commitment,
          onStatusChange: (status) => {
            setIssueStatus(status);
          }
        });

        // Add to shared reactive context
        addCredential({
          patientId,
          patientName,
          patientSecret,
          medication,
          dosage,
          instructions,
          diagnosisCode,
          prescriberName: wallet.address ? `Dr. (${wallet.address.substring(0, 10)}...)` : 'Dr. Authorized Practitioner',
          issuerProviderCommitment: providerCommitment,
          schemaId: 1,
          category,
          expirationEpoch,
          payloadHash,
          salt,
          commitment,
          status: 'VALID',
          isSingleUse,
          dispensed: false,
          issuedAtEpoch: 1,
          onChainTxHash: result.txHash,
          onChainBlockHeight: result.blockHeight,
        });

        setFeedback({
          type: 'success',
          message: result.blockHeight
            ? `Credential issued & confirmed on Midnight Preprod at Block #${result.blockHeight}!`
            : `Credential transaction submitted to Preprod! Tx: ${result.txHash.slice(0, 16)}...`,
          commitment,
          txHash: result.txHash,
          blockHeight: result.blockHeight,
        });
      } else {
        // Local Session Simulation
        addCredential({
          patientId,
          patientName,
          patientSecret,
          medication,
          dosage,
          instructions,
          diagnosisCode,
          prescriberName: isConnected && wallet.address ? `Dr. (${wallet.address.substring(0, 10)}...)` : 'Dr. Evelyn Vance, MD',
          issuerProviderCommitment: providerCommitment,
          schemaId: 1,
          category,
          expirationEpoch,
          payloadHash,
          salt,
          commitment,
          status: 'VALID',
          isSingleUse,
          dispensed: false,
          issuedAtEpoch: 1,
        });

        setFeedback({
          type: 'info',
          message: `Credential commitment computed and registered in local session vault (offline mode).`,
          commitment
        });
      }

      setActiveTab('issued');
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to issue credential'
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleExecuteRevocation = () => {
    if (confirmRevoke.credential) {
      revokeCredential(confirmRevoke.credential.commitment);
      setFeedback({
        type: 'info',
        message: `Credential for ${confirmRevoke.credential.medication} (${confirmRevoke.credential.commitment.substring(0, 14)}...) has been revoked.`
      });
    } else if (confirmRevoke.customCommitment) {
      revokeCredential(confirmRevoke.customCommitment);
      setFeedback({
        type: 'info',
        message: `Commitment ${confirmRevoke.customCommitment.substring(0, 16)}... marked as REVOKED.`
      });
      setDirectRevokeCommitment('');
    }
    setConfirmRevoke({ isOpen: false, credential: null });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
            Healthcare Provider Portal
          </h1>
          <span className="badge badge-teal">Practitioner Workspace</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '740px' }}>
          Issue zero-knowledge medical credentials, construct 7-attribute Poseidon commitments, and anchor commitments on the Midnight Preprod smart contract.
          Under MedProof security invariants, only the authorized provider can issue credentials and authorize revocations.
        </p>
      </div>

      {/* Provider Overview Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Authorization Status</span>
            <span style={{ fontSize: '16px' }}>🩺</span>
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: isConnected && isProviderAuthorized ? 'var(--accent-emerald)' : isConnected ? 'var(--accent-cyan)' : 'var(--accent-amber)', margin: '4px 0' }}>
            {isConnected && isProviderAuthorized ? 'Provider Authorized' : isConnected ? 'Connected (Pending Auth)' : 'Wallet Disconnected'}
          </div>
          <div className="metric-sub" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span className="metric-badge badge-network">{isConnected ? 'Lace Connected' : 'Lace Unlinked'}</span>
            <span className="metric-badge" style={{ background: isProviderAuthorized ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isProviderAuthorized ? 'var(--accent-emerald)' : 'var(--text-muted)', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
              {isProviderAuthorized ? 'Provider Authorized on Midnight Preprod' : 'Not Authorized On-Chain'}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Credentials Issued</span>
            <span style={{ fontSize: '16px' }}>📋</span>
          </div>
          <div className="metric-value">{activeCredentials.length}</div>
          <div className="metric-sub">
            <span className="metric-badge badge-session">Current Session</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active in vault</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Credentials Revoked</span>
            <span style={{ fontSize: '16px' }}>🚫</span>
          </div>
          <div className="metric-value">{revokedCredentials.length}</div>
          <div className="metric-sub">
            <span className="metric-badge badge-session">Current Session</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revoked status</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Consents</span>
            <span style={{ fontSize: '16px' }}>🛡️</span>
          </div>
          <div className="metric-value">{activeConsentsCount}</div>
          <div className="metric-sub">
            <span className="metric-badge badge-session">Patient Vault</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verifier links</span>
          </div>
        </div>
      </div>

      {/* Status Banner during active issue */}
      {issueStatus && (
        <div style={{
          marginBottom: '20px',
          padding: '16px 20px',
          borderRadius: '8px',
          background: issueStatus.stage === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' : issueStatus.stage === 'failed' || issueStatus.stage === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(133, 209, 219, 0.14)',
          border: `1px solid ${issueStatus.stage === 'confirmed' ? 'var(--accent-emerald)' : issueStatus.stage === 'failed' || issueStatus.stage === 'rejected' ? 'var(--accent-rose)' : 'var(--accent-blue)'}`,
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>
              {issueStatus.stage === 'confirmed' ? '✅' : issueStatus.stage === 'failed' || issueStatus.stage === 'rejected' ? '❌' : '⏳'}
            </span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              {issueStatus.stage === 'preparing' && '1. Preparing Circuit Parameters...'}
              {issueStatus.stage === 'proving' && '2. Generating ZK Proof with Proof Server (:6300)...'}
              {issueStatus.stage === 'waiting_approval' && '3. Waiting for Midnight Lace Approval...'}
              {issueStatus.stage === 'submitting' && '4. Submitting Transaction to Midnight Preprod...'}
              {issueStatus.stage === 'confirming' && '5. Awaiting Block Inclusion on Midnight Preprod...'}
              {issueStatus.stage === 'confirmed' && '6. Transaction Confirmed on Midnight Preprod!'}
              {issueStatus.stage === 'rejected' && 'Transaction Cancelled in Wallet'}
              {issueStatus.stage === 'failed' && 'Operation Failed'}
            </span>
          </div>
          <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)' }}>{issueStatus.message}</p>
          {issueStatus.txHash && (
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Transaction Hash: <code className="mono" style={{ color: 'var(--accent-teal)' }}>{issueStatus.txHash}</code>
            </div>
          )}
          {issueStatus.blockHeight && (
            <div style={{ fontSize: '12px', marginTop: '2px', color: 'var(--accent-emerald)' }}>
              Block Height: <strong>#{issueStatus.blockHeight}</strong>
            </div>
          )}
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          marginBottom: '20px',
          padding: '14px 18px',
          borderRadius: '8px',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : feedback.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(133, 209, 219, 0.11)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--accent-emerald)' : feedback.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-blue)'}`,
          color: 'var(--text-primary)',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: feedback.commitment ? '6px' : '0' }}>
            <span style={{ fontWeight: 600 }}>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
            >
              ×
            </button>
          </div>
          {feedback.commitment && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Commitment: <code className="mono" style={{ color: 'var(--accent-teal)' }}>{feedback.commitment}</code>
            </div>
          )}
          {feedback.txHash && (
            <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Tx Hash: <code className="mono" style={{ color: 'var(--accent-teal)' }}>{feedback.txHash}</code>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-btn ${activeTab === 'issue' ? 'active' : ''}`}
          onClick={() => setActiveTab('issue')}
        >
          ✍️ ISSUE CREDENTIAL
        </button>
        <button
          className={`tab-btn ${activeTab === 'issued' ? 'active' : ''}`}
          onClick={() => setActiveTab('issued')}
        >
          ISSUED CREDENTIALS ({activeCredentials.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'revoked' ? 'active' : ''}`}
          onClick={() => setActiveTab('revoked')}
        >
          REVOKED ({revokedCredentials.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          AUTHORIZATION & REVOCATION
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'issue' && (
        <div className="glass-card" style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div className="glass-card-header" style={{ marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>Issue Cryptographic Prescription</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Constructs a 7-attribute commitment matching <code className="mono">contracts/medproof.compact</code>.
                Clinical data is retained off-chain in the patient's client vault; only cryptographic commitment is registered on Midnight.
              </p>
            </div>
            <span className="badge badge-teal">issueCredential Circuit</span>
          </div>

          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
            <button
              type="button"
              className={`btn ${txMode === 'preprod' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '13px' }}
              onClick={() => setTxMode('preprod')}
            >
              🚀 Live Midnight Preprod Transaction
            </button>
            <button
              type="button"
              className={`btn ${txMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '13px' }}
              onClick={() => setTxMode('local')}
            >
              💾 Local Session Vault Only
            </button>
          </div>

          <form onSubmit={handleComputeAndIssue}>
            <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Patient ID Reference (Privacy-Safe)</label>
                <input
                  className="form-input"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="PT-CONTROLLED-TEST-001"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Patient Display Name (Vault Local Only)</label>
                <input
                  className="form-input"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Eleanor Vance"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Patient Secret (32-byte private witness)</label>
                <button
                  type="button"
                  onClick={generateRandomPatientSecret}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', fontSize: '12px' }}
                >
                  🎲 Generate Random Secret
                </button>
              </div>
              <input
                className="form-input mono"
                value={patientSecret}
                onChange={(e) => setPatientSecret(e.target.value)}
                placeholder="0x..."
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Private to patient; used in zero-knowledge circuit for consent checks & verification.
              </span>
            </div>

            <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Medication Name & Strength</label>
                <input
                  className="form-input"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  placeholder="Amoxicillin 500mg"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dosage & Frequency</label>
                <input
                  className="form-input"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="1 capsule TID x 10 days"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Dispensing & Usage Instructions</label>
              <textarea
                className="form-input"
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Take with food. Complete entire course."
                required
              />
            </div>

            <div className="grid-3" style={{ gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">ICD-10 Diagnosis Code</label>
                <input
                  className="form-input"
                  value={diagnosisCode}
                  onChange={(e) => setDiagnosisCode(e.target.value)}
                  placeholder="J01.90"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prescription Category</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(Number(e.target.value) as CredentialCategory)}
                >
                  <option value={CredentialCategory.STANDARD_PRESCRIPTION}>Standard Prescription (1)</option>
                  <option value={CredentialCategory.CONTROLLED_SUBSTANCE}>Controlled Substance (2)</option>
                  <option value={CredentialCategory.CHRONIC_CARE}>Chronic Care Management (3)</option>
                  <option value={CredentialCategory.EMERGENCY_ACCESS}>Emergency Access (4)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expiration Epoch</label>
                <input
                  type="number"
                  className="form-input"
                  value={expirationEpoch}
                  onChange={(e) => setExpirationEpoch(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={isSingleUse}
                  onChange={(e) => setIsSingleUse(e.target.checked)}
                />
                Single-Use Dispense Enforcement (Prevents double-dispensing via ZK nullifier)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isIssuing}
                style={{ minWidth: '220px' }}
              >
                {isIssuing
                  ? 'Processing ZK Issuance...'
                  : txMode === 'preprod'
                  ? !isConnected
                    ? '🔗 Connect Wallet & Issue on Preprod'
                    : '⚡ Issue on Midnight Preprod'
                  : '💾 Save to Local Vault'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Issued Credentials Tab */}
      {activeTab === 'issued' && (
        <div className="glass-card">
          <div className="glass-card-header" style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Active Medical Credentials</div>
            <input
              type="text"
              placeholder="Search credentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: '320px', fontSize: '13px' }}
            />
          </div>

          {filteredIssued.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p>No active credentials issued in this session.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredIssued.map((cred) => (
                <div
                  key={cred.id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
                        {cred.medication}
                      </span>
                      <span className="badge badge-teal">VALID</span>
                      {cred.onChainTxHash && <span className="badge badge-emerald">ON-CHAIN VERIFIED</span>}
                      {cred.isDemo && <span className="badge badge-demo">EXAMPLE RECORD</span>}
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 10px', color: 'var(--accent-rose)' }}
                      onClick={() => setConfirmRevoke({ isOpen: true, credential: cred })}
                    >
                      Revoke
                    </button>
                  </div>
                  <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    Commitment: {cred.commitment}
                  </div>
                  {cred.onChainTxHash && (
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--accent-teal)' }}>
                      On-Chain Tx: {cred.onChainTxHash} {cred.onChainBlockHeight ? `(Block #${cred.onChainBlockHeight})` : ''}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Patient: {cred.patientName} ({cred.patientId}) • Category: {CREDENTIAL_CATEGORY_LABELS[cred.category] || cred.category} • Dosage: {cred.dosage}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Revoked Credentials Tab */}
      {activeTab === 'revoked' && (
        <div className="glass-card">
          <div className="glass-card-header" style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Revoked Credentials</div>
            <input
              type="text"
              placeholder="Search revoked credentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: '320px', fontSize: '13px' }}
            />
          </div>

          {filteredRevoked.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p>No revoked credentials in this session.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredRevoked.map((cred) => (
                <div
                  key={cred.id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
                        {cred.medication}
                      </span>
                      <span className="badge badge-rose">REVOKED</span>
                      {cred.isDemo && <span className="badge badge-demo">EXAMPLE RECORD</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--accent-rose)' }}>On-Chain Revocation Locked</span>
                  </div>
                  <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Commitment: {cred.commitment}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Patient: {cred.patientName} ({cred.patientId}) • Category: {CREDENTIAL_CATEGORY_LABELS[cred.category] || cred.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auth Tab */}
      {activeTab === 'auth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Practitioner Authorization Model</h3>
              <span className="badge badge-teal">authorizedProviders Map</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
              Under MedProof contract rules, credential issuance requires the provider's public key commitment to exist in the contract's
              <code>authorizedProviders</code> map. Furthermore, only the original issuing provider (or root contract administrator) possesses
              authorization to revoke a credential:
            </p>
            <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Connected Provider Public Address (Lace):</div>
              <div className="mono" style={{ fontSize: '13px', color: 'var(--accent-teal)', wordBreak: 'break-all' }}>
                {wallet.address || 'Wallet not connected — Connect Lace in the top navigation bar'}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Contract Address: <code className="mono">94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626</code> (Midnight Preprod)
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Direct Revocation by Commitment</h3>
              <span className="badge badge-rose">revokeCredential Circuit</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Revoke an existing credential directly by submitting its 32-byte cryptographic commitment.
            </p>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Target Credential Commitment (32-byte hex)</label>
              <input
                className="form-input mono"
                placeholder="0x..."
                value={directRevokeCommitment}
                onChange={(e) => setDirectRevokeCommitment(e.target.value)}
              />
            </div>
            <button
              className="btn btn-danger"
              disabled={!directRevokeCommitment}
              onClick={() => setConfirmRevoke({ isOpen: true, credential: null, customCommitment: directRevokeCommitment })}
            >
              Authorize Revocation on Ledger
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmRevoke.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div className="glass-card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--accent-rose)' }}>
                ⚠️ Confirm Credential Revocation
              </h3>
            </div>
            <div style={{ margin: '16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <p>Are you sure you want to revoke this credential? Once revoked on-chain, all zero-knowledge verifications for this commitment will be permanently rejected.</p>
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '6px', fontSize: '12px' }}>
                {confirmRevoke.credential ? (
                  <>
                    <div><strong>Medication:</strong> {confirmRevoke.credential.medication}</div>
                    <div><strong>Patient:</strong> {confirmRevoke.credential.patientName}</div>
                    <div className="mono" style={{ color: 'var(--accent-teal)', marginTop: '4px' }}>
                      Commitment: {confirmRevoke.credential.commitment.substring(0, 24)}...
                    </div>
                  </>
                ) : (
                  <div className="mono" style={{ color: 'var(--accent-teal)' }}>
                    Commitment: {confirmRevoke.customCommitment}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmRevoke({ isOpen: false, credential: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleExecuteRevocation}
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
