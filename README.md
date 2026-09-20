# 🏥 MedProof — Confidential Healthcare Credential & Consent Exchange

[![CI/CD Pipeline](https://github.com/shouvik7majumdar/healthcare-credential/actions/workflows/ci.yml/badge.svg)](https://github.com/shouvik7majumdar/healthcare-credential/actions/workflows/ci.yml)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod%20Network-blue)](https://midnight.network)
[![Zero Knowledge](https://img.shields.io/badge/Zero--Knowledge-Compact%20v0.16-purple)](https://midnight.network)
[![Category](https://img.shields.io/badge/Midnight-Confidential%20Credentials-success)](https://midnight.network)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20App-black?logo=vercel)](https://medproof-ashen.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MedProof** is a production-grade, privacy-preserving healthcare credential and consent exchange built on the **Midnight Network** using **Compact** smart contracts and Zero-Knowledge proofs (zk-SNARKs). MedProof empowers patients, authorized healthcare prescribers, and licensed verifiers (pharmacies, insurers, research clinics) to issue, manage, consent to, and verify healthcare credentials without exposing sensitive Personal Health Information (PHI), diagnostic data, or patient/doctor identities on-chain.

<p align="center">
  <h3>LANDING PAGE</h3>
  <img src="docs/images/landing-page.png" alt="MedProof Landing Page" width="100%" />
  <br />
  <i>MedProof Landing Page — Zero-Knowledge Healthcare Credential & Consent Exchange Overview.</i>
</p>

<p align="center">
  <h3>CONFIDENTIAL PATIENT VAULT</h3>
  <img src="docs/images/patient-vault.png" alt="Confidential Patient Vault" width="100%" />
  <br />
  <i>Patient Confidential Vault interface for managing encrypted clinical prescriptions, inspecting zero-knowledge commitments, and controlling verifier consent permissions.</i>
</p>

---

## 🎥 Demo Video & Live Links

| Resource | Description | Status / Link |
| :--- | :--- | :--- |
| **🌐 Live Application** | Deployed web application on Vercel | [Live Demo](https://medproof-ashen.vercel.app/) |
| **🐦 X (Twitter) Account** | Official MedProof X (Twitter) Account | [@MedProof_midnit](https://x.com/MedProof_midnit) |
| **🐙 GitHub Repository** | Open-source monorepo codebase | [GitHub Repo](https://github.com/shouvik7majumdar/healthcare-credential) |
| **🎥 Demo Video** | Interactive application walkthrough | [Watch Demo Video (YouTube)](https://youtu.be/-8m0TcUsUUc) |
| **⚙️ CI/CD Workflow** | GitHub Actions build & verification pipeline | [View CI/CD Pipeline](https://github.com/shouvik7majumdar/healthcare-credential/actions/workflows/ci.yml) |
| **🔍 NightScan Explorer** | Midnight Preprod Network Explorer | [Midnight Preprod Explorer](https://explorer.preprod.midnight.network/) |
| **📄 Product Proposal** | Complete project documentation and specs | [PROPOSAL.md](PROPOSAL.md) |

---

## 📌 Verified Preprod Deployment & Provenance

The canonical MedProof smart contract (`medproof.compact`) is deployed and actively verified on the **Midnight Preprod Network**:

| Field | Details / Authoritative On-Chain Record |
| :--- | :--- |
| **Target Network** | Midnight Preprod Network (Network ID: `undeployed` / `preprod`) |
| **Contract Name** | `medproof.compact` (`@midnight-ntwrk/medproof`) |
| **Deployed Contract Address** | `94499aa3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626` |
| **Deployment Tx Hash** | `6187f85d86e03ba2b403d458878695bc10d825166131b68bcb861f074390609e` |
| **Deployment Block Height** | Block `#2607889` |
| **Explorer Verification** | [Midnight NightScan Explorer](https://explorer.preprod.midnight.network/) |
| **Indexer GraphQL API** | `https://indexer.preprod.midnight.network/api/v4/graphql` |
| **Indexer WebSocket** | `wss://indexer.preprod.midnight.network/api/v4/graphql/ws` |
| **Proof Server Engine** | Midnight Proof Server `v8.1.0` (`http://127.0.0.1:6300`) |

### Verified Complete On-Chain Transaction Provenance (All 7 Lifecycle Steps)

MedProof has genuinely executed and independently verified the full end-to-end zero-knowledge confidential credential lifecycle on the live Midnight Preprod blockchain:

| Stage | Operation | On-Chain Transaction Hash | Block Height | Status |
| :--- | :--- | :--- | :--- | :--- |
| **0. Deployment** | Deploy `medproof.compact` | `6187f85d86e03ba2b403d458878695bc10d825166131b68bcb861f074390609e` | `2607889` | **CONFIRMED** |
| **1. Authorization** | `authorizeProvider(0xba4a...)` | `00b772a566cee43b7a5e560eeff3e77d85856e042868396d1a7ee9236fe5640fc1` | `2608061` | **CONFIRMED** |
| **2. Credential Issuance** | `issueCredential(0xf66d...)` | `00a30d7b0e201a543f1de032f061e0ee954a8393bb71b786755724e16deed39c9e` | `2608563` | **CONFIRMED** |
| **3. Consent Grant** | `grantConsent(0xf889...)` | `00cbe31e7ce13c4c46a1c70805c0621276e7934c6393974965b17a6272173b4086` | `2608758` | **CONFIRMED** |
| **4. Repaired Issuance** | `issueCredential(0x1621...)` | `007c9aae77cf683c394e2c62ecf06cc425a4932656b4804b0e0fb6253ad7c5e51e` | `2621507` | **CONFIRMED** |
| **5. Repaired Consent** | `grantConsent(0x906e...)` | `004f13eb6312cfb899486e0ba7c9947ef2ae7e6a3b1f1b087855c6ef57648a762c` | `2621575` | **CONFIRMED** |
| **6. ZK Verification** | `verifyCredential(nullifier, ...)` | `00be95d3b45b8dc8d74dd1646667555db42da03f83929b5a8b26b846df95854456` | `2621646` | **CONFIRMED** |

*(Historical note: The earlier prototype `prescription-verifier.compact` was deployed on Preview Testnet at address `54b40b55db6c344ddb1511d13c93e2bbbb280b4c1738b912cd838f5ac94df8dc` in Block `#271826`.)*

---

## 🔒 Cryptographic Architecture & Privacy Guarantees

In MedProof, all health data and personal identifiers are strictly partitioned into **Client-Side Private Witness State** and **On-Chain Public State**.

### Client-Side Witness State (Never Disclosed)
1. **Patient Secret (`patientSecret`)**: A 256-bit entropy seed known solely to the patient, used to derive the patient commitment and cryptographic nullifiers.
2. **Clinical Content & PHI**: Diagnostic codes, medication names, dosages, instructions, and notes remain strictly in the patient and doctor local storage.
3. **Commitment Salt**: Random nonces that prevent dictionary and rainbow-table attacks against commitments.
4. **Consent Pre-images**: Verifier authorization proof evaluated locally inside the ZK prover.

### On-Chain Public Ledger State (Transparent & Verifiable)
1. **`totalCredentialsIssued`**: Monotonically increasing counter of registered credential commitments (`2`).
2. **`totalVerifications`**: Verified zero-knowledge proof counter on Preprod (`1`).
3. **`authorizedProviders`**: Map of verified healthcare provider public keys authorized to issue credentials.
4. **`activeConsents`**: Map of active consent identifiers linking credential commitments to verifiers with expiration epochs.
5. **`nullifiers`**: Cryptographic nullifiers preventing double-presentation or replay of single-use credentials.

### Cryptographic Domain Consistency
All commitments and nullifiers are calculated using the Midnight Poseidon hash primitive:
- **Patient Commitment**: `Poseidon(pad(32, "PATIENT_ID"), patientSecret)`
- **Credential Commitment**: `Poseidon(providerPk, patientCommitment, expiry, pad(32, "MEDPROOF_SALT"))`
- **Consent Identifier**: `Poseidon(patientCommitment, verifierPk, credentialCommitment)`
- **Verification Nullifier**: `Poseidon(pad(32, "MEDPROOF_NULLIFIER"), patientSecret, credentialCommitment)`

---

## 🏗️ System Architecture

MedProof is organized as an enterprise monorepo:

```text
confidential-prescription-verification/
├── contracts/                  # Midnight Compact smart contract workspace
│   ├── medproof.compact        # Production Compact contract with full consent lifecycle
│   └── managed/medproof/       # Compiled ZK circuit artifacts & TypeScript bindings
├── ui/                         # Next.js 15 App Router web application
│   ├── src/app/                # 7 Healthcare workflows (/patient, /provider, /consent, etc.)
│   ├── src/services/           # Lace Wallet integration & Midnight contract services
│   ├── src/context/            # Context state distinguishing demo vs live on-chain data
│   └── src/lib/config.ts       # Canonical Preprod network configuration
├── src/                        # Admin CLI, deployment, wallet, and network utilities
├── scripts/                    # Verified lifecycle execution & verification scripts
├── tests/                      # 119 unit and integration tests (Vitest)
├── docs/images/                # Visual assets and UI screenshots
└── vercel.json                 # Vercel deployment configuration
```

### Full-Stack Healthcare Portals
- **Patient Vault (`/patient`)**: Patients manage credentials, inspect private details, and grant time-bounded consent.
- **Provider Portal (`/provider`)**: Verified prescribers issue tamper-proof cryptographic credentials.
- **Consent Center (`/consent`)**: Granular consent authorization and revocation management.
- **Verifier Portal (`/verifier`)**: Pharmacies, insurers, and clinical research teams verify credentials with zero PHI disclosure.
- **Credential Explorer (`/credentials`)**: Public on-chain commitment audit trail.
- **Privacy Architecture (`/privacy`)**: Interactive breakdown of private witnesses vs public state.

---

## 👛 Midnight Lace Wallet Integration

The application integrates natively with the official **Midnight Lace Browser Wallet** via the DApp Connector standard (`window.midnight.mnLace`):

1. **Auto-Detection**: Probes for the Lace extension and handles locked/disconnected states gracefully.
2. **Access Authorization**: Requests read permissions for the user's Midnight Preprod address.
3. **Hardware & Session Resiliency**: Incorporates backoff timeouts, session heartbeat caching, and network mismatch alerts.
4. **ZK Proof Signing**: Submits zero-knowledge transactions with real tNIGHT balances and DUST fee management.

---

## 🧪 Automated Testing

MedProof features a 100% passing test suite with **119 automated tests across 12 test files**:

```bash
npm test
```

### Verification Results

```text
 ✓ tests/lace-connection-optimization.test.ts (6 tests)
 ✓ tests/lace-session-robustness.test.ts (7 tests)
 ✓ tests/lace-fast-reconnect.test.ts (5 tests)
 ✓ tests/phase6c-grant-consent.test.ts (8 tests)
 ✓ tests/phase9r-domain-repair.test.ts (6 tests)
 ✓ tests/healthcare.test.ts (9 tests)
 ✓ tests/privacy.test.ts (7 tests)
 ✓ tests/contract.test.ts (9 tests)
 ✓ tests/network.test.ts (5 tests)
 ✓ tests/level4-ux-upgrade.test.ts (24 tests)
 ✓ tests/ui-nextjs-integration.test.ts (19 tests)
 ✓ tests/medproof-contract.test.ts (14 tests)

 Test Files  12 passed (12)
      Tests  119 passed (119)
   Start at  18:38:00
   Duration  2.83s
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: `>=20.0.0` or `22.x`
- **npm**: `>=10.x`
- **Docker**: For local Midnight Proof Server (`midnightntwrk/proof-server:8.1.0`)
- **Midnight Lace Extension**: Configured for Midnight Preprod Network

### Steps
```bash
# 1. Clone & install dependencies
git clone https://github.com/shouvik7majumdar/healthcare-credential.git
cd healthcare-credential
npm install && cd ui && npm install && cd ..

# 2. Start local Proof Server
docker run -d -p 6300:6300 midnightntwrk/proof-server:8.1.0

# 3. Run test suite
npm test

# 4. Build Next.js production bundle
cd ui && npm run build

# 5. Start development server
npm run dev:ui
```
Open `http://localhost:3000` to interact with the MedProof application.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
