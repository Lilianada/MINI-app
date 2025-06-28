"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"


export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // AGGRESSIVE REDIRECT CHECK - before any other logic
  if (typeof window !== 'undefined' && !loading && !user) {
    window.location.href = "/login"
    return <PageLoadingSkeleton />
  }

  // Immediate redirect - fastest possible response to unauthorized access
  useEffect(() => {
    if (!loading && !user) {
      // Try both Next.js router and direct navigation
      router.replace("/login")
      // Fallback to direct navigation after a brief delay
      setTimeout(() => {
        if (!user) {
          window.location.href = "/login"
        }
      }, 100)
    }
  }, [user, loading, router])

  // Immediate early return for unauthenticated users
  if (!loading && !user) {
    if (typeof window !== 'undefined') {
      window.location.href = "/login"
    }
    return <PageLoadingSkeleton />
  }

  // Prevent any UI rendering for unauthorized users
  if (loading || !user) {
    return <PageLoadingSkeleton />
  }

  // Lazy load the actual settings content only when authenticated
  const SettingsPageContent = require("./settings-content").SettingsPageContent
  return <SettingsPageContent />
}
