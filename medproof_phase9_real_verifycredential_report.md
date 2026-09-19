# MEDPROOF — PHASE 9 REAL VERIFYCREDENTIAL ON-CHAIN E2E REPORT

## 1. Executive Summary

Phase 9 execution of the genuine MedProof verifyCredential() circuit flow was initiated against the active Midnight Preprod contract 94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626.

In strict adherence to the Absolute Fail-Closed Execution Policy, execution was halted during local circuit simulation prior to zero-knowledge proof generation or transaction submission due to an on-chain credential commitment derivation mismatch originating in Phase 7.

No synthetic, mock, or fabricated transactions were produced. Zero blockchain transactions were submitted. The on-chain state, wallet balances, and DUST reserves remain completely preserved and uncorrupted.

---

## 2. Technical Root Cause Forensic Analysis

1. Compact Contract Circuit Specification (contracts/medproof.compact:158):
   The compiled smart contract bytecode on Midnight Preprod derives the 7-attribute credential commitment inside the verifyCredential circuit using domain tag 'PATIENT_ID':
   patientCommitment = persistentHash([patientSecret, pad(32, 'PATIENT_ID')])
   When evaluated with patientSecret = 0xaaaa... and domain tag 'PATIENT_ID', the resulting commitment is:
   0x1621efb5e5e7a0c9a322738cf25417caaf1d1d4b966ba58897849fa156aa7d4b

2. Phase 7 Issuer Script Discrepancy (scripts/issue_credential_real.mjs:44):
   During Phase 7 execution, the off-chain commitment calculation script used the string 'MEDPROOF_PATIENT' instead of 'PATIENT_ID':
   padPatient.write('MEDPROOF_PATIENT', 'utf-8');
   This derived:
   0xf66d8d9e2c3634f3558e8c5b9c5b9dc9f0244ef9c83c97fbbd8010b4d1a8f63c
   This commitment was registered on the Preprod ledger in issuedCredentials.

3. Circuit Failure Mechanism in Phase 9 (contracts/medproof.compact:171):
   When verifyCredential executes:
   assert(issuedCredentials.member(commitmentDisclosed), 'Credential commitment is not registered on ledger');
   Because the circuit derives 0x1621efb5... (via 'PATIENT_ID'), while the ledger contains 0xf66d8d9e... (registered via 'MEDPROOF_PATIENT'), the membership check strictly fails with:
   CompactError: failed assert: Credential commitment is not registered on ledger

4. Fail-Closed Outcome:
   The Compact runtime aborted transaction creation during scoped execution. Zero transactions were submitted to the network, preventing wasted gas/DUST and preventing invalid state publication.

---

## 3. Evidence Matrix

- Contract Address: 94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626 (Active, isContractActive == true)
- Phase 7 Credential: Present on ledger (issuedCredentials[0xf66d...] == true)
- Phase 8 Consent: Present on ledger (activeConsents[0xf889...] == true)
- Verifier PK: Bound to Consent (0xbbbb... matched to expectedConsentId)
- Proof Path: Genuine Bindings (contracts/managed/medproof/, zero mocks)
- Proof Server: Port 6300 (Healthy, http://127.0.0.1:6300/health HTTP 200 OK)
- Circuit Simulation: Fail-Closed Guard (threw expected ledger assertion error before proof generation)
- Transactions Submitted: 0
- Wallet & DUST State: Integrity Preserved (5,000 tNIGHT and 5.799e18 DUST intact)
- Privacy Forensics: Zero PHI, diagnosis, dosage, or patient secrets exposed
- Unit & Lifecycle Tests: 113 / 113 passed across 11 test suites
- Production Build: 13 / 13 routes compiled cleanly with 0 errors

---

## 4. Phase 9 Execution Audit Metadata

PHASE:
9

CONTRACT:
94499aa3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626

NETWORK:
PREPROD

REAL PHASE 7 CREDENTIAL:
YES

REAL PHASE 8 CONSENT:
YES

REAL VERIFIER:
YES

VERIFIERCREDENTIAL:
NOT EXECUTED

REAL ZK PROOF:
NO

REAL LACE:
NOT REQUIRED

REAL TRANSACTION:
NO

TX HASH:
NONE

BLOCK:
NONE

ON-CHAIN CONFIRMATION:
FAILED

ON-CHAIN RESULT:
UNMODIFIED (totalVerifications = 0)

NULLIFIER / REPLAY STATE:
UNTOUCHED (0 nullifiers on-chain)

FRONTEND RESULT:
MATCHES REAL STATE

RAW PHI EXPOSED:
NO

PRIVATE WITNESSES EXPOSED:
NO

TESTS:
113 passed (113/113 across 11 test suites)

BUILD:
PASS (Next.js 15.3.9 — 13/13 routes compiled)

TRANSACTIONS SUBMITTED IN PHASE 9:
0
