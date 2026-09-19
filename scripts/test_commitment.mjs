import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import crypto from 'node:crypto';

const descriptor_bytes32 = new compactRuntime.CompactTypeBytes(32);
const descriptor_vec2_bytes32 = new compactRuntime.CompactTypeVector(2, descriptor_bytes32);
const descriptor_vec7_bytes32 = new compactRuntime.CompactTypeVector(7, descriptor_bytes32);
const descriptor_uint32 = new compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);
const descriptor_uint64 = new compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const REAL_LACE_ADDRESS = 'mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn';
const providerSecretBytes = Uint8Array.from(crypto.createHash('sha256').update(REAL_LACE_ADDRESS).digest());

const padProv = Buffer.alloc(32);
padProv.write('MEDPROOF_PROVIDER', 'utf-8');
const providerCommitment = compactRuntime.persistentHash(descriptor_vec2_bytes32, [providerSecretBytes, new Uint8Array(padProv)]);

const patientSecret = Uint8Array.from(Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'hex'));
const schemaId = 1;
const category = 1;
const expirationEpoch = 12;

const clinicalPayload = {
  medication: 'Amoxicillin 500mg (Controlled Test)',
  dosage: '1 capsule every 8 hours for 10 days',
  instructions: 'Take with water and food. Complete entire course.',
  diagnosisCode: 'J01.90 - Acute Sinusitis',
  patientId: 'PT-CONTROLLED-TEST-001',
  prescriber: 'Dr. Evelyn Vance, MD (Lace Provider #1)',
};
const payloadString = JSON.stringify(clinicalPayload);
const payloadHash = Uint8Array.from(crypto.createHash('sha256').update(payloadString).digest());
const salt = Uint8Array.from(Buffer.from('76d631341d918fd1db1ac1cdba5d2d24b04690ce301fb6ea3dc7600a9a20dae9', 'hex'));

function testTag(tag) {
  const padPatient = Buffer.alloc(32);
  padPatient.write(tag, 'utf-8');
  const patientCommitment = compactRuntime.persistentHash(descriptor_vec2_bytes32, [patientSecret, new Uint8Array(padPatient)]);
  const schemaHash = compactRuntime.persistentHash(descriptor_uint32, BigInt(schemaId));
  const categoryHash = compactRuntime.persistentHash(descriptor_uint32, BigInt(category));
  const epochHash = compactRuntime.persistentHash(descriptor_uint64, BigInt(expirationEpoch));

  const commitment = compactRuntime.persistentHash(descriptor_vec7_bytes32, [
    providerCommitment,
    patientCommitment,
    schemaHash,
    categoryHash,
    epochHash,
    payloadHash,
    salt
  ]);
  return Buffer.from(commitment).toString('hex');
}

console.log('Target on-chain:  f66d8d9e2c3634f3558e8c5b9c5b9dc9f0244ef9c83c97fbbd8010b4d1a8f63c');
console.log('MEDPROOF_PATIENT:', testTag('MEDPROOF_PATIENT'));
console.log('PATIENT_ID:      ', testTag('PATIENT_ID'));

const descriptor_vec4_bytes32 = new compactRuntime.CompactTypeVector(4, descriptor_bytes32);
const verifierPk = Uint8Array.from(Buffer.from('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'hex'));
const padConsent = Buffer.alloc(32);
padConsent.write('MEDPROOF_CONSENT', 'utf-8');
const credCommitmentBytes = Uint8Array.from(Buffer.from(testTag('PATIENT_ID'), 'hex'));
const newConsentId = compactRuntime.persistentHash(descriptor_vec4_bytes32, [
  patientSecret,
  verifierPk,
  credCommitmentBytes,
  new Uint8Array(padConsent)
]);
console.log('NEW_CONSENT_ID:  ', Buffer.from(newConsentId).toString('hex'));
