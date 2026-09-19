# MedProof — Deployment Truth Check & State Audit

**Project:** MedProof — Confidential Healthcare Credential & Consent Exchange  
**Network:** Midnight Preprod (https://rpc.preprod.midnight.network)  
**Audit Timestamp:** September 17, 2026, 14:28 UTC  
**Audit Status:** REALITY VERIFIED — NO SPECULATION  

---

## 1. Executive Verdict

============================================================
FRESH MEDPROOF PREPROD DEPLOYMENT HAS NOT OCCURRED.
============================================================
DECISION: D. DEPLOYMENT BLOCKED — SPECIFIC REASON
(DUST registration in src/deploy.ts encountered Substrate error 171 [OutOfDustValidityWindow], entering an indefinite wait loop at line 143 before reaching deployContract)
============================================================

---

## 2. Active Background Tasks & Process Status

- **test_reg_fix.ts Status:** TERMINATED & CANCELLED.
  - Background task task-540 and follow-up task-655 were safely cancelled and terminated via task management.
  - Zero lingering background processes remain (ps aux | grep -E 'node|tsx|deploy|test_reg' confirmed empty).
  - Why it was running: scripts/test_reg_fix.ts was an ad-hoc diagnostic helper script created to test Midnight SDK estimateRegistration and waitForGeneratedDust in isolation after src/deploy.ts encountered Substrate error 171.
  - Is it part of deployment? **NO.** It is a test/diagnostic script, not part of the official deployment pipeline.
  - Is it stuck? When run in task-540, it encountered an indexer client query exception (ServerError: An unknown error occurred at HttpQueryClient.js:40:27) and disconnected from the WebSocket RPC.
  - Active project-related background tasks: **0**.
  - Docker Infrastructure: Healthy. Container midnightntwrk/proof-server:8.1.0 on port 6300 is running and responding (HTTP 200).

---

## 3. Actual Deployment Execution Status

### Did npx tsx src/deploy.ts --network preprod run?
- **EXECUTED:** **YES** (launched in background task task-284).
- **EXIT STATUS:** **CANCELLED / TIMED OUT** (never reached completion or exit code 0).
- **Execution Log Summary:**
  1. Connected to Preprod Node (https://rpc.preprod.midnight.network) and Indexer (https://indexer.preprod.midnight.network/api/v4/graphql).
  2. Wallet restored from .midnight-wallet-state/preprod/ and reached isSynced = true in 3 seconds.
  3. Deployer address confirmed: mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn.
  4. Balance confirmed: 5,000,000,000 tNight (5,000 tNIGHT).
  5. Entered DUST Token Setup: Attempted to register 1 unshielded UTXO for DUST generation.
  6. Substrate node returned:
     RPC-CORE: submitAndWatchExtrinsic(extrinsic: Extrinsic): ExtrinsicStatus:: 1010: Invalid Transaction: Custom error: 171 (OutOfDustValidityWindow).
  7. All 3 registration retry attempts failed with this error.
  8. Execution entered line 143:
     if (dustState.dust.balance(new Date()) === 0n) {
       console.log('  Waiting for DUST...');
       await Rx.firstValueFrom(walletCtx.wallet.state().pipe(
         Rx.throttleTime(5000), Rx.filter((s: any) => s.isSynced), Rx.filter((s: any) => s.dust.balance(new Date()) > 0n),
       ));
     }
  9. Because the UTXO was not registered, DUST generation remained at 0n, causing src/deploy.ts to block indefinitely at Waiting for DUST....
  10. **The function deployContract() was NEVER called.**
  11. **No transaction was submitted to deploy the MedProof contract.**

---

## 4. Distinction Between Contracts & Historical Deployments

| Contract Entity | Network | Contract Address | Status |
| :--- | :--- | :--- | :--- |
| **Historical Preview Contract** | Midnight Preview | 54b40b55db6c344ddb1511d13c93e2bbbb280b4c1738b912cd838f5ac94df8dc | **EXCLUDED (Legacy Preview)** |
| **Historical Devnet Contract** | Local Devnet | 58e1e74340e5a250668f9a9da1597b1bddca694440545796994d9d186db2f36c | **EXCLUDED (Local Devnet)** |
| **Legacy Prescription Verifier** | Devnet / Preview | N/A | **EXCLUDED (Superseded)** |
| **NEW MedProof Preprod Contract** | **Midnight Preprod** | **NOT YET DEPLOYED** | **PENDING EXECUTION** |

- .midnight-state.json deployment records:
  - undeployed: 58e1e74340e5a250668f9a9da1597b1bddca694440545796994d9d186db2f36c
  - preview: 54b40b55db6c344ddb1511d13c93e2bbbb280b4c1738b912cd838f5ac94df8dc
  - preprod: **NONE** (no entry exists).

---

## 5. Network & On-Chain Verification

- **Network:** Midnight Preprod
- **Latest Preprod Block Height:** 2,587,132+ (live block timestamp confirmed).
- **New MedProof Contract Address:** **NOT AVAILABLE** (not yet deployed).
- **Deployment Transaction Hash:** **NOT AVAILABLE** (not yet submitted).
- **Block Height of Deployment:** **NOT AVAILABLE**.
- **Deployer Public Address:** mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn.
- **Independent Preprod Indexer Verification Result:** Confirmed that no Preprod deployment for MedProof has occurred.

---

## 6. Wallet Readiness (Read-Only Audit)

- **Wallet Identity Preserved:** mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn (consistent across all sessions).
- **Wallet Synchronization:** isSynced = true (restores from .midnight-wallet-state/preprod/ in ~3 seconds; no genesis resync required).
- **tNIGHT Balance:** 5,000,000,000 tNight (5,000 tNIGHT confirmed on-chain in 1 available UTXO).
- **DUST State:**
  - UTXO creation time: 2026-09-15T19:30:42.000Z
  - registeredForDustGeneration: false
  - Potential DUST generated capacity: 5,534,343,150,000,000,000n (exceeds registration fee of 300,000,000,000,001n)
  - Active DUST balance: 0n (because registration extrinsic has not been accepted on-chain due to Substrate validity window constraint).

---

## 7. Exact Root Cause of Blockage & Solution

### Root Cause:
In src/deploy.ts, lines 122–145:
1. registerNightUtxosForDustGeneration was called without the prerequisite waitForGeneratedDust(unregisteredUtxos, fee) or with a stale validity window, returning Substrate error 1010: Custom error: 171 (OutOfDustValidityWindow).
2. When registration failed, dustState.dust.balance(new Date()) remained 0n.
3. deploy.ts immediately blocked on:
   await Rx.firstValueFrom(walletCtx.wallet.state().pipe(
     Rx.filter((s: any) => s.isSynced && s.dust.balance(new Date()) > 0n)
   ));
   Since the UTXO was not registered, the balance never increased, creating an infinite wait loop before deployContract() could ever be reached.

### Exact Next Step Required to Unblock Deployment:
1. Align the DUST registration sequence in src/deploy.ts with the official Midnight SDK specification:
   - Call wallet.estimateRegistration(unregisteredUtxos) to determine fee.
   - Call wallet.waitForGeneratedDust(unregisteredUtxos, fee) so the internal ledger validity window and generated DUST fee align.
   - Call registerNightUtxosForDustGeneration and submit transaction.
   - Do NOT enter an infinite blocking wait if registration needs a moment—allow the downstream 20-attempt retry loop in deployContract (which natively handles DUST availability) to manage transaction balancing.
2. Execute ONE clean run of:
   ./scripts/run.sh npx tsx src/deploy.ts --network preprod
3. Capture the authentic Preprod contract address and transaction ID from the completed deployment.
4. Independently verify the contract on the Preprod Indexer.
5. Update ui/src/lib/config.ts and ui/.env.local to point to the new Preprod contract address.
6. Verify production build (npm run build).

---

## 8. Final Decision

**D. DEPLOYMENT BLOCKED — SPECIFIC REASON**  
*Substrate error 171 (OutOfDustValidityWindow) during UTXO DUST registration caused src/deploy.ts to halt in an infinite wait loop prior to contract deployment. No transaction was submitted, no contract was deployed to Midnight Preprod, and all background tasks have now been safely terminated with wallet state and infrastructure fully preserved.*
