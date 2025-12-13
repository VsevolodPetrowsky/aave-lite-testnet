import { vi } from 'vitest'
import { Address } from 'viem'

// Mock wagmi hooks
export const mockUseAccount = vi.fn()
export const mockUseReadContracts = vi.fn()
export const mockUseReadContract = vi.fn()
export const mockUseWriteContract = vi.fn()
export const mockUseWaitForTransactionReceipt = vi.fn()
export const mockUseChainId = vi.fn()
export const mockUseConnect = vi.fn()
export const mockUseDisconnect = vi.fn()
export const mockUseSwitchChain = vi.fn()

// Default mock implementations
export const defaultAccountMock = {
  address: '0x1234567890123456789012345678901234567890' as Address,
  isConnected: true,
  isConnecting: false,
  isDisconnected: false,
}

export const defaultDisconnectedAccountMock = {
  address: undefined,
  isConnected: false,
  isConnecting: false,
  isDisconnected: true,
}

export const defaultWriteContractMock = {
  writeContract: vi.fn(),
  data: undefined,
  isPending: false,
  isError: false,
  error: null,
  reset: vi.fn(),
}

export const defaultWaitForTransactionMock = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: undefined,
}

export const defaultReadContractMock = {
  data: undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}

// Mock token data
export const mockTokens = [
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
]

export const mockPoolAddress = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as Address

// Mock balances
export const mockBalances = [
  { ...mockTokens[0], balance: 1000000000000000000000n, formatted: '1000.0' },
  { ...mockTokens[1], balance: 500000000n, formatted: '500.0' },
  { ...mockTokens[2], balance: 2000000000000000000n, formatted: '2.0' },
]

// Mock positions
export const mockPositions = [
  {
    ...mockTokens[0],
    aTokenAddress: '0xaToken1234567890123456789012345678901234' as Address,
    balance: 500000000000000000000n,
    formatted: '500.0',
  },
]

// Reset all mocks
export function resetMocks() {
  mockUseAccount.mockReset()
  mockUseReadContracts.mockReset()
  mockUseReadContract.mockReset()
  mockUseWriteContract.mockReset()
  mockUseWaitForTransactionReceipt.mockReset()
  mockUseChainId.mockReset()
  mockUseConnect.mockReset()
  mockUseDisconnect.mockReset()
  mockUseSwitchChain.mockReset()
}

// Setup default mocks
export function setupDefaultMocks() {
  mockUseAccount.mockReturnValue(defaultAccountMock)
  mockUseChainId.mockReturnValue(11155111) // Sepolia
  mockUseWriteContract.mockReturnValue(defaultWriteContractMock)
  mockUseWaitForTransactionReceipt.mockReturnValue(defaultWaitForTransactionMock)
  mockUseReadContract.mockReturnValue(defaultReadContractMock)
  mockUseReadContracts.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() })
  mockUseConnect.mockReturnValue({ connect: vi.fn(), connectors: [], isPending: false })
  mockUseDisconnect.mockReturnValue({ disconnect: vi.fn() })
  mockUseSwitchChain.mockReturnValue({ switchChain: vi.fn(), chains: [] })
}
