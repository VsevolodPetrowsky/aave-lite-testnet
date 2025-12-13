import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { POOL_ABI } from '../config/contracts'
import { useNetworkConfig } from './useNetworkConfig'
import { HEALTH_FACTOR_THRESHOLDS } from '../config/constants'

type AccountData = readonly [bigint, bigint, bigint, bigint, bigint, bigint]

// Type guard to validate AccountData shape from RPC
function isAccountData(value: unknown): value is AccountData {
  if (!Array.isArray(value) || value.length !== 6) return false
  return value.every((item) => typeof item === 'bigint')
}

// Safe extractor for AccountData from contract result
function extractAccountData(data: unknown): AccountData | null {
  return isAccountData(data) ? data : null
}

export function useAccountData() {
  const { address } = useAccount()
  const { poolAddress } = useNetworkConfig()

  const { data, isLoading, refetch } = useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: 'getUserAccountData',
    args: [address!],
    query: {
      enabled: !!address,
    },
  })

  // Data is returned as array: [totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor]
  const result = extractAccountData(data)

  const totalCollateral = result ? formatUnits(result[0], 8) : '0'
  const totalDebt = result ? formatUnits(result[1], 8) : '0'
  const availableBorrows = result ? formatUnits(result[2], 8) : '0'
  const ltv = result ? Number(result[4]) / 100 : 0 // LTV is in basis points (10000 = 100%)
  const healthFactor = result && result[5] > 0n
    ? formatUnits(result[5], 18)
    : '0'

  // Health factor status
  const getHealthStatus = () => {
    const hf = parseFloat(healthFactor)
    if (hf === 0 || !result || result[1] === 0n) return 'safe' // No debt
    if (hf < HEALTH_FACTOR_THRESHOLDS.LIQUIDATION) return 'danger'
    if (hf < HEALTH_FACTOR_THRESHOLDS.WARNING) return 'warning'
    return 'safe'
  }

  return {
    totalCollateral,
    totalDebt,
    availableBorrows,
    ltv,
    healthFactor,
    healthStatus: getHealthStatus(),
    hasPosition: result ? result[0] > 0n || result[1] > 0n : false,
    isLoading,
    refetch,
  }
}
