import type { Metadata } from "next"
import { ApiKeyManagement } from "@/components/admin/api-key-management"

export const metadata: Metadata = {
  title: "API Keys | Lead Management System",
  description: "Manage API keys for external integrations",
}

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
      </div>

      <ApiKeyManagement />
    </div>
  )
}
