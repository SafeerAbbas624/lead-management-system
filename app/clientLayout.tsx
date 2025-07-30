"use client"

import type React from "react"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/layout/header"
import { AuthProvider } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { QueryProvider } from "@/components/providers/query-provider"
import ErrorBoundary, { useChunkLoadErrorHandler } from "@/components/error-boundary"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const isLoginPage = pathname === "/login" || pathname === "/register"
  const showSidebar = !isHomePage && !isLoginPage

  // Handle chunk load errors
  useChunkLoadErrorHandler()

  // Set the document title
  useEffect(() => {
    document.title = "Leads"
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <ServiceWorkerRegistration />
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="relative flex min-h-screen flex-col">
                  {!isHomePage && <Header />}
                  <div className="flex flex-1">
                    {showSidebar && <Sidebar className="hidden md:block" />}
                    <main className={`flex-1 ${showSidebar ? "p-6" : "p-0"}`}>{children}</main>
                  </div>
                </div>
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
