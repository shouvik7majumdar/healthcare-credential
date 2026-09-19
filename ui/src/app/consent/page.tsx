'use client';

import React, { useState } from 'react';
import { useMedProofData } from '../../context/MedProofDataContext';
import { useWallet } from '../../context/WalletContext';
import { ConsentRecord } from '../../types/medproof';
import type { ConsentStatus } from '../../services/medproof-contract';

export default function ConsentCenterPage() {
  const { consents, grantConsent, revokeConsent, credentials } = useMedProofData();
  const { isConnected, wallet } = useWallet();

  const [activeTab, setActiveTab] = useState<'active' | 'revoked' | 'grant'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Execution Pipeline Mode
  const [executionMode, setExecutionMode] = useState<'real' | 'session'>('real');
  const [txStatus, setTxStatus] = useState<ConsentStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Grant Consent Form state
  const [patientSecret, setPatientSecret] = useState('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  const [newVerifierName, setNewVerifierName] = useState('Regional Medical Center');
  const [newVerifierPk, setNewVerifierPk] = useState('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
  const [selectedCredId, setSelectedCredId] = useState(credentials[0]?.id || '');
  const [customCommitment, setCustomCommitment] = useState(credentials[0]?.commitment || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    consent: ConsentRecord | null;
    action: 'revoke' | 'reactivate';
  }>({
    isOpen: false,
    consent: null,
    action: 'revoke'
  });

  const activeConsents = consents.filter(c => c.isActive);
  const revokedConsents = consents.filter(c => !c.isActive);
  const uniqueVerifiers = new Set(activeConsents.map(c => c.verifierPk)).size;
  const uniqueCredentials = new Set(activeConsents.map(c => c.credentialCommitment)).size;

  const filteredConsents = (activeTab === 'active' ? activeConsents : revokedConsents).filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.verifierName.toLowerCase().includes(q) ||
      c.credentialName.toLowerCase().includes(q) ||
      c.verifierPk.toLowerCase().includes(q) ||
      c.credentialCommitment.toLowerCase().includes(q)
    );
  });

  const handleCredentialSelect = (credId: string) => {
    setSelectedCredId(credId);
    const found = credentials.find(c => c.id === credId);
    if (found) {
      setCustomCommitment(found.commitment);
    }
  };

  const generateRandomSecret = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const hex = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    setPatientSecret(hex);
  };

  const handleGrantConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVerifierPk || !customCommitment || !patientSecret) {
      setFeedback({ type: 'error', message: 'Verifier Public Key, Credential Commitment, and Patient Secret are required.' });
      return;
    }

    const cleanPk = newVerifierPk.replace(/^0x/, '');
    const cleanComm = customCommitment.replace(/^0x/, '');
    const cleanSec = patientSecret.replace(/^0x/, '');

    if (cleanPk.length !== 64 || cleanComm.length !== 64 || cleanSec.length !== 64) {
      setFeedback({
        type: 'error',
        message: 'All cryptographic parameters must be valid 32-byte hex strings (64 hexadecimal characters).'
      });
      return;
    }

    if (executionMode === 'real' && !isConnected) {
      setFeedback({
        type: 'error',
        message: 'Please connect your Midnight Lace wallet (top-right) before submitting a live on-chain transaction.'
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    setTxStatus({ stage: 'preparing', message: 'Initializing transaction pipeline...' });

    try {
      const selectedCred = credentials.find(c => c.id === selectedCredId);
      const result = await grantConsent({
        verifierPk: newVerifierPk,
        verifierName: newVerifierName || 'Authorized Verifier',
        credentialCommitment: customCommitment,
        patientSecret,
        credentialName: selectedCred ? `${selectedCred.medication} (${selectedCred.category})` : 'Custom Credential',
        isRealTx: executionMode === 'real',
        onStatusChange: (status) => {
          setTxStatus(status);
        }
      });

      if (executionMode === 'real') {
        setFeedback({
          type: 'success',
          message: `Live Midnight Preprod transaction confirmed! Consent ID: ${result.consentId.substring(0, 18)}... ${result.txHash ? `| Tx Hash: ${result.txHash}` : ''} ${result.blockHeight ? `| Block #${result.blockHeight}` : ''}`
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Session consent created! Consent ID: ${result.consentId.substring(0, 18)}... (Recorded in local session).`
        });
      }
      setActiveTab('active');
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: `Transaction failed: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openConfirmation = (consent: ConsentRecord, action: 'revoke' | 'reactivate') => {
    setConfirmModal({
      isOpen: true,
      consent,
      action
    });
  };

  const executeConfirmedAction = async () => {
    if (confirmModal.consent) {
      if (confirmModal.action === 'revoke') {
        revokeConsent(confirmModal.consent.id);
        setFeedback({
          type: 'info',
          message: `Consent for ${confirmModal.consent.verifierName} has been revoked.`
        });
      } else {
        await grantConsent({
          verifierPk: confirmModal.consent.verifierPk,
          verifierName: confirmModal.consent.verifierName,
          credentialCommitment: confirmModal.consent.credentialCommitment,
          patientSecret: confirmModal.consent.patientSecret,
          credentialName: confirmModal.consent.credentialName,
          isRealTx: false
        });
        setFeedback({
          type: 'success',
          message: `Consent for ${confirmModal.consent.verifierName} has been re-activated.`
        });
      }
    }
    setConfirmModal({ isOpen: false, consent: null, action: 'revoke' });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Patient Consent Manager
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, maxWidth: '640px', lineHeight: '1.5' }}>
            Authorize and manage zero-knowledge verification access for healthcare providers, pharmacies, and insurers.
            Revocable anytime with immediate on-chain cryptographic enforcement.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`btn ${activeTab === 'grant' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('grant'); setFeedback(null); }}
          >
            + Authorize New Verifier
          </button>
        </div>
      </div>

      {/* Global feedback message */}
      {feedback && (
        <div className={`alert alert-${feedback.type}`} style={{ marginBottom: '20px' }}>
          <span>{feedback.type === 'success' ? '?' : feedback.type === 'error' ? '?' : '?'}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Live Transaction Status Banner (When Processing or Pending Approval) */}
      {isProcessing && txStatus && (
        <div style={{
          background: txStatus.stage === 'waiting_approval' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
          border: `1px solid ${txStatus.stage === 'waiting_approval' ? 'var(--accent-amber)' : 'var(--accent-teal)'}`,
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>
                {txStatus.stage === 'waiting_approval' ? '??' : txStatus.stage === 'proving' ? '??' : '?'}
              </span>
              <strong style={{
                fontSize: '15px',
                color: txStatus.stage === 'waiting_approval' ? 'var(--accent-amber)' : 'var(--accent-teal)'
              }}>
                {txStatus.stage === 'preparing' && 'Stage 1/5: Preparing Circuit Execution'}
                {txStatus.stage === 'proving' && 'Stage 2/5: Generating ZK Proof (Proof Server :6300)'}
                {txStatus.stage === 'waiting_approval' && 'Stage 3/5: HUMAN APPROVAL REQUIRED ? Midnight Lace Popup'}
                {txStatus.stage === 'submitting' && 'Stage 4/5: Broadcasting Transaction to Preprod'}
                {txStatus.stage === 'confirming' && 'Stage 5/5: Awaiting Block Confirmation on Preprod'}
                {txStatus.stage === 'confirmed' && 'Transaction Confirmed!'}
                {txStatus.stage === 'rejected' && 'Transaction Cancelled in Lace'}
                {txStatus.stage === 'failed' && 'Transaction Failed'}
              </strong>
            </div>
            <span className={`badge ${txStatus.stage === 'waiting_approval' ? 'badge-amber' : 'badge-teal'}`}>
              {txStatus.stage.toUpperCase()}
            </span>
          </div>

          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
            {txStatus.message}
          </p>

          {txStatus.stage === 'waiting_approval' && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '13px',
              marginTop: '12px',
              borderLeft: '3px solid var(--accent-amber)'
            }}>
              <strong>Human Action Required:</strong> Please look at your Google Chrome browser window. The Midnight Lace extension has opened an approval popup asking to balance and sign this transaction. Review the DUST fee and click <strong>Approve</strong>.
            </div>
          )}

          {txStatus.consentId && (
            <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Consent ID: {txStatus.consentId}
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Authorizations
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-teal)' }}>
            {activeConsents.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Cryptographically active on ledger
          </div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Authorized Organizations
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-blue)' }}>
            {uniqueVerifiers}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Distinct verifier public keys
          </div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Protected Credentials
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-indigo)' }}>
            {uniqueCredentials}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Distinct clinical commitments
          </div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Revoked Authorizations
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-rose)' }}>
            {revokedConsents.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Access permanently blocked
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active' ? '2px solid var(--accent-teal)' : '2px solid transparent',
            color: activeTab === 'active' ? 'var(--accent-teal)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Active Consents ({activeConsents.length})
        </button>
        <button
          onClick={() => setActiveTab('revoked')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'revoked' ? '2px solid var(--accent-rose)' : '2px solid transparent',
            color: activeTab === 'revoked' ? 'var(--accent-rose)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Revoked Consents ({revokedConsents.length})
        </button>
        <button
          onClick={() => setActiveTab('grant')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'grant' ? '2px solid var(--accent-teal)' : '2px solid transparent',
            color: activeTab === 'grant' ? 'var(--accent-teal)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          + Authorize Verifier
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab !== 'grant' ? (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              {activeTab === 'active' ? 'Currently Authorized Verifiers' : 'Revoked Authorizations'}
            </div>
            <input
              type="text"
              placeholder="Search by verifier, credential, or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: '320px', fontSize: '13px' }}
            />
          </div>

          {filteredConsents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>??</div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                No {activeTab} consents found
              </div>
              <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px' }}>
                {searchQuery ? 'Try adjusting your search criteria.' : 'Authorize a healthcare provider or verifier using the "Authorize Verifier" tab.'}
              </p>
              {activeTab === 'active' && !searchQuery && (
                <button className="btn btn-primary" onClick={() => setActiveTab('grant')}>
                  Authorize Verifier
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredConsents.map((consent) => (
                <div
                  key={consent.id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
                          {consent.verifierName}
                        </span>
                        {consent.isDemo ? (
                          <span className="badge badge-demo">EXAMPLE RECORD</span>
                        ) : consent.txHash ? (
                          <span className="badge badge-emerald">ON-CHAIN PREPROD</span>
                        ) : (
                          <span className="badge badge-session">SESSION RECORD</span>
                        )}
                        {consent.isActive ? (
                          <span className="badge badge-emerald">ACTIVE CONSENT</span>
                        ) : (
                          <span className="badge badge-rose">REVOKED</span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Target Credential: <strong style={{ color: 'var(--text-primary)' }}>{consent.credentialName}</strong>
                      </div>
                    </div>

                    <div>
                      <button
                        className={`btn ${consent.isActive ? 'btn-danger' : 'btn-primary'}`}
                        style={{ fontSize: '12px', padding: '7px 14px' }}
                        onClick={() => openConfirmation(consent, consent.isActive ? 'revoke' : 'reactivate')}
                      >
                        {consent.isActive ? 'Revoke Consent' : 'Re-Activate Consent'}
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>
                        Verifier Public Key
                      </div>
                      <div className="mono" style={{ color: 'var(--accent-teal)', wordBreak: 'break-all' }}>
                        {consent.verifierPk}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>
                        Protected Credential Commitment
                      </div>
                      <div className="mono" style={{ color: 'var(--accent-blue)', wordBreak: 'break-all' }}>
                        {consent.credentialCommitment}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '8px' }}>
                    <div className="mono" style={{ fontSize: '11px' }}>
                      Consent ID: {consent.consentId.substring(0, 18)}...
                      {consent.txHash && (
                        <span style={{ marginLeft: '12px', color: 'var(--accent-teal)' }}>
                          Tx: {consent.txHash.substring(0, 16)}...
                          {consent.blockHeight && ` (Block #${consent.blockHeight})`}
                        </span>
                      )}
                    </div>
                    <div>
                      Granted: {consent.grantedAtTime || 'Initial Session'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Grant New Consent Tab */
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="glass-card-header" style={{ marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>Authorize Verifier Access</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Generate a genuine zero-knowledge consent commitment. The smart contract requires valid consent from the credential owner before any claim can be verified.
              </p>
            </div>
            <span className="badge badge-teal">grantConsent Circuit</span>
          </div>

          {/* Execution Pipeline Selector */}
          <div style={{
            background: 'var(--bg-input)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)'
          }}>
            <label className="form-label" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Transaction Pipeline</span>
              <span className={`badge ${executionMode === 'real' ? 'badge-teal' : 'badge-amber'}`}>
                {executionMode === 'real' ? 'LIVE MIDNIGHT PREPROD' : 'LOCAL SESSION RECORD'}
              </span>
            </label>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="radio"
                  name="executionMode"
                  checked={executionMode === 'real'}
                  onChange={() => setExecutionMode('real')}
                />
                <span><strong>Live Midnight Preprod Transaction</strong> (Proof Server + Lace Wallet)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="radio"
                  name="executionMode"
                  checked={executionMode === 'session'}
                  onChange={() => setExecutionMode('session')}
                />
                <span><strong>Local Session Record</strong> (Offline Demo)</span>
              </label>
            </div>
          </div>

          <form onSubmit={handleGrantConsent}>
            {/* Quick-fill from vault */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Protected Credential From Vault</span>
                <span style={{ fontSize: '11px', color: 'var(--accent-teal)' }}>{credentials.length} credentials in vault</span>
              </label>
              <select
                className="form-input"
                value={selectedCredId}
                onChange={(e) => handleCredentialSelect(e.target.value)}
                style={{ fontSize: '13px', background: 'var(--bg-input)' }}
              >
                {credentials.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.medication} ({c.category}) ? {c.commitment.substring(0, 14)}... {c.isDemo ? '[Demo Record]' : '[Session Record]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label">Verifier Name / Organization (Display Label)</label>
              <input
                className="form-input"
                value={newVerifierName}
                onChange={(e) => setNewVerifierName(e.target.value)}
                placeholder="e.g. St. Jude Hospital Verifier, CVS Pharmacy #4012"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label">Verifier Public Key (32-byte hex)</label>
              <input
                className="form-input mono"
                value={newVerifierPk}
                onChange={(e) => setNewVerifierPk(e.target.value)}
                placeholder="0x..."
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                The public key of the pharmacy, hospital, or insurance verifier authorized to evaluate proofs.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label">Target Credential Commitment (32-byte hex)</label>
              <input
                className="form-input mono"
                value={customCommitment}
                onChange={(e) => setCustomCommitment(e.target.value)}
                placeholder="0x..."
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                The 32-byte credential commitment to bind consent against.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Patient Private Secret (Witness Only)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={generateRandomSecret}
                  >
                    ?? Generate Random Secret
                  </button>
                  <span className="badge badge-rose">Off-Chain Witness</span>
                </div>
              </div>
              <input
                className="form-input mono"
                value={patientSecret}
                onChange={(e) => setPatientSecret(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Private preimage witness required to compute genuine consentId. Sensitive clinical data and secrets remain off-chain in patient client memory.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('active')}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 24px' }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing Transaction...' : 'Authorize Verifier Consent'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.consent && (
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
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', border: '1px solid var(--border-subtle)' }}>
            <div className="glass-card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: confirmModal.action === 'revoke' ? 'var(--accent-rose)' : 'var(--accent-teal)' }}>
                {confirmModal.action === 'revoke' ? '?? Confirm Consent Revocation' : 'Confirm Consent Re-Activation'}
              </h3>
            </div>

            <div style={{ margin: '20px 0', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <p style={{ margin: '0 0 12px 0' }}>
                Are you sure you want to {confirmModal.action === 'revoke' ? 'revoke' : 're-activate'} verification authorization for:
              </p>
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
                <div><strong>Verifier:</strong> {confirmModal.consent.verifierName}</div>
                <div><strong>Credential:</strong> {confirmModal.consent.credentialName}</div>
                <div className="mono" style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)' }}>
                  Commitment: {confirmModal.consent.credentialCommitment.substring(0, 24)}...
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                {confirmModal.action === 'revoke'
                  ? 'Once revoked, any future ZK verification attempts by this verifier will fail on-chain consent checks.'
                  : 'Re-activating will allow this verifier to verify zero-knowledge claims against this credential.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ isOpen: false, consent: null, action: 'revoke' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${confirmModal.action === 'revoke' ? 'btn-danger' : 'btn-primary'}`}
                onClick={executeConfirmedAction}
              >
                Confirm {confirmModal.action === 'revoke' ? 'Revocation' : 'Re-Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
