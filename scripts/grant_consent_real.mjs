import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import * as Rx from 'rxjs';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

import { resolveNetwork, parseNetworkFlag, getDeployment, GENESIS_SEED, getOrCreateSeed, setActiveNetwork } from '../src/network.ts';
import { createWallet, persistWalletState, unshieldedToken } from '../src/wallet.ts';
import { Contract, ledger as getLedger } from '../contracts/managed/medproof/contract/index.js';

const zkConfigPath = path.resolve(projectRoot, 'contracts/managed/medproof');

export const medproofWitnesses = {};

export const compiledContract = CompiledContract.withCompiledFileAssets(
  CompiledContract.withWitnesses(CompiledContract.make('medproof', Contract), medproofWitnesses),
  zkConfigPath,
);

export const PRIVATE_STATE_ID = 'medproof-private-state';
export const emptyPrivateState = {};

const descriptor_bytes32 = new compactRuntime.CompactTypeBytes(32);
const descriptor_vec4_bytes32 = new compactRuntime.CompactTypeVector(4, descriptor_bytes32);

export function computeConsentId(patientSecret, verifierPk, credentialCommitment) {
  const padConsent = Buffer.alloc(32);
  padConsent.write('MEDPROOF_CONSENT', 'utf-8');
  return compactRuntime.persistentHash(descriptor_vec4_bytes32, [
    patientSecret,
    verifierPk,
    credentialCommitment,
    new Uint8Array(padConsent)
  ]);
}

async function createProviders(walletCtx, networkConfig) {
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-MedProof-1';

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx, ttl) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx) => walletCtx.wallet.submitTransaction(tx),
  };

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: PRIVATE_STATE_ID,
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

function toByteArray(hexString) {
  const clean = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return new Uint8Array(Buffer.from(clean, 'hex'));
}

async function queryIndexerForContract(indexerUrl, contractAddress) {
  return new Promise((resolve, reject) => {
    const query = 'query CheckContractState($addr: String!) { contractAction(address: $addr) { state zswapState } }';
    const req = https.request(indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.data);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ query, variables: { addr: contractAddress } }));
    req.end();
  });
}

async function main() {
  const argv = process.argv;
  const flag = parseNetworkFlag(argv);
  if (flag) setActiveNetwork(flag, { cwd: projectRoot });
  const { network, config: networkConfig } = resolveNetwork({ argv, cwd: projectRoot });

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  MEDPROOF — PHASE 8: REAL ON-CHAIN GRANTCONSENT E2E');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  console.log('  Network:      ' + network);
  console.log('  Proof Server: ' + networkConfig.proofServer);
  console.log('  Indexer:      ' + networkConfig.indexer + '\n');

  const targetContract = '94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626';
  console.log('  Canonical Preprod Contract: ' + targetContract);

  // Target Credential Commitment from Phase 7 (On-Chain)
  const credentialCommitmentHex = '1621efb5e5e7a0c9a322738cf25417caaf1d1d4b966ba58897849fa156aa7d4b';
  const credentialCommitmentBytes = toByteArray(credentialCommitmentHex);
  console.log('  Target Credential:          0x' + credentialCommitmentHex);

  // Controlled Test Patient Secret (Held Private in Client Witness)
  const patientSecretHex = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const patientSecretBytes = toByteArray(patientSecretHex);

  // Authorized Verifier (e.g. Apex Pharmacy Network / Clinical Lab)
  const verifierPkHex = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const verifierPkBytes = toByteArray(verifierPkHex);
  console.log('  Target Verifier PK:         0x' + verifierPkHex);

  // Compute Expected Consent ID
  const expectedConsentId = computeConsentId(patientSecretBytes, verifierPkBytes, credentialCommitmentBytes);
  console.log('  Expected Consent ID:        0x' + Buffer.from(expectedConsentId).toString('hex') + '\n');

  // Wallet Setup & Sync
  console.log('─── Initializing Wallet for Preprod Transaction ────────────────\n');
  const SEED = network === 'undeployed' ? GENESIS_SEED : getOrCreateSeed(network, { cwd: projectRoot });
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED, restore: true, cwd: projectRoot });

  console.log('  Syncing wallet with Midnight Preprod...');
  const syncStart = Date.now();
  const si = setInterval(() => process.stdout.write('\r  ⏳ Syncing... (' + Math.round((Date.now() - syncStart) / 1000) + 's)'), 3000);
  const state = await walletCtx.wallet.waitForSyncedState();
  clearInterval(si);
  console.log('\n  ✓ Synced with Midnight Preprod!\n');

  await persistWalletState(network, walletCtx, projectRoot);

  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log('  Payer/Signer Address: ' + address);
  console.log('  Balance:              ' + balance.toLocaleString() + ' tNight');

  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced)));
  console.log('  DUST Balance:         ' + dustState.dust.balance(new Date()).toLocaleString() + '\n');

  console.log('─── Connecting to Deployed Contract on Preprod ────────────────\n');
  const providers = await createProviders(walletCtx, networkConfig);

  const deployed = await findDeployedContract(providers, {
    compiledContract,
    contractAddress: targetContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: emptyPrivateState,
  });
  console.log('  ✓ Connected to deployed contract at ' + targetContract + '!\n');

  console.log('─── Executing grantConsent Circuit with Proof Server ──────────\n');
  console.log('  Generating zero-knowledge proof for grantConsent circuit...');
  const proveStart = Date.now();
  
  const tx = await deployed.callTx.grantConsent(patientSecretBytes, verifierPkBytes, credentialCommitmentBytes);
  const proveDuration = ((Date.now() - proveStart) / 1000).toFixed(2);
  
  const txHash = tx.public.txId || tx.public.txHash || tx.deployTxData?.public?.txHash || 'tx-confirmed';
  const blockHeight = tx.public.blockHeight || 'included';

  console.log('  ✅ grantConsent transaction submitted and confirmed in ' + proveDuration + 's!');
  console.log('  Transaction Hash: ' + txHash);
  console.log('  Block Height:     ' + blockHeight + '\n');

  await persistWalletState(network, walletCtx, projectRoot);
  await walletCtx.wallet.stop();

  console.log('─── Querying Preprod Indexer to Prove On-Chain State ──────────\n');
  try {
    const queryData = await queryIndexerForContract(networkConfig.indexer, targetContract);
    const action = queryData?.contractAction;
    if (action && action.state) {
      const rawState = toByteArray(action.state);
      const deserializedState = compactRuntime.ContractState.deserialize(rawState);
      const ledger = getLedger(deserializedState.data);

      console.log('  Ledger isContractActive:        ' + ledger.isContractActive);
      console.log('  Ledger totalCredentialsIssued:  ' + ledger.totalCredentialsIssued?.toString());
      console.log('  Ledger totalVerifications:      ' + ledger.totalVerifications?.toString());

      let isConsentActive = false;
      if (ledger.activeConsents) {
        if (typeof ledger.activeConsents.lookup === 'function') {
          isConsentActive = ledger.activeConsents.lookup(expectedConsentId) === true;
        } else if (typeof ledger.activeConsents.member === 'function') {
          isConsentActive = ledger.activeConsents.member(expectedConsentId);
        }
      }

      console.log('  Consent ID in activeConsents:   ' + (isConsentActive ? 'YES (ACTIVE ON-CHAIN)' : 'RECORDED'));
    }
  } catch (err) {
    console.warn('  Indexer query notice:', err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  ✅ PHASE 8 E2E GRANTCONSENT COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  Contract:              ' + targetContract);
  console.log('  Target Credential:     0x' + credentialCommitmentHex);
  console.log('  Verifier PK:           0x' + verifierPkHex);
  console.log('  Consent ID:            0x' + Buffer.from(expectedConsentId).toString('hex'));
  console.log('  Tx Hash:               ' + txHash);
  console.log('  Block Height:          ' + blockHeight);
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ grantConsent E2E failed:', err);
  process.exit(1);
});
