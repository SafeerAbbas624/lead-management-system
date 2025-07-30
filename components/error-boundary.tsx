'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console and potentially to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Check if it's a ChunkLoadError
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      console.log('ChunkLoadError detected, will attempt to reload...')
      // Automatically reload the page after a short delay for chunk errors
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a ChunkLoadError
      const isChunkError = this.state.error?.name === 'ChunkLoadError' || 
                          this.state.error?.message.includes('Loading chunk')

      if (isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Updating Application...
              </h2>
              <p className="text-gray-600 mb-4">
                The application is being updated. Please wait while we reload the latest version.
              </p>
              <div className="text-sm text-gray-500">
                This will only take a moment...
              </div>
            </div>
          </div>
        )
      }

      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4 text-center">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.retry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for handling chunk load errors in functional components
export function useChunkLoadErrorHandler() {
  React.useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      if (event.error?.name === 'ChunkLoadError' || 
          event.message?.includes('Loading chunk')) {
        console.log('ChunkLoadError detected in useEffect, reloading...')
        window.location.reload()
      }
    }

    window.addEventListener('error', handleChunkError)
    
    return () => {
      window.removeEventListener('error', handleChunkError)
    }
  }, [])
}

// Higher-order component for wrapping pages with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary
