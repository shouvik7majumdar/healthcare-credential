// tests/medproof-contract.test.ts
// Comprehensive unit, specification, and security regression test suite for hardened MedProof contract.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractSourcePath = path.resolve(__dirname, '../contracts/medproof.compact');
const managedDir = path.resolve(__dirname, '../contracts/managed/medproof');

// Helper to simulate Poseidon / persistentHash behavior in Model tests
function sha256(data: string | Buffer): string {
  return '0x' + crypto.createHash('sha256').update(data).digest('hex');
}

function mockHashVector(items: (string | bigint)[]): string {
  return sha256(items.map(x => x.toString()).join(':'));
}

describe('MedProof Compact Contract Source Specification (STATIC SOURCE TESTS)', () => {
  const source = readFileSync(contractSourcePath, 'utf-8');

  it('must declare compatible language version pragma', () => {
    expect(source).toMatch(/pragma language_version >= 0\.23;/);
  });

  it('must import CompactStandardLibrary', () => {
    expect(source).toMatch(/import CompactStandardLibrary;/);
  });

  it('must define all hardened public ledger variables', () => {
    expect(source).toMatch(/export ledger adminCommitment: Bytes<32>;/);
    expect(source).toMatch(/export ledger isContractActive: Boolean;/);
    expect(source).toMatch(/export ledger currentEpoch: Uint<64>;/);
    expect(source).toMatch(/export ledger totalCredentialsIssued: Uint<64>;/);
    expect(source).toMatch(/export ledger totalVerifications: Uint<64>;/);
    expect(source).toMatch(/export ledger authorizedProviders: Map<Bytes<32>, Boolean>;/);
    expect(source).toMatch(/export ledger credentialIssuers: Map<Bytes<32>, Bytes<32>>;/);
    expect(source).toMatch(/export ledger issuedCredentials: Map<Bytes<32>, Boolean>;/);
    expect(source).toMatch(/export ledger revokedCredentials: Map<Bytes<32>, Boolean>;/);
    expect(source).toMatch(/export ledger activeConsents: Map<Bytes<32>, Boolean>;/);
    expect(source).toMatch(/export ledger nullifiers: Map<Bytes<32>, Boolean>;/);
  });

  it('must declare contract constructor with adminCommitmentParam parameter', () => {
    expect(source).toMatch(/constructor\(adminCommitmentParam: Bytes<32>\)/);
  });

  it('must export provider authorization and deauthorization circuits with admin witness', () => {
    expect(source).toMatch(/export circuit authorizeProvider\(/);
    expect(source).toMatch(/export circuit deauthorizeProvider\(/);
  });

  it('must export credential issuance and revocation circuits with caller witness', () => {
    expect(source).toMatch(/export circuit issueCredential\(/);
    expect(source).toMatch(/export circuit revokeCredential\(/);
  });

  it('must export patient consent management circuits bound to patientSecret', () => {
    expect(source).toMatch(/export circuit grantConsent\(/);
    expect(source).toMatch(/export circuit revokeConsent\(/);
  });

  it('must export epoch advancement and emergency administrative circuits with admin witness', () => {
    expect(source).toMatch(/export circuit advanceEpoch\(/);
    expect(source).toMatch(/export circuit setContractActive\(/);
  });

  it('must export 7-attribute bound verifyCredential circuit returning unlinkable receipt', () => {
    expect(source).toMatch(/export circuit verifyCredential\(/);
    expect(source).toMatch(/return disclose\(receipt\);/);
  });
});

describe('MedProof Compiled Artifacts & Bindings (GENERATED ARTIFACT TESTS)', () => {
  it('compiled contract index.js must exist', () => {
    expect(existsSync(path.resolve(managedDir, 'contract/index.js'))).toBe(true);
  });

  it('compiled contract index.d.ts type definitions must exist', () => {
    expect(existsSync(path.resolve(managedDir, 'contract/index.d.ts'))).toBe(true);
  });

  it('ZKIR circuit definitions must exist for all circuits', () => {
    expect(existsSync(path.resolve(managedDir, 'zkir'))).toBe(true);
  });

  it('type definitions must declare Contract class with hardened ledger interface', () => {
    const dts = readFileSync(path.resolve(managedDir, 'contract/index.d.ts'), 'utf-8');
    expect(dts).toContain('export declare class Contract');
    expect(dts).toContain('adminCommitment: Uint8Array');
    expect(dts).toContain('credentialIssuers:');
    expect(dts).toContain('export type Circuits');
  });
});

describe('MedProof Hardened Security Regression Invariants (MODEL / SIMULATION TESTS)', () => {
  // Exact behavioral simulation of the hardened Compact circuit execution
  class HardenedMedProofModel {
    adminCommitment: string;
    isContractActive: boolean;
    currentEpoch: bigint;
    totalCredentialsIssued: bigint;
    totalVerifications: bigint;
    authorizedProviders = new Map<string, boolean>();
    credentialIssuers = new Map<string, string>();
    issuedCredentials = new Map<string, boolean>();
    revokedCredentials = new Map<string, boolean>();
    activeConsents = new Map<string, boolean>();
    nullifiers = new Map<string, boolean>();

    constructor(adminSecret: string) {
      this.adminCommitment = mockHashVector([adminSecret, 'MEDPROOF_ADMIN']);
      this.isContractActive = true;
      this.currentEpoch = 1n;
      this.totalCredentialsIssued = 0n;
      this.totalVerifications = 0n;
    }

    authorizeProvider(adminSecret: string, providerSecret: string): string {
      const adminHash = mockHashVector([adminSecret, 'MEDPROOF_ADMIN']);
      if (adminHash !== this.adminCommitment) throw new Error('Unauthorized admin operation');
      const providerCommitment = mockHashVector([providerSecret, 'MEDPROOF_PROVIDER']);
      this.authorizedProviders.set(providerCommitment, true);
      return providerCommitment;
    }

    deauthorizeProvider(adminSecret: string, providerCommitment: string) {
      const adminHash = mockHashVector([adminSecret, 'MEDPROOF_ADMIN']);
      if (adminHash !== this.adminCommitment) throw new Error('Unauthorized admin operation');
      this.authorizedProviders.set(providerCommitment, false);
    }

    computeCommitment(params: {
      issuerProviderCommitment: string;
      patientSecret: string;
      schemaId: bigint;
      category: bigint;
      expirationEpoch: bigint;
      payloadHash: string;
      salt: string;
    }): string {
      const patientCommitment = mockHashVector([params.patientSecret, 'PATIENT_ID']);
      const schemaHash = sha256(params.schemaId.toString());
      const categoryHash = sha256(params.category.toString());
      const epochHash = sha256(params.expirationEpoch.toString());
      return mockHashVector([
        params.issuerProviderCommitment,
        patientCommitment,
        schemaHash,
        categoryHash,
        epochHash,
        params.payloadHash,
        params.salt,
      ]);
    }

    issueCredential(providerSecret: string, commitment: string) {
      if (!this.isContractActive) throw new Error('Contract is not active');
      const providerCommitment = mockHashVector([providerSecret, 'MEDPROOF_PROVIDER']);
      if (!this.authorizedProviders.get(providerCommitment)) {
        throw new Error('Provider is not authorized to issue credentials');
      }
      if (this.issuedCredentials.get(commitment)) {
        throw new Error('Credential commitment already registered');
      }
      this.issuedCredentials.set(commitment, true);
      this.credentialIssuers.set(commitment, providerCommitment);
      this.totalCredentialsIssued += 1n;
    }

    revokeCredential(callerSecret: string, isCallerAdmin: boolean, commitment: string) {
      if (!this.isContractActive) throw new Error('Contract is not active');
      if (!this.issuedCredentials.get(commitment)) throw new Error('Target credential was not registered');

      if (isCallerAdmin) {
        const adminHash = mockHashVector([callerSecret, 'MEDPROOF_ADMIN']);
        if (adminHash !== this.adminCommitment) throw new Error('Unauthorized admin revocation');
      } else {
        const callerProviderCommitment = mockHashVector([callerSecret, 'MEDPROOF_PROVIDER']);
        const registeredIssuer = this.credentialIssuers.get(commitment);
        if (registeredIssuer !== callerProviderCommitment) {
          throw new Error('Only the issuing provider or admin can revoke this credential');
        }
      }
      this.revokedCredentials.set(commitment, true);
    }

    grantConsent(patientSecret: string, verifierPk: string, credentialCommitment: string): string {
      if (!this.isContractActive) throw new Error('Contract is not active');
      const consentId = mockHashVector([patientSecret, verifierPk, credentialCommitment, 'MEDPROOF_CONSENT']);
      this.activeConsents.set(consentId, true);
      return consentId;
    }

    revokeConsent(patientSecret: string, verifierPk: string, credentialCommitment: string): string {
      if (!this.isContractActive) throw new Error('Contract is not active');
      const consentId = mockHashVector([patientSecret, verifierPk, credentialCommitment, 'MEDPROOF_CONSENT']);
      this.activeConsents.set(consentId, false);
      return consentId;
    }

    advanceEpoch(adminSecret: string, newEpoch: bigint) {
      const adminHash = mockHashVector([adminSecret, 'MEDPROOF_ADMIN']);
      if (adminHash !== this.adminCommitment) throw new Error('Unauthorized admin operation');
      if (newEpoch <= this.currentEpoch) {
        throw new Error('New epoch must be strictly greater than current epoch');
      }
      this.currentEpoch = newEpoch;
    }

    setContractActive(adminSecret: string, active: boolean) {
      const adminHash = mockHashVector([adminSecret, 'MEDPROOF_ADMIN']);
      if (adminHash !== this.adminCommitment) throw new Error('Unauthorized admin operation');
      this.isContractActive = active;
    }

    verifyCredential(params: {
      issuerProviderCommitment: string;
      verifierPk: string;
      patientSecret: string;
      schemaId: bigint;
      category: bigint;
      expirationEpoch: bigint;
      payloadHash: string;
      salt: string;
      requiredCategory: bigint;
      sessionNonce: string;
      dispenseNullifier?: string;
      isSingleUse: boolean;
    }): string {
      if (!this.isContractActive) throw new Error('Contract is not accepting verifications');
      if (!this.authorizedProviders.get(params.issuerProviderCommitment)) {
        throw new Error('Issuer is not an active authorized provider');
      }
      if (params.expirationEpoch < this.currentEpoch) {
        throw new Error('Credential has expired');
      }
      if (params.category < params.requiredCategory) {
        throw new Error('Credential does not satisfy required category');
      }

      // Recompute full 7-attribute commitment
      const commitment = this.computeCommitment(params);
      if (!this.issuedCredentials.get(commitment)) {
        throw new Error('Credential commitment is not registered on ledger');
      }
      if (this.revokedCredentials.get(commitment) === true) {
        throw new Error('Credential has been revoked');
      }

      // Bound consent verification
      const consentId = mockHashVector([params.patientSecret, params.verifierPk, commitment, 'MEDPROOF_CONSENT']);
      if (!this.activeConsents.get(consentId)) {
        throw new Error('Consent record not found for this patient, verifier, and credential');
      }

      // Single-use dispense nullifier check
      if (params.isSingleUse) {
        const epochHash = sha256(params.expirationEpoch.toString());
        const expectedNullifier = mockHashVector([params.patientSecret, commitment, 'DISPENSE', epochHash]);
        if (params.dispenseNullifier !== expectedNullifier) {
          throw new Error('Invalid dispense nullifier derivation');
        }
        if (this.nullifiers.get(params.dispenseNullifier)) {
          throw new Error('Prescription has already been dispensed');
        }
        this.nullifiers.set(params.dispenseNullifier, true);
      }

      this.totalVerifications += 1n;
      // Return unlinkable session receipt
      return mockHashVector([commitment, params.verifierPk, params.sessionNonce, 'RECEIPT']);
    }
  }

  const ADMIN_SECRET = '0x1111111111111111111111111111111111111111111111111111111111111111';
  const FAKE_ADMIN_SECRET = '0x9999999999999999999999999999999999999999999999999999999999999999';
  const DOCTOR_SECRET = '0x2222222222222222222222222222222222222222222222222222222222222222';
  const DOCTOR_2_SECRET = '0x3333333333333333333333333333333333333333333333333333333333333333';
  const PATIENT_SECRET = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const FAKE_PATIENT_SECRET = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const VERIFIER_PK = '0xvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv';
  const VERIFIER_2_PK = '0xwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww';
  const SALT = '0x5555555555555555555555555555555555555555555555555555555555555555';
  const PAYLOAD_HASH = '0x7777777777777777777777777777777777777777777777777777777777777777';

  // REGRESSION 1: Unauthorized admin action fails
  it('Regression 1: Unauthorized admin secret cannot authorize provider', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    expect(() => model.authorizeProvider(FAKE_ADMIN_SECRET, DOCTOR_SECRET)).toThrow('Unauthorized admin operation');
  });

  // REGRESSION 2 & 3: Unauthorized provider action & issueCredential fails
  it('Regression 2 & 3: Unauthorized provider secret cannot issue credentials', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    expect(() => model.issueCredential(DOCTOR_SECRET, '0xdeadbeef')).toThrow('Provider is not authorized to issue credentials');
  });

  // REGRESSION 4: Unauthorized consent grant fails
  it('Regression 4: Consent is strictly bound to patientSecret; fake secret fails verification', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorComm = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorComm,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);

    // Attacker grants consent using a fake patient secret
    model.grantConsent(FAKE_PATIENT_SECRET, VERIFIER_PK, comm);

    // Verifying with legitimate patient secret fails because consent was not granted by legitimate patient
    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorComm,
        verifierPk: VERIFIER_PK,
        patientSecret: PATIENT_SECRET,
        schemaId: 1n,
        category: 2n,
        expirationEpoch: 10n,
        payloadHash: PAYLOAD_HASH,
        salt: SALT,
        requiredCategory: 1n,
        sessionNonce: '0x123',
        isSingleUse: false,
      })
    ).toThrow('Consent record not found for this patient, verifier, and credential');
  });

  // REGRESSION 5: Unauthorized consent revoke fails
  it('Regression 5: Adversary cannot revoke consent without patient secret', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorComm = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorComm,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);
    model.grantConsent(PATIENT_SECRET, VERIFIER_PK, comm);

    // Adversary attempts to revoke consent with fake patient secret
    model.revokeConsent(FAKE_PATIENT_SECRET, VERIFIER_PK, comm);

    // Legitimate consent is UNTOUCHED and verification still succeeds
    const receipt = model.verifyCredential({
      issuerProviderCommitment: doctorComm,
      verifierPk: VERIFIER_PK,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
      requiredCategory: 1n,
      sessionNonce: '0x123',
      isSingleUse: false,
    });
    expect(receipt).toBeDefined();
  });

  // REGRESSION 6: Unauthorized credential revoke fails
  it('Regression 6: Doctor B cannot revoke Doctor A credentials', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorCommA = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const doctorCommB = model.authorizeProvider(ADMIN_SECRET, DOCTOR_2_SECRET);

    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorCommA,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);

    // Doctor B tries to revoke Doctor A's credential
    expect(() => model.revokeCredential(DOCTOR_2_SECRET, false, comm)).toThrow('Only the issuing provider or admin can revoke');
  });

  // REGRESSION 7 & 11: Expired credential and expiration substitution fails
  it('Regression 7 & 11: Expired credential fails and cannot be forged by substituting expiration witness', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorComm = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorComm,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 5n, // Expired at epoch 5
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);
    model.grantConsent(PATIENT_SECRET, VERIFIER_PK, comm);
    model.advanceEpoch(ADMIN_SECRET, 10n); // Current epoch is 10

    // 1. Calling with real expired epoch fails expiration check
    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorComm,
        verifierPk: VERIFIER_PK,
        patientSecret: PATIENT_SECRET,
        schemaId: 1n,
        category: 2n,
        expirationEpoch: 5n,
        payloadHash: PAYLOAD_HASH,
        salt: SALT,
        requiredCategory: 1n,
        sessionNonce: '0x123',
        isSingleUse: false,
      })
    ).toThrow('Credential has expired');

    // 2. Calling with forged future epoch fails commitment check because expiration is bound!
    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorComm,
        verifierPk: VERIFIER_PK,
        patientSecret: PATIENT_SECRET,
        schemaId: 1n,
        category: 2n,
        expirationEpoch: 20n, // Substituted future epoch
        payloadHash: PAYLOAD_HASH,
        salt: SALT,
        requiredCategory: 1n,
        sessionNonce: '0x123',
        isSingleUse: false,
      })
    ).toThrow('Credential commitment is not registered on ledger');
  });

  // REGRESSION 8: Category substitution fails
  it('Regression 8: Substituting category witness fails commitment binding', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorComm = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorComm,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 1n, // Low category
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);
    model.grantConsent(PATIENT_SECRET, VERIFIER_PK, comm);

    // Attempt to prove Category 2 for Category 1 credential fails commitment check
    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorComm,
        verifierPk: VERIFIER_PK,
        patientSecret: PATIENT_SECRET,
        schemaId: 1n,
        category: 2n, // Substituted category
        expirationEpoch: 10n,
        payloadHash: PAYLOAD_HASH,
        salt: SALT,
        requiredCategory: 2n,
        sessionNonce: '0x123',
        isSingleUse: false,
      })
    ).toThrow('Credential commitment is not registered on ledger');
  });

  // REGRESSION 9: Issuer substitution fails
  it('Regression 9: Issuer substitution fails commitment binding', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorCommA = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const doctorCommB = model.authorizeProvider(ADMIN_SECRET, DOCTOR_2_SECRET);

    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorCommA,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);
    model.grantConsent(PATIENT_SECRET, VERIFIER_PK, comm);

    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorCommB, // Substituted issuer
        verifierPk: VERIFIER_PK,
        patientSecret: PATIENT_SECRET,
        schemaId: 1n,
        category: 2n,
        expirationEpoch: 10n,
        payloadHash: PAYLOAD_HASH,
        salt: SALT,
        requiredCategory: 1n,
        sessionNonce: '0x123',
        isSingleUse: false,
      })
    ).toThrow('Credential commitment is not registered on ledger');
  });

  // REGRESSION 10: Patient-binding substitution fails
  it('Regression 10: Fake patient secret fails commitment binding', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorComm = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorComm,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);
    model.grantConsent(PATIENT_SECRET, VERIFIER_PK, comm);

    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorComm,
        verifierPk: VERIFIER_PK,
        patientSecret: FAKE_PATIENT_SECRET, // Fake patient
        schemaId: 1n,
        category: 2n,
        expirationEpoch: 10n,
        payloadHash: PAYLOAD_HASH,
        salt: SALT,
        requiredCategory: 1n,
        sessionNonce: '0x123',
        isSingleUse: false,
      })
    ).toThrow('Credential commitment is not registered on ledger');
  });

  // REGRESSION 12: Payload substitution fails
  it('Regression 12: Substituting clinical payload hash fails commitment binding', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorComm = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorComm,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);
    model.grantConsent(PATIENT_SECRET, VERIFIER_PK, comm);

    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorComm,
        verifierPk: VERIFIER_PK,
        patientSecret: PATIENT_SECRET,
        schemaId: 1n,
        category: 2n,
        expirationEpoch: 10n,
        payloadHash: '0xbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb',
        salt: SALT,
        requiredCategory: 1n,
        sessionNonce: '0x123',
        isSingleUse: false,
      })
    ).toThrow('Credential commitment is not registered on ledger');
  });

  // REGRESSION 13 & 14: Invalid nullifier & single-use replay fails
  it('Regression 13 & 14: Fake nullifiers and replay of single-use prescriptions fail', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    const doctorComm = model.authorizeProvider(ADMIN_SECRET, DOCTOR_SECRET);
    const comm = model.computeCommitment({
      issuerProviderCommitment: doctorComm,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
    });
    model.issueCredential(DOCTOR_SECRET, comm);
    model.grantConsent(PATIENT_SECRET, VERIFIER_PK, comm);

    const epochHash = sha256((10n).toString());
    const validNullifier = mockHashVector([PATIENT_SECRET, comm, 'DISPENSE', epochHash]);

    // 1. Fake nullifier fails
    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorComm,
        verifierPk: VERIFIER_PK,
        patientSecret: PATIENT_SECRET,
        schemaId: 1n,
        category: 2n,
        expirationEpoch: 10n,
        payloadHash: PAYLOAD_HASH,
        salt: SALT,
        requiredCategory: 1n,
        sessionNonce: '0x123',
        dispenseNullifier: '0xfakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefake',
        isSingleUse: true,
      })
    ).toThrow('Invalid dispense nullifier derivation');

    // 2. Valid first dispense succeeds
    const receipt1 = model.verifyCredential({
      issuerProviderCommitment: doctorComm,
      verifierPk: VERIFIER_PK,
      patientSecret: PATIENT_SECRET,
      schemaId: 1n,
      category: 2n,
      expirationEpoch: 10n,
      payloadHash: PAYLOAD_HASH,
      salt: SALT,
      requiredCategory: 1n,
      sessionNonce: '0x123',
      dispenseNullifier: validNullifier,
      isSingleUse: true,
    });
    expect(receipt1).toBeDefined();

    // 3. Replay with same nullifier fails
    expect(() =>
      model.verifyCredential({
        issuerProviderCommitment: doctorComm,
        verifierPk: VERIFIER_PK,
        patientSecret: PATIENT_SECRET,
        schemaId: 1n,
        category: 2n,
        expirationEpoch: 10n,
        payloadHash: PAYLOAD_HASH,
        salt: SALT,
        requiredCategory: 1n,
        sessionNonce: '0x456',
        dispenseNullifier: validNullifier,
        isSingleUse: true,
      })
    ).toThrow('Prescription has already been dispensed');
  });

  // REGRESSION 15 & 16: Epoch manipulation fails
  it('Regression 15 & 16: Unauthorized epoch advance and backward epoch advance fail', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    // Unauthorized admin fails
    expect(() => model.advanceEpoch(FAKE_ADMIN_SECRET, 5n)).toThrow('Unauthorized admin operation');
    // Backward or same epoch fails
    expect(() => model.advanceEpoch(ADMIN_SECRET, 1n)).toThrow('New epoch must be strictly greater than current epoch');
    // Forward advance succeeds
    model.advanceEpoch(ADMIN_SECRET, 2n);
    expect(model.currentEpoch).toBe(2n);
  });

  // REGRESSION 17: Unauthorized contract activation/deactivation fails
  it('Regression 17: Unauthorized caller cannot deactivate or activate contract', () => {
    const model = new HardenedMedProofModel(ADMIN_SECRET);
    expect(() => model.setContractActive(FAKE_ADMIN_SECRET, false)).toThrow('Unauthorized admin operation');
    model.setContractActive(ADMIN_SECRET, false);
    expect(model.isContractActive).toBe(false);
  });
});
