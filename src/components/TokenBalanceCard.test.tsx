import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TokenBalanceCard } from './TokenBalanceCard'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(),
}
Object.assign(navigator, {
  clipboard: mockClipboard,
})

describe('TokenBalanceCard', () => {
  const defaultProps = {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    balance: '1000.0000',
    address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
    onDeposit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockClipboard.writeText.mockResolvedValue(undefined)
  })

  it('should render token symbol', () => {
    render(<TokenBalanceCard {...defaultProps} />)

    expect(screen.getByText('DAI')).toBeInTheDocument()
  })

  it('should render token name', () => {
    render(<TokenBalanceCard {...defaultProps} />)

    expect(screen.getByText('Dai Stablecoin')).toBeInTheDocument()
  })

  it('should render token balance', () => {
    render(<TokenBalanceCard {...defaultProps} />)

    expect(screen.getByText('1000.0000')).toBeInTheDocument()
    expect(screen.getByText('Available:')).toBeInTheDocument()
  })

  it('should render formatted address', () => {
    render(<TokenBalanceCard {...defaultProps} />)

    // Address should be formatted as first 6 + ... + last 4
    expect(screen.getByText(/0xFF34...a357/)).toBeInTheDocument()
  })

  it('should render deposit button', () => {
    render(<TokenBalanceCard {...defaultProps} />)

    expect(screen.getByRole('button', { name: /deposit/i })).toBeInTheDocument()
  })

  it('should call onDeposit when deposit button is clicked', () => {
    const onDeposit = vi.fn()
    render(<TokenBalanceCard {...defaultProps} onDeposit={onDeposit} />)

    fireEvent.click(screen.getByRole('button', { name: /deposit/i }))

    expect(onDeposit).toHaveBeenCalledTimes(1)
  })

  it('should copy address to clipboard when copy button is clicked', async () => {
    await import('sonner') // Import sonner (toast mock is set up globally)
    render(<TokenBalanceCard {...defaultProps} />)

    // Find copy button (button with Copy icon)
    const copyButtons = screen.getAllByRole('button')
    const copyButton = copyButtons.find(btn => btn.querySelector('svg'))

    expect(copyButton).toBeDefined()
    if (copyButton) {
      fireEvent.click(copyButton)

      expect(mockClipboard.writeText).toHaveBeenCalledWith(defaultProps.address)
    }
  })

  it('should show success toast when address is copied', async () => {
    const { toast } = await import('sonner')
    render(<TokenBalanceCard {...defaultProps} />)

    const copyButtons = screen.getAllByRole('button')
    const copyButton = copyButtons.find(btn => btn.querySelector('svg'))

    if (copyButton) {
      fireEvent.click(copyButton)

      // Wait for async clipboard operation
      await vi.waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Copied to clipboard')
      })
    }
  })

  it('should show error toast when copy fails', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Failed'))
    const { toast } = await import('sonner')
    render(<TokenBalanceCard {...defaultProps} />)

    const copyButtons = screen.getAllByRole('button')
    const copyButton = copyButtons.find(btn => btn.querySelector('svg'))

    if (copyButton) {
      fireEvent.click(copyButton)

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy')
      })
    }
  })

  it('should render with different token data', () => {
    render(
      <TokenBalanceCard
        symbol="USDC"
        name="USD Coin"
        balance="500.00"
        address="0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"
        onDeposit={vi.fn()}
      />
    )

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('USD Coin')).toBeInTheDocument()
    expect(screen.getByText('500.00')).toBeInTheDocument()
  })
})
