import { loadSync, Root } from "protobufjs";

let root = new Root();
root.loadSync("./src/proto/transaction.proto");

export const TxMessage = root.lookupType("proto.Transaction");
