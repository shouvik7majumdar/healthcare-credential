import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as Rx from 'rxjs';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

console.log('Testing deploy host imports and configuration...');
console.log('Proof server: http://127.0.0.1:6300');
console.log('Indexer: https://indexer.preprod.midnight.network/api/v4/graphql');

// Test proof server
const psResp = await fetch('http://127.0.0.1:6300/health');
console.log('Proof server status:', await psResp.json());

// Test indexer
const idxResp = await fetch('https://indexer.preprod.midnight.network/api/v4/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'query { block { height } }' })
});
console.log('Indexer block:', await idxResp.json());
console.log('✅ ALL IMPORTS AND NETWORK CALLS PASSED ON HOST!');
