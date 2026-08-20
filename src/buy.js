import { TxVersion, DEVNET_PROGRAM_ID, LAUNCHPAD_PROGRAM, getPdaLaunchpadPoolId, PlatformConfig } from "@raydium-io/raydium-sdk-v2";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import fs from "fs";
import { initSdk } from "./sdk.js";
import { CLUSTER } from "./config.js";

const raydium = await initSdk();
const programId = CLUSTER === "devnet" ? DEVNET_PROGRAM_ID.LAUNCHPAD_PROGRAM : LAUNCHPAD_PROGRAM;
const { mint } = JSON.parse(fs.readFileSync("./data/last-mint.json"));
const mintA = new PublicKey(mint);
const buySol = Number(process.argv[2] ?? "0.2");
const inAmount = new BN(Math.round(buySol * 1e9));

const poolId = getPdaLaunchpadPoolId(programId, mintA, NATIVE_MINT).publicKey;
const poolInfo = await raydium.launchpad.getRpcPoolInfo({ poolId });
const pdata = await raydium.connection.getAccountInfo(poolInfo.platformId);
const platformInfo = PlatformConfig.decode(pdata.data);
const mintInfo = await raydium.token.getTokenInfo(mintA);

const { execute, extInfo } = await raydium.launchpad.buyToken({
  programId, mintA, mintAProgram: new PublicKey(mintInfo.programId),
  poolInfo, slippage: new BN(100), configInfo: poolInfo.configInfo,
  platformFeeRate: platformInfo.feeRate, txVersion: TxVersion.V0, buyAmount: inAmount,
});
console.log("expected out:", extInfo.decimalOutAmount?.toString());
try { const s = await execute({ sendAndConfirm: true }); console.log("BOUGHT", s); }
catch(e){ console.log("ERROR:", e); }
process.exit();
