import https from "node:https";
const indexerUrl = "https://indexer.preprod.midnight.network/api/v4/graphql";
const query = `
query IntrospectOffsetFields {
  __type(name: "ContractActionOffset") {
    name
    kind
    inputFields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
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
  res.on("end", () => console.log(body));
});
req.write(JSON.stringify({ query }));
req.end();