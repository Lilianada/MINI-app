"use client"

import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserIcon, CalendarIcon, Globe } from "lucide-react"

interface UserData {
  username: string
  email: string
  bio?: string
  profileEmoji?: string
  createdAt?: any
}

interface ProfileCardProps {
  userData: UserData
}

export function ProfileCard({ userData }: ProfileCardProps) {
  const joinDate = userData.createdAt?.toDate?.()

  return (
      <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                  {userData?.profileEmoji || <UserIcon className="h-4 w-4 text-muted-foreground" />}
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
                  <span className="text-sm text-muted-foreground">
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
