# MedProof — Authoritative Deployment State Record

**Date:** 2026-09-18  
**Project:** MedProof — Confidential Healthcare Credential & Consent Exchange  
**Project Root:** `/home/user/midnight-projects/confidential-prescription-verification`  
**Network:** Midnight Preprod  

---

## 1. Verified Canonical Preprod Contract

- **Canonical Contract Address:** `1ccb306f688ec9e68afd44d4bbf57f6fcc64fd951ce3e238bf384c29dac9bb`  
  *(Exact on-chain address string from `.midnight-state.json` / deploy tx: `1ccb306f688ec96e8afd44d4bff5f7f6fcc64fdc951ce3e238bf384c29dac9bb`)*
- **Contract Source:** `contracts/medproof.compact`
- **Managed Bindings:** `contracts/managed/medproof/`
- **Compiler Version:** Compact compiler `0.26.0`
- **Deployer Public Address:** `mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn`

---

## 2. On-Chain Deployment Evidence

- **Deployment Transaction Hash:** `7898a35a4306859bdbfa884e227b00b88a6cd34d4f9b0582aefba452ee811118`
- **Deployment Block Height:** `2591520`
- **Deployment Block Hash:** `38fe5757d5904be735cbef2a5c5332f91bc47eb2be881b94b05a62f689c368d9`
- **Deployment Timestamp:** `2026-09-17T16:16:47.790Z`
- **Independent On-Chain Verification:** `YES`
  - Queried directly via GraphQL API against `https://indexer.preprod.midnight.network/api/v4/graphql`
  - Block Height `#2591520` verified
  - Contract deployed state deserialized successfully with `@midnight-ntwrk/compact-runtime`
  - `isContractActive: true` confirmed on-chain
  - `currentEpoch: 1` confirmed on-chain
  - `adminCommitment: 0xce6881404e46046eef24f8d5e1654b1f63cb32d8495a6cb6e3260c6d744f4755` confirmed on-chain

---

## 3. Deprecated / Unused Deployments

- **Historical Preview Contract:** `54b40b55db6c344ddb1511d13c93e2bbbb280b4c1738b912cd838f5ac94df8dc`
  - **Status:** `NOT USED` (Superseded by fresh Preprod deployment)
- **Legacy Prescription Verifier:** `contracts/prescription-verifier.compact`
  - **Status:** `NOT USED` (Superseded by MedProof v2 comprehensive contract)

---

## 4. Current Frontend Binding Configuration

- **File:** `ui/src/lib/config.ts`
  - Network: `preprod`
  - Contract Address: `1ccb306f688ec96e8afd44d4bff5f7f6fcc64fdc951ce3e238bf384c29dac9bb`
  - RPC URL: `https://rpc.preprod.midnight.network`
  - Indexer URL: `https://indexer.preprod.midnight.network/api/v4/graphql`
  - Indexer WS URL: `wss://indexer.preprod.midnight.network/api/v4/graphql/ws`
  - Proof Server: `http://127.0.0.1:6300`
- **File:** `ui/.env.local` / `ui/.env`
  - `NEXT_PUBLIC_NETWORK=preprod`
  - `NEXT_PUBLIC_CONTRACT_ADDRESS=1ccb306f688ec96e8afd44d4bff5f7f6fcc64fdc951ce3e238bf384c29dac9bb`
  - `NEXT_PUBLIC_PROOF_SERVER_URL=http://127.0.0.1:6300`

---

## 5. Circuit Readiness State

| Circuit | Preconditions | On-Chain State Requirement | Feasibility for 1st Tx |
|---|---|---|---|
| `grantConsent` | `isContractActive == true` | No credential/provider required | **READY (Primary Target)** |
| `revokeConsent` | `isContractActive`, existing consent | Requires prior active consent | Blocked until consent granted |
| `verifyCredential` | `isContractActive`, provider auth, credential issued, consent active | Requires full registration chain | Blocked until records exist |
| `issueCredential` | Caller must prove `adminSecret` | Requires admin preimage | Blocked (Admin secret required) |
| `authorizeProvider` | Caller must prove `adminSecret` | Requires admin preimage | Blocked (Admin secret required) |
