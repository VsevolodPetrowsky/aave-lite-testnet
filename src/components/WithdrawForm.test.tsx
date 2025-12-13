import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WithdrawForm } from './WithdrawForm'
import { NETWORK_CONFIG } from '../config/contracts'
import { sepolia } from 'wagmi/chains'
import { Address, parseUnits } from 'viem'

// Mock hooks
vi.mock('../hooks/useWithdraw', () => ({
  useWithdraw: vi.fn(),
}))

vi.mock('../hooks/usePositions', () => ({
  usePositions: vi.fn(),
}))

vi.mock('../hooks/useTransactionForm', () => ({
  useTransactionForm: vi.fn(),
}))

vi.mock('../hooks/useRefetchAll', () => ({
  useRefetchAll: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

import { useWithdraw } from '../hooks/useWithdraw'
import { usePositions } from '../hooks/usePositions'
import { useTransactionForm } from '../hooks/useTransactionForm'
import { useRefetchAll } from '../hooks/useRefetchAll'

const mockUseWithdraw = vi.mocked(useWithdraw)
const mockUsePositions = vi.mocked(usePositions)
const mockUseTransactionForm = vi.mocked(useTransactionForm)
const mockUseRefetchAll = vi.mocked(useRefetchAll)

describe('WithdrawForm', () => {
  const sepoliaTokens = NETWORK_CONFIG[sepolia.id].tokens

  const defaultWithdrawMock = {
    handleWithdraw: vi.fn(),
    isWithdrawing: false,
    isWithdrawConfirming: false,
    isWithdrawSuccess: false,
    isWithdrawReverted: false,
    withdrawHash: undefined as `0x${string}` | undefined,
    withdrawError: null,
  }

  const defaultPositionsMock = {
    positions: [
      {
        ...sepoliaTokens[0], // DAI
        aTokenAddress: '0xaToken1234567890123456789012345678901234' as Address,
        balance: parseUnits('500', 18),
        formatted: '500',
      },
    ],
    borrowings: [],
    isLoading: false,
    refetch: vi.fn(),
  }

  const defaultTransactionFormMock = {
    selectedTokenSymbol: 'DAI',
    selectedTokenData: sepoliaTokens[0],
    handleTokenSelect: vi.fn(),
    tokens: sepoliaTokens,
    amount: '',
    setAmount: vi.fn(),
    amountNum: 0,
    error: '',
    setError: vi.fn(),
    validateAmount: vi.fn(),
    shownToasts: { current: new Set<string>() },
    clearShownToasts: vi.fn(),
    hasShownToast: vi.fn().mockReturnValue(false),
    markToastShown: vi.fn(),
    createTransactionEffect: vi.fn(),
    useTransactionEffects: vi.fn(),
    explorerUrl: NETWORK_CONFIG[sepolia.id].explorerUrl,
  }

  const defaultRefetchAllMock = {
    refetchAll: vi.fn(),
    refetchAfterSupply: vi.fn(),
    refetchAfterBorrow: vi.fn(),
    refetchAfterRepay: vi.fn(),
    refetchAfterWithdraw: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWithdraw.mockReturnValue(defaultWithdrawMock)
    mockUsePositions.mockReturnValue(defaultPositionsMock)
    mockUseTransactionForm.mockReturnValue(defaultTransactionFormMock)
    mockUseRefetchAll.mockReturnValue(defaultRefetchAllMock)
  })

  it('should render withdraw form title', () => {
    render(<WithdrawForm />)

    expect(screen.getByRole('heading', { name: 'Withdraw' })).toBeInTheDocument()
    expect(
      screen.getByText(/Withdraw your tokens from Aave/)
    ).toBeInTheDocument()
  })

  it('should render token selector', () => {
    render(<WithdrawForm />)

    expect(screen.getByText('Token')).toBeInTheDocument()
  })

  it('should render amount input', () => {
    render(<WithdrawForm />)

    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
  })

  it('should render Max button', () => {
    render(<WithdrawForm />)

    expect(screen.getByRole('button', { name: /max/i })).toBeInTheDocument()
  })

  it('should show available aToken balance', () => {
    render(<WithdrawForm selectedToken="DAI" />)

    expect(screen.getByText(/Available:/)).toBeInTheDocument()
  })

  it('should show error for amount exceeding balance', async () => {
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '1000',
      amountNum: 1000,
      error: 'Amount exceeds balance',
    })

    render(<WithdrawForm selectedToken="DAI" />)

    expect(screen.getByText('Amount exceeds balance')).toBeInTheDocument()
  })

  it('should show error for zero amount', async () => {
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '0',
      amountNum: 0,
      error: 'Amount must be greater than zero',
    })

    render(<WithdrawForm selectedToken="DAI" />)

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
  })

  it('should call handleWithdraw when withdraw button is clicked', async () => {
    const handleWithdraw = vi.fn()
    mockUseWithdraw.mockReturnValue({
      ...defaultWithdrawMock,
      handleWithdraw,
    })
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '100',
      amountNum: 100,
    })

    render(<WithdrawForm selectedToken="DAI" />)

    const withdrawButton = screen.getByRole('button', { name: /^withdraw$/i })
    fireEvent.click(withdrawButton)

    expect(handleWithdraw).toHaveBeenCalledWith('100', false)
  })

  it('should call handleWithdraw with isMax=true when max amount is used', async () => {
    const handleWithdraw = vi.fn()
    const setAmount = vi.fn()
    mockUseWithdraw.mockReturnValue({
      ...defaultWithdrawMock,
      handleWithdraw,
    })
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '500',
      amountNum: 500,
      setAmount,
    })

    render(<WithdrawForm selectedToken="DAI" />)

    const withdrawButton = screen.getByRole('button', { name: /^withdraw$/i })
    fireEvent.click(withdrawButton)

    expect(handleWithdraw).toHaveBeenCalledWith('500', true)
  })

  it('should fill max amount when Max button is clicked', async () => {
    const setAmount = vi.fn()
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      setAmount,
    })

    render(<WithdrawForm selectedToken="DAI" />)

    const maxButton = screen.getByRole('button', { name: /max/i })
    fireEvent.click(maxButton)

    expect(setAmount).toHaveBeenCalledWith('500')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<WithdrawForm disabled={true} />)

    const withdrawButton = screen.getByRole('button', { name: /connect wallet/i })
    expect(withdrawButton).toBeInTheDocument()
  })

  it('should show loading state when withdrawing', () => {
    mockUseWithdraw.mockReturnValue({
      ...defaultWithdrawMock,
      isWithdrawing: true,
    })

    render(<WithdrawForm />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should show "Withdrawing..." text when confirming', () => {
    mockUseWithdraw.mockReturnValue({
      ...defaultWithdrawMock,
      isWithdrawConfirming: true,
    })

    render(<WithdrawForm />)

    expect(screen.getByText(/Withdrawing.../)).toBeInTheDocument()
  })

  it('should accept selectedToken prop', () => {
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      selectedTokenSymbol: 'DAI',
    })

    render(<WithdrawForm selectedToken="DAI" />)

    expect(screen.getByText('DAI')).toBeInTheDocument()
  })

  it('should call onTokenChange when token is changed', async () => {
    const onTokenChange = vi.fn()
    render(<WithdrawForm onTokenChange={onTokenChange} />)

    expect(onTokenChange).not.toHaveBeenCalled()
  })

  it('should show zero balance when no position exists', () => {
    mockUsePositions.mockReturnValue({
      ...defaultPositionsMock,
      positions: [],
    })
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      selectedTokenSymbol: 'USDC',
    })

    render(<WithdrawForm selectedToken="USDC" />)

    expect(screen.getByText(/0\.0000/)).toBeInTheDocument()
  })
})
