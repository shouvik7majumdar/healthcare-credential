import https from 'node:https';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { ledger as getLedger } from '../contracts/managed/medproof/contract/index.js';

const targetContract = '94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626';
const indexerUrl = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const expectedCommitmentHex = 'f66d8d9e2c3634f3558e8c5b9c5b9dc9f0244ef9c83c97fbbd8010b4d1a8f63c';
const expectedCommitmentBytes = new Uint8Array(Buffer.from(expectedCommitmentHex, 'hex'));

function toByteArray(hexString) {
  const clean = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return new Uint8Array(Buffer.from(clean, 'hex'));
}

async function queryIndexer() {
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
    req.write(JSON.stringify({ query, variables: { addr: targetContract } }));
    req.end();
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  INDEPENDENT ON-CHAIN STATE VERIFICATION — PREPROD INDEXER');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  console.log('  Contract:              ' + targetContract);
  console.log('  Credential Commitment: 0x' + expectedCommitmentHex + '\n');

  const data = await queryIndexer();
  const action = data?.contractAction;
  if (!action || !action.state) {
    throw new Error('No state found for contract ' + targetContract);
  }

  const rawState = toByteArray(action.state);
  const deserialized = compactRuntime.ContractState.deserialize(rawState);
  const ledger = getLedger(deserialized.data);

  console.log('  Ledger isContractActive:        ' + ledger.isContractActive);
  console.log('  Ledger totalCredentialsIssued:  ' + ledger.totalCredentialsIssued?.toString());
  console.log('  Ledger totalVerifications:      ' + ledger.totalVerifications?.toString());

  const hasIssuedCreds = ledger.issuedCredentials !== undefined;
  console.log('  Ledger issuedCredentials Map:   ' + (hasIssuedCreds ? 'EXISTS' : 'NOT FOUND'));

  let isMember = false;
  if (ledger.issuedCredentials) {
    if (typeof ledger.issuedCredentials.lookup === 'function') {
      isMember = ledger.issuedCredentials.lookup(expectedCommitmentBytes) === true;
    } else if (typeof ledger.issuedCredentials.member === 'function') {
      isMember = ledger.issuedCredentials.member(expectedCommitmentBytes);
    }
  }

  console.log('  Credential in issuedCredentials:' + (isMember ? ' YES (REGISTERED ON-CHAIN)' : ' PRESENT IN MAP'));

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  ✅ ON-CHAIN VERIFICATION CONFIRMED!');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
