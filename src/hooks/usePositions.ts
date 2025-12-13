import { useReadContracts, useAccount } from 'wagmi'
import { POOL_ABI, ERC20_ABI, Token } from '../config/contracts'
import { formatUnits, Address } from 'viem'
import { useNetworkConfig } from './useNetworkConfig'

interface ReserveData {
  aTokenAddress: Address
  variableDebtTokenAddress: Address
}

// Type guard to validate ReserveData shape from RPC
function isReserveData(value: unknown): value is ReserveData {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.aTokenAddress === 'string' &&
    obj.aTokenAddress.startsWith('0x') &&
    typeof obj.variableDebtTokenAddress === 'string' &&
    obj.variableDebtTokenAddress.startsWith('0x')
  )
}

// Safe extractor for ReserveData from contract result
function extractReserveData(result: { status: string; result?: unknown } | undefined): ReserveData | null {
  if (result?.status !== 'success') return null
  return isReserveData(result.result) ? result.result : null
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

// Helper to safely parse balance from contract result
function parseBalance(result: { status: string; result?: unknown } | undefined): bigint {
  if (result?.status !== 'success' || result.result === undefined) return 0n
  try {
    return BigInt(result.result as string)
  } catch (error) {
    console.error('Failed to parse balance:', error, result)
    return 0n
  }
}

// Helper to build balance contracts for token addresses
function buildBalanceContracts(
  tokens: Token[],
  tokenAddresses: (Address | null)[],
  userAddress: Address
) {
  return tokens.map((_, i) => ({
    address: tokenAddresses[i] ?? ZERO_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: [userAddress],
  }))
}

export function usePositions() {
  const { address } = useAccount()
  const { poolAddress, tokens } = useNetworkConfig()

  // First, get aToken and debt token addresses from pool
  const { data: reserveData } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'getReserveData',
      args: [token.address],
    })),
    query: {
      enabled: !!address,
    },
  })

  const aTokenAddresses = reserveData?.map((r) => {
    const data = extractReserveData(r)
    return data?.aTokenAddress ?? null
  }) ?? []

  const debtTokenAddresses = reserveData?.map((r) => {
    const data = extractReserveData(r)
    return data?.variableDebtTokenAddress ?? null
  }) ?? []

  const hasATokens = aTokenAddresses.some((a) => a !== null)
  const hasDebtTokens = debtTokenAddresses.some((a) => a !== null)

  // Get aToken balances (supply positions)
  const { data: aTokenBalances, isLoading: isLoadingSupply, refetch: refetchSupply } = useReadContracts({
    contracts: address ? buildBalanceContracts(tokens, aTokenAddresses, address) : [],
    query: {
      enabled: !!address && hasATokens,
    },
  })

  // Get debt token balances (borrow positions)
  const { data: debtTokenBalances, isLoading: isLoadingDebt, refetch: refetchDebt } = useReadContracts({
    contracts: address ? buildBalanceContracts(tokens, debtTokenAddresses, address) : [],
    query: {
      enabled: !!address && hasDebtTokens,
    },
  })

  // Supply positions (aTokens)
  const positions = tokens
    .map((token, i) => {
      const aTokenAddress = aTokenAddresses[i]
      if (!aTokenAddress) return null
      const rawBalance = parseBalance(aTokenBalances?.[i])
      return {
        ...token,
        aTokenAddress,
        balance: rawBalance,
        formatted: formatUnits(rawBalance, token.decimals),
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null && p.balance > 0n)

  // Borrow positions (debt tokens)
  const borrowings = tokens
    .map((token, i) => {
      const debtTokenAddress = debtTokenAddresses[i]
      if (!debtTokenAddress) return null
      const rawBalance = parseBalance(debtTokenBalances?.[i])
      return {
        ...token,
        debtTokenAddress,
        balance: rawBalance,
        formatted: formatUnits(rawBalance, token.decimals),
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null && p.balance > 0n)

  const refetch = async () => {
    await Promise.all([refetchSupply(), refetchDebt()])
  }

  return {
    positions,
    borrowings,
    isLoading: isLoadingSupply || isLoadingDebt,
    refetch,
  }
}
