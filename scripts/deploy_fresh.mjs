import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import * as Rx from 'rxjs';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

import { resolveNetwork, parseNetworkFlag, recordDeployment, GENESIS_SEED, getOrCreateSeed, setActiveNetwork } from '../src/network.ts';
import { createWallet, persistWalletState, unshieldedToken } from '../src/wallet.ts';
import { Contract } from '../contracts/managed/medproof/contract/index.js';

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

export function getAdminSecret() {
  // 1. Check environment variable
  const envSecret = process.env.MEDPROOF_ADMIN_SECRET?.trim();
  if (envSecret) {
    const clean = envSecret.startsWith('0x') ? envSecret.slice(2) : envSecret;
    if (clean.length === 64) {
      return Uint8Array.from(Buffer.from(clean, 'hex'));
    }
  }

  // 2. Check preserved secret file outside git
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
    'Deployment requires a preserved admin secret at ~/midnight-secrets/medproof-preprod-admin.secret ' +
    'or MEDPROOF_ADMIN_SECRET environment variable. Random fallback is disabled for security.'
  );
}

export function getOrDeriveAdminCommitment() {
  const secret = getAdminSecret();
  return deriveAdminCommitment(secret);
}

async function waitForProofServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(url + '/provingKey').catch(() => null);
      if (resp && resp.status !== 502 && resp.status !== 503) return true;
    } catch { /* ignore */ }
    try {
      const resp = await fetch(url).catch(() => null);
      if (resp) return true;
    } catch { /* ignore */ }
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
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

async function main() {
  const argv = process.argv;
  const flag = parseNetworkFlag(argv);
  if (flag) setActiveNetwork(flag, { cwd: projectRoot });
  const { network, config: networkConfig } = resolveNetwork({ argv, cwd: projectRoot });

  console.log('\n─── MedProof Confidential Credential Exchange — Deploy ──────────────\n');
  console.log('  Network: ' + network);
  console.log('  Node:    ' + networkConfig.node);
  console.log('  Indexer: ' + networkConfig.indexer + '\n');

  const SEED = network === 'undeployed' ? GENESIS_SEED : getOrCreateSeed(network, { cwd: projectRoot });
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED, restore: true, cwd: projectRoot });

  console.log('─── Wallet Setup ─────────────────────────────────────────────\n');
  console.log('  Syncing wallet with network...');
  const syncStart = Date.now();
  const si = setInterval(() => process.stdout.write('\r  ⏳ Syncing... (' + Math.round((Date.now() - syncStart) / 1000) + 's)'), 3000);
  const state = await walletCtx.wallet.waitForSyncedState();
  clearInterval(si);
  console.log('\n  ✓ Synced!\n');

  await persistWalletState(network, walletCtx, projectRoot);

  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log('  Address: ' + address);
  console.log('  Balance: ' + balance.toLocaleString() + ' tNight\n');

  // DUST check
  console.log('─── DUST Token Setup ─────────────────────────────────────────\n');
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced)));
  console.log('  DUST Balance: ' + dustState.dust.balance(new Date()).toLocaleString());
  console.log('  DUST ready!\n');

  // Deploy
  console.log('─── Deploy MedProof Contract ─────────────────────────────────\n');
  if (!(await waitForProofServer(networkConfig.proofServer))) {
    console.log('  ❌ Proof server not responding. Run: docker compose up -d\n');
    await walletCtx.wallet.stop(); process.exit(1);
  }
  console.log('  Proof server ready!');

  const providers = await createProviders(walletCtx, networkConfig);
  await new Promise(r => setTimeout(r, 6000));

  const adminCommitment = getOrDeriveAdminCommitment();
  console.log('  Admin Commitment: 0x' + Buffer.from(adminCommitment).toString('hex') + '\n');

  let deployed;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      deployed = await deployContract(providers, {
        compiledContract,
        args: [adminCommitment],
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: emptyPrivateState,
      });
      break;
    } catch (err) {
      const full = (err?.message || '') + ' ' + (err?.cause?.message || '');
      const isDust = full.includes('Not enough Dust') || full.includes('Insufficient Funds');
      if (!(isDust && attempt === 1)) console.error('\n  Attempt ' + attempt + ': ' + err?.message);
      if (!isDust && full.includes('ECONNREFUSED')) { console.log('  ❌ Proof server unreachable.'); await walletCtx.wallet.stop(); process.exit(1); }
      if (isDust && attempt < 20) { if (attempt === 1) console.log('  Generating DUST...'); await new Promise(r => setTimeout(r, 5000)); }
      else if (!isDust) throw err;
    }
  }

  if (!deployed) throw new Error('Deployment failed');

  const contractAddress = deployed.deployTxData.public.contractAddress;
  console.log('  ✅ MedProof Contract deployed!\n');
  console.log('  Contract Address: ' + contractAddress + '\n');
  recordDeployment(network, contractAddress, address.toString(), { cwd: projectRoot });
  console.log('  Saved to .midnight-state.json\n');
  await persistWalletState(network, walletCtx, projectRoot);
  await walletCtx.wallet.stop();
  console.log('─── Deployment complete ──────────────────────────────────────\n');
}

main().catch((err) => { console.error(err); process.exit(1); });
