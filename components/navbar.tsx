"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "./ui/button"
import { PenLine, User, Settings, LogOut, Loader2, Menu, Minimize, ChevronDown, BookOpen } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { IssueDialog } from "./issue-dialog"
import { ThemeToggle } from "./theme-toggle"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { ModeToggle } from "./mode-toggle"

export function Navbar() {
  const { user, logout, loggingOut } = useAuth()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)

  // Don't show navbar on landing page
  if (pathname === "/") return null

  return (
    <nav className="border-b p-4 sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex justify-between sm:justify-center items-center">
        {/* Mobile: show logo only */}
        <div className="flex  items-center gap-2 ">
          <Minimize className="h-5 w-5" />
          <Link href="/" className="font-bold text-lg">
            MINI
          </Link>
        </div>
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col justify-between">
              <div className="flex flex-col gap-6 p-4">
                <SheetTitle>
                  <Link href="/articles" className="font-bold text-lg mb-4 flex items-center gap-2 px-2 py-2">
                    MINI
                  </Link>
                </SheetTitle>
                <Link href="/article" className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded-lg px-2 py-2" onClick={() => setIsMobileOpen(false)}>
                  <BookOpen className="w-4 h-4" /> Read
                </Link>
                <Link href="/write" className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded-lg px-2 py-2" onClick={() => setIsMobileOpen(false)}>
                  <PenLine className="w-4 h-4" /> Write
                </Link>
                {user && (
                  <Link href="/profile" className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded-lg px-2 py-2" onClick={() => setIsMobileOpen(false)}>
                    <User className="w-4 h-4" /> Profile
                  </Link>
                )}
                {user && (
                  <Link href="/settings" className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded-lg px-2 py-2" onClick={() => setIsMobileOpen(false)} >
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                )}
                <div className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded-lg px-2">
                  <ThemeToggle /> Switch
                </div>
                </div>
                <div className="flex flex-col gap-6 p-4">
                  <IssueDialog />
                  {user ? (
                    <button
                      className={`px-4 py-2 rounded-md hover:bg-muted text-left flex items-center gap-2 ${loggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => {
                        if (!loggingOut) {
                          setIsMobileOpen(false)
                          logout()
                        }
                      }}
                      disabled={loggingOut}
                    >
                      <LogOut className="w-4 h-4" />
                      {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                  ) : (
                    <>
                     
                      <Link
                        href="/login"
                        className={`px-4 py-2 rounded-md hover:bg-muted ${pathname === "/login" ? "bg-muted" : ""}`}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className={`px-4 py-2 rounded-md hover:bg-muted ${pathname === "/signup" ? "bg-muted" : ""}`}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        Signup
                      </Link>
                    </>
                  )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
