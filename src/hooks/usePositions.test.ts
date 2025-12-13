import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePositions } from './usePositions'
import { NETWORK_CONFIG } from '../config/contracts'
import { sepolia } from 'wagmi/chains'
import { Address, parseUnits } from 'viem'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useReadContracts: vi.fn(),
}))

import { useAccount, useReadContracts } from 'wagmi'

const mockUseAccount = vi.mocked(useAccount)
const mockUseReadContracts = vi.mocked(useReadContracts)

describe('usePositions', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  const sepoliaTokens = NETWORK_CONFIG[sepolia.id].tokens
  const mockRefetchSupply = vi.fn()
  const mockRefetchDebt = vi.fn()

  const mockATokenAddresses = sepoliaTokens.map(
    (_, i) => `0xaToken${i.toString().padStart(38, '0')}` as Address
  )
  const mockDebtTokenAddresses = sepoliaTokens.map(
    (_, i) => `0xdebt${i.toString().padStart(38, '0')}` as Address
  )

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAccount.mockReturnValue({
      address: mockAddress,
      chain: { id: sepolia.id },
    } as unknown as ReturnType<typeof useAccount>)
  })

  it('should return empty positions when loading', () => {
    mockUseReadContracts
      .mockReturnValueOnce({
        // Reserve data
        data: undefined,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        // aToken balances
        data: undefined,
        isLoading: true,
        refetch: mockRefetchSupply,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        // debt balances
        data: undefined,
        isLoading: true,
        refetch: mockRefetchDebt,
      } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => usePositions())

    expect(result.current.positions).toEqual([])
    expect(result.current.borrowings).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('should return positions with balances', () => {
    const mockReserveData = sepoliaTokens.map((_, i) => ({
      status: 'success' as const,
      result: {
        aTokenAddress: mockATokenAddresses[i],
        variableDebtTokenAddress: mockDebtTokenAddresses[i],
      },
    }))

    const mockATokenBalances = sepoliaTokens.map((token, i) => ({
      status: 'success' as const,
      result: i === 0 ? parseUnits('500', token.decimals) : 0n, // Only first token has balance
    }))

    const mockDebtBalances = sepoliaTokens.map(() => ({
      status: 'success' as const,
      result: 0n,
    }))

    mockUseReadContracts
      .mockReturnValueOnce({
        data: mockReserveData,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: mockATokenBalances,
        isLoading: false,
        refetch: mockRefetchSupply,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: mockDebtBalances,
        isLoading: false,
        refetch: mockRefetchDebt,
      } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => usePositions())

    expect(result.current.positions).toHaveLength(1)
    expect(result.current.positions[0].symbol).toBe('DAI')
    expect(result.current.positions[0].formatted).toBe('500')
    expect(result.current.borrowings).toHaveLength(0)
    expect(result.current.isLoading).toBe(false)
  })

  it('should return borrowings with balances', () => {
    const mockReserveData = sepoliaTokens.map((_, i) => ({
      status: 'success' as const,
      result: {
        aTokenAddress: mockATokenAddresses[i],
        variableDebtTokenAddress: mockDebtTokenAddresses[i],
      },
    }))

    const mockATokenBalances = sepoliaTokens.map(() => ({
      status: 'success' as const,
      result: 0n,
    }))

    const mockDebtBalances = sepoliaTokens.map((token, i) => ({
      status: 'success' as const,
      result: i === 1 ? parseUnits('200', token.decimals) : 0n, // USDC has debt
    }))

    mockUseReadContracts
      .mockReturnValueOnce({
        data: mockReserveData,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: mockATokenBalances,
        isLoading: false,
        refetch: mockRefetchSupply,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: mockDebtBalances,
        isLoading: false,
        refetch: mockRefetchDebt,
      } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => usePositions())

    expect(result.current.positions).toHaveLength(0)
    expect(result.current.borrowings).toHaveLength(1)
    expect(result.current.borrowings[0].symbol).toBe('USDC')
    expect(result.current.borrowings[0].formatted).toBe('200')
  })

  it('should filter out positions with zero balance', () => {
    const mockReserveData = sepoliaTokens.map((_, i) => ({
      status: 'success' as const,
      result: {
        aTokenAddress: mockATokenAddresses[i],
        variableDebtTokenAddress: mockDebtTokenAddresses[i],
      },
    }))

    const mockATokenBalances = sepoliaTokens.map(() => ({
      status: 'success' as const,
      result: 0n,
    }))

    const mockDebtBalances = sepoliaTokens.map(() => ({
      status: 'success' as const,
      result: 0n,
    }))

    mockUseReadContracts
      .mockReturnValueOnce({
        data: mockReserveData,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: mockATokenBalances,
        isLoading: false,
        refetch: mockRefetchSupply,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: mockDebtBalances,
        isLoading: false,
        refetch: mockRefetchDebt,
      } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => usePositions())

    expect(result.current.positions).toHaveLength(0)
    expect(result.current.borrowings).toHaveLength(0)
  })

  it('should handle failed reserve data reads', () => {
    const mockReserveData = sepoliaTokens.map(() => ({
      status: 'failure' as const,
      error: new Error('Failed'),
    }))

    mockUseReadContracts
      .mockReturnValueOnce({
        data: mockReserveData,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        refetch: mockRefetchSupply,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        refetch: mockRefetchDebt,
      } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => usePositions())

    expect(result.current.positions).toHaveLength(0)
  })

  it('should provide refetch function that refetches both', () => {
    mockUseReadContracts
      .mockReturnValueOnce({
        data: [],
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        refetch: mockRefetchSupply,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        refetch: mockRefetchDebt,
      } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => usePositions())

    act(() => {
      result.current.refetch()
    })

    expect(mockRefetchSupply).toHaveBeenCalled()
    expect(mockRefetchDebt).toHaveBeenCalled()
  })

  it('should include aToken address in positions', () => {
    const mockReserveData = sepoliaTokens.map((_, i) => ({
      status: 'success' as const,
      result: {
        aTokenAddress: mockATokenAddresses[i],
        variableDebtTokenAddress: mockDebtTokenAddresses[i],
      },
    }))

    const mockATokenBalances = sepoliaTokens.map((token, i) => ({
      status: 'success' as const,
      result: i === 0 ? parseUnits('100', token.decimals) : 0n,
    }))

    mockUseReadContracts
      .mockReturnValueOnce({
        data: mockReserveData,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: mockATokenBalances,
        isLoading: false,
        refetch: mockRefetchSupply,
      } as unknown as ReturnType<typeof useReadContracts>)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        refetch: mockRefetchDebt,
      } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => usePositions())

    expect(result.current.positions[0].aTokenAddress).toBe(mockATokenAddresses[0])
  })
})
