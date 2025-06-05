import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DncListManager } from "@/components/dnc/dnc-list-manager"
import { DncEntryManager } from "@/components/dnc/dnc-entry-manager"

export const metadata: Metadata = {
  title: "DNC Lists | Lead Management System",
  description: "Manage Do Not Contact lists",
}

export default function DncListsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">DNC Lists</h1>
      </div>

      <Tabs defaultValue="lists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lists">DNC Lists</TabsTrigger>
          <TabsTrigger value="entries">DNC Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="lists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage DNC Lists</CardTitle>
              <CardDescription>Create and manage Do Not Contact lists</CardDescription>
            </CardHeader>
            <CardContent>
              <DncListManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>DNC Entries</CardTitle>
              <CardDescription>Manage individual entries in DNC lists</CardDescription>
            </CardHeader>
            <CardContent>
              <DncEntryManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
