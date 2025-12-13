import { useEffect, useRef } from 'react'
import { showTransactionSuccess, showTransactionReverted, showTransactionError } from '../utils/transactionToast'

interface TransactionState {
  isSuccess: boolean
  isReverted: boolean
  hash?: `0x${string}`
  error?: Error | null
}

interface TransactionEffectsOptions {
  transactionName: string
  explorerUrl: string
  onSuccess?: () => void
}

/**
 * Consolidated hook for handling transaction effects (success, reverted, error)
 * Reduces dependency arrays by using refs for callbacks
 */
export function useTransactionEffects(
  state: TransactionState,
  options: TransactionEffectsOptions,
  hasShownToast: (key: string) => boolean,
  markToastShown: (key: string) => void
) {
  const { transactionName, explorerUrl, onSuccess } = options
  const { isSuccess, isReverted, hash, error } = state

  // Use refs to avoid dependency array bloat
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const explorerUrlRef = useRef(explorerUrl)
  explorerUrlRef.current = explorerUrl

  // Handle success
  useEffect(() => {
    if (isSuccess && hash && !hasShownToast(`${transactionName}-${hash}`)) {
      markToastShown(`${transactionName}-${hash}`)
      onSuccessRef.current?.()
      showTransactionSuccess(`${transactionName} successful!`, {
        explorerUrl: explorerUrlRef.current,
        hash,
      })
    }
  }, [isSuccess, hash, transactionName, hasShownToast, markToastShown])

  // Handle reverted
  useEffect(() => {
    if (isReverted && hash && !hasShownToast(`${transactionName}-reverted-${hash}`)) {
      markToastShown(`${transactionName}-reverted-${hash}`)
      showTransactionReverted(`${transactionName} transaction reverted!`, {
        explorerUrl: explorerUrlRef.current,
        hash,
      })
    }
  }, [isReverted, hash, transactionName, hasShownToast, markToastShown])

  // Handle error
  useEffect(() => {
    if (error) {
      showTransactionError(transactionName, error)
    }
  }, [error, transactionName])
}

/**
 * Hook for handling approve transaction with pending action
 */
export function useApproveEffects(
  state: TransactionState & { refetchAllowance: () => void },
  options: TransactionEffectsOptions & {
    onApproveSuccess?: () => void
    clearPending: () => void
  },
  hasShownToast: (key: string) => boolean,
  markToastShown: (key: string) => void
) {
  const { isSuccess, isReverted, hash, error, refetchAllowance } = state
  const { explorerUrl, onApproveSuccess, clearPending } = options

  const onApproveSuccessRef = useRef(onApproveSuccess)
  onApproveSuccessRef.current = onApproveSuccess

  const explorerUrlRef = useRef(explorerUrl)
  explorerUrlRef.current = explorerUrl

  const clearPendingRef = useRef(clearPending)
  clearPendingRef.current = clearPending

  // Handle approve success
  useEffect(() => {
    if (isSuccess && hash && !hasShownToast(`approve-${hash}`)) {
      markToastShown(`approve-${hash}`)
      refetchAllowance()
      onApproveSuccessRef.current?.()
    }
  }, [isSuccess, hash, refetchAllowance, hasShownToast, markToastShown])

  // Handle approve reverted
  useEffect(() => {
    if (isReverted && hash && !hasShownToast(`approve-reverted-${hash}`)) {
      markToastShown(`approve-reverted-${hash}`)
      clearPendingRef.current()
      showTransactionReverted('Approve transaction reverted!', {
        explorerUrl: explorerUrlRef.current,
        hash,
      })
    }
  }, [isReverted, hash, hasShownToast, markToastShown])

  // Handle approve error
  useEffect(() => {
    if (error) {
      clearPendingRef.current()
      showTransactionError('Approve', error)
    }
  }, [error])
}
