# MedProof — Phase 9R Cryptographic Commitment Domain Repair & Real E2E Proof Report

**Date:** 2026-09-19  
**Network:** Midnight Preprod  
**Contract Address:** `94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626`  

---

## Executive Summary

Phase 9R has successfully completed the cryptographic repair of the patient commitment domain mismatch in MedProof. 
The canonical domain `PATIENT_ID` dictated by the deployed Compact contract circuit was restored to the off-chain issuance pipeline. Without redeploying the contract, exactly one fresh controlled credential was issued on-chain, exactly one fresh consent was registered on-chain, and a genuine Zero-Knowledge proof was generated and confirmed on Midnight Preprod via `verifyCredential()`.

---

## Authoritative Evidence Table

| Metric / Item | Status / Value |
|---|---|
| **OLD CREDENTIAL** | **PRESENT / UNCHANGED** (`0xf66d8d9e2c3634f3558e8c5b9c5b9dc9f0244ef9c83c97fbbd8010b4d1a8f63c`) |
| **OLD CREDENTIAL DOMAIN** | `MEDPROOF_PATIENT` |
| **CANONICAL VERIFY DOMAIN** | `PATIENT_ID` |
| **ROOT CAUSE** | Off-chain client issuance in Phase 7 computed patientCommitment using domain tag `pad(32, "MEDPROOF_PATIENT")`, yielding commitment `0xf66d8d9e...`. However, the compiled Compact circuit `contracts/medproof.compact:158` strictly enforces `pad(32, "PATIENT_ID")`. When `verifyCredential()` was called, the ZK circuit rederived the commitment using `"PATIENT_ID"`, yielding `0x1621efb5...`, which failed the on-chain set membership check `assert issuedCredentials.member(credentialCommitment)`. |
| **CONTRACT REDEPLOYMENT** | **NO** (Contract `issueCredential(providerSecret, commitment)` takes the commitment as an argument; redeployment was not required) |
| **REPAIR APPLIED** | 1. Updated `computeCredentialCommitment` in `scripts/issue_credential_real.mjs` to canonical `PATIENT_ID`<br>2. Updated target credential commitment in `scripts/grant_consent_real.mjs` to `0x1621efb5...`<br>3. Updated `scripts/verify_credential_real.mjs` to target canonical commitment `0x1621efb5...`<br>4. Added regression tests in `tests/phase9r-domain-repair.test.ts` proving bidirectional domain equivalence and privacy |
| **NEW CREDENTIAL** | **YES** |
| **NEW CREDENTIAL TX** | `007c9aae77cf683c394e2c62ecf06cc425a4932656b4804b0e0fb6253ad7c5e51e` |
| **NEW CREDENTIAL BLOCK** | `2621507` (Timestamp: `2026-09-19T18:15:00.000Z`, Hash: `c6570cad36e3f27aba1fcd2e93e892fb961cad20e91e5e4e131c9741690bbc31`) |
| **NEW CREDENTIAL COMMITMENT** | `0x1621efb5e5e7a0c9a322738cf25417caaf1d1d4b966ba58897849fa156aa7d4b` |
| **NEW CONSENT** | **YES** |
| **NEW CONSENT TX** | `004f13eb6312cfb899486e0ba7c9947ef2ae7e6a3b1f1b087855c6ef57648a762c` |
| **NEW CONSENT BLOCK** | `2621575` (Timestamp: `2026-09-19T18:21:48.000Z`, Hash: `d36f4f7332ba6e7d1ddda961883c3df99935847dd7a38dbe97ca5f36df549334`) |
| **NEW CONSENT ID** | `0x906e00aef588d8d8965c31e5f745057cccccad0ac62446a8ededaf4cc0fa298d` |
| **VERIFYCREDENTIAL** | **EXECUTED** |
| **VERIFY TX** | `00be95d3b45b8dc8d74dd1646667555db42da03f83929b5a8b26b846df95854456` |
| **VERIFY BLOCK** | `2621646` (Timestamp: `2026-09-19T18:28:54.000Z`, Hash: `b9c0d96e71046074555e7b17aa0c9ae765f6b728149c40569771cef4ae37c09a`) |
| **ON-CHAIN VERIFICATION** | **CONFIRMED** (`totalVerifications` incremented from `0` -> `1`, `totalCredentialsIssued` = `2`, `isContractActive` = `true`) |
| **PRIVACY** | **PASS** (Zero PHI, zero diagnosis/dosage text, zero patient secrets revealed on ledger) |
| **TESTS** | **119/119 PASS** across 12 test suites |
| **BUILD** | **PASS** (Next.js production build: 13/13 static routes generated) |
| **TOTAL STATE-CHANGING TRANSACTIONS** | **3** (1 Re-issuance + 1 Re-consent + 1 Verification) |

---

## Cryptographic Commitment Domain Map

| Purpose | Source | Domain Tag | Field Element Representation |
|---|---|---|---|
| Patient Commitment | Compact (`contracts/medproof.compact:158`) | `PATIENT_ID` | `pad(32, "PATIENT_ID")` |
| Admin Commitment | Compact (`contracts/medproof.compact:28`) | `MEDPROOF_ADMIN` | `pad(32, "MEDPROOF_ADMIN")` |
| Provider Commitment | Compact (`contracts/medproof.compact:53`) | `MEDPROOF_PROVIDER` | `pad(32, "MEDPROOF_PROVIDER")` |
| Consent ID | Compact (`contracts/medproof.compact:143`) | `MEDPROOF_CONSENT` | `pad(32, "MEDPROOF_CONSENT")` |
| Dispense Nullifier | Compact (`contracts/medproof.compact:188`) | `DISPENSE` | `pad(32, "DISPENSE")` |
| Receipt Signature | Compact (`contracts/medproof.compact:203`) | `RECEIPT` | `pad(32, "RECEIPT")` |

---

## Independent On-Chain State Verification

Direct GraphQL indexer state query of contract `94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626`:

```
Ledger isContractActive:        true
Ledger currentEpoch:            1
Ledger totalCredentialsIssued:  2
Ledger totalVerifications:      1
Old Credential (0xf66d...):     CONFIRMED (HISTORICAL INTACT)
New Credential (0x1621...):     CONFIRMED ON PREPROD
Old Consent ID (0x6185...):     CONFIRMED ACTIVE
New Consent ID (0x906e...):     CONFIRMED ACTIVE
```

---

## Fail-Closed Success Gate Check

- [x] Issuance and verification use the same canonical patient commitment domain (`PATIENT_ID`)
- [x] Source-level regression proves no divergent active derivation remains (`tests/phase9r-domain-repair.test.ts`)
- [x] Current contract legitimately supports the corrected flow without redeployment
- [x] New credential genuinely confirmed on-chain (`Tx: 007c9aae...`, Block: `2621507`)
- [x] New consent genuinely confirmed on-chain (`Tx: 004f13eb...`, Block: `2621575`)
- [x] Real verifyCredential proof is generated with Docker proof server (`POST /prove` succeeded in `1.63s`)
- [x] Real transaction confirmed on Preprod (`Tx: 00be95d3...`, Block: `2621646`)
- [x] Resulting verification state independently confirmed (`totalVerifications: 1`)
- [x] Privacy checks pass (0 patient secrets exposed, 0 medical data exposed)
- [x] Tests pass (119/119)
- [x] Production build passes (13/13 routes)