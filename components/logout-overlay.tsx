"use client"

import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export function LogoutOverlay() {
  const { loggingOut } = useAuth()

  if (!loggingOut) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Signing out...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Thank you for using MINI. See you soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
