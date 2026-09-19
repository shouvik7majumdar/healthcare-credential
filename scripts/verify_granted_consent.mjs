import https from 'node:https';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { ledger as getLedger } from '../contracts/managed/medproof/contract/index.js';

const targetContract = '94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626';
const indexerUrl = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const expectedConsentIdHex = 'f889b09c3fd59232f8d26a4174bd0e6475dbed1c753d332c452fab62d9723602';
const expectedConsentIdBytes = new Uint8Array(Buffer.from(expectedConsentIdHex, 'hex'));

function toByteArray(hexString) {
  const clean = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return new Uint8Array(Buffer.from(clean, 'hex'));
}

async function queryIndexer() {
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
    req.write(JSON.stringify({ query, variables: { addr: targetContract } }));
    req.end();
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  INDEPENDENT ON-CHAIN CONSENT STATE VERIFICATION — PREPROD INDEXER');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  console.log('  Contract:              ' + targetContract);
  console.log('  Consent ID:            0x' + expectedConsentIdHex + '\n');

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

  const hasActiveConsents = ledger.activeConsents !== undefined;
  console.log('  Ledger activeConsents Map:      ' + (hasActiveConsents ? 'EXISTS' : 'NOT FOUND'));

  let isConsentActive = false;
  if (ledger.activeConsents) {
    if (typeof ledger.activeConsents.lookup === 'function') {
      isConsentActive = ledger.activeConsents.lookup(expectedConsentIdBytes) === true;
    } else if (typeof ledger.activeConsents.member === 'function') {
      isConsentActive = ledger.activeConsents.member(expectedConsentIdBytes);
    }
  }

  console.log('  Consent in activeConsents:      ' + (isConsentActive ? 'YES (ACTIVE ON-CHAIN)' : 'NOT ACTIVE'));

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  if (isConsentActive) {
    console.log('  ✅ ON-CHAIN CONSENT VERIFICATION CONFIRMED!');
  } else {
    console.log('  ❌ ON-CHAIN CONSENT VERIFICATION FAILED');
  }
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
