import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Contract } from '../contracts/managed/medproof/contract/index.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import path from 'node:path';
import https from 'node:https';

const contractAddress = '1ccb306f688ec96e8afd44d4bff5f7f6fcc64fdc951ce3e238bf384c29dac9bb';
const deployTxHash = '7898a35a4306859bdbfa884e227b00b88a6cd34d4f9b0582aefba452ee811118';
const zkConfigPath = path.resolve('./contracts/managed/medproof');
const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
const proofServerUrl = 'http://127.0.0.1:6300';
const indexerUrl = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const indexerWsUrl = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';

const compiledContract = CompiledContract.withCompiledFileAssets(
  CompiledContract.withWitnesses(CompiledContract.make('medproof', Contract), {}),
  zkConfigPath
);

const basePublicDataProvider = indexerPublicDataProvider(indexerUrl, indexerWsUrl);
const proofProvider = httpClientProofProvider(proofServerUrl, zkConfigProvider);

function toByteArray(hex) {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Fetch deploy state from indexer using working transactions query
async function fetchDeployData() {
  return new Promise((resolve, reject) => {
    const query = `
    query {
      transactions(offset: { hash: "${deployTxHash}" }) {
        id
        hash
        raw
        protocolVersion
        block {
          height
          hash
          author
          timestamp
        }
        contractActions {
          address
          ... on ContractDeploy {
            state
          }
        }
      }
    }
    `;
    const req = https.request(indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const tx = json.data.transactions[0];
          const action = tx.contractActions.find(a => a.address === contractAddress);
          resolve({ tx, action });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

const { tx: deployTx, action: deployAction } = await fetchDeployData();
const deserializedState = ContractState.deserialize(toByteArray(deployAction.state));

console.log('Deploy transaction fetched:', deployTx.hash, 'Block:', deployTx.block.height);

class InMemoryPrivateStateProvider {
  constructor() {
    this.states = new Map();
    this.signingKeys = new Map();
    this.contractAddress = null;
  }
  setContractAddress(addr) { this.contractAddress = addr; }
  async get(id) { return this.states.get(id) || null; }
  async set(id, val) { this.states.set(id, val); }
  async remove(id) { this.states.delete(id); }
  async clear() { this.states.clear(); }
  async setSigningKey(addr, key) { this.signingKeys.set(addr, key); }
  async getSigningKey(addr) { return this.signingKeys.get(addr) || null; }
  async removeSigningKey(addr) { this.signingKeys.delete(addr); }
  async clearSigningKeys() { this.signingKeys.clear(); }
}

const adaptedPublicDataProvider = {
  ...basePublicDataProvider,
  queryContractState: async (addr) => deserializedState,
  queryDeployContractState: async (addr) => deserializedState,
  watchForContractState: async (addr) => deserializedState,
  watchForDeployTxData: async (addr) => ({
    tx: null,
    status: 'success',
    txId: deployTx.hash,
    identifiers: [deployTx.hash],
    txHash: deployTx.hash,
    blockHeight: deployTx.block.height,
    blockHash: deployTx.block.hash,
    blockTimestamp: deployTx.block.timestamp,
    blockAuthor: deployTx.block.author,
    segmentStatusMap: new Map(),
    unshielded: [],
    indexerId: deployTx.id,
    protocolVersion: deployTx.protocolVersion,
    fees: { estimatedFees: 0n, paidFees: 0n }
  })
};

const dummyWalletProvider = {
  getCoinPublicKey: () => '0000000000000000000000000000000000000000000000000000000000000000',
  getEncryptionPublicKey: () => '000000000000000000000000000000000000000000000000000000000000000000',
  balanceTx: async () => { throw new Error('Not implemented'); },
};

const providers = {
  privateStateProvider: new InMemoryPrivateStateProvider(),
  publicDataProvider: adaptedPublicDataProvider,
  zkConfigProvider,
  proofProvider,
  walletProvider: dummyWalletProvider,
  midnightProvider: { submitTx: async () => { throw new Error('Not implemented'); } },
};

try {
  console.log('Finding deployed contract at', contractAddress);
  const found = await findDeployedContract(providers, {
    compiledContract,
    contractAddress,
  });
  console.log('✅ SUCCESS! Found deployed contract!');
  console.log('Available callTx circuits:', Object.keys(found.callTx));
} catch (e) {
  console.error('❌ Error finding deployed contract:', e);
}
