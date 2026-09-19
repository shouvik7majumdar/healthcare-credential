import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import { pathToFileURL } from 'node:url';

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { findDeployedContract, createUnprovenCallTx, createCallTxOptions } from '@midnight-ntwrk/midnight-js-contracts';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { LedgerParameters, ZswapChainState } from '@midnight-ntwrk/midnight-js-protocol/ledger';

setNetworkId('preprod');

function resolveZkConfigPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'contracts/managed/medproof'),
    path.resolve(process.cwd(), '../contracts/managed/medproof'),
    '/home/user/midnight-projects/confidential-prescription-verification/contracts/managed/medproof'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Could not resolve contracts/managed/medproof directory');
}

const contractAddress = '94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626';
const deployTxHash = '6187f85d86e03ba2b403d458878695bc10d825166131b68bcb861f074390609e';
const proofServerUrl = process.env.NEXT_PUBLIC_PROOF_SERVER_URL || 'http://127.0.0.1:6300';
const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql';

function toByteArray(hex: string): Uint8Array {
  let clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

let cachedDeployData: any = null;

async function fetchDeployData(): Promise<any> {
  if (cachedDeployData) return cachedDeployData;
  return new Promise((resolve, reject) => {
    const query = 'query { transactions(offset: { hash: "' + deployTxHash + '" }) { id hash raw protocolVersion block { height hash author timestamp ledgerParameters } contractActions { address ... on ContractDeploy { state zswapState } } } }';
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
          const action = tx.contractActions.find((a: any) => a.address === contractAddress);
          cachedDeployData = { tx, action };
          resolve(cachedDeployData);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

class InMemoryPrivateStateProvider {
  private states = new Map<string, any>();
  private signingKeys = new Map<string, any>();
  setContractAddress() {}
  async get(id: string) { return this.states.get(id) || null; }
  async set(id: string, val: any) { this.states.set(id, val); }
  async remove(id: string) { this.states.delete(id); }
  async clear() { this.states.clear(); }
  async setSigningKey(addr: string, key: any) { this.signingKeys.set(addr, key); }
  async getSigningKey(addr: string) { return this.signingKeys.get(addr) || null; }
  async removeSigningKey(addr: string) { this.signingKeys.delete(addr); }
  async clearSigningKeys() { this.signingKeys.clear(); }
  async exportPrivateStates(): Promise<any> { return []; }
  async importPrivateStates(): Promise<void> {}
  async exportSigningKeys(): Promise<any> { return []; }
  async importSigningKeys(): Promise<void> {}
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientSecret, verifierPk, credentialCommitment } = body;

    if (!patientSecret || !verifierPk || !credentialCommitment) {
      return NextResponse.json({
        error: 'Missing required inputs: patientSecret, verifierPk, and credentialCommitment are required'
      }, { status: 400 });
    }

    const cleanSecret = String(patientSecret).replace(/^0x/, '');
    const cleanPk = String(verifierPk).replace(/^0x/, '');
    const cleanCommitment = String(credentialCommitment).replace(/^0x/, '');

    if (cleanSecret.length !== 64 || cleanPk.length !== 64 || cleanCommitment.length !== 64) {
      return NextResponse.json({
        error: 'Inputs must be exactly 32-byte hex strings (64 hexadecimal characters)'
      }, { status: 400 });
    }

    const healthCheck = await fetch(proofServerUrl + '/health').catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      return NextResponse.json({
        error: 'Proof server at ' + proofServerUrl + ' is unreachable. Real proof generation requires an active proof server.'
      }, { status: 503 });
    }

    const zkConfigPath = resolveZkConfigPath();
    const contractUrl = pathToFileURL(path.join(zkConfigPath, 'contract/index.js')).href;
    const dynamicImport = new Function("s", "return import(s)");
    const { Contract } = (await dynamicImport(contractUrl)) as any;

    const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
    const proofProvider = httpClientProofProvider(proofServerUrl, zkConfigProvider);

    const compiledContract = (CompiledContract as any).withCompiledFileAssets(
      (CompiledContract as any).withWitnesses((CompiledContract as any).make('medproof', Contract), {}),
      zkConfigPath
    );

    const { tx: deployTx, action: deployAction } = await fetchDeployData();
    const deserializedContractState = ContractState.deserialize(toByteArray(deployAction.state));
    const deserializedZswapState = deployAction.zswapState ? ZswapChainState.deserialize(toByteArray(deployAction.zswapState)) : ((ZswapChainState as any).initialState ? (ZswapChainState as any).initialState() : undefined);
    const deserializedLedgerParams = deployTx.block.ledgerParameters ? LedgerParameters.deserialize(toByteArray(deployTx.block.ledgerParameters)) : LedgerParameters.initialParameters();

    const adaptedPublicDataProvider: any = {
      queryContractState: async () => deserializedContractState,
      queryDeployContractState: async () => deserializedContractState,
      watchForContractState: async () => deserializedContractState,
      queryZSwapAndContractState: async () => [deserializedZswapState, deserializedContractState, deserializedLedgerParams],
      watchForDeployTxData: async () => ({
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
      balanceTx: async (provenTx: any) => ({ balanced: true, provenTx }),
    };

    const providers = {
      privateStateProvider: new InMemoryPrivateStateProvider(),
      publicDataProvider: adaptedPublicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider: dummyWalletProvider,
      midnightProvider: { submitTx: async () => 'mock-tx-id' },
    };

    await findDeployedContract(providers as any, {
      compiledContract,
      contractAddress,
    });

    const patientSecretBytes = toByteArray(cleanSecret);
    const verifierPkBytes = toByteArray(cleanPk);
    const credentialCommitmentBytes = toByteArray(cleanCommitment);

    const callOptions = createCallTxOptions(
      compiledContract,
      'grantConsent',
      contractAddress,
      undefined,
      undefined,
      [patientSecretBytes, verifierPkBytes, credentialCommitmentBytes]
    );

    const unprovenCallTxData = await createUnprovenCallTx(providers as any, callOptions as any);
    const circuitResultBytes = unprovenCallTxData.private.result as Uint8Array;
    const consentId = toHex(circuitResultBytes);

    const provenTx = await proofProvider.proveTx(unprovenCallTxData.private.unprovenTx);
    const serializedBytes = provenTx.serialize();
    const unsealedTxHex = Buffer.from(serializedBytes).toString('hex');
    const txIdentifiers = (provenTx as any).identifiers ? (provenTx as any).identifiers() : [];

    return NextResponse.json({
      success: true,
      unsealedTxHex,
      consentId,
      txIdentifiers,
      contractAddress,
      network: 'preprod'
    });
  } catch (err: any) {
    console.error('Error preparing grantConsent transaction:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || String(err)
    }, { status: 500 });
  }
}
