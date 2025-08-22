"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Database,
  FileText,
  Home,
  Settings,
  Shield,
  Users,
  Tag,
  Activity,
  Share2,
  Building2,
  Upload,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRoleAccess } from "@/hooks/use-role-access"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  pathname: string
}

function NavItem({ href, icon, label, pathname }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        pathname === href ? "bg-accent text-accent-foreground" : "transparent",
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { hasPermission } = useRoleAccess()

  return (
    <div className={cn("pb-12 border-r min-h-screen w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-xl font-semibold tracking-tight">Lead Management</h2>
          <div className="space-y-1">
            <NavItem href="/dashboard" icon={<Home />} label="Dashboard" pathname={pathname} />
            <NavItem href="/leads" icon={<FileText />} label="Leads" pathname={pathname} />
            <NavItem href="/uploads" icon={<Upload />} label="Upload Leads" pathname={pathname} />
            <NavItem href="/dnc-lists" icon={<Shield />} label="DNC Lists" pathname={pathname} />
            <NavItem href="/distribution" icon={<Share2 />} label="Lead Distribution" pathname={pathname} />
            <NavItem href="/roi-dashboard" icon={<BarChart3 />} label="ROI Dashboard" pathname={pathname} />
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Administration</h2>
          <div className="space-y-1">
            {hasPermission('canManageUsers') && (
              <NavItem href="/admin/users" icon={<Users />} label="User Management" pathname={pathname} />
            )}
            {hasPermission('canManageSuppliers') && (
              <NavItem href="/admin/suppliers" icon={<Database />} label="Suppliers" pathname={pathname} />
            )}
            {hasPermission('canManageClients') && (
              <NavItem href="/admin/clients" icon={<Building2 />} label="Clients" pathname={pathname} />
            )}
            {hasPermission('canViewActivityLogs') && (
              <NavItem href="/admin/activity" icon={<Activity />} label="Activity Logs" pathname={pathname} />
            )}
            {hasPermission('canAccessSystemSettings') && (
              <NavItem href="/admin/test-sendgrid" icon={<Mail />} label="Test SendGrid" pathname={pathname} />
            )}
            {hasPermission('canAccessSystemSettings') && (
              <NavItem href="/settings" icon={<Settings />} label="Profile Settings" pathname={pathname} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
