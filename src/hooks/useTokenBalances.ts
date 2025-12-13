import { useReadContracts, useAccount } from 'wagmi'
import { ERC20_ABI } from '../config/contracts'
import { formatUnits } from 'viem'
import { useNetworkConfig } from './useNetworkConfig'

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

export function useTokenBalances() {
  const { address } = useAccount()
  const { tokens } = useNetworkConfig()

  const { data, isLoading, refetch } = useReadContracts({
    contracts: address
      ? tokens.map((token) => ({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf' as const,
          args: [address],
        }))
      : [],
    query: {
      enabled: !!address,
    },
  })

  const balances = tokens.map((token, i) => {
    const rawBalance = parseBalance(data?.[i])
    return {
      ...token,
      balance: rawBalance,
      formatted: formatUnits(rawBalance, token.decimals),
    }
  })

  return { balances, isLoading, refetch }
}
