"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedPageProps {
  children: React.ReactNode
}

export function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Immediately redirect without allowing any rendering
        router.replace("/login")
        return
      }
      // Only allow rendering if user is authenticated
      setShouldRender(true)
    }
  }, [user, loading, router])

  // Prevent any rendering until we confirm authentication
  if (!shouldRender || loading || !user) {
    return null
  }

  return <>{children}</>
}
