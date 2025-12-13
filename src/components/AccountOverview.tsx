import { useAccountData } from '../hooks/useAccountData'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function AccountOverview() {
  const {
    totalCollateral,
    totalDebt,
    availableBorrows,
    healthFactor,
    healthStatus,
    hasPosition,
  } = useAccountData()

  const getHealthColor = () => {
    switch (healthStatus) {
      case 'danger':
        return 'var(--danger)'
      case 'warning':
        return '#f59e0b'
      default:
        return '#10b981'
    }
  }

  const formatUsd = (value: string) => {
    const num = parseFloat(value)
    if (num === 0) return '$0.00'
    if (num < 0.01) return '< $0.01'
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatHealthFactor = () => {
    const hf = parseFloat(healthFactor)
    if (hf === 0 || parseFloat(totalDebt) === 0) return '-'
    if (hf > 100) return '> 100'
    return hf.toFixed(2)
  }

  if (!hasPosition) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Account Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p style={{ color: 'var(--subtext)', fontSize: '0.75rem' }}>
              Total Collateral
            </p>
            <p style={{ color: 'var(--text)', fontWeight: 600 }}>
              {formatUsd(totalCollateral)}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--subtext)', fontSize: '0.75rem' }}>
              Total Debt
            </p>
            <p style={{ color: 'var(--text)', fontWeight: 600 }}>
              {formatUsd(totalDebt)}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--subtext)', fontSize: '0.75rem' }}>
              Available to Borrow
            </p>
            <p style={{ color: 'var(--text)', fontWeight: 600 }}>
              {formatUsd(availableBorrows)}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--subtext)', fontSize: '0.75rem' }}>
              Health Factor
            </p>
            <p style={{ color: getHealthColor(), fontWeight: 600 }}>
              {formatHealthFactor()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
