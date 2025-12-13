import { Address } from 'viem'
import { sepolia, arbitrumSepolia, baseSepolia } from 'wagmi/chains'

export interface Token {
  symbol: string
  name: string
  address: Address
  decimals: number
}

export interface NetworkConfig {
  pool: Address
  tokens: Token[]
  explorerUrl: string
}

// Network configurations with Pool addresses and tokens
export const NETWORK_CONFIG: Record<number, NetworkConfig> = {
  // Sepolia
  [sepolia.id]: {
    pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as Address,
    explorerUrl: 'https://sepolia.etherscan.io',
    tokens: [
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' as Address,
        decimals: 18,
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address,
        decimals: 6,
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c' as Address,
        decimals: 18,
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5' as Address,
        decimals: 18,
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        address: '0x29f2D40B0605204364af54EC677bD022dA425d03' as Address,
        decimals: 8,
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' as Address,
        decimals: 6,
      },
      {
        symbol: 'AAVE',
        name: 'Aave Token',
        address: '0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a' as Address,
        decimals: 18,
      },
    ],
  },
  // Arbitrum Sepolia
  [arbitrumSepolia.id]: {
    pool: '0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff' as Address,
    explorerUrl: 'https://sepolia.arbiscan.io',
    tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as Address,
        decimals: 6,
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x1dF462e2712496373A347f8ad10802a5E95f053D' as Address,
        decimals: 18,
      },
    ],
  },
  // Base Sepolia
  [baseSepolia.id]: {
    pool: '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b' as Address,
    explorerUrl: 'https://sepolia.basescan.org',
    tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
        decimals: 6,
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x4200000000000000000000000000000000000006' as Address,
        decimals: 18,
      },
    ],
  },
}

// Default network (Sepolia)
export const DEFAULT_CHAIN_ID = sepolia.id

// Legacy exports for backward compatibility
export const POOL_ADDRESS = NETWORK_CONFIG[DEFAULT_CHAIN_ID].pool
export const TOKENS = NETWORK_CONFIG[DEFAULT_CHAIN_ID].tokens

// Minimal ERC20 ABI
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

// Aave V3 Pool ABI
export const POOL_ABI = [
  // Supply (deposit)
  {
    name: 'supply',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    outputs: [],
  },
  // Withdraw
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Borrow
  {
    name: 'borrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRateMode', type: 'uint256' },
      { name: 'referralCode', type: 'uint16' },
      { name: 'onBehalfOf', type: 'address' },
    ],
    outputs: [],
  },
  // Repay
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRateMode', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Get Reserve Data
  {
    name: 'getReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'configuration', type: 'uint256' },
          { name: 'liquidityIndex', type: 'uint128' },
          { name: 'currentLiquidityRate', type: 'uint128' },
          { name: 'variableBorrowIndex', type: 'uint128' },
          { name: 'currentVariableBorrowRate', type: 'uint128' },
          { name: 'currentStableBorrowRate', type: 'uint128' },
          { name: 'lastUpdateTimestamp', type: 'uint40' },
          { name: 'id', type: 'uint16' },
          { name: 'aTokenAddress', type: 'address' },
          { name: 'stableDebtTokenAddress', type: 'address' },
          { name: 'variableDebtTokenAddress', type: 'address' },
          { name: 'interestRateStrategyAddress', type: 'address' },
          { name: 'accruedToTreasury', type: 'uint128' },
          { name: 'unbacked', type: 'uint128' },
          { name: 'isolationModeTotalDebt', type: 'uint128' },
        ],
      },
    ],
  },
  // Get User Account Data
  {
    name: 'getUserAccountData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
  },
] as const
