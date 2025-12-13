import { toast } from 'sonner'

interface TransactionToastOptions {
  explorerUrl: string
  hash: string
}

export function showTransactionSuccess(
  message: string,
  { explorerUrl, hash }: TransactionToastOptions
) {
  toast.success(message, {
    description: `Tx: ${hash.slice(0, 10)}...`,
    action: {
      label: 'View',
      onClick: () => window.open(`${explorerUrl}/tx/${hash}`, '_blank'),
    },
  })
}

export function showTransactionReverted(
  message: string,
  { explorerUrl, hash }: TransactionToastOptions
) {
  toast.error(message, {
    description: `Tx: ${hash.slice(0, 10)}...`,
    action: {
      label: 'View',
      onClick: () => window.open(`${explorerUrl}/tx/${hash}`, '_blank'),
    },
  })
}

export function showTransactionError(operation: string, error: Error) {
  toast.error(`${operation} failed: ${error.message}`)
}
