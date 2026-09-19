// src/types/medproof.ts
// Strongly typed domain models for MedProof: Confidential Healthcare Credential & Consent Exchange

export enum CredentialCategory {
  STANDARD_PRESCRIPTION = 1,
  CONTROLLED_SUBSTANCE = 2,
  CHRONIC_CARE = 3,
  EMERGENCY_ACCESS = 4,
}

export const CREDENTIAL_CATEGORY_LABELS: Record<CredentialCategory, string> = {
  [CredentialCategory.STANDARD_PRESCRIPTION]: 'Category 1: Standard Prescription',
  [CredentialCategory.CONTROLLED_SUBSTANCE]: 'Category 2: Controlled Substance',
  [CredentialCategory.CHRONIC_CARE]: 'Category 3: Chronic Care Management',
  [CredentialCategory.EMERGENCY_ACCESS]: 'Category 4: Emergency Access Override',
};

export enum CredentialSchema {
  PRESCRIPTION_V1 = 1,
  CONTROLLED_DISPENSE_V1 = 2,
}

export type CredentialStatus = 'VALID' | 'REVOKED' | 'EXPIRED' | 'UNREGISTERED';

export interface OffChainCredential {
  id: string;
  patientId: string;
  patientName: string;
  patientSecret: string; // Ephemeral client-side secret (Never exposed to public ledger!)
  medication: string;
  dosage: string;
  instructions: string;
  diagnosisCode: string;
  prescriberName: string;
  issuerProviderCommitment: string;
  schemaId: number;
  category: CredentialCategory;
  expirationEpoch: number;
  payloadHash: string;
  salt: string;
  commitment: string;
  status: CredentialStatus;
  isSingleUse: boolean;
  dispensed?: boolean;
  isDemo?: boolean; // Explicit flag to truthfully indicate seed example records vs live user-issued credentials
  issuedAtEpoch?: number;
  issuedAtTime?: string;
  onChainTxHash?: string;
  onChainBlockHeight?: number;
}

export interface ConsentRecord {
  id: string;
  consentId: string;
  patientSecret: string;
  verifierPk: string;
  verifierName: string;
  credentialCommitment: string;
  credentialName: string;
  isActive: boolean;
  grantedAtEpoch: number;
  grantedAtTime?: string;
  isDemo?: boolean;
  txHash?: string;
  blockHeight?: number;
}

export interface VerificationReceipt {
  receiptId: string;
  credentialCommitment: string;
  verifierPk: string;
  sessionNonce: string;
  verifiedAt: string;
  categorySatisfied: boolean;
  consentVerified: boolean;
  unrevoked: boolean;
  unexpired: boolean;
  nullifierConsumed: boolean;
}

export interface SessionVerificationRecord {
  id: string;
  timestamp: string;
  outcome: 'SUCCESS' | 'FAILED';
  category: CredentialCategory;
  requiredCategory: CredentialCategory;
  verifierPk: string;
  verifierName: string;
  credentialCommitment: string;
  receiptHash: string;
  nullifierConsumed: boolean;
  nullifierHash?: string;
  network: string;
  contractAddress: string;
  details: string;
}

export interface ActivityFeedItem {
  id: string;
  type:
    | 'CREDENTIAL_ISSUED'
    | 'CREDENTIAL_REVOKED'
    | 'CONSENT_GRANTED'
    | 'CONSENT_REVOKED'
    | 'VERIFICATION_SUCCESS'
    | 'VERIFICATION_FAILED';
  title: string;
  timestamp: string;
  status: 'SUCCESS' | 'INFO' | 'WARNING' | 'DANGER';
  identifierShort: string;
  details: string;
}

export interface SystemStatusState {
  network: string;
  contractAddress: string;
  indexerOnline: boolean;
  proofServerOnline: boolean;
  laceConnected: boolean;
  walletAddress: string | null;
  lastChecked: string;
}

export interface LedgerContractState {
  adminCommitment: string;
  isContractActive: boolean;
  currentEpoch: bigint;
  totalCredentialsIssued: bigint;
  totalVerifications: bigint;
  contractAddress: string;
  network: string;
}
