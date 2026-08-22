# SHILLit — Project Memory (read this first, every session)

This file is the standing context for the SHILLit project. Read it in full
before doing anything else. It captures everything discussed so far across
sessions so work doesn't restart from zero.

## WORKING RULES (non-negotiable, apply always)

- **Never make code changes without explicit permission.** Report findings
  and proposed fixes; wait for a go-ahead before editing anything.
- **Before editing any file, save a backup of its original content first**
  (so it can be reverted), then make the change.
- On `tokensite`: after making an approved change, push straight to `main`
  (no feature branches) so the user can just `git pull` then
  `docker compose up -d --build` on the server. User does not want to deal
  with branches.
- **Keep answers short.** Yes/no where possible. Don't over-explain.
- User is non-technical but capable. Explain findings in plain language,
  no jargon, when asked for one.
- Don't guess. If something is unverified or unknown, say so explicitly —
  do not invent plausible-sounding answers.
- Scope for now: only **shillit-test** and **tokensite** repos matter.
  (`shillit-bot` exists and is cloned but is out of current scope.)
- Repos available: `davidmaloney/shillit-test` (push access, this repo),
  `davidmaloney/tokensite` (read-only clone at
  `/home/user/davidmaloney/tokensite` — user pushes changes to this one
  themselves), `davidmaloney/shillit-bot` (read-only, out of scope).

## THE PRODUCT

Two products, one company, sharing plumbing:

- **Product A — Website builder (live, working)**: shillit.fun. Solana-wallet
  meme-coin landing-page builder. No signup/email/account. Connect wallet →
  build page → pay in SOL → page lives at `slug.shillit.fun`. Pay-as-you-go;
  page + slug permanently deleted on expiry. $4.99/month or $39/year.
  Tagline: "Instant crypto landing pages for your token. One wallet. One
  page. The fastest setup on Solana."
- **Product B — Token Launchpad (built, proven on mainnet, hidden behind a
  flag)**: launch a token on Raydium directly from the site. A real token
  has launched and traded on mainnet. Vision: merge both products under one
  wallet-connect front door — "Launch a Token" / "Create a Website" — with
  launched tokens getting a free page at `shillit.fun/coin/<slug>` feeding a
  leaderboard.

## LEGAL PRIORITY (drives all Launchpad design decisions)

User does NOT want trouble with EU (MiCA/AMF) law. Every design choice must
keep the company as a SOFTWARE/INTERFACE layer, never an intermediary in the
financial transaction:

- Non-custodial always. Never hold user SOL/tokens. User's own wallet signs.
- Do NOT execute/route/transmit user orders. Flow: user -> our UI -> user's
  OWN wallet -> Raydium. NOT user -> our server -> Raydium.
- Do NOT operate a trading venue, order book, matching, or custody.
- Launch rules fixed & shown before launch; no secret post-launch control.
- Platform fee = clearly disclosed software fee, not disguised.
- Dev tokens locked via on-chain mechanism, not a wallet we control.
- Marketing language: drop "fair / safe / rug-proof / protects buyers / moon
  / guaranteed / investment." Use factual mechanics instead: "non-custodial
  launches, transparent bonding-curve parameters, 6-year dev vesting,
  liquidity migrates automatically."
- Unresolved legal risk = "placement" (helping bring tokens to buyers). No
  code fixes this; needs a crypto lawyer to classify the exact frontend flow
  before opening to EU users. As of July 2026 France requires MiCA
  authorization for crypto-asset services.
- Payment sequencing constraint: if charging for the free website/launch,
  payment to us must be a SEPARATE, clearly-labeled software fee. Do NOT
  build a flow where the user pays us and THEN we trigger their launch — the
  launch must always be signed by the user's own wallet as its own action,
  separate step from our fee.
- Not legal advice; mechanics match how pump.fun/Raydium operate, but get
  counsel before commercial/EU launch.

## LAUNCHPAD — PROVEN FACTS (do not re-litigate)

- Mainnet platform created; fee routing CONFIRMED to treasury
  `ApYPhmmxRpwnGzfeEaxSCFUhaqqgVz1vL9uBfK5cgD1T`
- Platform ID: `HJpV9cFXKF4XY7eYbH2oLoG1equPvWC3QsHB7F2PeWyD`
- Test token launched & trades: mint `6GiSXQrjTtFTRLV2aZb3bjFh9ECJB9B7z6ciFiKdUiPp`
- Launch page live in real site at `/launch`, gated by `VITE_LAUNCH_ENABLED`
  (see "Diagnostic findings" below re: exactly how the gate works)
- A buy succeeded (2 holders; indexed on Birdeye/DexScreener/DexTools/
  GeckoTerminal/RugCheck; RugCheck clean, no risks)
- On-chain numbers verified: launch mcap ~$10.8K matches config math exactly

## LAUNCHPAD ECONOMIC MODEL (settled, verified vs Raydium source)

- Curve: Constant Product (only live curve; linear rejected)
- Supply 1B, 6 decimals
- 50% curve / 5% dev-locked / 45% pool
- Graduation target $6,000 USD, converted to SOL live at launch then frozen
  on-chain (`totalFundRaisingB`). SOL price up/down does NOT change a
  launched token's own price mechanics; USD is only a launch-time reference.
- Dev lock: 5%, FREE set-aside (not bought), 3yr cliff + 3yr linear unlock
- Fees per trade: platform 0.5% (ours) / creator 0% / Raydium ~0.25%
  = ~0.75-0.85% total shown to trader
- LP at graduation: 95% burn / 5% platform / 0% creator
- No transfer tax. Dev buy optional (currently `devBuySol=0`).
- Product identity insight: curve deliberately CALM/FLAT (~23% climb
  launch->graduation) — filters flippers, rewards conviction. Real upside
  lands after graduation in the open pool (same buying moves price ~9x
  more). Describe factually per legal section, not as "fair/safe".
- Honest limits: constant-product has no fairness ramp, fairness is
  structural; can't make dumping impossible (multi-wallet evasion only
  exposable via Bubblemaps); market cap = price x supply (paper number),
  not money in it; Jupiter warnings/failed swaps on new tokens are display
  artifacts (no price feed yet) + thin liquidity + tx expiry, not a bug.

## ARCHITECTURE

Real site = `tokensite` repo: `frontend/` + `backend/`, each own `.env`.
Test/admin harness = `shillit-test` repo (this repo), Docker-based terminal
scripts, no live site code.

Launchpad feature files (client-side, wallet signs directly), in `tokensite`:
- `frontend/src/config/launchConfig.js` — rules; `targetUsd` changeable any
  time (affects FUTURE launches only; already-launched tokens frozen)
- `frontend/src/lib/raydiumLaunch.js` — builds+sends `createLaunchpad` and
  `claimPlatformFee` via wallet
- `frontend/src/pages/LaunchToken.jsx` — the launch page UI
- `frontend/src/components/AdminClaim.jsx` — floating admin "claim fees to
  treasury" widget
- `frontend/src/App.jsx` — `/launch` route + `<AdminClaim />` always mounted
- `frontend/package.json` + `vite.config.js` — Raydium SDK + node polyfills
  (required or build fails)
- `frontend/.env` — `VITE_LAUNCH_ENABLED`, `VITE_SOLANA_RPC_URL` (Alchemy
  mainnet), `VITE_LAUNCH_PLATFORM_ID=HJpV9cFXKF4XY7eYbH2oLoG1equPvWC3QsHB7F2PeWyD`
  Deploy: edit on GitHub -> server `git pull` -> `docker compose up -d --build`
  (use `-d` or Ctrl+C kills containers). Frontend `.env` bakes in at build
  via Dockerfile.

RPC setup:
- Website/payments = Helius (backend, hidden, working — do not touch). Two
  env vars, same Helius key, by design: `VITE_SOLANA_RPC_URL` (frontend,
  `main.jsx`) and `SOLANA_RPC_URL` (backend, `verifier.js`/`payments.js`).
  Do not cross them.
- Launch = Alchemy mainnet endpoint. Two providers on purpose = double free
  tier.
- Known issue: Alchemy key is baked into the frontend build (client-exposed
  in the shipped JS bundle). Wanted hidden via backend proxy eventually
  (mirror `backend/routes/payments.js` proxy pattern, own hidden
  `LAUNCH_RPC_URL`); left for now — proxy risks re-triggering Phantom's red
  warning since the SDK currently talks to RPC directly.
- `PaymentModal.jsx` line ~127 hardcodes public `api.mainnet-beta.solana.com`
  for the send connection — decision: LEAVE IT, works fine, Phantom
  simulates on its own infra anyway.

## TEST-HARNESS RECOVERY (this repo, `shillit-test`, Docker terminal scripts)

1. `cd shillit-test`
2. `docker compose exec test bash` (-> `/app#`)
3. `export RPC_URL="https://solana-mainnet.g.alchemy.com/v2/alch_n_PMlgQDgYRQzlc5R_zpG"`
4. `export CLUSTER="mainnet"`

Gotchas: exports wiped every session (re-run each time). Alchemy free tier
has NO websocket -> all send scripts use `execute({sendAndConfirm:false})` +
15-20s wait. ONE platform per admin wallet — to change settings, UPDATE
(`updatePlatformConfig` -> `updateClaimFeeWallet`), don't recreate.

Admin/throwaway wallet: `AdTfgvAQ1GqMMPMmJ8Jhm3YQBUcCpU1rkvqXqKDXyCXT`
(~0.05 SOL). This is DIFFERENT from the treasury wallet — see diagnostic
finding below, this distinction is the root cause of the claim-button bug.

Scripts (`npm run <x>` inside container): `simulate` (full economic
lifecycle, verified, no chain), `math` (config vs Raydium's real formula, no
chain), `launch` (create token on devnet), `buy <amount>` (test buyer),
`info` (inspect pool). `simulate`/`math` need no network/SOL. `launch`/`buy`/
`info` hit devnet, need devnet SOL from https://faucet.solana.com. Mainnet:
set `CLUSTER=mainnet` + real `RPC_URL`.

## THE WEBSITE INTEGRATION VISION (not yet built)

Turn SHILLit into two products under one roof:
- Front door: wallet connect as universal "key" (connect once). Below it two
  balanced doors: [Launch a Token] [Create a Website]. Both lead into the
  same familiar flow. Launch path adds a settings step and swaps "type
  contract address" for the auto-filled mint from the launch.
- URL decision (chosen): launched tokens = path `shillit.fun/coin/<slug>`,
  NOT a subdomain. Falls inside existing wildcard -> zero Cloudflare/Nginx/
  DNS changes. Also solves slug collisions (bought "doge" at
  doge.shillit.fun, launched "doge" at shillit.fun/coin/doge — URL tells you
  which).
- CA field flips direction: website path = user types the contract address;
  launch path = token doesn't exist yet, launch creates the mint, must
  auto-fill CA field after. Must not consume a CA-change turn (`CA_LOCKED`
  budget in `pageService.js`); launched pages CA-locked from start.
- Page-generation must be replayable from the mint alone: if a user's tab
  crashes after on-chain launch, they can come back and the system rebuilds
  their page from the confirmed mint. DB follows the chain, not the reverse.
  Extend `cleanupJob.js` for two orphan directions: (a) launch tx fails -> no
  token, delete provisional record; (b) launch succeeds but page/app dies ->
  real token, no page -> do NOT delete, must be recoverable.
- Trust panel (Product B pages only): X% locked for Y years (verify link),
  pool %, graduation target, Bubblemaps wallet map, platform fee 0.5% / no
  transfer tax / no custody. Wording factual per legal section.
- Leaderboard (later): launched-tokens only, built purely from public
  on-chain/DexScreener data (no new infra). Rank by liquidity, mcap, age,
  "still locked".
- Premium visual idea (not decided): golden ring/badge around avatar to
  distinguish a launched (premium) page from a bought website page.
- Flow still being decided: possibly launch-token -> claim free website ->
  fill in website -> pay at the end. Legal warning applies: payment-to-us
  must never gate/trigger the on-chain launch.
- Reused unchanged: wallet connect, slug system, template renderer + all
  templates, SOL-payment rail, expiry/cleanup jobs, image handling,
  `buildBuyLinks` (mirrored in 3 files: `CreatePage.jsx`, `ManagePage.jsx`,
  `renderer.js` — change all three). `isValidContractAddress` already
  accepts Solana base58 (auto-filled mint validates).
- New files planned (parallel path so a launch bug can't break the website
  flow): backend `services/launchpadService.js`, `solana/launchpadClient.js`,
  `routes/launch.js`, `services/lockerService.js` (if used),
  `config/launchConfig.js`, `db/launchSchema.js`; frontend
  `pages/LaunchToken.jsx` (done), `components/LaunchSettings.jsx`,
  `TrustPanel.jsx`, `Leaderboard.jsx`. Light edits: `App.jsx` (route, done),
  Navbar/landing (second door), `server.js` (register launch route),
  `renderer.js` (optional TrustPanel), `schema.js` (ref new table).

## WEBSITE BUILDER — TEMPLATE SYSTEM

Per new template = 3 files only (verified by full-codebase trace):
1. `backend/src/templates/template_N/index.html`
2. `backend/src/templates/template_N/style.css` (folder name must exactly
   match id)
3. One line added to the array in
   `frontend/src/components/TemplateSelector.jsx`:
   `{ id, name, description, color }`

That single line drives name + description + colour swatch + picker card in
both CreatePage and ManagePage (they import the same component). Previews
work automatically — `PagePreview.jsx` posts to `/api/preview` -> real
renderer -> loads folder from disk. No allowlist anywhere; `renderer.js`,
`pageService.js`, `schema.js`, `preview.js` all handle templates
generically.

Two cosmetic gaps (do once at the end, not per template): `PageCard.jsx`
~line 62 and `CreatePage.jsx` ~line 601 (review step) both show raw id
("template_9") not friendly name. Best fix: export the TEMPLATES list from
TemplateSelector, import in both.

17 placeholders every template must contain (or sections render blank):
`{{CSS}} {{OG_TAGS}} {{TOKEN_NAME}} {{SLUG}} {{AVATAR_BLOCK}}
{{BANNER_BLOCK}} {{NAME_BLOCK}} {{DESC_BLOCK}} {{CONTRACT_BLOCK}}
{{BUY_BLOCK}} {{TOKENOMICS_BLOCK}} {{SOCIAL_BLOCK}} {{TICKER_BLOCK}}
{{CHART_BLOCK}} {{COUNTDOWN_BLOCK}} {{ABOUT_BLOCK}} {{ROADMAP_BLOCK}}`
Plus generic `.buy-btn` styling and the Report link.

Every existing template also has a full-screen `<canvas>` animation as its
signature.

The 8 existing templates (mood themes, names stay as-is):
| id | name | look | canvas |
|----|------|------|--------|
| template_1 | Genesis | techie purple/green | bg-net (constellation) |
| template_2 | Aurora | clean light teal | bg-flow (flowing lines) |
| template_3 | Degen | black, hot pink/cyan | bg-field (punk particles) |
| template_4 | Storm | navy/indigo | bg-storm (lightning) |
| template_5 | 24K | dark/gold | bg-gl (gold glimmer) |
| template_6 | Playground | playful pink | bg-play (bubbles) |
| template_7 | Moonshot | deep space | bg-space (starfield) |
| template_8 | Amber | dark warm orange | bg-fire (embers) |

Templates 9-15 plan (hard cap of 15 total): 8 are mood themes, 7 new are
category/subject themes (each covers a whole tribe, not one coin, so a
template resells across 20-100 projects). Allocation (based on real
CoinGecko market-share data): T9 Dog #1 (playful, biggest tribe), T10 Dog #2
(based/serious), T11 Frog, T12 Cat, T13 Zoo/animal-general, T14
Patriot/national, T15 Classic meme/degen (wojak, chad, casino, long tail).

Standing design directive for every template (don't make the user repeat):
1. Premium, art-directed — must look intentionally designed, composed
   motion with rhythm and depth, not random scattered particle fields.
2. Each one better than the last.
3. Animated and alive, classy and deliberate; must work for ANY project in
   the category, so no single centrepiece mascot.
4. Distinct per theme — must not look like another template.
5. All tooling stays functional but restyled per theme; buy buttons unique
   per template; must look fully premium even with NO buy buttons showing.
6. Names must be category-obvious ("oh, that's the dog one"). T9 = "Woof".
7. Start from: what does this meme's WORLD look like? Build a scene with
   setting, ground plane, light source, motion that belongs in it. Vary
   composition type.

T9 failure log (learn from this, don't repeat): v1 "Loyal" (warm caramel,
too close to template 8's palette, cheap floating objects) — rejected. v2
"Woof" (twilight/moon/stars, "dogs in space makes no sense", template-7
starfield repeat, cheap bones) — rejected hard. v3 "Sunny Dog Park" (grass
ground plane, sun, parallax hills, bouncing ball with real arcs, dandelion
fluff, butterfly) — built, not yet reviewed/delivered. Root cause of
failures: defaulting to "dark background + floating particles" — break this
habit.

## WEBSITE BUILDER — STABLE SYSTEMS (done, deployed, don't break)

- Buy-button chain picker: paste CA -> detect family (Solana -> Raydium +
  Pump.fun; Tron -> "Copy CA & Buy on SunSwap"; EVM -> creator picks chain
  -> Uniswap/PancakeSwap). `buildBuyLinks(family, ca, evmChain)` mirrored
  byte-for-byte in CreatePage, ManagePage, PagePreview and renderer.
- Show-buy-buttons toggle, Tron chart note, CA 3-change lock, expiry
  warnings, 2% payment tolerance, unpaid-page cleanup at 3h.
- Report feature on all templates + Dashboard -> https://report.shillit.fun,
  manual email flow to support@shillit.fun. Friction is intentional
  anti-spam — do NOT make it one-click.

## MODERATION / SLUG DELETE

Add slug to env `DELETE_SLUGS` -> cleanup job (every 6h) deletes images,
writes slug to `deleted_slugs` blacklist table, hard-deletes page +
transactions. No refund, no notice, ignores remaining paid time. Up to 6
hours to take effect. To release a slug: BOTH steps required — remove from
env `DELETE_SLUGS` AND delete the row from `deleted_slugs` table in
Postgres. The DB row is the real lock; page data does not come back.
Pending improvement: make this a clean admin action instead of a manual
Postgres chore.

## TREASURY & PRICING

- `TREASURY_WALLET` env var is the single source of truth (used 3x in
  `payments.js`, verified against in `verifier.js`). Changing it in env
  changes everything cleanly. Set to a fresh clean address (second account
  inside the same Phantom wallet) to avoid showing an old degen-history
  wallet.
- `pricingService.js` fetches SOL/USD from CoinGecko, caches 5 min, falls
  back to `return 50` if fetch fails and cache is empty. Flagged as worth
  revisiting — confirmed still present, see diagnostic findings below.

## PHANTOM WALLET SITUATION (ticket 221674, live)

Real thread with Phantom DevRel "Yaovi" via official Zendesk support. Two
separate issues:
- (A) Red "This dApp could be malicious / Request blocked" warning on the
  pay popup. Domain reputation issue (site ~1 month old). Disappears on a
  second payment from the same wallet (semi-trusted after one interaction),
  but every genuinely new user sees it — killing conversions. Wallet
  swapping does not fix it.
- (B) App directory listing rejected — "does not meet quality/standards,
  prioritise differentiated/novel features." Subjective, separate issue.

Progress: sent Yaovi a clean completed-transaction Solscan URL (legacy
single-signer SOL transfer, ~$4.98 vs $4.99 — normal SOL drift inside the 2%
tolerance; "legacy" tx type is fine). Phantom's offer: can't just flip the
whitelist; fast-track = a known trusted Solana developer (not an
influencer) vouching via X DM — user has no such contact, path closed, not
faking a voucher. KYC: Phantom has never asked for ID, their docs say they
don't collect government IDs — decision: do NOT proactively send
passport/selfie, offer to verify in words instead. Latest: Yaovi asked for
code snippets (can't clone repos); sent PaymentModal tx build/send,
main.jsx wallet setup, backend payments (blockhash + simulate with
sigVerify: false), verifier (on-chain check, 2% tolerance). Awaiting
response.

Next moves: (1) ask Yaovi directly what the path is given no voucher is
possible; (2) research Blowfish reclassification (Phantom's warnings are
Blowfish-powered) — prior web search returned nothing, retry; (3) on-site
mitigation — a line near connect/pay: "First-time Phantom users may see a
security prompt because our domain is new; it's safe to proceed."
Framing: whitelisting is a nice-to-have, not required to operate. Real edge
is a genuine working product with an identifiable person behind it.

## $SHILL TOKEN (planned, not built)

Memecoin with real utility tied to the product, launched on pump.fun (not
the in-house Launchpad).
- Mechanics: ~0.02 SOL to create, 1% buy/1% sell on curve, graduates at
  ~$69k mcap needing ~85 SOL cumulative volume. At graduation ~85 SOL pairs
  with ~207M tokens on PumpSwap, LP tokens burned. Auto-listed on
  DexScreener. Only ~1-1.4% of tokens graduate.
- Allocation: ~3% David, ~10% treasury (separate address from earnings
  treasury) — publish this upfront. Reality check: can't buy 13% for $650,
  curve steepens as you buy — realistically ~8-15 SOL, visible on-chain.
- Utility: pay for pages in SHILL at a discount (start 15-20%, not 40% —
  40% guts revenue), burn a portion of every SHILL payment, verifiable burn
  address. Best unbuilt idea: live burn counter on shillit.fun showing total
  SHILL burned, linking to burn address on Solscan.
- Implementation when ready: `SHILL_TOKEN_ADDRESS` env var, empty by default
  -> SHILL option hidden; paste CA and it lights up. Needs payment-method
  toggle, SPL token transfer (different from current SystemProgram.transfer),
  backend SPL verification, wider tolerance than 2% (SHILL will be
  volatile). Price via DexScreener USD directly. Fail gracefully: if price
  lookup missing/odd, hide SHILL option rather than guess.
- Sequencing: finish templates -> clear Phantom -> then build SHILL payment
  rail. Don't destabilise code Phantom is actively reviewing.
- Countdown timer currently ~25 days — recommendation: extend now while
  nobody's watching, or remove and post a roadmap instead, bring back when
  genuinely 2-4 weeks out.

## LOGO / BRANDING (final direction)

Brand: near-black #0d0d0d, purple->green gradient #9945FF -> #14F195, heavy
900-weight Inter, glassy translucent cards. Winning concept: SHILLit
wordmark where each letter is a window containing a different template
world — disciplined typography (Solana-coded) + chaotic colourful content
inside (the templates). David approved two images: round avatar version and
a shillit.fun banner. Readability rule learned: at small sizes, worlds
inside every letter break legibility — for avatars, use fewer letters or
put worlds behind solid bright letterforms.

## IMMEDIATE NEXT STEPS (as of last planning session)

1. Integrate the two approved logo images into the Dashboard front page
   (replace/sit above CSS gradient "SHILLit" headline). Files in frontend
   `public/`, not uploads. Needs max-width for desktop/mobile, alt text,
   round one as favicon + social preview.
2. T9 "Woof" v3 — verify the sunny dog park renders, then review.
3. T10-T15 — build following the standing directive.
4. Phantom — respond to Yaovi on the snippets; retry Blowfish research.
5. Phase-3 polish — friendly template names in PageCard + CreatePage review.
6. Slug-release fix — make it an admin action, not a manual Postgres edit.

## DISCOUNTED / OBSOLETE (was true earlier, now dead — don't resurrect)

- All devnet struggle (faucets, finalization, stuck platform 6b5sU1jB...) —
  abandoned; mainnet works.
- Linear curve; the "50/50, 98 SOL, $500 dev buy, 8% buy" numbers — old,
  superseded by 50/5/45 + $6k.
- `shillit-devnet-test` repo (00-05 numbered files) — superseded by this
  `shillit-test` repo.
- External locker (Streamflow/StakePoint) — not used; lock is native via
  `totalLockedAmount`.
- $10k graduation target — changed to $6k.
- 90/5/5 LP split — changed to 95/5/0 (creator gets 0).
- "Charge for the page then launch" as a bundled flow — flagged as legal
  risk; keep fee and launch separate.

## DIAGNOSTIC FINDINGS (from a full code review of tokensite + shillit-test)

Confirmed real issues, still present:
1. **RPC key exposed** — Alchemy key baked into the frontend build
   (`launchConfig.js`, via env at build time), visible in shipped JS. Not
   yet fixed.
2. **Price fallback risk** — `backend/src/services/pricingService.js` still
   hardcodes `return 50` USD/SOL if CoinGecko fetch fails and cache is
   empty. If real SOL price is much higher, users could be charged too much
   SOL for the same USD amount.
3. **`/launch` route not gated at the router level** — `App.jsx` registers
   `/launch` unconditionally; the `LAUNCH_ENABLED` flag check happens inside
   `LaunchToken.jsx` itself (line 23), not in the router. Still functionally
   safe (page shows disabled state), just not gated the way earlier notes
   assumed. Low priority.

Checked and clean: all backend/bot/test JS passes `node --check` (no syntax
errors, any of the 3 repos); all `package.json` files valid; no brace/paren
mismatches in frontend JSX; no hardcoded private keys/secrets found; no
`.env` files committed anywhere.

Not reproduced: the "Tx: [object Object]" display bug mentioned in earlier
notes — `LaunchToken.jsx` already has an `extractTxId()` helper in
`raydiumLaunch.js` specifically to avoid this, and the result screen renders
`{result.txId}` as a string correctly. Likely already fixed, or occurs in a
path not yet exercised.

## ROOT-CAUSE FINDING: claim-to-treasury button doesn't work

**Symptom** (reported by user): the admin "claim fees to treasury" button in
the website builder doesn't work when connecting the specific admin wallet.

**Root cause, confirmed by reading Raydium SDK source
(`raydium-sdk-v2`, `launchpad/instrument.ts`)**: the on-chain
`claimPlatformFee` instruction requires **`platformClaimFeeWallet` itself**
to be the transaction signer (it's account #1 in the instruction, marked
`isSigner: true`) — it is NOT a generic admin-authority instruction.

But the app's code has two different wallets:
- `AdminClaim.jsx` gates the button to only show/work for the **admin
  wallet** `AdTfgvAQ1GqMMPMmJ8Jhm3YQBUcCpU1rkvqXqKDXyCXT`.
- `raydiumLaunch.js`'s `claimPlatformFees()` decodes the on-chain
  `PlatformConfig` and passes `platform.platformClaimFeeWallet` (the real
  **treasury wallet**, `ApYPhmmxRpwnGzfeEaxSCFUhaqqgVz1vL9uBfK5cgD1T`) into
  the instruction as the required signer — but the transaction is being
  built and signed by whichever wallet is connected in the browser (the
  admin wallet), not the treasury wallet.

Since the admin wallet's key can't produce a valid signature for the
treasury wallet's pubkey, the claim transaction can never succeed no matter
what — connecting the admin wallet is fundamentally the wrong wallet for
this action.

**Fix #1 — IMPLEMENTED & PUSHED to `tokensite` main**: changed
`AdminClaim.jsx`'s `ADMIN_WALLET` constant from the admin/throwaway wallet
to the treasury wallet (`ApYPhmmxRpwnGzfeEaxSCFUhaqqgVz1vL9uBfK5cgD1T`), so
the button now only shows/works when the treasury wallet is connected —
matching what Raydium's program actually requires. Confirmed by user: this
worked, button now appears with treasury wallet connected.

Note on user's mental model: the admin/throwaway wallet
(`AdTfgvAQ1GqMMPMmJ8Jhm3YQBUcCpU1rkvqXqKDXyCXT`) was used to sign the
one-time `createPlatformConfig` setup transaction when the platform was
created. That's a one-off action — Raydium's on-chain `PlatformConfig`
account has no admin/authority field at all (checked full field list
against the pinned SDK), only `platformClaimFeeWallet`. So the admin wallet
has no ongoing special permission; every claim always requires the treasury
wallet itself to sign, no exceptions.

**Fix #2 — IMPLEMENTED & PUSHED to `tokensite` main**: after Fix #1, claim
hit a second bug — error `"cannot found mint info, mintB: ..., vaultB: ''"`.
Root cause: `claimPlatformFees()` in `raydiumLaunch.js` explicitly passed
`mintB: NATIVE_MINT` into `raydium.launchpad.claimPlatformFee({...})`. But
the SDK only auto-fetches the pool's vault address (`vaultB`) when `mintB`
is NOT provided — passing it skips that lookup, leaving `vaultB` blank.
Fix: removed the `mintB: NATIVE_MINT` line entirely so the SDK looks up
both `mintB` and `vaultB` itself from the on-chain pool. User confirmed the
coin's fee vault genuinely exists on-chain (found it directly on Solscan:
`6cJLxVw59AqKawc4hU2r8TrwP9tzFwWotuE9KfZpJMna`), ruling out "token already
migrated/pool doesn't exist" as the cause.

**Fix #3 — IMPLEMENTED & PUSHED to `tokensite` main, bigger bug**: after
Fix #2, the claim button said "Claimed to treasury" but nothing ever
appeared on Solscan — transaction fully vanished from Phantom's history
too (not failed, not pending, just gone). Root cause, confirmed by reading
the exact pinned SDK's compiled `txTool` execute() implementation: for a
browser wallet (non-keypair owner, using `signAllTransactions`), `execute()`
calls `connection.sendRawTransaction(...)` with `skipPreflight: true` and
returns the signature **immediately** — it never checks whether the
transaction actually gets confirmed by the network. The app was treating
"got a signature back" as "succeeded." If the tx then silently drops
(which happened twice), the app has no way to know and reports false
success. This affects `claimPlatformFees()` AND `launchToken()` equally
(same `execute()` pattern) — **`launchToken()` still has this bug,
un-fixed, awaiting permission to touch it.**

**Fix #5 — IMPLEMENTED & PUSHED to `tokensite` main, product-level addition**:
after Fix #3's confirmation check started working correctly, a real claim
attempt returned on-chain custom error 6009 = `NoAssetsToCollect` (looked up
directly in Raydium's official IDL, `raydium-idl` repo on GitHub — this repo
is the authoritative source for the on-chain program, better than reading
minified SDK JS). This is not a bug — Raydium's program has TWO separate
fee-holding places: (a) a per-coin vault, drained via `claim_platform_fee`
(what the button used, correctly reporting nothing to collect for this
low-volume test coin), and (b) a **shared platform-wide vault** (one bucket
for the whole platform, PDA = `getPdaPlatformVault(programId, platformId,
NATIVE_MINT)`), drained via `claim_platform_fee_from_vault` — a different
instruction the installed SDK version (0.2.42-alpha, confirmed same in the
newest available 0.2.x-alpha release too) does NOT wrap in a convenience
method. User specifically wants "claim everything in one click" as the
product scales, which is exactly what this second mechanism is for.

Verified on Solscan the shared vault (`6cJLxVw59AqKawc4hU2r8TrwP9tzFwWotuE9KfZpJMna`,
confirmed by direct PDA computation to be this exact `platform_fee_vault`,
NOT a per-pool vault as earlier notes assumed) actually holds:
- 0.002184765 SOL — this is NOT fee money, it's the mandatory Solana rent
  reserve for a 165-byte token account. Don't mistake this number for
  claimable funds again.
- 0.000145485 WSOL (~$0.01) — this IS real, claimable platform fee.

Implemented `claimPlatformFeeFromVault()` in `raydiumLaunch.js` by hand
(raw `TransactionInstruction`, not via the SDK's launchpad module) since the
SDK doesn't expose it yet. Account list, seeds, and discriminator
(`[117,241,198,168,248,218,80,29]`) all taken directly from Raydium's
official `raydium_launchpad.json` IDL, not guessed. Added a second button
in `AdminClaim.jsx`, "Claim all from platform vault", alongside the
existing per-coin claim button — both use the same treasury-wallet gate and
the same `waitForConfirmation()` safety check.

Fix applied to `claimPlatformFees()` only (scope: claim button): added a
`waitForConfirmation()` helper that polls `connection.getSignatureStatuses()`
every 2s for up to 30s after sending, throws a clear error if the tx failed
on-chain or never confirmed in time (with a Solscan link to check manually),
and only returns success once actually confirmed. This mirrors the existing
project pattern for the no-websocket Alchemy free tier (poll + wait, not
subscribe) already used in `shillit-test`'s send scripts.

**Reassurance given to user**: because the transaction never actually
confirmed on both failed attempts, the accrued platform fee never left the
coin's on-chain fee vault — nothing was lost or sent elsewhere. Verified by
grepping both `tokensite` and `shillit-test` for the treasury/admin/platform
addresses: the treasury address appears in exactly one place in the whole
codebase (the `AdminClaim.jsx` gate), and `shillit-test` has no wallet
addresses hardcoded anywhere (it's a disconnected dev/test harness) — no
sign of any code path that could redirect claimed funds elsewhere.

**Fix #4 — IMPLEMENTED & PUSHED to `tokensite` main**: `launchToken()` had
the identical blind-success bug as Fix #3 (same `execute()` pattern, same
missing confirmation check) — a coin launch could report "your coin is
live" with a mint address even if the transaction silently dropped, since
launching costs real SOL this was flagged as equally serious. Applied the
same `waitForConfirmation()` helper (already added to `raydiumLaunch.js` for
the claim fix) to `launchToken()` too: after `execute()`, extract the txId,
throw if empty, poll for real confirmed/finalized status for up to 30s
before returning success. Verified safe before pushing: `LaunchToken.jsx`
already wraps its `launchToken()` call in try/catch, so a new thrown error
(timeout or on-chain failure) surfaces as a normal error message — no other
file needed changing, nothing else in the launch flow touched.

## TONE / RELATIONSHIP

User is non-deeply-technical but capable; works from phone (laptop is
German, avoids browser devtools/console). Wants decisive, concise,
factually honest answers. Explicitly said to STOP GUESSING — when unknown,
say so and check, don't invent plausible answers (corrected previously for
inventing a "creator fee", overconfidence on RPC exposure, guessing fee
splits). Owns real errors. Has funds, will spend a few real dollars. Not a
lawyer — flag legal matters for professional advice. Legal-safe design is
the stated top priority for all future Launchpad work.

David's working constraints (from an earlier working-notes session, may
still apply): iPhone/Safari, cannot use artifacts/downloads/file boxes in
some contexts — needs full files pasted as plain text, one file per
message, never truncated, then copy-pastes into GitHub which rebuilds the
server. Voice-to-text quirks to watch for: "trom/churn"=Tron, "s c c"=css,
"Earl"=URL, "OLED"=allowlist, "chill/shell"=SHILL, "chilit/chili"=SHILLit.
