import { useEffect, useCallback, memo } from 'react'
import { useBorrow } from '../hooks/useBorrow'
import { useAccountData } from '../hooks/useAccountData'
import { useTransactionForm } from '../hooks/useTransactionForm'
import { useRefetchAll } from '../hooks/useRefetchAll'
import { showTransactionSuccess, showTransactionReverted, showTransactionError } from '../utils/transactionToast'
import { TRANSACTION_THRESHOLDS } from '../config/constants'
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

interface BorrowFormProps {
  selectedToken?: string
  onTokenChange?: (token: string) => void
  disabled?: boolean
}

export const BorrowForm = memo(function BorrowForm({
  selectedToken: externalSelectedToken,
  onTokenChange,
  disabled = false,
}: BorrowFormProps) {
  const {
    selectedTokenSymbol,
    selectedTokenData,
    handleTokenSelect,
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

  const { availableBorrows } = useAccountData()
  const { refetchAfterBorrow } = useRefetchAll()

  const {
    handleBorrow,
    isBorrowing,
    isBorrowConfirming,
    isBorrowSuccess,
    isBorrowReverted,
    borrowHash,
    borrowError,
  } = useBorrow(
    selectedTokenData?.address ?? tokens[0]?.address ?? '0x0000000000000000000000000000000000000001',
    selectedTokenData?.decimals ?? tokens[0]?.decimals ?? 18
  )

  const availableBorrowsNum = parseFloat(availableBorrows)

  // Validation
  useEffect(() => {
    validateAmount([
      { condition: !!amount && amountNum <= 0, message: 'Amount must be greater than zero' },
      { condition: !!amount && availableBorrowsNum > 0 && amountNum > availableBorrowsNum, message: 'Amount exceeds available borrows' },
    ])
  }, [amount, amountNum, availableBorrowsNum, validateAmount])

  // Transaction effects
  useEffect(() => {
    if (isBorrowSuccess && borrowHash && !hasShownToast(`borrow-${borrowHash}`)) {
      markToastShown(`borrow-${borrowHash}`)
      setAmount('')
      void refetchAfterBorrow()
      showTransactionSuccess('Borrowed successfully!', { explorerUrl, hash: borrowHash })
    }
  }, [isBorrowSuccess, borrowHash, refetchAfterBorrow, explorerUrl, hasShownToast, markToastShown, setAmount])

  useEffect(() => {
    if (isBorrowReverted && borrowHash && !hasShownToast(`borrow-reverted-${borrowHash}`)) {
      markToastShown(`borrow-reverted-${borrowHash}`)
      showTransactionReverted('Borrow transaction reverted!', { explorerUrl, hash: borrowHash })
    }
  }, [isBorrowReverted, borrowHash, explorerUrl, hasShownToast, markToastShown])

  useEffect(() => {
    if (borrowError) {
      showTransactionError('Borrow', borrowError)
    }
  }, [borrowError])

  const canBorrow = amountNum > 0 && !error && availableBorrowsNum > 0
  const isLoading = isBorrowing || isBorrowConfirming

  const handlePrimaryAction = useCallback(async () => {
    if (!canBorrow) return

    // Confirm large borrows
    const isLargeAmount = amountNum > TRANSACTION_THRESHOLDS.LARGE_AMOUNT ||
      (availableBorrowsNum > 0 && amountNum / availableBorrowsNum > TRANSACTION_THRESHOLDS.BORROW_AVAILABLE_RATIO)
    if (isLargeAmount) {
      const confirmed = window.confirm(
        `You are about to borrow ${amountNum.toFixed(4)} ${selectedTokenSymbol} (${((amountNum / availableBorrowsNum) * 100).toFixed(1)}% of available). This will increase your liquidation risk. Continue?`
      )
      if (!confirmed) return
    }

    handleBorrow(amount)
  }, [canBorrow, amountNum, availableBorrowsNum, selectedTokenSymbol, amount, handleBorrow])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrow</CardTitle>
        <CardDescription>
          Borrow tokens against your collateral
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Select */}
        <div className="space-y-2">
          <Label>Token</Label>
          <Select
            value={selectedTokenSymbol}
            onValueChange={handleTokenSelect}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
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
          </div>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
              {error}
            </p>
          )}
          <p style={{ color: 'var(--subtext)', fontSize: '0.875rem' }}>
            Available to borrow: ${parseFloat(availableBorrows).toFixed(2)} USD
          </p>
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          onClick={handlePrimaryAction}
          disabled={disabled || isLoading || !canBorrow}
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {disabled
            ? 'Connect Wallet'
            : availableBorrowsNum === 0
            ? 'No collateral'
            : 'Borrow'}
        </Button>
      </CardContent>
    </Card>
  )
})
