import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useBorrow } from '../hooks/useBorrow'
import { usePositions } from '../hooks/usePositions'
import { useTokenBalances } from '../hooks/useTokenBalances'
import { useTransactionForm } from '../hooks/useTransactionForm'
import { useRefetchAll } from '../hooks/useRefetchAll'
import { showTransactionSuccess, showTransactionReverted, showTransactionError } from '../utils/transactionToast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RepayFormProps {
  selectedToken?: string
  onTokenChange?: (token: string) => void
  disabled?: boolean
}

export const RepayForm = memo(function RepayForm({
  selectedToken: externalSelectedToken,
  onTokenChange,
  disabled = false,
}: RepayFormProps) {
  const { address } = useAccount()
  const {
    selectedTokenSymbol,
    selectedTokenData,
    handleTokenSelect: baseHandleTokenSelect,
    tokens,
    amount,
    setAmount,
    amountNum,
    error,
    validateAmount,
    hasShownToast,
    markToastShown,
    explorerUrl,
  } = useTransactionForm({
    externalSelectedToken,
    onTokenChange,
  })

  const [pendingRepayAmount, setPendingRepayAmount] = useState<string | null>(null)
  const [pendingRepayIsMax, setPendingRepayIsMax] = useState(false)
  const { borrowings } = usePositions()
  const { balances } = useTokenBalances()
  const { refetchAfterRepay } = useRefetchAll()

  // Only show tokens that have debt - compute early for effectiveSelectedToken
  const tokensWithDebt = useMemo(
    () => tokens.filter((token) => borrowings.some((b) => b.symbol === token.symbol)),
    [tokens, borrowings]
  )

  // Effective token - must be from tokensWithDebt, fallback to first token with debt
  const effectiveSelectedToken = useMemo(() => {
    if (tokensWithDebt.some(t => t.symbol === selectedTokenSymbol)) {
      return selectedTokenSymbol
    }
    return tokensWithDebt[0]?.symbol || selectedTokenSymbol
  }, [tokensWithDebt, selectedTokenSymbol])

  // Get token data for effective selection
  const effectiveTokenData = useMemo(() => {
    return tokens.find(t => t.symbol === effectiveSelectedToken) || selectedTokenData
  }, [tokens, effectiveSelectedToken, selectedTokenData])

  // Auto-select first token with debt if current selection has no debt
  useEffect(() => {
    if (borrowings.length > 0 && !externalSelectedToken) {
      const hasDebt = borrowings.some((b) => b.symbol === selectedTokenSymbol)
      if (!hasDebt) {
        baseHandleTokenSelect(borrowings[0].symbol)
      }
    }
  }, [borrowings, selectedTokenSymbol, externalSelectedToken, baseHandleTokenSelect])

  const {
    handleRepay,
    handleApprove,
    isRepaying,
    isRepayConfirming,
    isRepaySuccess,
    isRepayReverted,
    repayHash,
    repayError,
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    isApproveReverted,
    approveHash,
    approveError,
    allowance,
    refetchAllowance,
  } = useBorrow(
    effectiveTokenData?.address ?? tokens[0]?.address ?? '0x0000000000000000000000000000000000000001',
    effectiveTokenData?.decimals ?? tokens[0]?.decimals ?? 18
  )

  // Ref for handleRepay to avoid dependency bloat
  const handleRepayRef = useRef(handleRepay);
  handleRepayRef.current = handleRepay;

  // Handle approve success - auto-trigger repay
  useEffect(() => {
    let cancelled = false

    if (isApproveSuccess && approveHash && !hasShownToast(`approve-${approveHash}`)) {
      markToastShown(`approve-${approveHash}`)
      toast.success('Token approved! Starting repay...')

      if (pendingRepayAmount && address) {
        // Wait for allowance refetch to complete before triggering repay
        const triggerRepay = async () => {
          await refetchAllowance()
          if (cancelled) return
          handleRepayRef.current(pendingRepayAmount, pendingRepayIsMax)
          setPendingRepayAmount(null)
          setPendingRepayIsMax(false)
        }
        void triggerRepay()
      } else {
        void refetchAllowance()
      }
    }

    return () => {
      cancelled = true
    }
  }, [isApproveSuccess, approveHash, refetchAllowance, pendingRepayAmount, pendingRepayIsMax, address, hasShownToast, markToastShown])

  // Handle approve reverted
  useEffect(() => {
    if (isApproveReverted && approveHash && !hasShownToast(`approve-reverted-${approveHash}`)) {
      markToastShown(`approve-reverted-${approveHash}`)
      setPendingRepayAmount(null)
      setPendingRepayIsMax(false)
      showTransactionReverted('Approve transaction reverted!', { explorerUrl, hash: approveHash })
    }
  }, [isApproveReverted, approveHash, explorerUrl, hasShownToast, markToastShown])

  // Handle repay success
  useEffect(() => {
    if (isRepaySuccess && repayHash && !hasShownToast(`repay-${repayHash}`)) {
      markToastShown(`repay-${repayHash}`)
      setAmount('')
      void refetchAfterRepay()
      showTransactionSuccess('Repaid successfully!', { explorerUrl, hash: repayHash })
    }
  }, [isRepaySuccess, repayHash, refetchAfterRepay, explorerUrl, hasShownToast, markToastShown, setAmount])

  // Handle repay reverted
  useEffect(() => {
    if (isRepayReverted && repayHash && !hasShownToast(`repay-reverted-${repayHash}`)) {
      markToastShown(`repay-reverted-${repayHash}`)
      showTransactionReverted('Repay transaction reverted!', { explorerUrl, hash: repayHash })
    }
  }, [isRepayReverted, repayHash, explorerUrl, hasShownToast, markToastShown])

  // Handle approve errors
  useEffect(() => {
    if (approveError) {
      setPendingRepayAmount(null)
      setPendingRepayIsMax(false)
      showTransactionError('Approve', approveError)
    }
  }, [approveError])

  // Handle repay errors
  useEffect(() => {
    if (repayError) {
      showTransactionError('Repay', repayError)
    }
  }, [repayError])

  const parsedAmount = useMemo(
    () =>
      amount && selectedTokenData
        ? parseUnits(amount || '0', selectedTokenData.decimals)
        : 0n,
    [amount, selectedTokenData]
  )

  const needsApproval = parsedAmount > allowance

  // Get debt for selected token
  const selectedBorrowing = borrowings.find((b) => b.symbol === selectedTokenSymbol)
  const debtBalance = parseFloat(selectedBorrowing?.formatted || '0')

  // Get wallet balance for selected token
  const selectedBalance = balances.find((b) => b.symbol === selectedTokenSymbol)
  const walletBalance = parseFloat(selectedBalance?.formatted || '0')

  // Validation
  useEffect(() => {
    validateAmount([
      { condition: !!amount && amountNum > walletBalance, message: 'Insufficient balance' },
      { condition: !!amount && amountNum > debtBalance, message: 'Amount exceeds debt' },
      { condition: !!amount && amountNum <= 0, message: 'Amount must be greater than zero' },
    ])
  }, [amount, amountNum, walletBalance, debtBalance, validateAmount])

  const handleMaxClick = useCallback(() => {
    // Use the smaller of wallet balance or debt (compare raw bigints to avoid floating-point errors)
    const walletRaw = selectedBalance?.balance ?? 0n
    const debtRaw = selectedBorrowing?.balance ?? 0n
    const decimals = selectedTokenData?.decimals ?? 18
    const maxRaw = walletRaw < debtRaw ? walletRaw : debtRaw
    setAmount(formatUnits(maxRaw, decimals))
  }, [selectedBalance, selectedBorrowing, selectedTokenData, setAmount])

  const handleTokenSelect = useCallback(
    (value: string) => {
      setPendingRepayAmount(null)
      setPendingRepayIsMax(false)
      baseHandleTokenSelect(value)
    },
    [baseHandleTokenSelect]
  )

  const canRepay = !needsApproval && amountNum > 0 && amountNum <= walletBalance && !error
  const isLoading = isApproving || isApproveConfirming || isRepaying || isRepayConfirming

  const handlePrimaryAction = useCallback(async () => {
    if (needsApproval) {
      if (!amount || amountNum <= 0) return
      const isMax = amountNum >= debtBalance
      setPendingRepayAmount(amount)
      setPendingRepayIsMax(isMax)
      handleApprove(amount)
    } else {
      if (!canRepay) return
      const isMax = amountNum >= debtBalance
      handleRepay(amount, isMax)
    }
  }, [needsApproval, amount, amountNum, debtBalance, canRepay, handleApprove, handleRepay])

  // Get debt for effective token
  const effectiveBorrowing = borrowings.find((b) => b.symbol === effectiveSelectedToken)
  const effectiveDebtBalance = parseFloat(effectiveBorrowing?.formatted || '0')

  // Get wallet balance for effective token
  const effectiveBalance = balances.find((b) => b.symbol === effectiveSelectedToken)
  const effectiveWalletBalance = parseFloat(effectiveBalance?.formatted || '0')

  if (tokensWithDebt.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repay</CardTitle>
          <CardDescription>
            Repay your borrowed tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ color: 'var(--subtext)', textAlign: 'center', padding: '1rem' }}>
            No active borrows to repay
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repay</CardTitle>
        <CardDescription>
          Repay your borrowed tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Select */}
        <div className="space-y-2">
          <Label>Token</Label>
          <Select
            value={effectiveSelectedToken}
            onValueChange={handleTokenSelect}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              {tokensWithDebt.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={disabled}
                className={error ? 'border-[var(--danger)]' : ''}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleMaxClick}
              disabled={disabled}
            >
              Max
            </Button>
          </div>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
              {error}
            </p>
          )}
          <p style={{ color: 'var(--subtext)', fontSize: '0.875rem' }}>
            Debt: {effectiveDebtBalance.toFixed(4)} {effectiveSelectedToken} | Wallet: {effectiveWalletBalance.toFixed(4)} {effectiveSelectedToken}
          </p>
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          onClick={handlePrimaryAction}
          disabled={
            disabled ||
            isLoading ||
            !amount ||
            amountNum <= 0 ||
            (needsApproval ? false : !!error)
          }
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {disabled
            ? 'Connect Wallet'
            : isApproving || isApproveConfirming
            ? 'Approving...'
            : isRepaying || isRepayConfirming
            ? 'Repaying...'
            : needsApproval
            ? `Approve & Repay ${effectiveSelectedToken}`
            : 'Repay'}
        </Button>
      </CardContent>
    </Card>
  )
})
