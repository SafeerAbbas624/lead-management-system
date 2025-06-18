"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Download, FileText, BarChart2, Users, Activity, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format as formatDate, subDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

type ReportType = 'lead-activity' | 'source-performance' | 'conversion' | 'revenue' | 'all'
type ReportFormat = 'pdf' | 'csv' | 'excel'

interface Report {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  date_from: string
  date_to: string
  status: 'scheduled' | 'completed' | 'failed'
  created_at: string
  file_name?: string
}

export function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedReports, setSelectedReports] = useState<ReportType[]>(['all'])
  const [format, setFormat] = useState<ReportFormat>('csv')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  
  // Use auth context
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  // Fetch recent reports when user is authenticated
  useEffect(() => {
    let isMounted = true
    
    const fetchRecentReports = async (attempt = 1): Promise<void> => {
      // Only proceed if we're authenticated and have a user
      if (!isAuthenticated || !user) {
        console.log('Not authenticated or no user, skipping report fetch')
        return
      }
      
      if (isMounted) {
        setIsLoading(true)
      }
      
      try {
        // Make the API request - the server will handle authentication
        const response = await fetch('/api/reports/recent', {
          method: 'GET',
          credentials: 'include', // Important for sending cookies
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          // If unauthorized and we haven't retried yet
          if (response.status === 401 && attempt < 2) {
            console.log('Received 401, attempting to refresh session...')
            const { error: refreshError } = await supabase.auth.refreshSession()
            
            if (!refreshError) {
              console.log('Session refreshed, retrying request...')
              return fetchRecentReports(attempt + 1)
            }
          }
          
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch reports')
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP error! status: ${response.status}`
          }))
          throw new Error(errorData.error || 'Failed to fetch reports')
        }
        
        const data = await response.json()
        if (isMounted) {
          setRecentReports(data)
        }
      } catch (error) {
        console.error('Error in fetchRecentReports:', error)
        
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load reports'
          
          // Show a more user-friendly error message
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          })
          
          // If it's an auth error, suggest signing in again
          if (errorMessage.toLowerCase().includes('session') || errorMessage.includes('401')) {
            toast({
              title: 'Authentication Required',
              description: 'Please sign in again to continue',
              variant: 'default',
              action: (
                <Button variant="outline" onClick={() => window.location.href = '/login'} className="ml-2">
                  Sign In
                </Button>
              ),
            })
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    // Initial fetch
    fetchRecentReports()
    
    // Set up a refresh interval
    const refreshInterval = setInterval(() => {
      if (isMounted) {
        fetchRecentReports()
      }
    }, 300000) // Refresh every 5 minutes
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchRecentReports()
      } else if (event === 'SIGNED_OUT') {
        setSelectedReports(['all'])
        setRecentReports([])
      }
    })
    
    return () => {
      isMounted = false
      clearInterval(refreshInterval)
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [isAuthenticated, user, supabase.auth, toast, setIsLoading, setRecentReports, setSelectedReports])

  const handleReportSelection = (reportType: ReportType) => {
    if (reportType === 'all') {
      setSelectedReports(['all'])
    } else {
      setSelectedReports(prev => {
        const newSelection = prev.includes('all') ? [] : [...prev]
        if (newSelection.includes(reportType)) {
          return newSelection.filter(type => type !== reportType)
        } else {
          return [...newSelection, reportType]
        }
      })
    }
  }

  const generateReport = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: 'Error',
        description: 'Please sign in to generate reports',
        variant: 'destructive',
      })
      return
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: 'Error',
        description: 'Please select a date range',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession?.access_token}`
        },
        body: JSON.stringify({
          type: selectedReports.includes('all') ? ['all'] : selectedReports,
          format,
          dateRange: {
            from: dateRange.from?.toISOString(),
            to: dateRange.to?.toISOString(),
          },
          name: `Report ${new Date().toLocaleDateString()}`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      // Trigger file download
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `report-${new Date().toISOString().split('T')[0]}.${format}`
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Refresh the reports list
      const { data: { session: newSession } } = await supabase.auth.getSession()
      const refreshResponse = await fetch('/api/reports/recent', {
        headers: {
          'Authorization': `Bearer ${newSession?.access_token}`
        },
        cache: 'no-store'
      })
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setRecentReports(data)
      }

      toast({
        title: 'Success',
        description: 'Report generated successfully',
      })
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper function to format date string
  const formatDateString = (dateString: string) => {
    if (!dateString) return ''
    try {
      return formatDate(new Date(dateString), 'MMM d, yyyy')
    } catch (error) {
      return dateString
    }
  }

  // Helper function to get file extension display name
  function getFormatDisplayName(format: ReportFormat): string {
    switch (format) {
      case 'pdf':
        return 'PDF'
      case 'csv':
        return 'CSV'
      case 'excel':
        return 'Excel'
      default:
        return String(format).toUpperCase()
    }
  }

  // Report type options
  const reportTypes: { id: ReportType; name: string; icon: React.ReactNode }[] = [
    { id: 'all', name: 'All Reports', icon: <FileText className="h-4 w-4" /> },
    { id: 'lead-activity', name: 'Lead Activity', icon: <Activity className="h-4 w-4" /> },
    { id: 'source-performance', name: 'Source Performance', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'conversion', name: 'Conversion', icon: <Users className="h-4 w-4" /> },
    { id: 'revenue', name: 'Revenue', icon: <BarChart2 className="h-4 w-4" /> },
  ]

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  // Show sign in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Please sign in to access reports</p>
        <Button 
          onClick={() => {
            window.location.href = '/login'
          }}
          className="gap-2"
        >
          <span>Sign In</span>
        </Button>
      </div>
    )
  }

  // Show loading state while fetching reports
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reports...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main header with title and generate button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and manage your reports</p>
        </div>
        <Button
          onClick={generateReport}
          disabled={isGenerating || !dateRange?.from || !dateRange?.to}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {/* Reports grid with stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentReports.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentReports.filter(report => {
                const reportDate = new Date(report.created_at);
                const now = new Date();
                return reportDate.getMonth() === now.getMonth() && 
                       reportDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Reports generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for report generation and recent reports */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Select report type, date range, and format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <h3 className="text-sm font-medium mb-2">Report Type</h3>
                <div className="flex flex-wrap gap-2">
                  {reportTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedReports.includes(type.id) ? 'default' : 'outline'}
                      size="sm"
                      className="gap-2"
                      onClick={() => handleReportSelection(type.id)}
                    >
                      {type.icon}
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Range Picker */}
              <div>
                <h3 className="text-sm font-medium mb-2">Date Range</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className={cn(
                            "w-full sm:w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {formatDate(dateRange.from, "LLL dd, y")} - {" "}
                                {formatDate(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              formatDate(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                          className="rounded-md"
                        />
                        {dateRange?.from && dateRange.to && (
                          <div className="p-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setDateRange(undefined)}
                            >
                              Clear selection
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    {dateRange?.from && dateRange.to && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {formatDate(dateRange.from, "MMM d, yyyy")} - {formatDate(dateRange.to, "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <h3 className="text-sm font-medium mb-2">Format</h3>
                <div className="flex flex-wrap gap-2">
                  {['pdf', 'csv', 'excel'].map((fmt) => (
                    <Button
                      key={fmt}
                      variant={format === fmt ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormat(fmt as ReportFormat)}
                    >
                      {getFormatDisplayName(fmt as ReportFormat)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button
                onClick={generateReport}
                disabled={isGenerating || !dateRange?.from || !dateRange?.to}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Recent Reports Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your recently generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              {recentReports.length > 0 ? (
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{report.type}</span>
                            <span>•</span>
                            <span>{getFormatDisplayName(report.format)}</span>
                            <span>•</span>
                            <span>{formatDateString(report.date_from)} - {formatDateString(report.date_to)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (report.file_name) {
                              window.open(`/api/reports/download/${report.id}`, '_blank')
                            }
                          }}
                          disabled={!report.file_name || report.status !== 'completed'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No reports generated yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate your first report to see it here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
