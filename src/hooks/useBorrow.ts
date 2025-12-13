import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { parseUnits, Address, maxUint256 } from 'viem'
import { POOL_ABI, ERC20_ABI } from '../config/contracts'
import { useNetworkConfig } from './useNetworkConfig'

// Variable rate mode = 2 (Aave V3)
const VARIABLE_RATE_MODE = 2n

export function useBorrow(tokenAddress: Address, decimals: number) {
  const { address } = useAccount()
  const { poolAddress } = useNetworkConfig()

  const { writeContract: borrow, data: borrowHash, isPending: isBorrowing, error: borrowError, reset: resetBorrow } = useWriteContract()
  const { writeContract: repay, data: repayHash, isPending: isRepaying, error: repayError, reset: resetRepay } = useWriteContract()
  const { writeContract: approve, data: approveHash, isPending: isApproving, error: approveError, reset: resetApprove } = useWriteContract()

  const {
    isLoading: isBorrowConfirming,
    isSuccess: isBorrowConfirmed,
    data: borrowReceipt,
    error: borrowReceiptError,
  } = useWaitForTransactionReceipt({
    hash: borrowHash,
  })

  const {
    isLoading: isRepayConfirming,
    isSuccess: isRepayConfirmed,
    data: repayReceipt,
    error: repayReceiptError,
  } = useWaitForTransactionReceipt({
    hash: repayHash,
  })

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveConfirmed,
    data: approveReceipt,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Check transaction statuses
  const isBorrowSuccess = isBorrowConfirmed && borrowReceipt?.status === 'success'
  const isBorrowReverted = isBorrowConfirmed && borrowReceipt?.status === 'reverted'
  const isRepaySuccess = isRepayConfirmed && repayReceipt?.status === 'success'
  const isRepayReverted = isRepayConfirmed && repayReceipt?.status === 'reverted'
  const isApproveSuccess = isApproveConfirmed && approveReceipt?.status === 'success'
  const isApproveReverted = isApproveConfirmed && approveReceipt?.status === 'reverted'

  // Check allowance for repay
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, poolAddress],
    query: {
      enabled: !!address,
    },
  })

  const handleBorrow = (amount: string) => {
    if (!address) return
    resetBorrow()
    const parsedAmount = parseUnits(amount, decimals)
    borrow({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'borrow',
      args: [tokenAddress, parsedAmount, VARIABLE_RATE_MODE, 0, address],
    })
  }

  const handleRepay = (amount: string, isMax: boolean = false) => {
    if (!address) return
    resetRepay()
    const parsedAmount = isMax ? maxUint256 : parseUnits(amount, decimals)
    repay({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'repay',
      args: [tokenAddress, parsedAmount, VARIABLE_RATE_MODE, address],
    })
  }

  const handleApprove = (amount: string) => {
    resetApprove()
    const parsedAmount = parseUnits(amount, decimals)
    approve({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [poolAddress, parsedAmount],
    })
  }

  return {
    // Borrow
    handleBorrow,
    isBorrowing,
    isBorrowConfirming,
    isBorrowSuccess,
    isBorrowReverted,
    borrowHash,
    borrowError: borrowError || borrowReceiptError,
    // Repay
    handleRepay,
    isRepaying,
    isRepayConfirming,
    isRepaySuccess,
    isRepayReverted,
    repayHash,
    repayError: repayError || repayReceiptError,
    // Approve (for repay)
    handleApprove,
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    isApproveReverted,
    approveHash,
    approveError: approveError || approveReceiptError,
    allowance: allowance ?? 0n,
    refetchAllowance,
  }
}
