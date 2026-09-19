import https from 'node:https';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { ledger as getLedger } from '../contracts/managed/medproof/contract/index.js';

const contractAddress = '94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626';
const indexerUrl = 'https://indexer.preprod.midnight.network/api/v4/graphql';

function toByteArray(hex) {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

const query = `
query GetContractDeployInfo {
  contractAction(address: "${contractAddress}") {
    ... on ContractDeploy {
      state
      zswapState
      transaction {
        id
        hash
        protocolVersion
        block {
          height
          hash
          author
          timestamp
        }
      }
    }
    ... on ContractCall {
      state
      zswapState
      transaction {
        id
        hash
        block {
          height
          hash
          author
          timestamp
        }
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
      console.log('Contract Actions:', JSON.stringify(json, null, 2));
      const action = json.data?.contractAction;
      if (action && action.state) {
        const rawState = toByteArray(action.state);
        const deserializedState = ContractState.deserialize(rawState);
        const ledger = getLedger(deserializedState.data);
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('  ON-CHAIN PREPROD CONTRACT VERIFICATION');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  Contract Address:       ' + contractAddress);
        console.log('  Deployment Tx Hash:     ' + action.transaction?.hash);
        console.log('  Deployment Block Height:' + action.transaction?.block?.height);
        console.log('  Deployment Timestamp:   ' + new Date(Number(action.transaction?.block?.timestamp)).toISOString());
        console.log('  Block Author:           ' + action.transaction?.block?.author);
        console.log('  Network:                PREPROD');
        console.log('───────────────────────────────────────────────────────────');
        console.log('  isContractActive:       ' + ledger.isContractActive);
        console.log('  currentEpoch:           ' + ledger.currentEpoch?.toString());
        console.log('  adminCommitment:        0x' + Buffer.from(ledger.adminCommitment).toString('hex'));
        console.log('  totalCredentialsIssued: ' + ledger.totalCredentialsIssued?.toString());
        console.log('  totalVerifications:     ' + ledger.totalVerifications?.toString());
        console.log('  authorizedProviders:    ' + (ledger.authorizedProviders ? 'Initialized' : 'Empty'));
        console.log('═══════════════════════════════════════════════════════════\n');
      }
    } catch (e) {
      console.error('Error parsing indexer response:', e);
    }
  });
});
req.on('error', console.error);
req.write(JSON.stringify({ query }));
req.end();
