"use client"

import Link from "next/link"
import { Minimize, BookOpen, PenLine, User, Settings, LogOut, AlertCircle } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { SidebarTooltip } from "./sidebar-tooltip"
import { SidebarLogoutButton } from "./ui/sidebar"
import { useAuth } from "@/lib/auth-context"

export default function Sidebar() {
  const { user } = useAuth()
  return (
    <aside className="hidden sticky top-0 h-screen w-16 md:flex flex-col items-center justify-center gap-6 py-8 bg-background">
      <SidebarTooltip label="Articles">
        <Link href="/articles" className="flex items-center justify-center w-10 h-10 rounded hover:bg-muted">
          <BookOpen className="w-4 h-4" />
        </Link>
      </SidebarTooltip>
      <SidebarTooltip label="Write">
        <Link href="/write" className="flex items-center justify-center w-10 h-10 rounded hover:bg-muted">
          <PenLine className="w-4 h-4" />
        </Link>
      </SidebarTooltip>
      <SidebarTooltip label="Profile">
        <Link href="/profile" className="flex items-center justify-center w-10 h-10 rounded hover:bg-muted">
          <User className="w-4 h-4" />
        </Link>
      </SidebarTooltip>
      <SidebarTooltip label="Settings">
        <Link href="/settings" className="flex items-center justify-center w-10 h-10 rounded hover:bg-muted">
          <Settings className="w-4 h-4" />
        </Link>
      </SidebarTooltip>
      <SidebarTooltip label="Issues">
        <Link href="/issues" className="flex items-center justify-center w-10 h-10 rounded hover:bg-muted">
          <AlertCircle className="w-4 h-4" />
        </Link>
      </SidebarTooltip>
      
      {user && (
        <SidebarTooltip label="Logout">
          <SidebarLogoutButton />
        </SidebarTooltip>
      )}
    </aside>
  )
}
