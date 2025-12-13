import { useCallback } from 'react'
import { usePositions } from './usePositions'
import { useTokenBalances } from './useTokenBalances'
import { useAccountData } from './useAccountData'

/**
 * Centralized hook for batched data refetching
 * Reduces multiple sequential RPC calls to a single batched operation
 */
export function useRefetchAll() {
  const { refetch: refetchPositions } = usePositions()
  const { refetch: refetchBalances } = useTokenBalances()
  const { refetch: refetchAccountData } = useAccountData()

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchPositions(),
      refetchBalances(),
      refetchAccountData(),
    ])
  }, [refetchPositions, refetchBalances, refetchAccountData])

  const refetchAfterSupply = useCallback(async () => {
    await Promise.all([refetchBalances(), refetchPositions()])
  }, [refetchBalances, refetchPositions])

  const refetchAfterBorrow = useCallback(async () => {
    await Promise.all([refetchAccountData(), refetchPositions()])
  }, [refetchAccountData, refetchPositions])

  const refetchAfterRepay = useCallback(async () => {
    await Promise.all([refetchPositions(), refetchBalances()])
  }, [refetchPositions, refetchBalances])

  const refetchAfterWithdraw = useCallback(async () => {
    await Promise.all([refetchPositions(), refetchBalances(), refetchAccountData()])
  }, [refetchPositions, refetchBalances, refetchAccountData])

  return {
    refetchAll,
    refetchAfterSupply,
    refetchAfterBorrow,
    refetchAfterRepay,
    refetchAfterWithdraw,
  }
}
