import * as ledger from "@midnight-ntwrk/midnight-js-protocol/ledger";
console.log("ledger keys:", Object.keys(ledger).filter(k => k.toLowerCase().includes("tx") || k.toLowerCase().includes("transaction")));
if (ledger.Transaction) {
  console.log("Transaction static methods:", Object.getOwnPropertyNames(ledger.Transaction));
  console.log("Transaction prototype methods:", Object.getOwnPropertyNames(ledger.Transaction.prototype));
}