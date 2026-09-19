# MEDPROOF — HUMAN RESUME GUIDE (FROM 2026-09-18)

Welcome back! This guide allows anyone to resume work on MedProof smoothly, safely, and without redundant or destructive actions.

---

## 1. Quick Environment Verification (30 Seconds)

When you return to the machine, execute the following fast checks:

### Step 1: Ensure Docker Desktop is Running
Check that the Proof Server container is running on port `6300`:
```bash
docker ps --filter "name=proof-server"
```
If not running, start it:
```bash
docker start anonymous-mental-health-survey-proof-server
# or
docker run -d -p 6300:6300 midnightntwrk/proof-server:8.1.0
```
Verify Proof Server is responsive:
```bash
curl -s http://127.0.0.1:6300/health || echo "Check Proof Server"
```

### Step 2: Open Project Directory
```bash
cd /home/user/midnight-projects/confidential-prescription-verification
```

### Step 3: Confirm Wallet State Exists (DO NOT RESYNC)
Confirm persistent state files:
```bash
ls -la .midnight-state.json .midnight-wallet-state/
```
> [!IMPORTANT]
> **DO NOT RESYNC THE WALLET.** The wallet was already fully synchronized to Preprod block 2591520+ and DUST registration is already completed with 5.799 * 10^18 DUST. Re-syncing will needlessly waste hours and may corrupt existing synchronized state.

### Step 4: Verify Network Connectivity
- **Preprod RPC:** `curl -s https://rpc.preprod.midnight.network/health`
- **Preprod Indexer:** `curl -s https://indexer.preprod.midnight.network/api/v4/graphql`
- **Contract Address:** Ensure `ui/src/lib/config.ts` and `ui/.env.local` point to:
  `1ccb306f688ec96e8afd44d4bff5f7f6fcc64fdc951ce3e238bf384c29dac9bb`

---

## 2. Where We Left Off

1. **Deployment Complete:** Contract is live on Midnight Preprod at Block `#2591520` (`isContractActive = true`).
2. **Frontend UI Complete:** Modern Next.js interface with Doctor Portal, Patient Vault, Consent Center, Verifier Workspace, System Status Bar, and Demo Data separation.
3. **Phase 6C Validated in Test Script (`scripts/test_full_circuit.mjs`):**
   - Successfully queried Preprod Indexer for deployment transaction `7898a35a4306859bdbfa884e227b00b88a6cd34d4f9b0582aefba452ee811118`.
   - Successfully resolved `findDeployedContract`.
   - Successfully created unproven transaction for `grantConsent` circuit.
   - Successfully generated real ZK proof with Proof Server (`http://127.0.0.1:6300`).
4. **Current Incomplete Boundary:**
   - The UI's `ui/src/services/medproof-contract.ts` still needs the real `grantConsent` function wired into the UI `Consent Center` page with real Lace signing.

---

## 3. The Exact Next Task: Phase 6C Execution

### Objective:
Implement and verify the REAL:
```
UI form (explicit non-demo inputs)
→ medproof-contract.ts
→ findDeployedContract
→ createUnprovenCallTx(grantConsent)
→ httpClientProofProvider (proveTx at 127.0.0.1:6300)
→ Lace DApp Connector (balance / approve prompt)
→ submitTransaction to Preprod
→ independent indexer query for confirmation
```

### Critical Rules:
1. **DO NOT REDEPLOY THE CONTRACT.**
2. **HUMAN-ONLY LACE APPROVAL:** When the authentic Lace signing popup opens, DO NOT automate clicking Approve. Stop and wait for the human user.
3. **NON-DEMO INPUTS:** Require explicit user inputs (32-byte hex strings or derived keys), never hardcoded demo placeholders for real on-chain submissions.

### How to Launch the Frontend:
```bash
cd /home/user/midnight-projects/confidential-prescription-verification/ui
npm run dev
```
Open Chrome with Lace wallet (Profile 3) and visit:
```
http://localhost:3000/consent
```

---

## 4. Disaster Recovery (If Ever Needed)

If the local repository is ever corrupted or lost:
- **Public Source Snapshot:** `/home/user/midnight-projects/MEDPROOF_FINAL_SESSION_CHECKPOINT_2026-09-18/`
  - Integrity verified with `CHECKPOINT_SHA256SUMS.txt`.
- **Private Wallet Backup:** `/home/user/midnight-projects/MEDPROOF_PRIVATE_WALLET_BACKUP/`
  - Contains synchronized `.midnight-state.json`, `.midnight-wallet-state/`, and `midnight-level-db/`.
- **Restore Script:**
  ```bash
  cp -r /home/user/midnight-projects/MEDPROOF_PRIVATE_WALLET_BACKUP/.midnight* /home/user/midnight-projects/confidential-prescription-verification/
  ```

---
*Checkpoint created: 2026-09-18. All systems verified and frozen in safe state.*
