import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTokenBalances } from './useTokenBalances'
import { sepolia } from 'wagmi/chains'
import { NETWORK_CONFIG } from '../config/contracts'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useReadContracts: vi.fn(),
}))

import { useAccount, useReadContracts } from 'wagmi'
const mockUseAccount = vi.mocked(useAccount)
const mockUseReadContracts = vi.mocked(useReadContracts)

describe('useTokenBalances', () => {
  const sepoliaTokens = NETWORK_CONFIG[sepolia.id].tokens
  const mockAddress = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      chain: { id: sepolia.id },
    } as unknown as ReturnType<typeof useAccount>)
  })

  it('should return empty balances when data is loading', () => {
    mockUseReadContracts.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useTokenBalances())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.balances).toHaveLength(sepoliaTokens.length)
    result.current.balances.forEach((balance) => {
      expect(balance.balance).toBe(0n)
      expect(balance.formatted).toBe('0')
    })
  })

  it('should return formatted balances when data is available', () => {
    const mockBalanceData = sepoliaTokens.map((_token, index) => ({
      status: 'success' as const,
      result: BigInt((index + 1) * 1000000000000000000), // 1, 2, 3... tokens
    }))

    mockUseReadContracts.mockReturnValue({
      data: mockBalanceData,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useTokenBalances())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.balances).toHaveLength(sepoliaTokens.length)

    // Check first token (DAI with 18 decimals)
    expect(result.current.balances[0].symbol).toBe('DAI')
    expect(result.current.balances[0].balance).toBe(1000000000000000000n)
    expect(result.current.balances[0].formatted).toBe('1')
  })

  it('should handle USDC balance with 6 decimals correctly', () => {
    const usdcIndex = sepoliaTokens.findIndex((t) => t.symbol === 'USDC')
    const mockBalanceData = sepoliaTokens.map((_, index) => ({
      status: 'success' as const,
      result: index === usdcIndex ? BigInt(500000000) : 0n, // 500 USDC
    }))

    mockUseReadContracts.mockReturnValue({
      data: mockBalanceData,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useTokenBalances())

    const usdcBalance = result.current.balances.find((b) => b.symbol === 'USDC')
    expect(usdcBalance?.balance).toBe(500000000n)
    expect(usdcBalance?.formatted).toBe('500')
  })

  it('should handle failed contract reads', () => {
    const mockBalanceData = sepoliaTokens.map(() => ({
      status: 'failure' as const,
      error: new Error('Failed to read'),
    }))

    mockUseReadContracts.mockReturnValue({
      data: mockBalanceData,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useTokenBalances())

    result.current.balances.forEach((balance) => {
      expect(balance.balance).toBe(0n)
      expect(balance.formatted).toBe('0')
    })
  })

  it('should provide refetch function', () => {
    const mockRefetch = vi.fn()
    mockUseReadContracts.mockReturnValue({
      data: [],
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useTokenBalances())

    expect(result.current.refetch).toBe(mockRefetch)
  })

  it('should include token metadata in balances', () => {
    const mockBalanceData = sepoliaTokens.map(() => ({
      status: 'success' as const,
      result: BigInt(1000000000000000000),
    }))

    mockUseReadContracts.mockReturnValue({
      data: mockBalanceData,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useTokenBalances())

    result.current.balances.forEach((balance, index) => {
      expect(balance.symbol).toBe(sepoliaTokens[index].symbol)
      expect(balance.name).toBe(sepoliaTokens[index].name)
      expect(balance.address).toBe(sepoliaTokens[index].address)
      expect(balance.decimals).toBe(sepoliaTokens[index].decimals)
    })
  })
})
