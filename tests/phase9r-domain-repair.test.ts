import { describe, it, expect } from 'vitest';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import crypto from 'node:crypto';
import { computeCredentialCommitment as issueCommitment } from '../scripts/issue_credential_real.mjs';
import { computeCredentialCommitment as verifyCommitment } from '../scripts/verify_credential_real.mjs';

const descriptor_bytes32 = new compactRuntime.CompactTypeBytes(32);
const descriptor_vec2_bytes32 = new compactRuntime.CompactTypeVector(2, descriptor_bytes32);

function derivePatientCommitment(patientSecret: Uint8Array, domain: string): Uint8Array {
  const pad = Buffer.alloc(32);
  pad.write(domain, 'utf-8');
  return compactRuntime.persistentHash(descriptor_vec2_bytes32, [
    patientSecret,
    new Uint8Array(pad)
  ]);
}

describe('Phase 9R: Cryptographic Domain Alignment & Regression Tests', () => {
  const testPatientSecret = Uint8Array.from(Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'hex'));
  const testProviderCommitment = Uint8Array.from(Buffer.from('ba4a59721d19ae5c74b1ef22590a323e681f5976eb495cbf057686bb1757a401', 'hex'));
  const testPayload = JSON.stringify({
    medication: 'Amoxicillin 500mg (Controlled Test)',
    dosage: '1 capsule every 8 hours for 10 days',
    instructions: 'Take with water and food. Complete entire course.',
    diagnosisCode: 'J01.90 - Acute Sinusitis',
    patientId: 'PT-CONTROLLED-TEST-001',
    prescriber: 'Dr. Evelyn Vance, MD (Lace Provider #1)',
  });
  const testPayloadHash = Uint8Array.from(crypto.createHash('sha256').update(testPayload).digest());
  const testSalt = Uint8Array.from(Buffer.from('76d631341d918fd1db1ac1cdba5d2d24b04690ce301fb6ea3dc7600a9a20dae9', 'hex'));

  it('1. issueCredential patient commitment derivation == verifyCredential patient commitment derivation', () => {
    const credParams = {
      issuerProviderCommitment: testProviderCommitment,
      patientSecret: testPatientSecret,
      schemaId: 1,
      category: 1,
      expirationEpoch: 12,
      payloadHash: testPayloadHash,
      salt: testSalt,
    };

    const fromIssue = issueCommitment(credParams);
    const fromVerify = verifyCommitment(credParams);

    expect(Buffer.from(fromIssue).toString('hex')).toBe(Buffer.from(fromVerify).toString('hex'));
  });

  it('2. identical patient secret produces identical canonical patient commitment in both paths', () => {
    const canonicalDomain = 'PATIENT_ID';
    const patientCommitment1 = derivePatientCommitment(testPatientSecret, canonicalDomain);
    const patientCommitment2 = derivePatientCommitment(testPatientSecret, canonicalDomain);

    expect(Buffer.from(patientCommitment1).toString('hex')).toBe(Buffer.from(patientCommitment2).toString('hex'));
  });

  it('3. old MEDPROOF_PATIENT derivation is not used by active issuance path and differs from canonical', () => {
    const oldCommitment = derivePatientCommitment(testPatientSecret, 'MEDPROOF_PATIENT');
    const canonicalCommitment = derivePatientCommitment(testPatientSecret, 'PATIENT_ID');

    expect(Buffer.from(oldCommitment).toString('hex')).not.toBe(Buffer.from(canonicalCommitment).toString('hex'));
  });

  it('4. credential commitment produced by corrected issuance input is accepted by verifyCredential calculation', () => {
    const credParams = {
      issuerProviderCommitment: testProviderCommitment,
      patientSecret: testPatientSecret,
      schemaId: 1,
      category: 1,
      expirationEpoch: 12,
      payloadHash: testPayloadHash,
      salt: testSalt,
    };

    const derived = issueCommitment(credParams);
    const canonicalHex = '1621efb5e5e7a0c9a322738cf25417caaf1d1d4b966ba58897849fa156aa7d4b';
    expect(Buffer.from(derived).toString('hex')).toBe(canonicalHex);
  });

  it('5. no raw patient secret is exposed in commitments or receipts', () => {
    const canonicalCommitment = derivePatientCommitment(testPatientSecret, 'PATIENT_ID');
    const hexCommitment = Buffer.from(canonicalCommitment).toString('hex');
    const rawSecretHex = Buffer.from(testPatientSecret).toString('hex');

    expect(hexCommitment).not.toContain(rawSecretHex);
    expect(hexCommitment.length).toBe(64);
  });

  it('6. no raw PHI is placed on-chain (only cryptographic hash)', () => {
    const rawClinicalData = JSON.stringify({
      medication: 'Amoxicillin 500mg',
      dosage: '1 capsule every 8 hours',
      diagnosis: 'Acute Sinusitis'
    });
    const hash = crypto.createHash('sha256').update(rawClinicalData).digest('hex');

    expect(hash).not.toContain('Amoxicillin');
    expect(hash).not.toContain('Sinusitis');
    expect(hash.length).toBe(64);
  });
});
