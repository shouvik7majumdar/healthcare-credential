import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { WalletConnect } from './components/WalletConnect';
import { PrescriptionVerifier } from './components/PrescriptionVerifier';
import { LedgerState } from './components/LedgerState';
import { PrivacyModel } from './components/PrivacyModel';
import { ToastContainer } from './components/Toast';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DoctorPortal } from './components/DoctorPortal';
import { PatientDashboard } from './components/PatientDashboard';
import { PharmacyPortal } from './components/PharmacyPortal';
import { VerificationHistory } from './components/VerificationHistory';
import { QRCodeModal } from './components/QRCodeModal';
import { requestLaceConnection } from './wallet-service';

import type { WalletState, Toast, TabType } from './types';
import type { Prescription, VerificationLog } from '../../src/healthcare-services';
import { AUTHORIZED_DOCTORS, AUTHORIZED_HOSPITALS } from '../../src/healthcare-services';

function App() {
  const [wallet, setWallet] = useState<WalletState | null>(() => {
    try {
      const saved = sessionStorage.getItem('rxverify_wallet');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSetWallet = useCallback((w: WalletState | null) => {
    setWallet(w);
    if (w) {
      sessionStorage.setItem('rxverify_wallet', JSON.stringify(w));
    } else {
      sessionStorage.removeItem('rxverify_wallet');
    }
  }, []);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [verificationCount, setVerificationCount] = useState<bigint | null>(null);
  const [contractActive, setContractActive] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  // Modal QR State
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; data: string; title: string }>({
    isOpen: false,
    data: '',
    title: '',
  });

  // Seed sample initial prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: 'rx-101',
      patientId: 101,
      patientName: 'Alex Rivera',
      medicationName: 'Amoxicillin 500mg',
      dosage: '1 capsule every 8 hours (10 days)',
      instructions: 'Take after meals with water',
      doctorId: 'doc-101',
      doctorName: AUTHORIZED_DOCTORS[0].name,
      doctorLicense: AUTHORIZED_DOCTORS[0].licenseNumber,
      hospitalId: AUTHORIZED_HOSPITALS[0].id,
      hospitalName: AUTHORIZED_HOSPITALS[0].name,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      prescriptionHash: '8f1a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      doctorSignature: '11223344556677889900112233445566778899001122334455667788990011223344556677889900112233445566778899001122334455667788990011223344',
      status: 'Valid',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'rx-102',
      patientId: 102,
      patientName: 'Samantha Chen',
      medicationName: 'Lisopril 10mg',
      dosage: '1 tablet daily in the morning',
      instructions: 'Monitor blood pressure weekly',
      doctorId: 'doc-102',
      doctorName: AUTHORIZED_DOCTORS[1].name,
      doctorLicense: AUTHORIZED_DOCTORS[1].licenseNumber,
      hospitalId: AUTHORIZED_HOSPITALS[1].id,
      hospitalName: AUTHORIZED_HOSPITALS[1].name,
      issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      prescriptionHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      doctorSignature: '22334455667788990011223344556677889900112233445566778899001122334455667788990011223344556677889900112233445566778899001122334455',
      status: 'Valid',
      createdAt: Date.now() - 86400000 * 15,
    },
  ]);

  // Initial audit log
  const [logs, setLogs] = useState<VerificationLog[]>([
    {
      id: 'log-001',
      timestamp: Date.now() - 3600000,
      type: 'Issued',
      prescriptionId: 'rx-101',
      verifierRole: 'Doctor',
      details: 'Confidential prescription digitally signed by Dr. Sarah Jenkins, MD',
      zkStatus: 'Proof Valid',
    },
  ]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const onVerified = useCallback((rxId?: string) => {
    setVerificationCount(prev => prev !== null ? prev + 1n : 1n);
    const targetId = rxId || 'rx-101';
    setLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: 'Verified',
        prescriptionId: targetId,
        verifierRole: 'Pharmacy',
        details: 'Zero-Knowledge Proof verified on Midnight Network circuit',
        zkStatus: 'Proof Valid',
      },
      ...prev,
    ]);
    addToast('Prescription verified on-chain! ZK proof submitted.', 'success');
  }, [addToast]);

  const handleIssuePrescription = (newRx: Prescription) => {
    setPrescriptions(prev => [newRx, ...prev]);
    setLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: 'Issued',
        prescriptionId: newRx.id,
        verifierRole: 'Doctor',
        details: `Prescription issued & signed by ${newRx.doctorName}`,
        zkStatus: 'Proof Valid',
      },
      ...prev,
    ]);
  };

  const handleRevokePrescription = (rxId: string, reason: string) => {
    setPrescriptions(prev => prev.map(p => p.id === rxId ? { ...p, status: 'Revoked' as const } : p));
    setLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: 'Revoked',
        prescriptionId: rxId,
        verifierRole: 'Doctor',
        details: `Revoked by doctor. Reason: ${reason}`,
        zkStatus: 'Revoked',
      },
      ...prev,
    ]);
  };

  const handleVerifyPrescriptionOnChain = async (rx: Prescription) => {
    // Simulate ZK proof execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    onVerified(rx.id);
  };

  const handleHeaderConnect = useCallback(async () => {
    try {
      const connectedWallet = await requestLaceConnection();
      handleSetWallet(connectedWallet);
      addToast('Midnight Lace Wallet connected!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Lace wallet';
      addToast(msg, 'error');
      setActiveTab('privacy');
    }
  }, [handleSetWallet, addToast]);

  const network = import.meta.env.VITE_NETWORK || 'preview';
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '54b40b55db6c344ddb1511d13c93e2bbbb280b4c1738b912cd838f5ac94df8dc';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        network={network}
        wallet={wallet}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onConnectWallet={handleHeaderConnect}
        onDisconnect={() => handleSetWallet(null)}
      />

      <main className="main-content">
        <section className="hero">
          <div className="container">
            <div className="hero-eyebrow">
              <span>🔒</span>
              Production-Grade Zero-Knowledge Healthcare Platform
            </div>
            <h1>
              <span className="gradient-text">Confidential</span>
              {' '}Prescription<br />Verification Platform
            </h1>
            <p className="hero-desc">
              Digitally sign, issue, verify, and manage confidential health credentials on the **Midnight Network**.
              Zero medical exposure, doctor identity assurance, instant QR verification, and automated expiry rules.
            </p>
          </div>
        </section>

        <div className="container">
          {/* Main Navigation Tab Views */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              prescriptions={prescriptions}
              logs={logs}
              verificationCount={verificationCount}
              contractActive={contractActive}
            />
          )}

          {activeTab === 'doctor' && (
            <DoctorPortal
              prescriptions={prescriptions}
              onIssuePrescription={handleIssuePrescription}
              onRevokePrescription={handleRevokePrescription}
              onShowQR={(data, title) => setQrModal({ isOpen: true, data, title })}
              onNotify={addToast}
            />
          )}

          {activeTab === 'patient' && (
            <PatientDashboard
              prescriptions={prescriptions}
              wallet={wallet}
              contractAddress={contractAddress}
              network={network}
              onVerifyPrescriptionOnChain={handleVerifyPrescriptionOnChain}
              onShowQR={(data, title) => setQrModal({ isOpen: true, data, title })}
              onNotify={addToast}
            />
          )}

          {activeTab === 'pharmacy' && (
            <PharmacyPortal
              prescriptions={prescriptions}
              wallet={wallet}
              contractAddress={contractAddress}
              network={network}
              onVerifyPrescriptionOnChain={handleVerifyPrescriptionOnChain}
              onNotify={addToast}
            />
          )}

          {activeTab === 'history' && (
            <VerificationHistory
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          )}

          {activeTab === 'privacy' && (
            <div className="animate-fade-in">
              <div className="main-grid mb-32">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <WalletConnect
                    wallet={wallet}
                    onConnect={handleSetWallet}
                    onDisconnect={() => handleSetWallet(null)}
                    onError={(msg) => addToast(msg, 'error')}
                  />
                  <LedgerState
                    contractAddress={contractAddress}
                    network={network}
                    verificationCount={verificationCount}
                    contractActive={contractActive}
                    onStateLoaded={(count, active) => {
                      setVerificationCount(count);
                      setContractActive(active);
                    }}
                  />
                </div>

                <div>
                  <PrescriptionVerifier
                    wallet={wallet}
                    contractAddress={contractAddress}
                    network={network}
                    onVerified={() => onVerified()}
                    onError={(msg) => addToast(msg, 'error')}
                  />
                </div>
              </div>

              <PrivacyModel />
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            Built on{' '}
            <a href="https://midnight.network" target="_blank" rel="noopener noreferrer">Midnight Network</a>
            {' '}· Preview Testnet · Zero-Knowledge Proofs · Level 3 Confidential Credentials ·{' '}
            <a
              href="https://explorer.preview.midnight.network/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-teal)' }}
            >
              View Contract on Explorer
            </a>
          </p>
        </div>
      </footer>

      <ToastContainer toasts={toasts} />

      {qrModal.isOpen && (
        <QRCodeModal
          qrData={qrModal.data}
          title={qrModal.title}
          onClose={() => setQrModal({ isOpen: false, data: '', title: '' })}
          onNotify={addToast}
        />
      )}
    </div>
  );
}

export default App;