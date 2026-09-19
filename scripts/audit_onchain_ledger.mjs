import https from "node:https";
import * as compactRuntime from "@midnight-ntwrk/compact-runtime";
import { ledger as getLedger } from "../contracts/managed/medproof/contract/index.js";

const targetContract = "94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626";
const indexerUrl = "https://indexer.preprod.midnight.network/api/v4/graphql";

function toByteArray(hexString) {
  const clean = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  return new Uint8Array(Buffer.from(clean, "hex"));
}

async function queryIndexer() {
  return new Promise((resolve, reject) => {
    const query = "query CheckContractState($addr: String!) { contractAction(address: $addr) { state zswapState } }";
    const req = https.request(indexerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json.data);
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(JSON.stringify({ query, variables: { addr: targetContract } }));
    req.end();
  });
}

async function main() {
  const data = await queryIndexer();
  const action = data?.contractAction;
  if (!action || !action.state) {
    throw new Error("No state found for contract " + targetContract);
  }

  const rawState = toByteArray(action.state);
  const deserialized = compactRuntime.ContractState.deserialize(rawState);
  const ledger = getLedger(deserialized.data);

  console.log("=== LEDGER DUMP ===");
  console.log("isContractActive:       ", ledger.isContractActive);
  console.log("currentEpoch:           ", ledger.currentEpoch?.toString());
  console.log("totalCredentialsIssued: ", ledger.totalCredentialsIssued?.toString());
  console.log("totalVerifications:     ", ledger.totalVerifications?.toString());

  const providerCommitment = toByteArray("ba4a59721d19ae5c74b1ef22590a323e681f5976eb495cbf057686bb1757a401");
  console.log("authorizedProviders has Lace:", ledger.authorizedProviders?.member(providerCommitment));

  const oldCred = toByteArray("f66d8d9e2c3634f3558e8c5b9c5b9dc9f0244ef9c83c97fbbd8010b4d1a8f63c");
  const newCred = toByteArray("1621efb5e5e7a0c9a322738cf25417caaf1d1d4b966ba58897849fa156aa7d4b");
  console.log("issuedCredentials has Old (f66d...):", ledger.issuedCredentials?.member(oldCred));
  console.log("issuedCredentials has New (1621...):", ledger.issuedCredentials?.member(newCred));

  const oldConsent = toByteArray("618587cae61a4918f8ff23e1f7fe1ec92348f9ecf4a6217646193fe4c2b9a7ea");
  const newConsent = toByteArray("906e00aef588d8d8965c31e5f745057cccccad0ac62446a8ededaf4cc0fa298d");
  console.log("activeConsents has Old (6185...):   ", ledger.activeConsents?.member(oldConsent));
  console.log("activeConsents has New (906e...):   ", ledger.activeConsents?.member(newConsent));

  console.log("revokedCredentials has Old:        ", ledger.revokedCredentials?.member(oldCred) ?? false);
  console.log("revokedCredentials has New:        ", ledger.revokedCredentials?.member(newCred) ?? false);

  const zeroNullifier = new Uint8Array(32);
  console.log("usedNullifiers has 0-nullifier:    ", ledger.usedNullifiers?.member(zeroNullifier) ?? false);
}

main().catch(console.error);