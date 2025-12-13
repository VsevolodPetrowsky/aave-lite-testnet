import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DepositForm } from './DepositForm'
import { NETWORK_CONFIG } from '../config/contracts'
import { sepolia } from 'wagmi/chains'
import { parseUnits } from 'viem'

// Mock hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

vi.mock('../hooks/useDeposit', () => ({
  useDeposit: vi.fn(),
}))

vi.mock('../hooks/useTokenBalances', () => ({
  useTokenBalances: vi.fn(),
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

import { useAccount } from 'wagmi'
import { useDeposit } from '../hooks/useDeposit'
import { useTokenBalances } from '../hooks/useTokenBalances'
import { useTransactionForm } from '../hooks/useTransactionForm'
import { useRefetchAll } from '../hooks/useRefetchAll'

const mockUseAccount = vi.mocked(useAccount)
const mockUseDeposit = vi.mocked(useDeposit)
const mockUseTokenBalances = vi.mocked(useTokenBalances)
const mockUseTransactionForm = vi.mocked(useTransactionForm)
const mockUseRefetchAll = vi.mocked(useRefetchAll)

describe('DepositForm', () => {
  const sepoliaTokens = NETWORK_CONFIG[sepolia.id].tokens

  const defaultDepositMock = {
    allowance: 0n,
    refetchAllowance: vi.fn(),
    handleApprove: vi.fn(),
    handleDeposit: vi.fn(),
    isApproving: false,
    isApproveConfirming: false,
    isApproveSuccess: false,
    isApproveReverted: false,
    approveHash: undefined as `0x${string}` | undefined,
    approveError: null,
    isSupplying: false,
    isSupplyConfirming: false,
    isSupplySuccess: false,
    isSupplyReverted: false,
    supplyHash: undefined as `0x${string}` | undefined,
    supplyError: null,
  }

  const defaultBalancesMock = {
    balances: sepoliaTokens.map((token) => ({
      ...token,
      balance: parseUnits('1000', token.decimals),
      formatted: '1000',
    })),
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
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
    } as unknown as ReturnType<typeof useAccount>)
    mockUseDeposit.mockReturnValue(defaultDepositMock)
    mockUseTokenBalances.mockReturnValue(defaultBalancesMock)
    mockUseTransactionForm.mockReturnValue(defaultTransactionFormMock)
    mockUseRefetchAll.mockReturnValue(defaultRefetchAllMock)
  })

  it('should render deposit form title', () => {
    render(<DepositForm />)

    expect(screen.getByRole('heading', { name: 'Deposit' })).toBeInTheDocument()
    expect(
      screen.getByText(/Deposit your tokens into Aave to start earning interest/)
    ).toBeInTheDocument()
  })

  it('should render token selector', () => {
    render(<DepositForm />)

    expect(screen.getByText('Token')).toBeInTheDocument()
  })

  it('should render amount input', () => {
    render(<DepositForm />)

    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
  })

  it('should render Max button', () => {
    render(<DepositForm />)

    expect(screen.getByRole('button', { name: /max/i })).toBeInTheDocument()
  })

  it('should show "Approve" button when allowance is insufficient', async () => {
    mockUseDeposit.mockReturnValue({
      ...defaultDepositMock,
      allowance: 0n,
    })
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '100',
      amountNum: 100,
    })

    render(<DepositForm />)

    expect(screen.getByRole('button', { name: /approve & deposit dai/i })).toBeInTheDocument()
  })

  it('should show "Deposit" button when allowance is sufficient', async () => {
    mockUseDeposit.mockReturnValue({
      ...defaultDepositMock,
      allowance: parseUnits('1000', 18),
    })
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '100',
      amountNum: 100,
    })

    render(<DepositForm />)

    expect(screen.getByRole('button', { name: /^deposit$/i })).toBeInTheDocument()
  })

  it('should show error for insufficient balance', async () => {
    mockUseTokenBalances.mockReturnValue({
      ...defaultBalancesMock,
      balances: sepoliaTokens.map((token) => ({
        ...token,
        balance: parseUnits('50', token.decimals),
        formatted: '50',
      })),
    })
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '100',
      amountNum: 100,
      error: 'Insufficient balance',
    })

    render(<DepositForm />)

    expect(screen.getByText('Insufficient balance')).toBeInTheDocument()
  })

  it('should show error for zero amount', async () => {
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '0',
      amountNum: 0,
      error: 'Amount must be greater than zero',
    })

    render(<DepositForm />)

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
  })

  it('should call handleApprove when approve button is clicked', async () => {
    const handleApprove = vi.fn()
    mockUseDeposit.mockReturnValue({
      ...defaultDepositMock,
      allowance: 0n,
      handleApprove,
    })
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '100',
      amountNum: 100,
    })

    render(<DepositForm />)

    const approveButton = screen.getByRole('button', { name: /approve & deposit dai/i })
    fireEvent.click(approveButton)

    expect(handleApprove).toHaveBeenCalledWith('100')
  })

  it('should call handleDeposit when deposit button is clicked', async () => {
    const handleDeposit = vi.fn()
    mockUseDeposit.mockReturnValue({
      ...defaultDepositMock,
      allowance: parseUnits('1000', 18),
      handleDeposit,
    })
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      amount: '100',
      amountNum: 100,
    })

    render(<DepositForm />)

    const depositButton = screen.getByRole('button', { name: /^deposit$/i })
    fireEvent.click(depositButton)

    expect(handleDeposit).toHaveBeenCalledWith('100')
  })

  it('should fill max amount when Max button is clicked', async () => {
    const setAmount = vi.fn()
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      setAmount,
    })

    render(<DepositForm />)

    const maxButton = screen.getByRole('button', { name: /max/i })
    fireEvent.click(maxButton)

    expect(setAmount).toHaveBeenCalledWith('1000')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<DepositForm disabled={true} />)

    const depositButton = screen.getByRole('button', { name: /connect wallet/i })
    expect(depositButton).toBeInTheDocument()
  })

  it('should show loading state when approving', () => {
    mockUseDeposit.mockReturnValue({
      ...defaultDepositMock,
      isApproving: true,
    })

    render(<DepositForm />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should show loading state when supplying', () => {
    mockUseDeposit.mockReturnValue({
      ...defaultDepositMock,
      allowance: parseUnits('1000', 18),
      isSupplying: true,
    })

    render(<DepositForm />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should display available balance', () => {
    render(<DepositForm />)

    expect(screen.getByText(/Available:/)).toBeInTheDocument()
    expect(screen.getByText(/1000\.0000/)).toBeInTheDocument()
  })

  it('should accept selectedToken prop', () => {
    mockUseTransactionForm.mockReturnValue({
      ...defaultTransactionFormMock,
      selectedTokenSymbol: 'USDC',
      selectedTokenData: sepoliaTokens.find(t => t.symbol === 'USDC'),
    })

    render(<DepositForm selectedToken="USDC" />)

    const selectTrigger = screen.getByRole('combobox')
    expect(selectTrigger).toHaveTextContent('USDC')
  })

  it('should call onTokenChange when token is changed', async () => {
    const onTokenChange = vi.fn()
    render(<DepositForm onTokenChange={onTokenChange} />)

    expect(onTokenChange).not.toHaveBeenCalled()
  })
})
