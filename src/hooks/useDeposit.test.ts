import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDeposit } from './useDeposit'
import { NETWORK_CONFIG } from '../config/contracts'
import { sepolia } from 'wagmi/chains'
import { Address, parseUnits } from 'viem'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useReadContract: vi.fn(),
}))

// Mock useNetworkConfig
vi.mock('./useNetworkConfig', () => ({
  useNetworkConfig: vi.fn(),
}))

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi'
import { useNetworkConfig } from './useNetworkConfig'

const mockUseAccount = vi.mocked(useAccount)
const mockUseWriteContract = vi.mocked(useWriteContract)
const mockUseWaitForTransactionReceipt = vi.mocked(useWaitForTransactionReceipt)
const mockUseReadContract = vi.mocked(useReadContract)
const mockUseNetworkConfig = vi.mocked(useNetworkConfig)

describe('useDeposit', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  const daiToken = NETWORK_CONFIG[sepolia.id].tokens[0] // DAI
  const mockApprove = vi.fn()
  const mockSupply = vi.fn()
  const mockRefetchAllowance = vi.fn()

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

    mockUseWriteContract
      .mockReturnValueOnce({
        writeContract: mockApprove,
        data: undefined,
        isPending: false,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>)
      .mockReturnValueOnce({
        writeContract: mockSupply,
        data: undefined,
        isPending: false,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>)

    mockUseWaitForTransactionReceipt
      .mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)
      .mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)

    mockUseReadContract.mockReturnValue({
      data: 0n,
      refetch: mockRefetchAllowance,
    } as unknown as ReturnType<typeof useReadContract>)
  })

  it('should return initial state', () => {
    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    expect(result.current.allowance).toBe(0n)
    expect(result.current.isApproving).toBe(false)
    expect(result.current.isApproveConfirming).toBe(false)
    expect(result.current.isApproveSuccess).toBe(false)
    expect(result.current.isSupplying).toBe(false)
    expect(result.current.isSupplyConfirming).toBe(false)
    expect(result.current.isSupplySuccess).toBe(false)
  })

  it('should call approve with correct parameters', () => {
    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    act(() => {
      result.current.handleApprove('100')
    })

    expect(mockApprove).toHaveBeenCalledWith({
      address: daiToken.address,
      abi: expect.any(Array),
      functionName: 'approve',
      args: [NETWORK_CONFIG[sepolia.id].pool, parseUnits('100', 18)],
    })
  })

  it('should call deposit (supply) with correct parameters', () => {
    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    act(() => {
      result.current.handleDeposit('50')
    })

    expect(mockSupply).toHaveBeenCalledWith({
      address: NETWORK_CONFIG[sepolia.id].pool,
      abi: expect.any(Array),
      functionName: 'supply',
      args: [daiToken.address, parseUnits('50', 18), mockAddress, 0],
    })
  })

  it('should not call deposit when address is undefined', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      chain: { id: sepolia.id },
    } as unknown as ReturnType<typeof useAccount>)

    mockUseWriteContract
      .mockReturnValueOnce({
        writeContract: mockApprove,
        data: undefined,
        isPending: false,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>)
      .mockReturnValueOnce({
        writeContract: mockSupply,
        data: undefined,
        isPending: false,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>)

    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    act(() => {
      result.current.handleDeposit('50')
    })

    expect(mockSupply).not.toHaveBeenCalled()
  })

  it('should return allowance from contract read', () => {
    mockUseReadContract.mockReturnValue({
      data: parseUnits('1000', 18),
      refetch: mockRefetchAllowance,
    } as unknown as ReturnType<typeof useReadContract>)

    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    expect(result.current.allowance).toBe(parseUnits('1000', 18))
  })

  it('should provide refetchAllowance function', () => {
    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    expect(result.current.refetchAllowance).toBe(mockRefetchAllowance)
  })

  it('should handle pending states', () => {
    // Reset and set new mocks
    mockUseWriteContract.mockReset()
    mockUseWriteContract
      .mockReturnValueOnce({
        writeContract: mockApprove,
        data: undefined,
        isPending: true, // Approving
      } as unknown as ReturnType<typeof useWriteContract>)
      .mockReturnValueOnce({
        writeContract: mockSupply,
        data: undefined,
        isPending: false,
      } as unknown as ReturnType<typeof useWriteContract>)

    mockUseWaitForTransactionReceipt.mockReset()
    mockUseWaitForTransactionReceipt
      .mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)
      .mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)

    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    expect(result.current.isApproving).toBe(true)
  })

  it('should handle confirming states', () => {
    // Reset and set new mocks
    mockUseWriteContract.mockReset()
    mockUseWriteContract
      .mockReturnValueOnce({
        writeContract: mockApprove,
        data: undefined,
        isPending: false,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>)
      .mockReturnValueOnce({
        writeContract: mockSupply,
        data: undefined,
        isPending: false,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>)

    mockUseWaitForTransactionReceipt.mockReset()
    mockUseWaitForTransactionReceipt
      .mockReturnValueOnce({
        isLoading: true, // Approve confirming
        isSuccess: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)
      .mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)

    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    expect(result.current.isApproveConfirming).toBe(true)
  })

  it('should handle confirmed states', () => {
    // Reset and set new mocks
    mockUseWriteContract.mockReset()
    mockUseWriteContract
      .mockReturnValueOnce({
        writeContract: mockApprove,
        data: undefined,
        isPending: false,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>)
      .mockReturnValueOnce({
        writeContract: mockSupply,
        data: undefined,
        isPending: false,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>)

    mockUseWaitForTransactionReceipt.mockReset()
    mockUseWaitForTransactionReceipt
      .mockReturnValueOnce({
        isLoading: false,
        isSuccess: true, // Approve confirmed
        data: { status: 'success' }, // Receipt with success status
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)
      .mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
      } as unknown as ReturnType<typeof useWaitForTransactionReceipt>)

    const { result } = renderHook(() =>
      useDeposit(daiToken.address, daiToken.decimals)
    )

    expect(result.current.isApproveSuccess).toBe(true)
  })
})
