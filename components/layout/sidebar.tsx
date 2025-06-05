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
  Key,
  Activity,
  Share2,
  Building2,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

  return (
    <div className={cn("pb-12 border-r min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-xl font-semibold tracking-tight">Lead Management</h2>
          <div className="space-y-1">
            <NavItem href="/dashboard" icon={<Home />} label="Dashboard" pathname={pathname} />
            <NavItem href="/leads" icon={<FileText />} label="Leads" pathname={pathname} />
            <NavItem href="/leads/tagging" icon={<Tag />} label="Lead Tagging" pathname={pathname} />
            <NavItem href="/uploads" icon={<Upload />} label="Upload Leads" pathname={pathname} />
            <NavItem href="/data-processing" icon={<Database />} label="Data Processing" pathname={pathname} />
            <NavItem href="/dnc-lists" icon={<Shield />} label="DNC Lists" pathname={pathname} />
            <NavItem href="/distribution" icon={<Share2 />} label="Lead Distribution" pathname={pathname} />
            <NavItem href="/roi-dashboard" icon={<BarChart3 />} label="ROI Dashboard" pathname={pathname} />
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Administration</h2>
          <div className="space-y-1">
            <NavItem href="/admin/users" icon={<Users />} label="User Management" pathname={pathname} />
            <NavItem href="/admin/suppliers" icon={<Database />} label="Suppliers" pathname={pathname} />
            <NavItem href="/admin/clients" icon={<Building2 />} label="Clients" pathname={pathname} />
            <NavItem href="/admin/api-keys" icon={<Key />} label="API Keys" pathname={pathname} />
            <NavItem href="/admin/activity" icon={<Activity />} label="Activity Logs" pathname={pathname} />
            <NavItem href="/admin/settings" icon={<Settings />} label="System Settings" pathname={pathname} />
          </div>
        </div>
      </div>
    </div>
  )
}
