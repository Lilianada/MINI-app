"use client"

import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserIcon, CalendarIcon, Globe } from "lucide-react"

interface UserData {
  username: string
  email: string
  bio?: string
  profileEmoji?: string
  bannerImage?: string
  bannerPreset?: string
  accentColor?: string
  createdAt?: any
}

interface ProfileCardProps {
  userData: UserData
}

export function ProfileCard({ userData }: ProfileCardProps) {
  const joinDate = userData.createdAt?.toDate?.()
  
  // Predefined banner patterns
  const bannerPresets = {
    'garden-green': 'bg-gradient-to-r from-green-400 to-green-600',
    'sunset-orange': 'bg-gradient-to-r from-orange-400 to-pink-500',
    'ocean-blue': 'bg-gradient-to-r from-blue-400 to-blue-600',
    'lavender-purple': 'bg-gradient-to-r from-purple-400 to-purple-600',
    'warm-earth': 'bg-gradient-to-r from-amber-400 to-orange-500',
    'cool-gray': 'bg-gradient-to-r from-gray-400 to-gray-600',
    'minimal-dots': 'bg-gray-100 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] bg-[length:20px_20px]'
  }
  
  // Get accent color or default
  const accentColor = userData.accentColor || '#3b82f6' // default blue
  
  // Get banner style
  const getBannerStyle = () => {
    if (userData.bannerImage) {
      return {
        backgroundImage: `url(${userData.bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    }
    return {}
  }
  
  const bannerClass = userData.bannerPreset && bannerPresets[userData.bannerPreset as keyof typeof bannerPresets] 
    ? bannerPresets[userData.bannerPreset as keyof typeof bannerPresets]
    : 'bg-gradient-to-r from-gray-200 to-gray-300'

  return (
      <div className="mb-8">
          <Card className="overflow-hidden" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            {/* Banner */}
            <div 
              className={`h-32 w-full ${bannerClass}`}
              style={getBannerStyle()}
            />
            
            <CardHeader className="-mt-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-3xl border-4 border-white shadow-lg">
                  {userData?.profileEmoji || <UserIcon className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold capitalize flex items-center gap-2">
                    {userData?.username}
                  </h1>
                  {joinDate && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" style={{ color: accentColor }}>
                    minispace.dev/{userData?.username}
                  </span>
                </div>
              </div>
            </CardHeader>
            {userData?.bio && (
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{userData.bio}</p>
              </CardContent>
            )}
          </Card>
        </div>
  )
}
