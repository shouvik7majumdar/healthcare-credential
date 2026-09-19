# MedProof — Human-Readable Resumption Guide

**PROJECT:** MedProof — Confidential Healthcare Credential & Consent Exchange  
**DIRECTORY:** `/home/user/midnight-projects/confidential-prescription-verification`  
**PRESERVED STATE:** Wallet Synced, Funded (5,000 tNIGHT), DUST Registered (`5.799e18`), Proof Server Ready  

---

## Step-by-Step Instructions to Resume

### STEP 1: Open Docker Desktop
Ensure Docker Desktop is running on Windows.

### STEP 2: Open the project
Open a shell in the project root:
```bash
cd /home/user/midnight-projects/confidential-prescription-verification
```

### STEP 3: Verify the preserved wallet state
```bash
ls -la .midnight-wallet-state/preprod/
```
Verify `dust.json` (~11.97 MB), `shielded.json`, and `unshielded.json` exist.  
> [!IMPORTANT]  
> **DO NOT resync from genesis if `isSynced=true`.** The wallet restores from cache in ~3 seconds.

### STEP 4: Verify Proof Server on port 6300
```bash
curl -s http://127.0.0.1:6300
# Expected: {"status":"ok","timestamp":"..."}
```

### STEP 5: Verify Preprod RPC and Indexer
```bash
python3 scripts/check_time.py
# Confirms live Preprod block height and responsiveness
```

### STEP 6: Verify DUST is READY and validity window is valid
DUST is already registered on-chain via transaction:  
`00588521638172465514611c98db6d6345a989aeb8309b2c38ee60b785a820983a`  
Active balance: `5,799,052,489,999,999,999n` DUST.  
No additional registration transactions are needed.

### STEP 7: Verify `contracts/managed/medproof/`
Confirm compiled contract artifacts exist:
```bash
ls -la contracts/managed/medproof/contract/
```

### STEP 8: Run ONE fresh deployment
Execute the single authorized Preprod deployment command:
```bash
./scripts/run.sh npx tsx src/deploy.ts --network preprod
```

### STEP 9: Capture the REAL deployment evidence
From the terminal output, record:
- **Contract Address:** (e.g. 64-hex string)
- **Deployment Transaction ID:**
- **Block Height:**
- **Deployer Address:** (`mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn`)

### STEP 10: Independently verify the new contract on Midnight Preprod
Query the Preprod Indexer GraphQL API to verify the contract action exists on-chain.

### STEP 11: Update the ACTIVE Next.js contract configuration
Update `ui/.env.local` and `ui/src/lib/config.ts` with the **NEW** Preprod contract address.  
*(Do NOT use the old Preview address `54b40b55...`)*.

### STEP 12: Run Next.js build/tests
```bash
cd ui && npm run build
```

### STEP 13: Start localhost
```bash
npm run dev
```

### STEP 14: Connect REAL Lace Wallet
Open `http://localhost:3000` in the browser, ensure Lace is set to Midnight Preprod, and click **Connect Wallet**.

### STEP 15: Perform the first real MedProof transaction
Issue a credential or register a consent policy through the UI.

### STEP 16: Manually approve in Lace
Approve the proving and submission prompt inside the Lace extension window.

### STEP 17: Verify the real transaction and ledger state change
Confirm the transaction hash in Lace history and verify the on-chain state update.

---

> [!NOTE]  
> **Do not repeat wallet synchronization unless the persisted state is actually invalid or missing.**
