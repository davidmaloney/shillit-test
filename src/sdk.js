import { Raydium, TxVersion, DEV_API_URLS } from "@raydium-io/raydium-sdk-v2";
import { Connection, Keypair } from "@solana/web3.js";
import fs from "fs";
import { RPC_URL, CLUSTER, WALLET_FILE } from "./config.js";

export function loadWallet() {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
  if (!fs.existsSync(WALLET_FILE)) {
    const kp = Keypair.generate();
    fs.writeFileSync(WALLET_FILE, JSON.stringify(Array.from(kp.secretKey)));
    console.log("New wallet:", kp.publicKey.toBase58());
    return kp;
  }
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(WALLET_FILE))));
}

let _raydium;
export async function initSdk() {
  if (_raydium) return _raydium;
  const owner = loadWallet();
  const connection = new Connection(RPC_URL, "confirmed");
  _raydium = await Raydium.load({
    owner, connection, cluster: CLUSTER,
    disableFeatureCheck: true, disableLoadToken: true,
    blockhashCommitment: "finalized",
    ...(CLUSTER === "devnet" ? { urlConfigs: {
      ...DEV_API_URLS,
      BASE_HOST: "https://api-v3-devnet.raydium.io",
      OWNER_BASE_HOST: "https://owner-v1-devnet.raydium.io",
      SWAP_HOST: "https://transaction-v1-devnet.raydium.io",
      CPMM_LOCK: "https://dynamic-ipfs-devnet.raydium.io/lock/cpmm/position",
    }} : {}),
  });
  return _raydium;
}
