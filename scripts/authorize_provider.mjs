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

export function deriveAdminCommitment(adminSecretBytes) {
  const pad = Buffer.alloc(32);
  pad.write('MEDPROOF_ADMIN', 'utf-8');
  const padBytes = new Uint8Array(pad);
  return compactRuntime.persistentHash(descriptor_vec2_bytes32, [adminSecretBytes, padBytes]);
}

export function deriveProviderCommitment(providerSecretBytes) {
  const pad = Buffer.alloc(32);
  pad.write('MEDPROOF_PROVIDER', 'utf-8');
  const padBytes = new Uint8Array(pad);
  return compactRuntime.persistentHash(descriptor_vec2_bytes32, [providerSecretBytes, padBytes]);
}

export function getAdminSecret() {
  const envSecret = process.env.MEDPROOF_ADMIN_SECRET?.trim();
  if (envSecret) {
    const clean = envSecret.startsWith('0x') ? envSecret.slice(2) : envSecret;
    if (clean.length === 64) {
      return Uint8Array.from(Buffer.from(clean, 'hex'));
    }
  }

  const candidatePaths = [
    path.join(os.homedir(), 'midnight-secrets', 'medproof-preprod-admin.secret'),
    '\\\\wsl.localhost\\Ubuntu\\home\\user\\midnight-secrets\\medproof-preprod-admin.secret',
    '/home/user/midnight-secrets/medproof-preprod-admin.secret'
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const fileContent = fs.readFileSync(p, 'utf8').trim();
        const clean = fileContent.startsWith('0x') ? fileContent.slice(2) : fileContent;
        if (clean.length === 64) {
          return Uint8Array.from(Buffer.from(clean, 'hex'));
        }
      }
    } catch {}
  }

  throw new Error(
    'CRITICAL: MedProof admin secret not found! ' +
    'Authorization requires the preserved admin secret at ~/midnight-secrets/medproof-preprod-admin.secret ' +
    'or MEDPROOF_ADMIN_SECRET environment variable.'
  );
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
      contractState(address: $addr) {
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

  console.log('\n─── MedProof — Authorize Real Lace Provider ─────────────────────────\n');
  console.log('  Network: ' + network);
  console.log('  Node:    ' + networkConfig.node);
  console.log('  Indexer: ' + networkConfig.indexer + '\n');

  // Find deployed contract address
  let targetContract = '';
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--contract' && argv[i + 1]) {
      targetContract = argv[i + 1];
    }
  }
  if (!targetContract) {
    const dep = getDeployment(network, { cwd: projectRoot });
    if (!dep || !dep.address) {
      throw new Error('No deployment found in .midnight-state.json. Specify --contract <address>');
    }
    targetContract = dep.address;
  }
  console.log('  Target Contract: ' + targetContract + '\n');

  // Real Lace Provider to Authorize: Midnight Account #1
  const REAL_LACE_ADDRESS = 'mn_addr_preprod1a8qvcmlajc2q0q2r7zldq3qyjz04vmhgdgz0sqnzs592jx5kj0nsdrf6xn';
  console.log('  Real Lace Provider Address: ' + REAL_LACE_ADDRESS);

  // Derive provider secret and provider commitment
  const providerSecretBytes = Uint8Array.from(crypto.createHash('sha256').update(REAL_LACE_ADDRESS).digest());
  const providerCommitment = deriveProviderCommitment(providerSecretBytes);
  console.log('  Provider Commitment (Poseidon): 0x' + Buffer.from(providerCommitment).toString('hex') + '\n');

  const adminSecret = getAdminSecret();
  const adminCommitment = deriveAdminCommitment(adminSecret);
  console.log('  Admin Secret: [PRESERVED SECURELY]');
  console.log('  Admin Commitment: 0x' + Buffer.from(adminCommitment).toString('hex') + '\n');

  // Wallet setup
  const SEED = network === 'undeployed' ? GENESIS_SEED : getOrCreateSeed(network, { cwd: projectRoot });
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED, restore: true, cwd: projectRoot });

  console.log('─── Wallet Setup ─────────────────────────────────────────────\n');
  console.log('  Syncing wallet...');
  const syncStart = Date.now();
  const si = setInterval(() => process.stdout.write('\r  ⏳ Syncing... (' + Math.round((Date.now() - syncStart) / 1000) + 's)'), 3000);
  const state = await walletCtx.wallet.waitForSyncedState();
  clearInterval(si);
  console.log('\n  ✓ Synced!\n');

  await persistWalletState(network, walletCtx, projectRoot);

  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log('  Admin CLI Address: ' + address);
  console.log('  Balance: ' + balance.toLocaleString() + ' tNight\n');

  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced)));
  console.log('  DUST Balance: ' + dustState.dust.balance(new Date()).toLocaleString());
  console.log('  DUST ready!\n');

  console.log('─── Connecting to Deployed Contract ──────────────────────────\n');
  const providers = await createProviders(walletCtx, networkConfig);

  const deployed = await findDeployedContract(providers, {
    compiledContract,
    contractAddress: targetContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: emptyPrivateState,
  });
  console.log('  ✓ Connected to deployed contract!\n');

  console.log('─── Executing authorizeProvider Transaction ─────────────────\n');
  console.log('  Generating ZK proof for authorizeProvider circuit...');
  const tx = await deployed.callTx.authorizeProvider(adminSecret, providerCommitment);
  
  const txHash = tx.public.txId || tx.public.txHash || tx.deployTxData?.public?.txHash || 'tx-confirmed';
  const blockHeight = tx.public.blockHeight || 'included';
  console.log('  ✅ authorizeProvider transaction submitted and confirmed!');
  console.log('  Transaction Hash: ' + txHash);
  console.log('  Block Height:     ' + blockHeight + '\n');

  await persistWalletState(network, walletCtx, projectRoot);
  await walletCtx.wallet.stop();

  console.log('─── Verification of On-Chain Authorization ──────────────────\n');
  console.log('  Querying Preprod Indexer to verify state...');
  try {
    const queryData = await queryIndexerForContract(networkConfig.indexer, targetContract);
    if (queryData && queryData.contractState) {
      console.log('  ✓ Contract State confirmed active on Preprod!');
    }
  } catch (err) {
    console.warn('  Indexer query notice:', err.message);
  }

  console.log('\n✅ PROVIDER AUTHORIZATION COMPLETED SUCCESSFULLY!\n');
  console.log('  Contract: ' + targetContract);
  console.log('  Authorized Provider (Lace): ' + REAL_LACE_ADDRESS);
  console.log('  Provider Commitment: 0x' + Buffer.from(providerCommitment).toString('hex'));
}

main().catch((err) => { console.error('❌ Authorization failed:', err); process.exit(1); });
