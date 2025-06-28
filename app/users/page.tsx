"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Search, Users as UsersIcon, Filter, Grid, List } from "lucide-react"
import Link from "next/link"
import { initializeFirebase } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

interface User {
  id: string
  username: string
  email: string
  bio?: string
  profileEmoji?: string
  bannerPreset?: string
  accentColor?: string
  createdAt?: any
  articleCount?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most-active">("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Authentication redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { db } = await initializeFirebase()
        
        if (!db) {
          console.log("Firestore is not initialized")
          setLoading(false)
          return
        }

        const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore")

        // Fetch users
        const usersQuery = query(
          collection(db, "Users"),
          orderBy("createdAt", "desc"),
          limit(100) // Limit to first 100 users for performance
        )
        
        const usersSnapshot = await getDocs(usersQuery)
        const fetchedUsers: User[] = []

        // For each user, get their article count
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data()
          
          try {
            // Get article count for this user
            const articlesQuery = query(
              collection(db, "Articles"),
              orderBy("createdAt", "desc"),
              limit(50)
            )
            
            const articlesSnapshot = await getDocs(articlesQuery)
            const userArticles = articlesSnapshot.docs
              .map(doc => doc.data())
              .filter(article => article.authorName === userData.username && article.published)

            fetchedUsers.push({
              id: userDoc.id,
              username: userData.username,
              email: userData.email,
              bio: userData.bio,
              profileEmoji: userData.profileEmoji,
              bannerPreset: userData.bannerPreset,
              accentColor: userData.accentColor,
              createdAt: userData.createdAt,
              articleCount: userArticles.length
            })
          } catch (error) {
            // If we can't get articles for this user, still include them
            fetchedUsers.push({
              id: userDoc.id,
              username: userData.username,
              email: userData.email,
              bio: userData.bio,
              profileEmoji: userData.profileEmoji,
              bannerPreset: userData.bannerPreset,
              accentColor: userData.accentColor,
              createdAt: userData.createdAt,
              articleCount: 0
            })
          }
        }

        setUsers(fetchedUsers)
        setFilteredUsers(fetchedUsers)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  // Filter and sort users
  useEffect(() => {
    let filtered = [...users]

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(lowerSearchTerm) ||
        user.bio?.toLowerCase().includes(lowerSearchTerm)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
          case "most-active":
            return (b.articleCount || 0) - (a.articleCount || 0)
        case "newest":
          const dateA = a.createdAt?.toDate?.() || new Date(0)
          const dateB = b.createdAt?.toDate?.() || new Date(0)
          return dateB.getTime() - dateA.getTime()
        case "oldest":
          const dateA2 = a.createdAt?.toDate?.() || new Date(0)
          const dateB2 = b.createdAt?.toDate?.() || new Date(0)
          return dateA2.getTime() - dateB2.getTime()
        default:
          return 0
      }
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, sortBy])

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8 text-center">
          <Skeleton className="h-10 w-64 mx-auto mb-3" />
          <Skeleton className="h-6 w-96 mx-auto mb-1" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <div className="mb-8">
          <Skeleton className="h-11 w-full max-w-md mb-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-5 w-24 mx-auto" />
                  <Skeleton className="h-3 w-32 mx-auto" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8 ">
        <div className="flex  gap-3 mb-1">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Community
          </h1>
        </div>
        <p className="text-muted-foreground text-base">
          Discover amazing writers and creators in the MINISPACE community
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border rounded-lg text-sm bg-background hover:bg-muted transition-colors"
            >
              <option value="most-active">Most Active</option>
              <option value="newest">Newest Members</option>
              <option value="oldest">Earliest Members</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="px-3"
            >
              {viewMode === "grid" ? (
                <><List className="h-4 w-4 mr-1" /> List</>
              ) : (
                <><Grid className="h-4 w-4 mr-1" /> Grid</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Users Grid/List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <UsersIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchTerm 
              ? "Try adjusting your search terms or browse all community members" 
              : "Be the first to join our amazing community of writers and creators"
            }
          </p>
          {searchTerm && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchTerm("")}
            >
              Show All Members
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6" 
          : "space-y-3"
        }>
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  )
}

interface UserCardProps {
  user: User
  viewMode: "grid" | "list"
}

function UserCard({ user, viewMode }: UserCardProps) {
  const accentColor = user.accentColor || "#3b82f6"
  const joinDate = user.createdAt?.toDate?.() ? 
    new Date(user.createdAt.toDate()).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    }) : null
  
  if (viewMode === "list") {
    return (
      <Card className="group hover:shadow-md transition-all duration-200 hover:border-opacity-60">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Link href={`/${user.username}`} className="flex-shrink-0">
              <div 
                className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-semibold text-white shadow-sm group-hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: accentColor }}
              >
                {user.profileEmoji || user.username.charAt(0).toUpperCase()}
              </div>
            </Link>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <Link 
                  href={`/${user.username}`}
                  className="font-semibold text-lg hover:underline truncate"
                  style={{ color: accentColor }}
                  title={user.username}
                >
                  @{user.username}
                </Link>
                {user.articleCount !== undefined && user.articleCount > 0 && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {user.articleCount} post{user.articleCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                {joinDate && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    Joined {joinDate}
                  </span>
                )}
              </div>
              {user.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Link href={`/${user.username}`} className="block h-full">
      <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/40 hover:border-opacity-60">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Profile Avatar */}
            <div 
              className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: accentColor }}
            >
              {user.profileEmoji || user.username.charAt(0).toUpperCase()}
            </div>
            
            {/* Username */}
            <div className="space-y-1 w-full">
              <h3 
                className="font-bold text-lg group-hover:underline break-words"
                style={{ color: accentColor }}
                title={user.username}
              >
                @{user.username}
              </h3>
              
              {/* Stats */}
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                {user.articleCount !== undefined && user.articleCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
                    {user.articleCount} post{user.articleCount !== 1 ? 's' : ''}
                  </span>
                )}
                {joinDate && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                    Joined {joinDate}
                  </span>
                )}
              </div>
            </div>
            
            {/* Bio */}
            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                {user.bio}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
