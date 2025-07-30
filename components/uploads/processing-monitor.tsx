"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock, RefreshCw, Eye, Download } from "lucide-react"

interface ProcessingStep {
  step: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message: string
  progress: number
  timestamp: string
  data?: any
}

interface SessionStatus {
  session_id: string
  status: string
  current_step: number
  total_steps: number
  progress: number
  steps: ProcessingStep[]
  data?: any
}

interface ProcessingMonitorProps {
  sessionId: string
  onComplete?: (results: any) => void
  onError?: (error: string) => void
}

export function ProcessingMonitor({ sessionId, onComplete, onError }: ProcessingMonitorProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Poll for status updates
  useEffect(() => {
    if (!sessionId || !isPolling) return

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/hybrid/session-status/${sessionId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch session status')
        }

        const status: SessionStatus = await response.json()
        setSessionStatus(status)

        // Check if processing is complete or failed
        if (status.status === 'completed') {
          setIsPolling(false)
          onComplete?.(status.data)
        } else if (status.status === 'error') {
          setIsPolling(false)
          const errorMessage = status.steps.find(s => s.status === 'error')?.message || 'Processing failed'
          setError(errorMessage)
          onError?.(errorMessage)
        }

      } catch (err) {
        console.error('Error polling session status:', err)
        setError(err instanceof Error ? err.message : 'Failed to get status')
        setIsPolling(false)
      }
    }

    // Initial poll
    pollStatus()

    // Set up polling interval
    const interval = setInterval(pollStatus, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [sessionId, isPolling, onComplete, onError])

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStepBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'processing':
        return <Badge variant="default" className="bg-blue-500">Processing</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const formatStepName = (step: string) => {
    return step.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleRetry = () => {
    setError(null)
    setIsPolling(true)
  }

  const handleViewPreview = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/hybrid/preview-data/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Preview data:', data)
        // You could open a modal or navigate to a preview page here
      }
    } catch (err) {
      console.error('Error fetching preview:', err)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Processing Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleRetry} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sessionStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Processing Status...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Fetching session status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Progress</CardTitle>
          <CardDescription>
            Session: {sessionStatus.session_id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(sessionStatus.progress)}%</span>
            </div>
            <Progress value={sessionStatus.progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {sessionStatus.current_step + 1} of {sessionStatus.total_steps}</span>
              <span className="capitalize">{sessionStatus.status}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Details */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Steps</CardTitle>
          <CardDescription>
            Detailed progress for each processing step
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessionStatus.steps.map((step, index) => (
              <div key={step.step} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{formatStepName(step.step)}</h4>
                    {getStepBadge(step.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
                  {step.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                {step.data && step.step === 'preview' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewPreview}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {sessionStatus.steps.some(s => s.data) && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sessionStatus.steps.map((step) => {
                if (!step.data) return null

                return (
                  <div key={step.step} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {step.data.total_rows || step.data.duplicate_count || step.data.dnc_matches || '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatStepName(step.step)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setIsPolling(!isPolling)}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
          {isPolling ? 'Pause Updates' : 'Resume Updates'}
        </Button>

        {sessionStatus.status === 'completed' && (
          <Button
            onClick={() => onComplete?.(sessionStatus.data)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            View Results
          </Button>
        )}
      </div>
    </div>
  )
}
