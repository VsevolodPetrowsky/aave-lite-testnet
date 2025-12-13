import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWithdraw } from './useWithdraw'
import { NETWORK_CONFIG } from '../config/contracts'
import { sepolia } from 'wagmi/chains'
import { Address, parseUnits, maxUint256 } from 'viem'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}))

// Mock useNetworkConfig
vi.mock('./useNetworkConfig', () => ({
  useNetworkConfig: vi.fn(),
}))

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useNetworkConfig } from './useNetworkConfig'

const mockUseAccount = vi.mocked(useAccount)
const mockUseWriteContract = vi.mocked(useWriteContract)
const mockUseWaitForTransactionReceipt = vi.mocked(useWaitForTransactionReceipt)
const mockUseNetworkConfig = vi.mocked(useNetworkConfig)

describe('useWithdraw', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  const daiToken = NETWORK_CONFIG[sepolia.id].tokens[0] // DAI
  const mockWithdraw = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAccount.mockReturnValue({
      address: mockAddress,
      chain: { id: sepolia.id },
    } as unknown as ReturnType<typeof useAccount>)

    mockUseNetworkConfig.mockReturnValue({
      chainId: sepolia.id,
      poolAddress: NETWORK_CONFIG[sepolia.id].pool,
      tokens: NETWORK_CONFIG[sepolia.id].tokens,
      explorerUrl: NETWORK_CONFIG[sepolia.id].explorerUrl,
      config: NETWORK_CONFIG[sepolia.id],
    })

    mockUseWriteContract.mockReturnValue({
      writeContract: mockWithdraw,
      data: undefined,
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useWriteContract>)

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)
  })

  it('should return initial state', () => {
    const { result } = renderHook(() =>
      useWithdraw(daiToken.address, daiToken.decimals)
    )

    expect(result.current.isWithdrawing).toBe(false)
    expect(result.current.isWithdrawConfirming).toBe(false)
    expect(result.current.isWithdrawSuccess).toBe(false)
  })

  it('should call withdraw with correct parameters', () => {
    const { result } = renderHook(() =>
      useWithdraw(daiToken.address, daiToken.decimals)
    )

    act(() => {
      result.current.handleWithdraw('100')
    })

    expect(mockWithdraw).toHaveBeenCalledWith({
      address: NETWORK_CONFIG[sepolia.id].pool,
      abi: expect.any(Array),
      functionName: 'withdraw',
      args: [daiToken.address, parseUnits('100', 18), mockAddress],
    })
  })

  it('should use maxUint256 when isMax is true', () => {
    const { result } = renderHook(() =>
      useWithdraw(daiToken.address, daiToken.decimals)
    )

    act(() => {
      result.current.handleWithdraw('100', true)
    })

    expect(mockWithdraw).toHaveBeenCalledWith({
      address: NETWORK_CONFIG[sepolia.id].pool,
      abi: expect.any(Array),
      functionName: 'withdraw',
      args: [daiToken.address, maxUint256, mockAddress],
    })
  })

  it('should not call withdraw when address is undefined', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      chain: { id: sepolia.id },
    } as unknown as ReturnType<typeof useAccount>)

    const { result } = renderHook(() =>
      useWithdraw(daiToken.address, daiToken.decimals)
    )

    act(() => {
      result.current.handleWithdraw('50')
    })

    expect(mockWithdraw).not.toHaveBeenCalled()
  })

  it('should handle pending state', () => {
    mockUseWriteContract.mockReturnValue({
      writeContract: mockWithdraw,
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useWriteContract>)

    const { result } = renderHook(() =>
      useWithdraw(daiToken.address, daiToken.decimals)
    )

    expect(result.current.isWithdrawing).toBe(true)
  })

  it('should handle confirming state', () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: true,
      isSuccess: false,
    } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)

    const { result } = renderHook(() =>
      useWithdraw(daiToken.address, daiToken.decimals)
    )

    expect(result.current.isWithdrawConfirming).toBe(true)
  })

  it('should handle confirmed state', () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      data: { status: 'success' }, // Receipt with success status
    } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)

    const { result } = renderHook(() =>
      useWithdraw(daiToken.address, daiToken.decimals)
    )

    expect(result.current.isWithdrawSuccess).toBe(true)
  })

  it('should handle USDC with 6 decimals correctly', () => {
    const usdcToken = NETWORK_CONFIG[sepolia.id].tokens.find(
      (t) => t.symbol === 'USDC'
    )!

    const { result } = renderHook(() =>
      useWithdraw(usdcToken.address, usdcToken.decimals)
    )

    act(() => {
      result.current.handleWithdraw('100')
    })

    expect(mockWithdraw).toHaveBeenCalledWith({
      address: NETWORK_CONFIG[sepolia.id].pool,
      abi: expect.any(Array),
      functionName: 'withdraw',
      args: [usdcToken.address, parseUnits('100', 6), mockAddress],
    })
  })
})
