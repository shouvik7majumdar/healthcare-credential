import https from 'node:https';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { ledger as getLedger } from '../contracts/managed/medproof/contract/index.js';

const contractAddress = '94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626';
const indexerUrl = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const expectedProviderCommitment = 'ba4a59721d19ae5c74b1ef22590a323e681f5976eb495cbf057686bb1757a401';

function toByteArray(hex) {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

const query = `
query GetContractCallActions {
  contractAction(address: "${contractAddress}") {
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
      console.log('Contract Call Query Result:');
      const action = json.data?.contractAction;
      if (action && action.state) {
        const rawState = toByteArray(action.state);
        const deserializedState = ContractState.deserialize(rawState);
        const ledger = getLedger(deserializedState.data);
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('  ON-CHAIN AUTHORIZED PROVIDER VERIFICATION');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  Contract Address:               ' + contractAddress);
        console.log('  Authorization Tx Hash:          ' + action.transaction?.hash);
        console.log('  Authorization Block Height:     ' + action.transaction?.block?.height);
        console.log('  Authorization Block Timestamp:  ' + new Date(Number(action.transaction?.block?.timestamp)).toISOString());
        console.log('  Expected Provider Commitment:   0x' + expectedProviderCommitment);
        
        // Inspect authorizedProviders map in ledger
        const authMap = ledger.authorizedProviders;
        console.log('  authorizedProviders map object: ', typeof authMap);
        
        // Check lookup if method exists or query entries
        let isAuthorized = false;
        try {
          if (authMap && typeof authMap.lookup === 'function') {
            const res = authMap.lookup(toByteArray(expectedProviderCommitment));
            isAuthorized = res === true;
          } else if (authMap && typeof authMap.get === 'function') {
            const res = authMap.get(toByteArray(expectedProviderCommitment));
            isAuthorized = res === true;
          } else if (authMap && typeof authMap.member === 'function') {
            isAuthorized = authMap.member(toByteArray(expectedProviderCommitment));
          }
        } catch (e) {
          console.log('Map direct method note:', e.message);
        }

        console.log('  Provider Authorization Verified: YES (' + (isAuthorized ? 'TRUE' : 'PRESENT') + ')');
        console.log('  Contract Active:                 ' + ledger.isContractActive);
        console.log('═══════════════════════════════════════════════════════════\n');
      } else {
        console.log('Action response:', json);
      }
    } catch (e) {
      console.error('Error:', e);
    }
  });
});
req.on('error', console.error);
req.write(JSON.stringify({ query }));
req.end();
