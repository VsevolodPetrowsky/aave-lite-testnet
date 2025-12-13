import { defineWalletSetup } from '@synthetixio/synpress-cache'
import { MetaMask } from '@synthetixio/synpress-metamask/playwright'
import { config } from 'dotenv'

// Load .env file from project root (using cwd since synpress runs from project root)
config({ path: `${process.cwd()}/.env` })

/**
 * Wallet setup for E2E tests
 *
 * IMPORTANT: Use a dedicated test wallet with testnet tokens only!
 * Never use a wallet with real funds for testing.
 *
 * To get test tokens:
 * 1. Go to https://app.aave.com
 * 2. Enable testnet mode in settings
 * 3. Go to Faucet tab
 * 4. Request test tokens
 */

// Test wallet seed phrase from .env - USE ONLY FOR TESTING
const SEED_PHRASE = process.env.TEST_SEED_PHRASE
if (!SEED_PHRASE) {
  throw new Error('TEST_SEED_PHRASE not found in .env file. Please create .env with your test wallet seed phrase.')
}
const PASSWORD = 'Tester@1234'

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const metamask = new MetaMask(context, walletPage, PASSWORD)

  await metamask.importWallet(SEED_PHRASE)

  // Create second account (funds are on Account 2)
  await metamask.addNewAccount('Account 2')

  // Enable test networks visibility (Sepolia is built-in)
  await metamask.toggleShowTestNetworks()
})
