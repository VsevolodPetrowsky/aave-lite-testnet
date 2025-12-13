import { usePositions } from '../hooks/usePositions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Button } from './ui/button'
import { TokenIcon } from './TokenIcon'

interface BorrowingsTableProps {
  onRepay?: (asset: string) => void
  disabled?: boolean
}

export function BorrowingsTable({ onRepay, disabled = false }: BorrowingsTableProps) {
  const { borrowings } = usePositions()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Borrows</CardTitle>
        <CardDescription>
          Active borrowed positions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {borrowings.length === 0 ? (
          <p style={{ color: 'var(--subtext)', textAlign: 'center', padding: '1rem' }}>
            No active borrows
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Debt</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {borrowings.map((borrowing) => (
                <TableRow key={borrowing.symbol}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={borrowing.symbol} />
                      <span>{borrowing.symbol}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(borrowing.formatted).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRepay?.(borrowing.symbol)}
                      disabled={disabled}
                    >
                      Repay
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
