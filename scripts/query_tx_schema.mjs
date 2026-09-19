import https from "node:https";
const indexerUrl = "https://indexer.preprod.midnight.network/api/v4/graphql";
const query = `
query IntrospectTransactions {
  __type(name: "Query") {
    fields {
      name
      args {
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
}
`;
const req = https.request(indexerUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}, (res) => {
  let body = "";
  res.on("data", c => body += c);
  res.on("end", () => {
    const json = JSON.parse(body);
    const tx = json.data.__type.fields.find(f => f.name === "transactions");
    console.log(JSON.stringify(tx, null, 2));
  });
});
req.write(JSON.stringify({ query }));
req.end();