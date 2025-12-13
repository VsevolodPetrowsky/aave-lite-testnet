import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseUnits, Address, maxUint256 } from 'viem'
import { POOL_ABI } from '../config/contracts'
import { useNetworkConfig } from './useNetworkConfig'

export function useWithdraw(tokenAddress: Address, decimals: number) {
  const { address } = useAccount()
  const { poolAddress } = useNetworkConfig()

  const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing, error: withdrawError, reset: resetWithdraw } = useWriteContract()

  const {
    isLoading: isWithdrawConfirming,
    isSuccess: isWithdrawConfirmed,
    data: withdrawReceipt,
    error: withdrawReceiptError,
  } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  })

  // Check transaction status
  const isWithdrawSuccess = isWithdrawConfirmed && withdrawReceipt?.status === 'success'
  const isWithdrawReverted = isWithdrawConfirmed && withdrawReceipt?.status === 'reverted'

  const handleWithdraw = (amount: string, isMax: boolean = false) => {
    if (!address) return
    resetWithdraw()
    const parsedAmount = isMax ? maxUint256 : parseUnits(amount, decimals)
    withdraw({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'withdraw',
      args: [tokenAddress, parsedAmount, address],
    })
  }

  return {
    handleWithdraw,
    isWithdrawing,
    isWithdrawConfirming,
    isWithdrawSuccess,
    isWithdrawReverted,
    withdrawHash,
    withdrawError: withdrawError || withdrawReceiptError,
  }
}
