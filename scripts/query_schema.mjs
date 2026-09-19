import https from "node:https";
const indexerUrl = "https://indexer.preprod.midnight.network/api/v4/graphql";
const query = `
query IntrospectQuery {
  __type(name: "Query") {
    fields {
      name
      args {
        name
        type {
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
  res.on("end", () => {
    const json = JSON.parse(body);
    for (const f of json.data.__type.fields) {
      console.log(f.name, f.args.map(a => a.name).join(", "));
    }
  });
});
req.write(JSON.stringify({ query }));
req.end();