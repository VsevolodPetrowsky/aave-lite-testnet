import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { parseUnits, Address } from 'viem'
import { POOL_ABI, ERC20_ABI } from '../config/contracts'
import { useNetworkConfig } from './useNetworkConfig'

export function useDeposit(tokenAddress: Address, decimals: number) {
  const { address } = useAccount()
  const { poolAddress } = useNetworkConfig()

  const { writeContract: approve, data: approveHash, isPending: isApproving, error: approveError, reset: resetApprove } = useWriteContract()
  const { writeContract: supply, data: supplyHash, isPending: isSupplying, error: supplyError, reset: resetSupply } = useWriteContract()

  // Track approve transaction receipt with full status
  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveConfirmed,
    data: approveReceipt,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Track supply transaction receipt with full status
  const {
    isLoading: isSupplyConfirming,
    isSuccess: isSupplyConfirmed,
    data: supplyReceipt,
    error: supplyReceiptError,
  } = useWaitForTransactionReceipt({
    hash: supplyHash,
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, poolAddress],
    query: {
      enabled: !!address,
    },
  })

  // Check if transactions actually succeeded (status === 'success')
  const isApproveSuccess = isApproveConfirmed && approveReceipt?.status === 'success'
  const isApproveReverted = isApproveConfirmed && approveReceipt?.status === 'reverted'
  const isSupplySuccess = isSupplyConfirmed && supplyReceipt?.status === 'success'
  const isSupplyReverted = isSupplyConfirmed && supplyReceipt?.status === 'reverted'

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

  const handleDeposit = (amount: string) => {
    if (!address) return
    resetSupply()
    const parsedAmount = parseUnits(amount, decimals)

    supply({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'supply',
      args: [tokenAddress, parsedAmount, address, 0],
    })
  }

  return {
    // Allowance
    allowance: allowance ?? 0n,
    refetchAllowance,

    // Actions
    handleApprove,
    handleDeposit,

    // Approve states
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    isApproveReverted,
    approveHash,
    approveError: approveError || approveReceiptError,

    // Supply states
    isSupplying,
    isSupplyConfirming,
    isSupplySuccess,
    isSupplyReverted,
    supplyHash,
    supplyError: supplyError || supplyReceiptError,
  }
}
