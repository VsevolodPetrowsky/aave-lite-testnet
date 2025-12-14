# Aave Lite Testnet

[🇷🇺 Русская версия](README_RU.md)

A minimalist interface for interacting with the Aave V3 protocol on the Sepolia testnet.

## What is this?

A web application that allows you to:
- **Deposit** - deposit tokens into Aave to earn interest
- **Withdraw** - withdraw your deposits
- **Borrow** - borrow tokens using your deposit as collateral
- **Repay** - repay your loans

## Supported Tokens

The following tokens work on Aave Sepolia:
- **LINK** - Chainlink Token
- **WBTC** - Wrapped Bitcoin
- **AAVE** - Aave Token

> **Note:** DAI and USDC are temporarily frozen on Aave Sepolia (error 51 - RESERVE_INACTIVE)

## Technologies

- **React 19** + **TypeScript**
- **Vite** - bundler
- **wagmi v2** + **viem** - blockchain interaction
- **RainbowKit** - wallet connection
- **Tailwind CSS** - styling
- **shadcn/ui** - UI components
- **Vitest** - unit tests
- **Playwright** + **Synpress** - E2E tests with MetaMask

---

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd aave-lite-testnet
npm install
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# Seed phrase for test wallet (for E2E tests only!)
SEED_PHRASE="your twelve word seed phrase here for testing only"
```

> **IMPORTANT:** Use ONLY a test wallet! Never use your main wallet.

### 3. Getting Test Tokens

1. Get Sepolia ETH for gas: https://sepoliafaucet.com/
2. Get test LINK: https://faucets.chain.link/sepolia
3. Get Aave test tokens: https://staging.aave.com/faucet/

### 4. Run the Application

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Using the Application

### Connecting Your Wallet

1. Click "Connect Wallet"
2. Select MetaMask
3. Confirm the connection
4. Switch to Sepolia network (if prompted)

### Depositing Tokens

1. In the "Your tokens" section, find the desired token (LINK, WBTC, AAVE)
2. Click "Deposit"
3. Enter the amount or click "Max"
4. Click "Approve & Deposit" (approval is required for the first time)
5. Confirm the transactions in MetaMask
6. Wait for confirmation

### Withdrawing Tokens

1. In the "Your Supplies" table, find your position
2. Click "Withdraw"
3. Enter the amount
4. Confirm the transaction

### Borrowing Tokens

1. First make a deposit (this will be your collateral)
2. In the "Borrow" form, select a token
3. Enter the amount (not more than the available limit)
4. Confirm the transaction

### Repaying a Loan

1. In the "Your Borrows" table, find your position
2. Click "Repay"
3. Enter the amount
4. Click "Approve & Repay"
5. Confirm the transactions

---

## Testing

### Unit Tests

Run all unit tests:
```bash
npm run test:run
```

Run in watch mode:
```bash
npm run test
```

Unit tests cover:
- `useDeposit` - deposit hook
- `useWithdraw` - withdraw hook
- `useBorrow` - borrow/repay hook
- `DepositForm` - deposit form component
- `WithdrawForm` - withdraw form component

### E2E Tests (with MetaMask)

E2E tests use Synpress v4 for MetaMask automation.

#### Requirements

- Node.js 18+
- Chromium installed (installs automatically)
- Test wallet with tokens on Sepolia

#### Setup

1. Make sure `.env` contains `SEED_PHRASE`
2. The wallet should have:
   - Sepolia ETH for gas
   - LINK tokens for tests

#### Running E2E Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run specific test groups:
```bash
# Deposit tests only
npm run test:e2e -- --grep "Deposit"

# Withdraw tests only
npm run test:e2e -- --grep "Withdraw"

# Borrow tests only
npm run test:e2e -- --grep "Borrow"

# Repay tests only
npm run test:e2e -- --grep "Repay"
```

#### What's Being Tested (23 tests)

| Group | Tests | Description |
|-------|-------|-------------|
| Connection | 2 | Wallet connection |
| Token Balances | 2 | Balance display |
| Deposit Flow | 4 | Complete LINK and WBTC deposit flow |
| Positions | 2 | Position display |
| Withdraw Flow | 3 | Token withdrawal |
| Borrow Flow | 3 | Token borrowing |
| Repay Flow | 2 | Loan repayment |
| Account Overview | 2 | Account overview |
| Error Handling | 2 | Error handling |

#### Viewing the Report

After running tests:
```bash
npx playwright show-report
```

---

## Project Structure

```
aave-lite-testnet/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── DepositForm.tsx  # Deposit form
│   │   ├── WithdrawForm.tsx # Withdraw form
│   │   ├── BorrowForm.tsx   # Borrow form
│   │   ├── RepayForm.tsx    # Repay form
│   │   └── ...
│   ├── hooks/               # React hooks
│   │   ├── useDeposit.ts    # Deposit logic
│   │   ├── useWithdraw.ts   # Withdraw logic
│   │   ├── useBorrow.ts     # Borrow/repay logic
│   │   ├── usePositions.ts  # User positions
│   │   └── ...
│   ├── config/              # Configuration
│   │   └── contracts.ts     # Contract addresses and ABI
│   └── utils/               # Utilities
├── e2e/                     # E2E tests
│   └── aave.spec.ts         # MetaMask tests
├── .env                     # Environment variables
└── package.json
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview build |
| `npm run test` | Unit tests (watch) |
| `npm run test:run` | Unit tests (single run) |
| `npm run test:e2e` | E2E tests |
| `npm run lint` | Lint check |

---

## Implementation Details

### Automatic Approve + Deposit/Repay

When allowance is insufficient, automatically:
1. Approval is requested
2. After confirmation, deposit/repay is executed immediately

### Toast Deduplication

Uses `useRef<Set<string>>` to track shown notifications by transaction hash to avoid duplicates.

### Transaction Status Tracking

Checks `receipt.status === 'success'` to determine transaction success, not just `isSuccess` from wagmi.

### Auto-select Token in RepayForm

If the user has no debt for the selected token, the first token with debt is automatically selected.

---

## Troubleshooting

### "Reserve is inactive" (Error 51)

DAI and USDC are frozen on Aave Sepolia. Use LINK, WBTC, or AAVE.

### Transaction is Stuck

1. Check that you have enough ETH for gas
2. Try increasing gas in MetaMask
3. Cancel the transaction and retry

### Tests are Failing

1. Make sure `SEED_PHRASE` is correct
2. Check test token balance
3. Run `npx playwright install` to update browsers
