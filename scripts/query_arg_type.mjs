import https from "node:https";
const indexerUrl = "https://indexer.preprod.midnight.network/api/v4/graphql";
const query = `
query IntrospectContractActionArg {
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
    const ca = json.data.__type.fields.find(f => f.name === "contractAction");
    console.log(JSON.stringify(ca, null, 2));
  });
});
req.write(JSON.stringify({ query }));
req.end();