import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useNetworkConfig } from './useNetworkConfig'
import {
  showTransactionSuccess,
  showTransactionReverted,
  showTransactionError,
} from '../utils/transactionToast'

export interface ValidationRule {
  condition: boolean
  message: string
}

export interface TransactionState {
  isSuccess: boolean
  isReverted: boolean
  hash: string | undefined
  error: Error | null
}

interface UseTransactionFormOptions {
  externalSelectedToken?: string
  onTokenChange?: (token: string) => void
  defaultToken?: string
}

interface TransactionEffectConfig {
  /** Unique key for this transaction type (e.g., 'supply', 'withdraw') */
  key: string
  /** Success message to show in toast */
  successMessage: string
  /** Reverted message to show in toast */
  revertedMessage: string
  /** Error operation name (e.g., 'Deposit', 'Withdraw') */
  errorOperation: string
  /** Transaction state from the underlying hook */
  state: TransactionState
  /** Callbacks to run on success (refetch, etc.) */
  onSuccess?: () => void | Promise<void>
  /** Whether to clear amount on success (default: true) */
  clearAmountOnSuccess?: boolean
}

export function useTransactionForm(options: UseTransactionFormOptions = {}) {
  const { externalSelectedToken, onTokenChange, defaultToken } = options
  const { tokens, explorerUrl } = useNetworkConfig()

  // Token selection state
  const [internalSelectedToken, setInternalSelectedToken] = useState<string>(
    defaultToken || tokens[0]?.symbol || 'USDC'
  )
  const selectedTokenSymbol = externalSelectedToken || internalSelectedToken

  // Amount state
  const [amount, setAmount] = useState('')

  // Error state
  const [error, setError] = useState('')

  // Track which toasts we've shown to prevent duplicates
  const shownToasts = useRef<Set<string>>(new Set())

  // Selected token data
  const selectedTokenData = useMemo(
    () => tokens.find((t) => t.symbol === selectedTokenSymbol),
    [tokens, selectedTokenSymbol]
  )

  // Handle token selection
  const handleTokenSelect = useCallback(
    (value: string) => {
      if (onTokenChange) {
        onTokenChange(value)
      } else {
        setInternalSelectedToken(value)
      }
      setAmount('')
      setError('')
      shownToasts.current.clear()
    },
    [onTokenChange]
  )

  // Validate amount with custom rules
  const validateAmount = useCallback((rules: ValidationRule[]) => {
    setError('')
    for (const rule of rules) {
      if (rule.condition) {
        setError(rule.message)
        return false
      }
    }
    return true
  }, [])

  // Create transaction effect handler
  const createTransactionEffect = useCallback(
    (config: TransactionEffectConfig) => {
      const { key, successMessage, revertedMessage, errorOperation, state, onSuccess, clearAmountOnSuccess = true } = config
      const { isSuccess, isReverted, hash, error: txError } = state

      // Handle success
      if (isSuccess && hash && !shownToasts.current.has(`${key}-${hash}`)) {
        shownToasts.current.add(`${key}-${hash}`)
        if (clearAmountOnSuccess) {
          setAmount('')
        }
        if (onSuccess) {
          void Promise.resolve(onSuccess())
        }
        showTransactionSuccess(successMessage, { explorerUrl, hash })
      }

      // Handle reverted
      if (isReverted && hash && !shownToasts.current.has(`${key}-reverted-${hash}`)) {
        shownToasts.current.add(`${key}-reverted-${hash}`)
        showTransactionReverted(revertedMessage, { explorerUrl, hash })
      }

      // Handle error
      if (txError) {
        showTransactionError(errorOperation, txError)
      }
    },
    [explorerUrl]
  )

  // Hook for handling transaction effects declaratively
  const useTransactionEffects = (configs: TransactionEffectConfig[]) => {
    useEffect(() => {
      configs.forEach((config) => {
        createTransactionEffect(config)
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, configs.flatMap((c) => [c.state.isSuccess, c.state.isReverted, c.state.hash, c.state.error]))
  }

  // Clear shown toasts (useful for resetting state)
  const clearShownToasts = useCallback(() => {
    shownToasts.current.clear()
  }, [])

  // Check if a toast was already shown
  const hasShownToast = useCallback((key: string) => {
    return shownToasts.current.has(key)
  }, [])

  // Mark a toast as shown
  const markToastShown = useCallback((key: string) => {
    shownToasts.current.add(key)
  }, [])

  return {
    // Token selection
    selectedTokenSymbol,
    selectedTokenData,
    handleTokenSelect,
    tokens,

    // Amount handling
    amount,
    setAmount,
    amountNum: parseFloat(amount || '0'),

    // Error handling
    error,
    setError,
    validateAmount,

    // Toast tracking
    shownToasts,
    clearShownToasts,
    hasShownToast,
    markToastShown,

    // Transaction effects
    createTransactionEffect,
    useTransactionEffects,

    // Network
    explorerUrl,
  }
}
