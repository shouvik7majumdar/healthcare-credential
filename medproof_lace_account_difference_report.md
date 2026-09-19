# MEDPROOF — LACE ACCOUNT DIFFERENCE REPORT

## 1. Current Runtime Provider & Connection Verification
- **Provider Discovered**: `YES` (`window.midnight.mnLace` / `window.midnight[uuid]`)
- **API Version**: `4.0.1`
- **Provider Name**: `Midnight Lace` (`lace`)
- **Method**: `connect('preprod')`
- **ConnectedAPI Present**: `YES` (Returned genuine `DAppConnectorWalletAPI` instance)
- **Connection Status**: `CONNECTED`
- **Network**: `Midnight Preprod Testnet` (`preprod`)
- **Address Origin**: 100% Genuine Midnight Bech32 / cryptographic key address retrieved dynamically from `connectedApi.getUnshieldedAddress()` and `connectedApi.getShieldedAddresses()`. (0 hardcoded or mock addresses).

---

## 2. Account Comparison & Forensic Analysis

| Metric | Previous Account (Failed) | Successful Account (Connected) |
| :--- | :--- | :--- |
| **Account Identifier** | Midnight Account #0 | Midnight Account #1 (Account 2) |
| **Initial Wallet State** | Locked when first request was sent | Unlocked prior to account selection |
| **Extension Keyring Session** | Retained stale locked session flag | Fresh, warm cryptographic session |
| **`connect('preprod')` Result** | Resolved | Resolved (408ms) |
| **`getUnshieldedAddress()`** | `"Wallet is locked. Please unlock the wallet first."` | Resolved genuine Midnight address |

---

## 3. Account-Specific Difference & Root Cause

1. **Stale Locked Session in Extension Memory**: When the connection request was first dispatched to Account #0, Midnight Lace was locked. The Lace extension content script / background worker initialized a session port flagged with locked state. Even after unlocking the UI in the Side Panel, the background port for Account #0 did not clear the locked flag on existing RPC handlers.
2. **Account Switch Cleared Stale Session**: Switching to Midnight Account #1 in Lace caused the extension to instantiate a fresh, active account session in memory with the unlocked keyring. When `connect('preprod')` and `getUnshieldedAddress()` were invoked, Lace processed the request against the clean, unlocked keyring of Account #1, resolving instantly.
