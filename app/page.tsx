"use client"

import Link from "next/link"
import { TypewriterEffect } from "@/components/typewriter-effect"
import { Minimize } from "lucide-react"

export default function Home() {
  const phrases = [
    "Read, Write, Build, and Connect without all the noise", 
    "Create your own small world on the internet", 
    "Experience the quiet and calm of the web again"
  ]

  return (
    <div className="flex flex-col h-[calc(100vh_-_73px)]">
      {/* Navbar */}
      <nav className="flex justify-between items-center py-8 px-4 ">
        <div>
          <Link href="/discover" className="hover:text-blue-500 transition-colors text-sm">
            Discover
          </Link>
        </div>
        <div className="flex gap-4">
         
          <Link href="/about" className="text-sm hover:text-blue-500 transition-colors">
            About
          </Link>
          <Link href="/login" className="text-sm hover:text-blue-500 transition-colors">
            Login
          </Link>
          <Link href="/signup" className="text-sm hover:text-blue-500 transition-colors">
            Create Space
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <Minimize className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">MINISPACE</h1>
        <div className="">
          <TypewriterEffect phrases={phrases} />
        </div>
      
      </main>
    </div>
  )
}