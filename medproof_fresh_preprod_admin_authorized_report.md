# MEDPROOF — FRESH PREPROD REDEPLOYMENT & PROVIDER AUTHORIZATION REPORT

## 1. Executive Summary

A fresh, cryptographically secure MedProof smart contract deployment has been successfully executed on Midnight Preprod. The deployment was initialized with a deterministic admin commitment derived directly from a preserved 32-byte secret stored outside the Git repository.

Following contract deployment and verification on the Preprod indexer, an on-chain authorizeProvider circuit transaction was successfully submitted and confirmed, authorising the real Midnight Lace Account #1 (mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn) on Midnight Preprod.

---

## 2. Verified Status & Contract Parameters

`yaml
OLD CONTRACT:
  ADDRESS: 1ccb306f688ec9e68afd44d4bbf5f7f6fcc64fd951ce3e238bf384c29dac9bb
  STATUS: LEGACY / UNCHANGED (0 transactions sent)

NEW CONTRACT:
  ADDRESS: 94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626
  NETWORK: PREPROD
  DEPLOYMENT TX: 6187f85d86e03ba2b403d458878695bc10d825166131b68bcb861f074390609e
  DEPLOYMENT BLOCK: 2607889
  CONTRACT ACTIVE: YES (isContractActive == true, currentEpoch == 1)

ADMIN SECRET:
  LOCATION: /home/user/midnight-secrets/medproof-preprod-admin.secret
  PERMISSIONS: directory 0700, file 0600 (outside git)
  STORAGE STATUS: PRESERVED SECURELY OUTSIDE GIT
  CONFIDENTIALITY: [REDACTED - NEVER PRINTED]
  ADMIN COMMITMENT: PRESENT / VERIFIED (0x2127f4f24f30a7580f9ae5ce76e75bb234ee4574e17f4ce4c6ff4006d2108e64)

REAL LACE PROVIDER:
  ACCOUNT: Midnight Account #1
  UNSHIELDED ADDRESS: mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn
  PROVIDER COMMITMENT: 0xba4a59721d19ae5c74b1ef22590a323e681f5976eb495cbf057686bb1757a401
  AUTHORIZATION TX: 00b772a566cee43b7a5e560eeff3e77d85856e042868396d1a7ee9236fe5640fc1
  AUTHORIZATION BLOCK: 2608061
  PROVIDER AUTHORIZATION: VERIFIED ON-CHAIN (authorizedProviders[providerCommitment] == true)
  AUTHORIZED PROVIDER COUNT: 1 (verified via Preprod GraphQL Indexer)

INFRASTRUCTURE & INTEGRATION STATUS:
  ISSUE CREDENTIAL: READY
  VERIFY CREDENTIAL: READY
  INDEXER: READY (https://indexer.preprod.midnight.network/api/v1/graphql)
  PROOF SERVER: READY (http://127.0.0.1:6300)
  WALLET: PRESERVED (.midnight-wallet-state intact)
  DUST: PRESERVED (Existing UTXOs intact)

SAFETY & INTEGRITY VERIFICATION:
  OLD CONTRACT MODIFIED: NO
  WALLET RESET: NO
  FAKE PROVIDER: NO
  FAKE AUTHORIZATION: NO
  FAKE CONTRACT ADDRESS: NO
  TRANSACTIONS IN THIS PHASE: 2 (1 Deployment Tx + 1 AuthorizeProvider Tx)

TEST & BUILD VERIFICATION:
  TESTS: 113/113 passed (11 test suites)
  BUILD: PASS (Next.js 15.3.9 - 12/12 routes compiled cleanly with 0 errors)
`

---

## 3. Frontend & Runtime Updates

1. **Active Runtime Configuration Updated**:
   - ui/src/lib/config.ts: Canonical contract address updated to 94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626.
   - ui/.env.local and ui/.env: NEXT_PUBLIC_MEDPROOF_CONTRACT_ADDRESS updated.
   - ui/src/app/api/consent/prepare/route.ts: Updated fallback address.
   - Active runtime references to legacy contract address: **0**.

2. **Provider Portal Truthful State**:
   - ui/src/app/provider/page.tsx truthfully distinguishes between generic wallet connection and verified on-chain provider authorization on Midnight Preprod.

---

## 4. Phase Verification Checklist

- [x] Phase 1: Forensic inspection of contract, deployment scripts, and Compact circuits.
- [x] Phase 2: Preserved admin secret stored securely in ~/midnight-secrets/medproof-preprod-admin.secret (0600).
- [x] Phase 3: Deployment initialization updated with deterministic Poseidon commitment derivation and fail-fast validation.
- [x] Phase 4: Pre-deployment build and automated tests verified.
- [x] Phase 5: Fresh Preprod contract deployed successfully.
- [x] Phase 6: New contract deployment verified active on Preprod indexer.
- [x] Phase 7: Real Lace provider authorized on-chain via ZK proof transaction.
- [x] Phase 8: Frontend configured to new canonical contract address with 0 active legacy references.
- [x] Phase 9: Provider portal UI updated to truthfully reflect on-chain authorization status.
- [x] Phase 10: Read-only readiness verified across all services.
- [x] Phase 11: Regression tests (113/113 pass) and production build (12/12 routes pass) verified.
- [x] Phase 12: Final report generated and hard stop observed.
