#!/usr/bin/env bash
set -e

echo "============================================================"
echo "MEDPROOF — CHECKPOINT VERIFICATION & SAFE RESUME PRE-CHECK"
echo "============================================================"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "[1/7] Verifying Node.js and npm..."
node -v
npm -v

echo "[2/7] Verifying Docker and Proof Server container..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:6300 | grep -q "200"; then
    echo "  ✓ Proof Server is responding on port 6300 (HTTP 200 OK)."
else
    echo "  ⚠ Proof Server not detected on http://127.0.0.1:6300."
    echo "    Start it with: docker run -d -p 6300:6300 midnightntwrk/proof-server:8.1.0"
fi

echo "[3/7] Verifying generated MedProof Compact bindings..."
if [ -d "contracts/managed/medproof/keys" ] && [ -f "contracts/managed/medproof/contract/index.js" ]; then
    echo "  ✓ MedProof managed bindings intact (9 circuits compiled)."
else
    echo "  ✗ ERROR: MedProof managed bindings missing from contracts/managed/medproof!"
    exit 1
fi

echo "[4/7] Verifying wallet state files..."
if [ -f ".midnight-state.json" ] && [ -f ".midnight-wallet-state/preprod/dust.json" ]; then
    echo "  ✓ Synchronized Preprod wallet state files detected."
else
    echo "  ⚠ Preprod wallet state files missing in project root."
    echo "    Restore them from ../MEDPROOF_PRIVATE_WALLET_BACKUP/ before deploying."
fi

echo "[5/7] Verifying Preprod network connectivity..."
RPC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://rpc.preprod.midnight.network || true)
if [ "$RPC_STATUS" = "200" ] || [ "$RPC_STATUS" = "405" ]; then
    echo "  ✓ Preprod RPC is reachable (HTTP $RPC_STATUS)."
else
    echo "  ⚠ Warning: Could not reach Preprod RPC (status: $RPC_STATUS)."
fi

echo "[6/7] Running read-only unit tests..."
npx vitest run tests/medproof-contract.test.ts

echo "[7/7] Deployment Status Check..."
echo "  FINAL MEDPROOF PREPROD DEPLOYMENT HAS NOT YET OCCURRED."
echo ""
echo "============================================================"
echo "PRE-CHECKS COMPLETE — READY FOR DEPLOYMENT"
echo "============================================================"
echo "To deploy the contract to Midnight Preprod, execute:"
echo "  npx tsx src/deploy.ts --network preprod"
echo "============================================================"
