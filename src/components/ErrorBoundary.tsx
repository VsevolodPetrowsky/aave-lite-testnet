import { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle style={{ color: 'var(--danger)' }}>
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p style={{ color: 'var(--subtext)' }}>
              An unexpected error occurred. Please try again.
            </p>
            {this.state.error && (
              <pre
                className="p-3 rounded text-sm overflow-auto"
                style={{
                  background: 'var(--border)',
                  color: 'var(--danger)',
                  maxHeight: '200px',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset}>Try Again</Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
