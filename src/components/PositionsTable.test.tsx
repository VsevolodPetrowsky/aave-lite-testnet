import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PositionsTable } from './PositionsTable'

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

describe('PositionsTable', () => {
  const mockPositions = [
    {
      asset: 'DAI',
      aTokenAddress: '0xaToken1234567890123456789012345678901234',
      balance: '500.0000',
    },
    {
      asset: 'USDC',
      aTokenAddress: '0xbToken1234567890123456789012345678905678',
      balance: '200.0000',
    },
  ]

  const defaultProps = {
    positions: mockPositions,
    onWithdraw: vi.fn(),
    disabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockClipboard.writeText.mockResolvedValue(undefined)
  })

  it('should render table title', () => {
    render(<PositionsTable {...defaultProps} />)

    expect(screen.getByText('Your positions (aTokens)')).toBeInTheDocument()
  })

  it('should render table description', () => {
    render(<PositionsTable {...defaultProps} />)

    expect(
      screen.getByText(/View your deposited assets and interest-bearing aTokens/)
    ).toBeInTheDocument()
  })

  it('should render table headers', () => {
    render(<PositionsTable {...defaultProps} />)

    expect(screen.getByText('Asset')).toBeInTheDocument()
    expect(screen.getByText('aToken Address')).toBeInTheDocument()
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('should render positions with aToken prefix', () => {
    render(<PositionsTable {...defaultProps} />)

    expect(screen.getByText('aDAI')).toBeInTheDocument()
    expect(screen.getByText('aUSDC')).toBeInTheDocument()
  })

  it('should render position balances', () => {
    render(<PositionsTable {...defaultProps} />)

    expect(screen.getByText('500.0000')).toBeInTheDocument()
    expect(screen.getByText('200.0000')).toBeInTheDocument()
  })

  it('should render formatted aToken addresses', () => {
    render(<PositionsTable {...defaultProps} />)

    // Address format: first 6 + ... + last 4
    expect(screen.getAllByText(/0xaTok...1234/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/0xbTok...5678/).length).toBeGreaterThan(0)
  })

  it('should render withdraw buttons for each position', () => {
    render(<PositionsTable {...defaultProps} />)

    const withdrawButtons = screen.getAllByRole('button', { name: /withdraw/i })
    expect(withdrawButtons).toHaveLength(2)
  })

  it('should call onWithdraw with asset when withdraw button is clicked', () => {
    const onWithdraw = vi.fn()
    render(<PositionsTable {...defaultProps} onWithdraw={onWithdraw} />)

    const withdrawButtons = screen.getAllByRole('button', { name: /withdraw/i })
    fireEvent.click(withdrawButtons[0])

    expect(onWithdraw).toHaveBeenCalledWith('DAI')
  })

  it('should show empty state when no positions', () => {
    render(<PositionsTable {...defaultProps} positions={[]} />)

    expect(
      screen.getByText(/No positions yet. Deposit tokens to start earning interest./)
    ).toBeInTheDocument()
  })

  it('should disable withdraw buttons when disabled prop is true', () => {
    render(<PositionsTable {...defaultProps} disabled={true} />)

    const withdrawButtons = screen.getAllByRole('button', { name: /withdraw/i })
    withdrawButtons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  it('should disable withdraw button when balance is zero', () => {
    const positionsWithZero = [
      {
        asset: 'DAI',
        aTokenAddress: '0xaToken1234567890123456789012345678901234',
        balance: '0',
      },
    ]

    render(<PositionsTable {...defaultProps} positions={positionsWithZero} />)

    const withdrawButton = screen.getByRole('button', { name: /withdraw/i })
    expect(withdrawButton).toBeDisabled()
  })

  it('should copy aToken address when copy button is clicked', async () => {
    await import('sonner') // Import sonner (toast mock is set up globally)
    render(<PositionsTable {...defaultProps} />)

    // Find copy buttons
    const allButtons = screen.getAllByRole('button')
    const copyButtons = allButtons.filter((btn) => btn.querySelector('svg'))

    expect(copyButtons.length).toBeGreaterThan(0)
    if (copyButtons[0]) {
      fireEvent.click(copyButtons[0])

      await vi.waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled()
      })
    }
  })

  it('should show success toast when address is copied', async () => {
    const { toast } = await import('sonner')
    render(<PositionsTable {...defaultProps} />)

    const allButtons = screen.getAllByRole('button')
    const copyButtons = allButtons.filter((btn) => btn.querySelector('svg'))

    if (copyButtons[0]) {
      fireEvent.click(copyButtons[0])

      await vi.waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Copied to clipboard')
      })
    }
  })

  it('should show error toast when copy fails', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Failed'))
    const { toast } = await import('sonner')
    render(<PositionsTable {...defaultProps} />)

    const allButtons = screen.getAllByRole('button')
    const copyButtons = allButtons.filter((btn) => btn.querySelector('svg'))

    if (copyButtons[0]) {
      fireEvent.click(copyButtons[0])

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy')
      })
    }
  })

  it('should handle position without aToken address', () => {
    const positionsWithNull = [
      {
        asset: 'DAI',
        aTokenAddress: null,
        balance: '500.0000',
      },
    ]

    render(<PositionsTable {...defaultProps} positions={positionsWithNull} />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
