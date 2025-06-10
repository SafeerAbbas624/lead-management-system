"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarIcon, Download, FileText, BarChart2, Users, Activity } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format as formatDate, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { DateRange } from "react-day-picker"
import { supabase } from "@/lib/supabase-client"

type ReportType = 'lead-activity' | 'source-performance' | 'conversion' | 'revenue' | 'all'
type ReportFormat = 'pdf' | 'csv' | 'excel'

// Helper function to safely format file extensions
const formatFileExt = (format: ReportFormat): string => format.toUpperCase()

interface Report {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  dateRange: { from: Date; to: Date }
  status: 'scheduled' | 'completed' | 'failed'
  createdAt: Date
  downloadUrl?: string
}

export function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedReports, setSelectedReports] = useState<ReportType[]>(['all'])
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Fetch recent reports
  useEffect(() => {
    const fetchRecentReports = async () => {
      try {
        // In a real app, you would fetch this from your API
        const mockReports: Report[] = [
          {
            id: '1',
            name: 'Monthly Performance',
            type: 'all',
            format: 'pdf',
            dateRange: {
              from: startOfMonth(new Date()),
              to: new Date()
            },
            status: 'completed',
            createdAt: new Date(),
            downloadUrl: '#'
          },
          {
            id: '2',
            name: 'Lead Source Analysis',
            type: 'source-performance',
            format: 'excel',
            dateRange: {
              from: subDays(new Date(), 7),
              to: new Date()
            },
            status: 'completed',
            createdAt: subDays(new Date(), 1),
            downloadUrl: '#'
          },
          {
            id: '3',
            name: 'Weekly Conversion',
            type: 'conversion',
            format: 'csv',
            dateRange: {
              from: startOfWeek(new Date()),
              to: endOfWeek(new Date())
            },
            status: 'scheduled',
            createdAt: subDays(new Date(), 2),
          },
        ]
        
        setRecentReports(mockReports)
      } catch (error) {
        console.error('Error fetching reports:', error)
      }
    }

    fetchRecentReports()
  }, [])

  const handleReportSelection = (reportType: ReportType) => {
    if (reportType === 'all') {
      setSelectedReports(['all'])
    } else {
      setSelectedReports(prev => {
        const newSelection = prev.includes(reportType)
          ? prev.filter(type => type !== reportType)
          : [...prev.filter(type => type !== 'all'), reportType]
        return newSelection.length === 0 ? ['all'] : newSelection
      })
    }
  }

  const generateReport = async () => {
    setIsGenerating(true)
    try {
      // In a real app, you would call your API to generate the report
      console.log('Generating report with:', {
        dateRange,
        selectedReports: selectedReports.includes('all') ? 'all' : selectedReports,
        format
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Add to recent reports
      const newReport: Report = {
        id: Date.now().toString(),
        name: `Custom Report ${recentReports.length + 1}`,
        type: selectedReports[0] === 'all' ? 'all' : selectedReports[0],
        format,
        dateRange: {
          from: dateRange?.from || new Date(),
          to: dateRange?.to || new Date()
        },
        status: 'completed',
        createdAt: new Date(),
        downloadUrl: '#'
      }
      
      setRecentReports(prev => [newReport, ...prev])
      
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const reportTypes: {id: ReportType, name: string, icon: React.ReactNode}[] = [
    { id: 'all', name: 'All Reports', icon: <FileText className="h-4 w-4" /> },
    { id: 'lead-activity', name: 'Lead Activity', icon: <Activity className="h-4 w-4" /> },
    { id: 'source-performance', name: 'Source Performance', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'conversion', name: 'Conversion', icon: <Users className="h-4 w-4" /> },
    { id: 'revenue', name: 'Revenue', icon: <BarChart2 className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
          <CardDescription>Select report type, date range, and format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Report Types</h3>
              <div className="flex flex-wrap gap-2">
                {reportTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={selectedReports.includes(type.id as ReportType) ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => handleReportSelection(type.id as ReportType)}
                  >
                    {type.icon}
                    {type.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Date Range</h3>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {formatDate(dateRange.from, 'MMM d, yyyy')} -{' '}
                          {formatDate(dateRange.to, 'MMM d, yyyy')}
                        </>
                      ) : (
                        formatDate(dateRange.from, 'MMM d, yyyy')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                  {isCalendarOpen && (
                    <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md border p-2">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                      <div className="flex justify-end p-2 border-t">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setDateRange(undefined)}
                        >
                          Clear
                        </Button>
                        <Button 
                          size="sm" 
                          className="ml-2"
                          onClick={() => setIsCalendarOpen(false)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Format</h3>
                <div className="flex gap-2">
                  {(['pdf', 'csv', 'excel'] as const).map((fmt) => (
                    <Button
                      key={fmt}
                      variant={format === fmt ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormat(fmt)}
                    >
                      {formatFileExt(fmt)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Button 
            onClick={generateReport}
            disabled={isGenerating || !dateRange?.from || !dateRange?.to}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Your previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          {recentReports.length > 0 ? (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{report.type} • {report.format.toUpperCase()}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {formatDate(report.dateRange.from, 'MMM d')} - {formatDate(report.dateRange.to, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                    {report.downloadUrl && (
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No reports generated yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
