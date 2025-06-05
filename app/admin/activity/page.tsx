import type { Metadata } from "next"
import { ActivityLogs } from "@/components/admin/activity-logs"

export const metadata: Metadata = {
  title: "Activity Logs | Lead Management System",
  description: "View and audit user activity in the system",
}

export default function ActivityLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
      </div>

      <ActivityLogs />
    </div>
  )
}
