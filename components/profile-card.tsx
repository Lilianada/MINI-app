"use client"

import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserIcon, CalendarIcon, Globe, ExternalLink, Twitter, Github, Linkedin } from "lucide-react"
import Link from "next/link"

interface UserData {
  username: string
  email: string
  bio?: string
  profileEmoji?: string
  bannerImage?: string
  bannerPreset?: string
  accentColor?: string
  createdAt?: any
  // Enhanced customization options
  profileTheme?: string
  socialLinks?: {
    website?: string
    twitter?: string
    github?: string
    linkedin?: string
  }
  headerText?: string
  footerText?: string
  showJoinDate?: boolean
  profileLayout?: string
}

interface ProfileCardProps {
  userData: UserData
}

export function ProfileCard({ userData }: ProfileCardProps) {
  const joinDate = userData.createdAt?.toDate?.()
  const showJoinDate = userData.showJoinDate !== false // default to true
  
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

  // Get theme-specific styling
  const getThemeClasses = () => {
    switch (userData.profileTheme) {
      case 'modern':
        return {
          card: 'shadow-xl border-0 bg-gradient-to-br from-background to-background/50',
          header: 'bg-gradient-to-r from-background/80 to-background/40 backdrop-blur-sm',
          avatar: 'ring-4 ring-white/50 shadow-2xl'
        }
      case 'creative':
        return {
          card: 'shadow-2xl border-2 transform hover:scale-[1.02] transition-transform duration-300',
          header: 'bg-gradient-to-r from-primary/5 to-secondary/5',
          avatar: 'ring-4 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300'
        }
      default: // minimal
        return {
          card: 'shadow-sm border',
          header: '',
          avatar: 'border-4 border-white shadow-lg'
        }
    }
  }

  const themeClasses = getThemeClasses()
  
  // Social links configuration
  const socialLinksConfig = [
    { key: 'website', icon: ExternalLink, label: 'Website' },
    { key: 'twitter', icon: Twitter, label: 'Twitter' },
    { key: 'github', icon: Github, label: 'GitHub' },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn' }
  ]

  return (
        <Card className={`overflow-hidden mb-8 profile-card ${themeClasses.card}`} style={{ '--accent-color': accentColor } as React.CSSProperties}>
          {/* Banner */}
          <div 
            className={`h-32 w-full profile-banner ${bannerClass}`}
            style={getBannerStyle()}
          />
          
          <CardHeader className={`-mt-8 relative z-10 ${themeClasses.header}`}>
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full bg-muted flex items-center justify-center text-3xl profile-avatar ${themeClasses.avatar}`} style={{ backgroundColor: accentColor }}>
                {userData?.profileEmoji ? (
                  <span className="text-white">{userData.profileEmoji}</span>
                ) : (
                  <UserIcon className="h-8 w-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold capitalize flex items-center gap-2">
                  {userData?.username}
                </h1>
                {showJoinDate && joinDate && (
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
              <p className="text-muted-foreground whitespace-pre-wrap mb-4">{userData.bio}</p>
              
              {/* Social Links */}
              {userData.socialLinks && Object.values(userData.socialLinks).some(link => link) && (
                <div className="flex flex-wrap gap-3 social-links">
                  {socialLinksConfig.map(({ key, icon: Icon, label }) => {
                    const link = userData.socialLinks?.[key as keyof typeof userData.socialLinks]
                    if (!link) return null
                    
                    return (
                      <Link
                        key={key}
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1 rounded-full border hover:shadow-sm transition-all text-sm"
                        style={{ 
                          borderColor: `${accentColor}40`,
                          color: accentColor
                        }}
                        title={`${label}: ${link}`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
  )
}
