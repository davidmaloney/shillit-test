// SHILLit FULL LIFECYCLE SIMULATION — pure math, no chain. Run: npm run simulate
const DECIMALS = 6;
const SUPPLY = 1_000_000_000n * (10n ** BigInt(DECIMALS));
const SELL   = SUPPLY * 50n / 100n;
const LOCK   = SUPPLY * 5n  / 100n;
const SOL_USD = 77;
const TARGET_USD = 6000;
const targetSol = TARGET_USD / SOL_USD;
const TFB = BigInt(Math.round(targetSol * 1e9));
const MIGRATE_FEE = 0n;

let PASS = true;
const check = (label, cond) => { console.log(`  [${cond ? "PASS" : "FAIL"}] ${label}`); if (!cond) PASS = false; };

console.log("============================================================");
console.log("  SHILLit Fair Launch — FULL LIFECYCLE SIMULATION");
console.log("============================================================\n");
console.log(`Config: 50% curve / 5% lock / 45% pool`);
console.log(`Target: $${TARGET_USD} @ $${SOL_USD}/SOL = ${targetSol.toFixed(2)} SOL\n`);

function getInitParam(supply, totalSell, locked, tf, migFee) {
  if (supply <= totalSell) throw new Error("supply need gt total sell");
  const smsl = supply - totalSell - locked;
  if (smsl <= 0n) throw new Error("supplyMinusSellLocked <= 0");
  const tfm = tf - migFee;
  if (tfm <= 0n) throw new Error("tfMinusMf <= 0");
  const numerator = tfm * totalSell * totalSell / smsl;
  const denominator = (tfm * totalSell / smsl) - tf;
  if (denominator === 0n) throw new Error("denominator zero");
  const a = numerator / denominator;
  const b = tf * tf / denominator;
  if (a < 0n || b < 0n) throw new Error("invalid input 0");
  return { a, b };
}
function buyExactIn(vA, vB, realA, realB, amountIn) {
  return amountIn * (vA - realA) / ((vB + realB) + amountIn);
}

console.log("STEP 1 — LAUNCH");
let vA, vB;
try {
  const p = getInitParam(SUPPLY, SELL, LOCK, TFB, MIGRATE_FEE);
  vA = p.a; vB = p.b;
  check("config valid", true);
  check("virtualA > 0", vA > 0n);
  check("virtualB > 0", vB > 0n);
  check("validity 2*sell+lock>supply", (SELL*2n + LOCK) > SUPPLY);
} catch (e) { check("config valid", false); console.log("  ERROR:", e.message); console.log("\nRESULT: NO"); process.exit(1); }

console.log("\nSTEP 2 — DEV buy 1%");
function lamportsForTokens(vA, vB, rA, rB, want) {
  let lo = 0n, hi = TFB * 1000n;
  for (let i=0;i<100;i++){ const mid=(lo+hi)/2n; if (buyExactIn(vA,vB,rA,rB,mid)<want) lo=mid+1n; else hi=mid; }
  return hi;
}
const devWant = SUPPLY * 1n / 100n;
const devLam = lamportsForTokens(vA, vB, 0n, 0n, devWant);
let realA = buyExactIn(vA, vB, 0n, 0n, devLam), realB = devLam;
check("dev buy returned tokens", realA > 0n);
console.log(`  dev: 1% for ${(Number(devLam)/1e9).toFixed(3)} SOL = $${(Number(devLam)/1e9*SOL_USD).toFixed(0)}`);

console.log("\nSTEP 3 — buyers fill curve");
let n=0; const chunk = TFB/20n;
while (realB < TFB && n<1000){ const left=TFB-realB; const amt=left<chunk?left:chunk; const got=buyExactIn(vA,vB,realA,realB,amt); if(got<=0n)break; realA+=got; realB+=amt; n++; }
check("reached target", realB >= TFB - chunk);
check("sold <= curve allocation", realA <= SELL);
console.log(`  ${n} buys, raised ${(Number(realB)/1e9).toFixed(2)} SOL, sold ${(Number(realA)/1e6).toLocaleString()} tokens`);

console.log("\nSTEP 4 — GRADUATION");
const poolTokens = SUPPLY - SELL - LOCK;
const gradPriceUsd = (Number(TFB - MIGRATE_FEE)/Number(poolTokens)) * (10**(DECIMALS-9)) * SOL_USD;
check("pool = 45%", poolTokens === SUPPLY*45n/100n);
check("grad price > 0", gradPriceUsd > 0);
console.log(`  pool: ${(Number(poolTokens)/1e6).toLocaleString()} tokens + ${(Number(TFB)/1e9).toFixed(1)} SOL`);
console.log(`  FDV ≈ $${(gradPriceUsd*1e9).toLocaleString(undefined,{maximumFractionDigits:0})}`);

console.log("\nSTEP 5 — dump resistance");
const kTok=poolTokens, kSol=TFB;
const drop=(p)=>{ const sold=SUPPLY*BigInt(Math.round(p*100))/10000n; const nt=kTok+sold; const ns=(kTok*kSol)/nt; return (1 - (Number(ns)/Number(nt))/(Number(kSol)/Number(kTok)))*100; };
console.log(`  3% sell -> -${drop(3).toFixed(1)}%`);
console.log(`  6% sell -> -${drop(6).toFixed(1)}%`);
check("6% dump < 30%", drop(6) < 30);

console.log("\n============================================================");
console.log(`  RESULT: ${PASS ? "YES - economic model holds" : "NO - something failed"}`);
console.log("============================================================");
