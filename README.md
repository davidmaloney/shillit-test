# SHILLit Test

## Quick start
git clone <repo> shillit-test && cd shillit-test && mkdir -p data
docker compose up -d --build
docker compose exec test bash

## Inside the container
npm run simulate    # verified — full economic lifecycle, prints YES/NO, no chain
npm run math        # config validity vs Raydium's real formula, no chain
npm run launch      # create the token on devnet
npm run buy 0.5     # buy as a test buyer
npm run info        # inspect the pool

## Notes
- simulate + math need no network/SOL and are verified.
- launch/buy/info hit devnet and may need debugging first run (paste errors).
- devnet SOL: run launch once to create the wallet, fund it at
  https://faucet.solana.com, then run launch again.
- mainnet later: set CLUSTER=mainnet and a real RPC_URL.
