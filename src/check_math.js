import BN from "bn.js";
import { SUPPLY, TOTAL_SELL_A, TOTAL_LOCKED, TOTAL_FUND_RAISING_B, SOL_USD_PRICE, TARGET_USD } from "./config.js";
const migrateFee = new BN(0);
function getInitParam(supply, totalSell, locked, tf, mf) {
  if (supply.lte(totalSell)) throw new Error("supply need gt total sell");
  const smsl = supply.sub(totalSell).sub(locked);
  if (smsl.lte(new BN(0))) throw new Error("supplyMinusSellLocked <= 0");
  const tfm = tf.sub(mf);
  const num = tfm.mul(totalSell).mul(totalSell).div(smsl);
  const den = tfm.mul(totalSell).div(smsl).sub(tf);
  if (den.isZero()) throw new Error("denominator zero");
  const a = num.div(den), b = tf.mul(tf).div(den);
  if (a.lt(new BN(0)) || b.lt(new BN(0))) throw new Error("invalid input 0");
  return { a, b };
}
const pct = (p) => p.mul(new BN(10000)).div(SUPPLY).toNumber()/100;
console.log(`On curve ${pct(TOTAL_SELL_A)}% / lock ${pct(TOTAL_LOCKED)}% / pool ${(100-pct(TOTAL_SELL_A)-pct(TOTAL_LOCKED)).toFixed(1)}%`);
console.log(`Target $${TARGET_USD} = ${(TOTAL_FUND_RAISING_B.toNumber()/1e9).toFixed(2)} SOL`);
console.log(`Validity 2*sell+lock>supply? ${TOTAL_SELL_A.muln(2).add(TOTAL_LOCKED).gt(SUPPLY) ? "YES" : "NO"}`);
try {
  const p = getInitParam(SUPPLY, TOTAL_SELL_A, TOTAL_LOCKED, TOTAL_FUND_RAISING_B, migrateFee);
  console.log("OK valid. virtualA", p.a.toString(), "virtualB", p.b.toString());
} catch(e){ console.log("INVALID:", e.message); }
