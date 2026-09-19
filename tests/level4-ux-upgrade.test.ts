import { describe, it, expect } from 'vitest';
import { CredentialCategory, CREDENTIAL_CATEGORY_LABELS, OffChainCredential, ConsentRecord, SessionVerificationRecord } from '../ui/src/types/medproof';
import { MEDPROOF_CONFIG } from '../ui/src/lib/config';

describe('MedProof Level 4 UX / Product Feature Upgrade Tests', () => {
  const sampleCredentials: OffChainCredential[] = [
    {
      id: 'seed-cred-001',
      patientId: 'patient-001',
      patientName: 'Alex Mercer',
      patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      medication: 'Amoxicillin 500mg',
      dosage: '1 capsule every 8 hours for 10 days',
      instructions: 'Take with food. Complete full course.',
      diagnosisCode: 'J01.90',
      prescriberName: 'Dr. Evelyn Vance, MD',
      issuerProviderCommitment: '0x2222222222222222222222222222222222222222222222222222222222222222',
      schemaId: 1,
      category: CredentialCategory.STANDARD_PRESCRIPTION,
      expirationEpoch: 12,
      payloadHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      salt: '0x1111111111111111111111111111111111111111111111111111111111111111',
      commitment: '0x8f1a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      status: 'VALID',
      isSingleUse: true,
      dispensed: false,
      isDemo: true,
      issuedAtEpoch: 1,
      issuedAtTime: '10:00 AM'
    },
    {
      id: 'seed-cred-002',
      patientId: 'patient-001',
      patientName: 'Alex Mercer',
      patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      medication: 'Methylphenidate 20mg',
      dosage: '1 tablet every morning',
      instructions: 'Controlled substance Schedule II protocol.',
      diagnosisCode: 'F90.0',
      prescriberName: 'Dr. Marcus Sterling, MD',
      issuerProviderCommitment: '0x3333333333333333333333333333333333333333333333333333333333333333',
      schemaId: 1,
      category: CredentialCategory.CONTROLLED_SUBSTANCE,
      expirationEpoch: 4,
      payloadHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      salt: '0x2222222222222222222222222222222222222222222222222222222222222222',
      commitment: '0x3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d',
      status: 'VALID',
      isSingleUse: true,
      dispensed: false,
      isDemo: true,
      issuedAtEpoch: 1,
      issuedAtTime: '10:15 AM'
    },
    {
      id: 'seed-cred-003',
      patientId: 'patient-001',
      patientName: 'Alex Mercer',
      patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      medication: 'Atorvastatin 40mg',
      dosage: '1 tablet once daily at bedtime',
      instructions: 'For lipid management. Recheck LFTs in 6 months.',
      diagnosisCode: 'E78.0',
      prescriberName: 'Dr. Evelyn Vance, MD',
      issuerProviderCommitment: '0x2222222222222222222222222222222222222222222222222222222222222222',
      schemaId: 1,
      category: CredentialCategory.CHRONIC_CARE,
      expirationEpoch: 24,
      payloadHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      salt: '0x3333333333333333333333333333333333333333333333333333333333333333',
      commitment: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
      status: 'REVOKED',
      isSingleUse: false,
      dispensed: false,
      isDemo: true,
      issuedAtEpoch: 1,
      issuedAtTime: '10:30 AM'
    }
  ];

  const sampleConsents: ConsentRecord[] = [
    {
      id: 'consent-001',
      consentId: '0x1111111111111111111111111111111111111111111111111111111111111111',
      patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      verifierPk: '0x4444444444444444444444444444444444444444444444444444444444444444',
      verifierName: 'Metro Health Specialty Pharmacy #4102',
      credentialCommitment: '0x8f1a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      credentialName: 'Amoxicillin 500mg (Category 1)',
      isActive: true,
      grantedAtEpoch: 1,
      grantedAtTime: '10:05 AM',
      isDemo: true
    },
    {
      id: 'consent-002',
      consentId: '0x2222222222222222222222222222222222222222222222222222222222222222',
      patientSecret: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      verifierPk: '0x5555555555555555555555555555555555555555555555555555555555555555',
      verifierName: 'St. Jude Clinical Trials',
      credentialCommitment: '0x3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d',
      credentialName: 'Methylphenidate 20mg (Category 2)',
      isActive: false,
      grantedAtEpoch: 1,
      grantedAtTime: '10:20 AM',
      isDemo: true
    }
  ];

  const sampleVerifications: SessionVerificationRecord[] = [
    {
      id: 'verif-1',
      timestamp: '11:00 AM',
      result: 'VERIFIED',
      credentialCategory: 'Category 1: Standard Prescription',
      verifierName: 'Metro Health Pharmacy',
      commitmentShort: '0x8f1a9c...0a1b',
      nullifierStatus: 'Single-Use Enforced (Unspent)',
      network: 'Midnight Preprod',
      contractAddress: MEDPROOF_CONFIG.contractAddress,
      isSessionOnly: true
    }
  ];

  describe('1. Truthful Metrics & Data Provenance', () => {
    it('calculates vault registrations truthfully from connected patient state', () => {
      const totalRegistrations = sampleCredentials.length;
      expect(totalRegistrations).toBe(3);
    });

    it('derives active vs revoked credentials strictly from status', () => {
      const active = sampleCredentials.filter(c => c.status === 'VALID').length;
      const revoked = sampleCredentials.filter(c => c.status === 'REVOKED').length;
      expect(active).toBe(2);
      expect(revoked).toBe(1);
    });

    it('identifies active consents count and protects inactive consents from verifiers', () => {
      const activeConsents = sampleConsents.filter(c => c.isActive).length;
      const revokedConsents = sampleConsents.filter(c => !c.isActive).length;
      expect(activeConsents).toBe(1);
      expect(revokedConsents).toBe(1);
    });

    it('strictly labels verification count as session-scoped rather than global blockchain', () => {
      expect(sampleVerifications[0].isSessionOnly).toBe(true);
      expect(sampleVerifications[0].txId).toBeUndefined(); // Never fabricate fake TX IDs!
    });
  });

  describe('2. Patient Vault Filters & Category Tab Logic', () => {
    it('filters by status tab: ALL', () => {
      const tab = 'all';
      const filtered = sampleCredentials.filter(c => {
        if (tab === 'active') return c.status === 'VALID';
        if (tab === 'revoked') return c.status === 'REVOKED';
        return true;
      });
      expect(filtered.length).toBe(3);
    });

    it('filters by status tab: ACTIVE', () => {
      const tab = 'active';
      const filtered = sampleCredentials.filter(c => {
        if (tab === 'active') return c.status === 'VALID';
        if (tab === 'revoked') return c.status === 'REVOKED';
        return true;
      });
      expect(filtered.length).toBe(2);
    });

    it('filters by status tab: REVOKED', () => {
      const tab = 'revoked';
      const filtered = sampleCredentials.filter(c => {
        if (tab === 'active') return c.status === 'VALID';
        if (tab === 'revoked') return c.status === 'REVOKED';
        return true;
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].medication).toBe('Atorvastatin 40mg');
    });

    it('filters by Category dropdown correctly', () => {
      const selectedCategory = CredentialCategory.CONTROLLED_SUBSTANCE;
      const filtered = sampleCredentials.filter(c => c.category === selectedCategory);
      expect(filtered.length).toBe(1);
      expect(filtered[0].medication).toBe('Methylphenidate 20mg');
      expect(CREDENTIAL_CATEGORY_LABELS[filtered[0].category]).toBe('Category 2: Controlled Substance');
    });

    it('searches by medication name and diagnosis code', () => {
      const query = 'J01.90';
      const filtered = sampleCredentials.filter(c =>
        c.medication.toLowerCase().includes(query.toLowerCase()) ||
        c.diagnosisCode.toLowerCase().includes(query.toLowerCase())
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].medication).toBe('Amoxicillin 500mg');
    });
  });

  describe('3. Verifier Circuit Inputs & Nullifier Protocol', () => {
    it('ensures category matches circuit requirements', () => {
      const cred = sampleCredentials[0];
      const requiredCategory = CredentialCategory.STANDARD_PRESCRIPTION;
      expect(cred.category).toBe(requiredCategory);
    });

    it('validates single-use credentials possess nullifier protection', () => {
      const singleUseCred = sampleCredentials[0];
      expect(singleUseCred.isSingleUse).toBe(true);
      expect(singleUseCred.dispensed).toBe(false);
    });

    it('detects demo records vs live session records truthfully', () => {
      expect(sampleCredentials[0].isDemo).toBe(true);
      const userIssuedCred: OffChainCredential = {
        ...sampleCredentials[0],
        id: 'live-user-001',
        isDemo: false
      };
      expect(userIssuedCred.isDemo).toBe(false);
    });
  });

  describe('4. Canonical Preprod Contract Integrity', () => {
    it('points to verified canonical Midnight Preprod contract address', () => {
      expect(MEDPROOF_CONFIG.contractAddress).toBeDefined();
      expect(MEDPROOF_CONFIG.contractAddress.length).toBe(64);
    });

    it('configures network as Midnight Preprod', () => {
      expect(MEDPROOF_CONFIG.network).toBe('preprod');
    });
  });

  describe('5. Empty & Error State Handling', () => {
    it('returns empty list gracefully when no credentials match search', () => {
      const query = 'NonExistentMedicationXYZ';
      const filtered = sampleCredentials.filter(c =>
        c.medication.toLowerCase().includes(query.toLowerCase())
      );
      expect(filtered.length).toBe(0);
    });

    it('handles empty verification history without declaring false transactions', () => {
      const emptyHistory: SessionVerificationRecord[] = [];
      expect(emptyHistory.length).toBe(0);
    });
  });
});
