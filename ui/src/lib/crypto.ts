// src/lib/crypto.ts
// Cryptographic hashing and commitment calculation mirroring contracts/medproof.compact
// Uses universal WebCrypto (globalThis.crypto.subtle) supported in all modern browsers and Node 18+

export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return '0x' + hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function pad32(str: string): string {
  const hex = Array.from(new TextEncoder().encode(str))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hex.padEnd(64, '0');
}

export async function computePatientCommitment(patientSecret: string): Promise<string> {
  return sha256Hex(`${patientSecret}:PATIENT_ID`);
}

export async function computeCredentialCommitment(params: {
  issuerProviderCommitment: string;
  patientSecret: string;
  schemaId: number;
  category: number;
  expirationEpoch: number;
  payloadHash: string;
  salt: string;
}): Promise<string> {
  const patientCommitment = await computePatientCommitment(params.patientSecret);
  const schemaHash = await sha256Hex(params.schemaId.toString());
  const categoryHash = await sha256Hex(params.category.toString());
  const epochHash = await sha256Hex(params.expirationEpoch.toString());

  const vector = [
    params.issuerProviderCommitment,
    patientCommitment,
    schemaHash,
    categoryHash,
    epochHash,
    params.payloadHash,
    params.salt,
  ].join(':');

  return sha256Hex(vector);
}

export async function computeConsentId(patientSecret: string, verifierPk: string, credentialCommitment: string): Promise<string> {
  return sha256Hex(`${patientSecret}:${verifierPk}:${credentialCommitment}:MEDPROOF_CONSENT`);
}

export async function computeNullifier(patientSecret: string, credentialCommitment: string, epoch: number): Promise<string> {
  const epochHash = await sha256Hex(epoch.toString());
  return sha256Hex(`${patientSecret}:${credentialCommitment}:DISPENSE:${epochHash}`);
}

export async function computeReceipt(credentialCommitment: string, verifierPk: string, sessionNonce: string): Promise<string> {
  return sha256Hex(`${credentialCommitment}:${verifierPk}:${sessionNonce}:RECEIPT`);
}
