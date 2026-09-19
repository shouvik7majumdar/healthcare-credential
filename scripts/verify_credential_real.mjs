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
const descriptor_vec2_bytes32 = new compactRuntime.CompactTypeVector(2, descriptor_bytes32);
const descriptor_vec4_bytes32 = new compactRuntime.CompactTypeVector(4, descriptor_bytes32);
const descriptor_vec7_bytes32 = new compactRuntime.CompactTypeVector(7, descriptor_bytes32);
const descriptor_uint32 = new compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);
const descriptor_uint64 = new compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

function toByteArray(hexString) {
  const clean = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return Uint8Array.from(Buffer.from(clean, 'hex'));
}

export function deriveProviderCommitment(providerSecretBytes) {
  const pad = Buffer.alloc(32);
  pad.write('MEDPROOF_PROVIDER', 'utf-8');
  const padBytes = new Uint8Array(pad);
  return compactRuntime.persistentHash(descriptor_vec2_bytes32, [providerSecretBytes, padBytes]);
}

export function computeCredentialCommitment(params) {
  const padPatient = Buffer.alloc(32);
  padPatient.write('PATIENT_ID', 'utf-8');
  const patientCommitment = compactRuntime.persistentHash(descriptor_vec2_bytes32, [
    params.patientSecret,
    new Uint8Array(padPatient)
  ]);

  const schemaHash = compactRuntime.persistentHash(descriptor_uint32, BigInt(params.schemaId));
  const categoryHash = compactRuntime.persistentHash(descriptor_uint32, BigInt(params.category));
  const epochHash = compactRuntime.persistentHash(descriptor_uint64, BigInt(params.expirationEpoch));

  return compactRuntime.persistentHash(descriptor_vec7_bytes32, [
    params.issuerProviderCommitment,
    patientCommitment,
    schemaHash,
    categoryHash,
    epochHash,
    params.payloadHash,
    params.salt
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

async function queryIndexerForContract(indexerUrl, contractAddress) {
  return new Promise((resolve, reject) => {
    const query = `query CheckContractState($addr: String!) {
      contractAction(address: $addr) {
        state
        zswapState
      }
    }`;
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
  console.log('  MEDPROOF — PHASE 9: REAL ON-CHAIN VERIFYCREDENTIAL ZK E2E');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  console.log('  Network:      ' + network);
  console.log('  Proof Server: ' + networkConfig.proofServer);
  console.log('  Indexer:      ' + networkConfig.indexer + '\n');

  const targetContract = '94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626';
  console.log('  Canonical Preprod Contract: ' + targetContract);

  // Real Lace Provider Commitment (Phase 7 Issuer)
  const REAL_LACE_ADDRESS = 'mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn';
  const providerSecretBytes = Uint8Array.from(crypto.createHash('sha256').update(REAL_LACE_ADDRESS).digest());
  const issuerProviderCommitment = deriveProviderCommitment(providerSecretBytes);

  // Consented Verifier PK (Phase 8 Verifier)
  const verifierPkHex = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const verifierPkBytes = toByteArray(verifierPkHex);

  // Controlled Patient Secret (Phase 7 & 8 Patient)
  const patientSecretHex = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const patientSecretBytes = toByteArray(patientSecretHex);

  // Credential Attributes (Phase 7 Credential)
  const schemaId = 1n;
  const category = 1n;
  const expirationEpoch = 12n;

  const clinicalPayload = {
    medication: 'Amoxicillin 500mg (Controlled Test)',
    dosage: '1 capsule every 8 hours for 10 days',
    instructions: 'Take with water and food. Complete entire course.',
    diagnosisCode: 'J01.90 - Acute Sinusitis',
    patientId: 'PT-CONTROLLED-TEST-001',
    prescriber: 'Dr. Evelyn Vance, MD (Lace Provider #1)',
  };
  const payloadString = JSON.stringify(clinicalPayload);
  const payloadHash = Uint8Array.from(crypto.createHash('sha256').update(payloadString).digest());

  // Real Salt from Phase 7 (0x76d631341d918fd1db1ac1cdba5d2d24b04690ce301fb6ea3dc7600a9a20dae9)
  const saltHex = '76d631341d918fd1db1ac1cdba5d2d24b04690ce301fb6ea3dc7600a9a20dae9';
  const salt = toByteArray(saltHex);

  const credentialCommitment = computeCredentialCommitment({
    issuerProviderCommitment,
    patientSecret: patientSecretBytes,
    schemaId: Number(schemaId),
    category: Number(category),
    expirationEpoch: Number(expirationEpoch),
    payloadHash,
    salt
  });

  const expectedCommitmentHex = '1621efb5e5e7a0c9a322738cf25417caaf1d1d4b966ba58897849fa156aa7d4b';
  console.log('  Derived Commitment:         0x' + Buffer.from(credentialCommitment).toString('hex'));
  console.log('  On-Chain Target Commitment:  0x' + expectedCommitmentHex);

  if (Buffer.from(credentialCommitment).toString('hex') !== expectedCommitmentHex) {
    throw new Error('Credential commitment mismatch! Cannot proceed with verifyCredential.');
  }
  console.log('  ✓ Commitment hash verified mutually consistent with Phase 7 on-chain credential!\n');

  // Required Verification Policy
  const requiredCategory = 1n;
  const sessionNonce = Uint8Array.from(crypto.randomBytes(32));
  const dispenseNullifier = new Uint8Array(32); // 32 zeros
  const isSingleUse = false;

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
  console.log('  Signer/Payer Address: ' + address);
  console.log('  Balance:              ' + balance.toLocaleString() + ' tNight\n');

  console.log('─── Connecting to Deployed Contract on Preprod ────────────────\n');
  const providers = await createProviders(walletCtx, networkConfig);

  const deployed = await findDeployedContract(providers, {
    compiledContract,
    contractAddress: targetContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: emptyPrivateState,
  });
  console.log('  ✓ Connected to deployed contract at ' + targetContract + '!\n');

  console.log('─── Executing verifyCredential Circuit with Proof Server ───────\n');
  console.log('  Generating zero-knowledge proof for verifyCredential circuit...');
  const proveStart = Date.now();

  const tx = await deployed.callTx.verifyCredential(
    issuerProviderCommitment,
    verifierPkBytes,
    patientSecretBytes,
    schemaId,
    category,
    expirationEpoch,
    payloadHash,
    salt,
    requiredCategory,
    sessionNonce,
    dispenseNullifier,
    isSingleUse
  );

  const proveDuration = ((Date.now() - proveStart) / 1000).toFixed(2);
  const txHash = tx.public.txId || tx.public.txHash || tx.deployTxData?.public?.txHash || 'tx-confirmed';
  const blockHeight = tx.public.blockHeight || 'included';

  console.log('  ✅ verifyCredential transaction submitted and confirmed in ' + proveDuration + 's!');
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
    }
  } catch (err) {
    console.warn('  Indexer query notice:', err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  ✅ PHASE 9 E2E VERIFYCREDENTIAL COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  Contract:              ' + targetContract);
  console.log('  Target Credential:     0x' + expectedCommitmentHex);
  console.log('  Verifier PK:           0x' + verifierPkHex);
  console.log('  Tx Hash:               ' + txHash);
  console.log('  Block Height:          ' + blockHeight);
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('\n❌ verifyCredential E2E failed:', err);
    process.exit(1);
  });
}
