import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadTagging } from "@/components/leads/lead-tagging"
import { TagManagement } from "@/components/leads/tag-management"

export const metadata: Metadata = {
  title: "Lead Tagging | Lead Management System",
  description: "Tag and categorize leads",
}

export default function LeadTaggingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Lead Tagging</h1>
      </div>

      <Tabs defaultValue="tagging" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tagging">Apply Tags</TabsTrigger>
          <TabsTrigger value="management">Tag Management</TabsTrigger>
        </TabsList>

        <TabsContent value="tagging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Tagging</CardTitle>
              <CardDescription>Apply tags to leads for better organization</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadTagging />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tag Management</CardTitle>
              <CardDescription>Create and manage tags for lead categorization</CardDescription>
            </CardHeader>
            <CardContent>
              <TagManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
