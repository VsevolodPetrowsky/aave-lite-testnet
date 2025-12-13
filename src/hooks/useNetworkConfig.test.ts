import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNetworkConfig } from './useNetworkConfig'
import { NETWORK_CONFIG, DEFAULT_CHAIN_ID } from '../config/contracts'
import { sepolia, arbitrumSepolia, baseSepolia } from 'wagmi/chains'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

import { useAccount } from 'wagmi'
const mockUseAccount = vi.mocked(useAccount)

describe('useNetworkConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return Sepolia config when connected to Sepolia', () => {
    mockUseAccount.mockReturnValue({
      chain: { id: sepolia.id },
    } as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useNetworkConfig())

    expect(result.current.chainId).toBe(sepolia.id)
    expect(result.current.poolAddress).toBe(NETWORK_CONFIG[sepolia.id].pool)
    expect(result.current.tokens).toEqual(NETWORK_CONFIG[sepolia.id].tokens)
    expect(result.current.explorerUrl).toBe(NETWORK_CONFIG[sepolia.id].explorerUrl)
  })

  it('should return Arbitrum Sepolia config when connected to Arbitrum', () => {
    mockUseAccount.mockReturnValue({
      chain: { id: arbitrumSepolia.id },
    } as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useNetworkConfig())

    expect(result.current.chainId).toBe(arbitrumSepolia.id)
    expect(result.current.poolAddress).toBe(NETWORK_CONFIG[arbitrumSepolia.id].pool)
    expect(result.current.tokens).toEqual(NETWORK_CONFIG[arbitrumSepolia.id].tokens)
    expect(result.current.explorerUrl).toBe(NETWORK_CONFIG[arbitrumSepolia.id].explorerUrl)
  })

  it('should return Base Sepolia config when connected to Base', () => {
    mockUseAccount.mockReturnValue({
      chain: { id: baseSepolia.id },
    } as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useNetworkConfig())

    expect(result.current.chainId).toBe(baseSepolia.id)
    expect(result.current.poolAddress).toBe(NETWORK_CONFIG[baseSepolia.id].pool)
    expect(result.current.tokens).toEqual(NETWORK_CONFIG[baseSepolia.id].tokens)
    expect(result.current.explorerUrl).toBe(NETWORK_CONFIG[baseSepolia.id].explorerUrl)
  })

  it('should fallback to default chain when not connected', () => {
    mockUseAccount.mockReturnValue({
      chain: undefined,
    } as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useNetworkConfig())

    expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID)
    expect(result.current.poolAddress).toBe(NETWORK_CONFIG[DEFAULT_CHAIN_ID].pool)
  })

  it('should fallback to Sepolia for unknown networks', () => {
    mockUseAccount.mockReturnValue({
      chain: { id: 999999 }, // Unknown chain ID
    } as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useNetworkConfig())

    // Falls back to Sepolia config when chain is not in NETWORK_CONFIG
    expect(result.current.poolAddress).toBe(NETWORK_CONFIG[sepolia.id].pool)
    expect(result.current.tokens).toEqual(NETWORK_CONFIG[sepolia.id].tokens)
  })

  it('should return full config object', () => {
    mockUseAccount.mockReturnValue({
      chain: { id: sepolia.id },
    } as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useNetworkConfig())

    expect(result.current.config).toBeDefined()
    expect(result.current.config.pool).toBe(NETWORK_CONFIG[sepolia.id].pool)
    expect(result.current.config.tokens).toEqual(NETWORK_CONFIG[sepolia.id].tokens)
    expect(result.current.config.explorerUrl).toBe(NETWORK_CONFIG[sepolia.id].explorerUrl)
  })
})
