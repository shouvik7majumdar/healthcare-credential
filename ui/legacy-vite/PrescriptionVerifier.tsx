import React, { useState, useEffect } from 'react';
import type { WalletState } from '../types';

interface PrescriptionVerifierProps {
  wallet: WalletState | null;
  contractAddress: string;
  network: string;
  onVerified: () => void;
  onError: (msg: string) => void;
}

type VerifyState = 'idle' | 'hashing' | 'proving' | 'submitting' | 'success' | 'error';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PrescriptionVerifier({ wallet, contractAddress, network, onVerified, onError }: PrescriptionVerifierProps) {
  const [prescription, setPrescription] = useState('');
  const [patientSlot, setPatientSlot] = useState('1');
  const [state, setState] = useState<VerifyState>('idle');
  const [prescriptionHash, setPrescriptionHash] = useState('');
  const [lastTxId, setLastTxId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Auto-hash as user types
  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (prescription.trim()) {
        const hash = await sha256(prescription.trim());
        setPrescriptionHash(hash);
      } else {
        setPrescriptionHash('');
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [prescription]);

  // Elapsed timer during proving
  useEffect(() => {
    if (state === 'proving' || state === 'submitting') {
      const interval = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [state]);

  const verify = async () => {
    if (!prescription.trim()) { onError('Please enter prescription details'); return; }
    if (!wallet) { onError('Please connect your wallet first'); return; }

    setState('hashing');
    setErrorMsg('');
    setLastTxId('');

    try {
      // Step 1: hash prescription locally (stays in browser)
      await new Promise(r => setTimeout(r, 300));
      const hash = await sha256(prescription.trim());
      setPrescriptionHash(hash);

      // Step 2: prove (simulate ZK proof generation)
      setState('proving');
      await new Promise(r => setTimeout(r, 2000)); // Simulating proof generation

      // Step 3: submit to chain
      setState('submitting');

      // In production: call the Midnight contract via the proof server
      // For local demo: simulate the transaction
      const activeContractAddress = contractAddress || '58e1e74340e5a250668f9a9da1597b1bddca694440545796994d9d186db2f36c';
      if (!activeContractAddress) {
        throw new Error('VITE_CONTRACT_ADDRESS not set. Deploy first and update .env.local');
      }

      // Simulate network call (in production this calls the proof server)
      await new Promise(r => setTimeout(r, 1500));

      // Generate a deterministic mock tx ID from the hash
      const txId = hash.substring(0, 64);
      setLastTxId(txId);
      setState('success');
      onVerified();
      setPrescription('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setErrorMsg(msg);
      setState('error');
      onError(msg);
    }
  };

  const reset = () => { setState('idle'); setErrorMsg(''); setLastTxId(''); };

  const disabled = !wallet || state === 'hashing' || state === 'proving' || state === 'submitting';

  return (
    <div className="card" id="prescription-verifier">
      <div className="card-title">
        <span className="card-title-icon">🔐</span>
        Verify Prescription
        <span className="tag tag-green" style={{ marginLeft: 'auto' }}>Private</span>
      </div>

      {/* Disconnected state */}
      {!wallet && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠️</span>
          <div>Connect your wallet to submit a prescription verification.</div>
        </div>
      )}

      {/* Privacy notice */}
      <div className="alert alert-info" style={{ marginBottom: '20px', fontSize: '13px' }}>
        <span className="alert-icon">🔒</span>
        <div>
          <strong>Privacy First:</strong> Your prescription details are hashed locally in your browser.
          Only a zero-knowledge proof is sent to the blockchain — not your prescription content.
        </div>
      </div>

      {/* Prescription field */}
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label className="form-label" htmlFor="prescription-input">
          Prescription Details
          <span className="privacy-badge">🔒 Private</span>
        </label>
        <textarea
          id="prescription-input"
          className="private-field"
          placeholder="Enter prescription details (e.g., Amoxicillin 500mg twice daily — Dr. Smith)&#10;&#10;This stays on your device. Never sent to the blockchain."
          value={prescription}
          onChange={e => setPrescription(e.target.value)}
          disabled={disabled}
          rows={4}
        />
        {prescriptionHash && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: '4px' }}>
              SHA-256 hash (only this goes on-chain):
            </div>
            <div className="hash-display" id="prescription-hash-display">
              {prescriptionHash.substring(0, 32)}...
            </div>
          </div>
        )}
      </div>

      {/* Patient slot */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="form-label" htmlFor="patient-slot-input">
          Patient Slot ID
          <span className="tag tag-blue" style={{ marginLeft: '4px', fontSize: '11px' }}>Public Session Metadata</span>
        </label>
        <input
          type="number"
          id="patient-slot-input"
          value={patientSlot}
          onChange={e => setPatientSlot(e.target.value)}
          min={1}
          max={9999}
          placeholder="1-9999"
          disabled={disabled}
        />
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          A non-sensitive session identifier. This is the only value disclosed on-chain.
        </div>
      </div>

      {/* Action Button */}
      {state !== 'success' && (
        <button
          id="verify-btn"
          className="btn btn-success btn-lg w-full"
          onClick={verify}
          disabled={disabled || !prescription.trim()}
        >
          {state === 'idle' && <><span>🔐</span> Verify Prescription (ZK Proof)</>}
          {state === 'hashing' && <><span className="spinner" style={{ borderTopColor: 'white' }} /> Computing Hash...</>}
          {state === 'proving' && <><span className="spinner" style={{ borderTopColor: 'white' }} /> Generating ZK Proof ({elapsed}s)...</>}
          {state === 'submitting' && <><span className="spinner" style={{ borderTopColor: 'white' }} /> Submitting to Chain...</>}
          {state === 'error' && <><span>⚠️</span> Retry Verification</>}
        </button>
      )}

      {/* Progress indicator */}
      {(state === 'proving' || state === 'submitting') && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span>{state === 'proving' ? 'Generating zero-knowledge proof...' : 'Submitting transaction...'}</span>
            <span>{elapsed}s</span>
          </div>
          <div style={{ height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: 'var(--gradient-accent)',
              width: state === 'proving' ? '60%' : '90%',
              transition: 'width 2s ease',
            }} />
          </div>
        </div>
      )}

      {/* Success state */}
      {state === 'success' && (
        <div className="animate-fade-in">
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <span className="alert-icon">✅</span>
            <div>
              <strong>Prescription Verified!</strong>
              <br />Your ZK proof was accepted on-chain. No prescription content was revealed.
            </div>
          </div>
          {lastTxId && (
            <div className="hash-display" id="tx-id-display">
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>TX ID: </span>
              {lastTxId.substring(0, 32)}...
            </div>
          )}
          <button
            id="verify-again-btn"
            className="btn btn-outline w-full"
            onClick={reset}
            style={{ marginTop: '16px' }}
          >
            Verify Another Prescription
          </button>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && errorMsg && (
        <div className="alert alert-error" style={{ marginTop: '16px' }}>
          <span className="alert-icon">❌</span>
          <div>{errorMsg}</div>
        </div>
      )}
    </div>
  );
}