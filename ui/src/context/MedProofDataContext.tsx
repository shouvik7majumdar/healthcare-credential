// src/context/MedProofDataContext.tsx
// Centralized reactive domain store for MedProof credentials, consents, verification history, and system status

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  OffChainCredential,
  ConsentRecord,
  SessionVerificationRecord,
  ActivityFeedItem,
  SystemStatusState,
  CredentialCategory,
} from '../types/medproof';
import { MEDPROOF_CONFIG } from '../lib/config';
import { useWallet } from './WalletContext';
import { medproofService, type TransactionStatusUpdate } from '../services/medproof-contract';
import { fetchContractLedgerState } from '../services/midnight-indexer';
import { computeConsentId } from '../lib/crypto';

// Initial seed credentials clearly flagged as DEMO records
const INITIAL_DEMO_CREDENTIALS: OffChainCredential[] = [
  {
    id: 'demo-cred-001',
    patientId: 'PATIENT-7721-DEMO',
    patientName: 'Alex Mercer (Demo)',
    patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    medication: 'Amoxicillin 500mg',
    dosage: '1 capsule every 8 hours (10 days)',
    instructions: 'Take after meals with plenty of water',
    diagnosisCode: 'J02.9 (Acute Pharyngitis)',
    prescriberName: 'Dr. Sarah Jenkins, MD (License: MD-98231)',
    issuerProviderCommitment: '0x2222222222222222222222222222222222222222222222222222222222222222',
    schemaId: 1,
    category: CredentialCategory.STANDARD_PRESCRIPTION,
    expirationEpoch: 10,
    payloadHash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    salt: '0x1111111111111111111111111111111111111111111111111111111111111111',
    commitment: '0x8f1a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    status: 'VALID',
    isSingleUse: false,
    isDemo: true,
    issuedAtEpoch: 1,
    issuedAtTime: 'Demo Seed Record',
  },
  {
    id: 'demo-cred-002',
    patientId: 'PATIENT-7721-DEMO',
    patientName: 'Alex Mercer (Demo)',
    patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    medication: 'Methylphenidate 20mg Extended-Release',
    dosage: '1 tablet daily in the morning',
    instructions: 'Controlled substance - single dispense only. Zero-knowledge nullifier enforced.',
    diagnosisCode: 'F90.0 (ADHD Inattentive)',
    prescriberName: 'Dr. Michael Chang, MD (License: MD-77412)',
    issuerProviderCommitment: '0x3333333333333333333333333333333333333333333333333333333333333333',
    schemaId: 2,
    category: CredentialCategory.CONTROLLED_SUBSTANCE,
    expirationEpoch: 5,
    payloadHash: '0xa591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    salt: '0x2222222222222222222222222222222222222222222222222222222222222222',
    commitment: '0x3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d',
    status: 'VALID',
    isSingleUse: true,
    isDemo: true,
    issuedAtEpoch: 1,
    issuedAtTime: 'Demo Seed Record',
  },
];

const INITIAL_DEMO_CONSENTS: ConsentRecord[] = [
  {
    id: 'consent-demo-101',
    consentId: '0x6e2410fcfa0b63309e6c64119853fa7beea6ecf6e52002344efb4d241772654c',
    patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    verifierPk: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
    verifierName: 'CVS Pharmacy #4102',
    credentialCommitment: '0x8f1a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    credentialName: 'Amoxicillin 500mg',
    isActive: true,
    grantedAtEpoch: 1,
    grantedAtTime: 'Demo Seed Consent',
    isDemo: true,
  },
  {
    id: 'consent-demo-102',
    consentId: '0x992410fcfa0b63309e6c64119853fa7beea6ecf6e52002344efb4d241772654d',
    patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    verifierPk: '0x9999888877776666555544443333222211110000ffffeeeeddddccccbbbbaaaa',
    verifierName: 'Walgreens Specialty Pharmacy',
    credentialCommitment: '0x3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d',
    credentialName: 'Methylphenidate 20mg Extended-Release',
    isActive: false,
    grantedAtEpoch: 1,
    grantedAtTime: 'Demo Seed Consent',
    isDemo: true,
  },
];

interface MedProofDataContextType {
  credentials: OffChainCredential[];
  consents: ConsentRecord[];
  verificationHistory: SessionVerificationRecord[];
  activityFeed: ActivityFeedItem[];
  systemStatus: SystemStatusState;
  addCredential: (cred: Omit<OffChainCredential, 'id' | 'isDemo' | 'issuedAtTime'>) => OffChainCredential;
  revokeCredential: (commitment: string) => void;
  grantConsent: (params: {
    verifierPk: string;
    verifierName: string;
    credentialCommitment: string;
    patientSecret: string;
    credentialName?: string;
    isRealTx?: boolean;
    onStatusChange?: (status: TransactionStatusUpdate) => void;
  }) => Promise<{ consentId: string; txHash?: string; blockHeight?: number }>;
  revokeConsent: (consentId: string) => void;
  recordVerification: (record: Omit<SessionVerificationRecord, 'id' | 'timestamp'>) => SessionVerificationRecord;
  refreshSystemStatus: () => Promise<void>;
  clearSessionHistory: () => void;
}

const MedProofDataContext = createContext<MedProofDataContextType | null>(null);

export function MedProofDataProvider({ children }: { children: React.ReactNode }) {
  const { wallet } = useWallet();

  const [credentials, setCredentials] = useState<OffChainCredential[]>(INITIAL_DEMO_CREDENTIALS);
  const [consents, setConsents] = useState<ConsentRecord[]>(INITIAL_DEMO_CONSENTS);
  const [verificationHistory, setVerificationHistory] = useState<SessionVerificationRecord[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([
    {
      id: 'init-1',
      type: 'CREDENTIAL_ISSUED',
      title: 'Demo Seed Credential Prepared',
      timestamp: 'Session Initialization',
      status: 'INFO',
      identifierShort: '0x8f1a...0a1b',
      details: 'Amoxicillin 500mg (Example Record for Local Testing)',
    },
  ]);

  const [systemStatus, setSystemStatus] = useState<SystemStatusState>({
    network: MEDPROOF_CONFIG.network,
    contractAddress: MEDPROOF_CONFIG.contractAddress,
    indexerOnline: false,
    proofServerOnline: false,
    laceConnected: false,
    walletAddress: null,
    lastChecked: 'Checking...',
  });

  const refreshSystemStatus = useCallback(async () => {
    let proofServerOk = false;
    let indexerOk = false;

    try {
      const res = await fetch('/api/health').catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        proofServerOk = Boolean(data?.proofServerOnline);
        indexerOk = Boolean(data?.indexerOnline);
      } else {
        proofServerOk = await medproofService.checkProofServerHealth().catch(() => false);
        const state = await fetchContractLedgerState().catch(() => null);
        indexerOk = Boolean(state && !state.network.includes('Offline'));
      }
    } catch {
      proofServerOk = false;
      indexerOk = false;
    }

    setSystemStatus({
      network: MEDPROOF_CONFIG.network,
      contractAddress: MEDPROOF_CONFIG.contractAddress,
      indexerOnline: indexerOk,
      proofServerOnline: proofServerOk,
      laceConnected: wallet.status === 'CONNECTED',
      walletAddress: wallet.address,
      lastChecked: new Date().toLocaleTimeString(),
    });
  }, [wallet.status, wallet.address]);

  useEffect(() => {
    refreshSystemStatus();
    const interval = setInterval(refreshSystemStatus, 15000);
    return () => clearInterval(interval);
  }, [refreshSystemStatus]);

  const addCredential = useCallback((credData: Omit<OffChainCredential, 'id' | 'isDemo' | 'issuedAtTime'>) => {
    const newId = `cred-${Date.now()}`;
    const newCred: OffChainCredential = {
      ...credData,
      id: newId,
      isDemo: false,
      issuedAtTime: new Date().toLocaleTimeString(),
    };

    setCredentials(prev => [newCred, ...prev]);

    setActivityFeed(prev => [
      {
        id: `act-${Date.now()}`,
        type: 'CREDENTIAL_ISSUED',
        title: `Issued: ${credData.medication}`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS',
        identifierShort: `${credData.commitment.substring(0, 8)}...${credData.commitment.substring(credData.commitment.length - 4)}`,
        details: `Issued to ${credData.patientName} (${credData.patientId})`,
      },
      ...prev,
    ]);

    return newCred;
  }, []);

  const revokeCredential = useCallback((commitment: string) => {
    setCredentials(prev =>
      prev.map(c => (c.commitment.toLowerCase() === commitment.toLowerCase() ? { ...c, status: 'REVOKED' } : c))
    );

    setActivityFeed(prev => [
      {
        id: `act-${Date.now()}`,
        type: 'CREDENTIAL_REVOKED',
        title: 'Credential Revoked',
        timestamp: new Date().toLocaleTimeString(),
        status: 'DANGER',
        identifierShort: `${commitment.substring(0, 8)}...`,
        details: 'Status changed to REVOKED in client vault',
      },
      ...prev,
    ]);
  }, []);

  const grantConsent = useCallback(
    async ({
      verifierPk,
      verifierName,
      credentialCommitment,
      patientSecret,
      credentialName,
      isRealTx = false,
      onStatusChange,
    }: {
      verifierPk: string;
      verifierName: string;
      credentialCommitment: string;
      patientSecret: string;
      credentialName?: string;
      isRealTx?: boolean;
      onStatusChange?: (status: TransactionStatusUpdate) => void;
    }) => {
      if (isRealTx) {
        const result = await medproofService.executeRealGrantConsent({
          patientSecret,
          verifierPk,
          credentialCommitment,
          onStatusChange,
        });

        const newRecord: ConsentRecord = {
          id: `consent-${Date.now()}`,
          consentId: result.consentId,
          patientSecret,
          verifierPk,
          verifierName: verifierName || 'Authorized Verifier',
          credentialCommitment,
          credentialName: credentialName || 'Selected Credential',
          isActive: true,
          grantedAtEpoch: 1,
          grantedAtTime: new Date().toLocaleTimeString(),
          isDemo: false,
          txHash: result.txHash,
          blockHeight: result.blockHeight,
        };

        setConsents(prev => [newRecord, ...prev]);

        setActivityFeed(prev => [
          {
            id: `act-${Date.now()}`,
            type: 'CONSENT_GRANTED',
            title: `Consent Confirmed on Preprod: ${newRecord.verifierName}`,
            timestamp: new Date().toLocaleTimeString(),
            status: 'SUCCESS',
            identifierShort: result.txHash
              ? `${result.txHash.slice(0, 8)}...${result.txHash.slice(-6)}`
              : `${result.consentId.slice(0, 10)}...`,
            details: `Target: ${credentialName || 'Credential'} | Tx: ${result.txHash} | Block #${result.blockHeight || 'Pending'}`,
          },
          ...prev,
        ]);

        return result;
      }

      const computedId = await computeConsentId(patientSecret, verifierPk, credentialCommitment);

      const newRecord: ConsentRecord = {
        id: `consent-${Date.now()}`,
        consentId: computedId,
        patientSecret,
        verifierPk,
        verifierName: verifierName || 'Authorized Verifier',
        credentialCommitment,
        credentialName: credentialName || 'Selected Credential',
        isActive: true,
        grantedAtEpoch: 1,
        grantedAtTime: new Date().toLocaleTimeString(),
        isDemo: false,
      };

      setConsents(prev => [newRecord, ...prev]);

      setActivityFeed(prev => [
        {
          id: `act-${Date.now()}`,
          type: 'CONSENT_GRANTED',
          title: `Consent Granted to ${newRecord.verifierName} [Session]`,
          timestamp: new Date().toLocaleTimeString(),
          status: 'INFO',
          identifierShort: `${computedId.substring(0, 8)}...`,
          details: `Bound to credential ${credentialCommitment.substring(0, 10)}... (Session Record)`,
        },
        ...prev,
      ]);

      return { consentId: computedId };
    },
    [setConsents, setActivityFeed]
  );

  const revokeConsent = useCallback((consentId: string) => {
    setConsents(prev => prev.map(c => (c.id === consentId || c.consentId === consentId ? { ...c, isActive: false } : c)));

    setActivityFeed(prev => [
      {
        id: `act-${Date.now()}`,
        type: 'CONSENT_REVOKED',
        title: 'Verifier Consent Revoked',
        timestamp: new Date().toLocaleTimeString(),
        status: 'WARNING',
        identifierShort: `${consentId.substring(0, 8)}...`,
        details: 'Third party verification permissions suspended',
      },
      ...prev,
    ]);
  }, []);

  const recordVerification = useCallback((recData: Omit<SessionVerificationRecord, 'id' | 'timestamp'>) => {
    const record: SessionVerificationRecord = {
      ...recData,
      id: `verif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    setVerificationHistory(prev => [record, ...prev]);

    setActivityFeed(prev => [
      {
        id: `act-${Date.now()}`,
        type: record.outcome === 'SUCCESS' ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILED',
        title: record.outcome === 'SUCCESS' ? 'ZK Verification Succeeded' : 'Verification Rejected',
        timestamp: record.timestamp,
        status: record.outcome === 'SUCCESS' ? 'SUCCESS' : 'DANGER',
        identifierShort: `${record.credentialCommitment.substring(0, 8)}...`,
        details: `${record.verifierName} · Category ${record.requiredCategory} threshold satisfied`,
      },
      ...prev,
    ]);

    return record;
  }, []);

  const clearSessionHistory = useCallback(() => {
    setVerificationHistory([]);
  }, []);

  const value = useMemo(
    () => ({
      credentials,
      consents,
      verificationHistory,
      activityFeed,
      systemStatus,
      addCredential,
      revokeCredential,
      grantConsent,
      revokeConsent,
      recordVerification,
      refreshSystemStatus,
      clearSessionHistory,
    }),
    [
      credentials,
      consents,
      verificationHistory,
      activityFeed,
      systemStatus,
      addCredential,
      revokeCredential,
      grantConsent,
      revokeConsent,
      recordVerification,
      refreshSystemStatus,
      clearSessionHistory,
    ]
  );

  return <MedProofDataContext.Provider value={value}>{children}</MedProofDataContext.Provider>;
}

export function useMedProofData() {
  const ctx = useContext(MedProofDataContext);
  if (!ctx) {
    throw new Error('useMedProofData must be used within a <MedProofDataProvider>');
  }
  return ctx;
}
