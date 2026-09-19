# MedProof — Pre-Deployment Verified Checkpoint

**PROJECT:** MedProof — Confidential Healthcare Credential & Consent Exchange  
**DATE:** September 17, 2026, 16:10 UTC  
**NETWORK:** Midnight Preprod (`https://rpc.preprod.midnight.network`)  
**CHECKPOINT PURPOSE:** End-of-Session Deployment-Ready Baseline  

---

## Verified Runtime Baseline

```yaml
PROJECT: MedProof
DATE: 2026-09-17T16:10:00Z
NETWORK: Midnight Preprod
WALLET: mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn
WALLET SYNC: COMPLETE
isSynced: TRUE
DUST: READY
DUST VALIDITY WINDOW: VALID
DUST REGISTRATION TX: 00588521638172465514611c98db6d6345a989aeb8309b2c38ee60b785a820983a
ACTIVE DUST BALANCE: 5799052489999999999n
PROOF SERVER: READY (port 6300, HTTP 200 OK)
RPC: READY (https://rpc.preprod.midnight.network, block 2588127+)
INDEXER: READY (https://indexer.preprod.midnight.network/api/v4/graphql)
MEDPROOF CONTRACT: contracts/managed/medproof/
DEPLOYMENT SCRIPT: src/deploy.ts
FRESH MEDPROOF PREPROD CONTRACT: NOT DEPLOYED
NEXT DEPLOYMENT COMMAND: ./scripts/run.sh npx tsx src/deploy.ts --network preprod
```

---

## Critical Checkpoint Notice

The next session **MUST** begin by verifying this checkpoint and then performing **ONE** fresh MedProof Preprod deployment.
- **DO NOT** resynchronize the wallet from genesis.
- **DO NOT** create a new wallet.
- **DO NOT** re-register DUST (it is already confirmed on-chain).
- **DO NOT** deploy the legacy Preview or prescription-verifier contracts.
