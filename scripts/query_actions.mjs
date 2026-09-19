import https from "node:https";

const contractAddress = "94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626";
const indexerUrl = "https://indexer.preprod.midnight.network/api/v4/graphql";

const query = `
query GetActions {
  contractActions(filter: { address: "${contractAddress}" }) {
    edges {
      node {
        ... on ContractCall {
          transaction {
            id
            hash
            block {
              height
              timestamp
            }
          }
        }
        ... on ContractDeploy {
          transaction {
            id
            hash
            block {
              height
              timestamp
            }
          }
        }
      }
    }
  }
}
`;

const req = https.request(indexerUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}, (res) => {
  let body = "";
  res.on("data", c => body += c);
  res.on("end", () => {
    console.log(body);
  });
});
req.write(JSON.stringify({ query }));
req.end();