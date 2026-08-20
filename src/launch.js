import { TxVersion, DEVNET_PROGRAM_ID, LAUNCHPAD_PROGRAM, getPdaLaunchpadConfigId, LaunchpadConfig } from "@raydium-io/raydium-sdk-v2";
import { NATIVE_MINT } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import fs from "fs";
import { initSdk } from "./sdk.js";
import { CLUSTER, TOKEN, SUPPLY, TOTAL_SELL_A, TOTAL_LOCKED, TOTAL_FUND_RAISING_B, CLIFF_PERIOD_SECONDS, UNLOCK_PERIOD_SECONDS, DEV_BUY_LAMPORTS, MIGRATE_TYPE, PLATFORM_ID } from "./config.js";

const raydium = await initSdk();
const programId = CLUSTER === "devnet" ? DEVNET_PROGRAM_ID.LAUNCHPAD_PROGRAM : LAUNCHPAD_PROGRAM;
const configId = getPdaLaunchpadConfigId(programId, NATIVE_MINT, 0, 0).publicKey;
const configData = await raydium.connection.getAccountInfo(configId);
if (!configData) throw new Error("config not found at " + configId.toBase58());
const configInfo = LaunchpadConfig.decode(configData.data);
const mintBInfo = await raydium.token.getTokenInfo(configInfo.mintB);

const pair = Keypair.generate();
console.log("New mint:", pair.publicKey.toBase58());

const args = {
  programId, mintA: pair.publicKey, decimals: TOKEN.decimals,
  name: TOKEN.name, symbol: TOKEN.symbol, uri: TOKEN.uri,
  migrateType: MIGRATE_TYPE, configId, configInfo,
  mintBDecimals: mintBInfo.decimals,
  txVersion: TxVersion.V0, slippage: new BN(100),
  buyAmount: DEV_BUY_LAMPORTS,
  createOnly: DEV_BUY_LAMPORTS.isZero(),
  extraSigners: [pair],
  supply: SUPPLY, totalSellA: TOTAL_SELL_A,
  totalFundRaisingB: TOTAL_FUND_RAISING_B, totalLockedAmount: TOTAL_LOCKED,
  cliffPeriod: CLIFF_PERIOD_SECONDS, unlockPeriod: UNLOCK_PERIOD_SECONDS,
};
if (PLATFORM_ID) args.platformId = new PublicKey(PLATFORM_ID);

const { execute, extInfo } = await raydium.launchpad.createLaunchpad(args);
try {
  await execute({ sequentially: true });
  console.log("LAUNCHED. poolId:", JSON.stringify(extInfo, (k,v)=>v?.toString?v.toString():v, 2));
  fs.writeFileSync("./data/last-mint.json", JSON.stringify({ mint: pair.publicKey.toBase58() }));
} catch(e){ console.log("ERROR:", e); }
process.exit();
