"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UserIcon } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { parseTokens } from "@/lib/token-parser"
import { initializeFirebase } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

interface UserData {
  username: string
  email: string
  bio?: string
  profileEmoji?: string
  bannerImage?: string
  bannerPreset?: string
  accentColor?: string
  createdAt?: any
  customLayout?: string
  // Enhanced customization options
  profileTheme?: string
  customCSS?: string
  socialLinks?: {
    website?: string
    twitter?: string
    github?: string
    linkedin?: string
  }
  headerText?: string
  showJoinDate?: boolean
  profileLayout?: string
  // Structured data collections (read.cv style)
  general?: {
    displayName?: string
    profession?: string
    location?: string
    tagline?: string
  }
  projects?: Array<{
    title: string
    description?: string
    url?: string
    status?: 'active' | 'completed' | 'archived'
    year?: string
  }>
  bookshelf?: Array<{
    title: string
    author: string
    status?: 'reading' | 'completed' | 'want-to-read'
    rating?: number
  }>
  timeline?: Array<{
    title: string
    organization?: string
    period: string
    description?: string
    type: 'work' | 'education' | 'project' | 'achievement'
  }>
  skills?: string[]
  tools?: string[]
}

interface Article {
  id: string
  title: string
  excerpt: string
  createdAt: any
  published: boolean
  tags: string[]
  authorName: string
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const [userData, setUserData] = useState<UserData | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userNotFound, setUserNotFound] = useState(false)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Initialize Firebase first
        const { db } = await initializeFirebase()
        
        if (!db) {
          console.log("Firestore is not initialized")
          setLoading(false)
          return
        }
        
        if (!username) {
          console.log("Username parameter is not available")
          setLoading(false)
          return
        }

        // Dynamic import of Firestore functions
        const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore")

        console.log("Fetching profile for username:", username)

        // Normalize username to lowercase for lookup
        const normalizedUsername = username.toLowerCase()

        // Query for user by username (case-insensitive)
        let usersQuery = query(collection(db, "Users"), where("username", "==", normalizedUsername))
        let usersSnapshot = await getDocs(usersQuery)

        // If not found with lowercase, try original case for backward compatibility
        if (usersSnapshot.empty) {
          usersQuery = query(collection(db, "Users"), where("username", "==", username))
          usersSnapshot = await getDocs(usersQuery)
          
          if (usersSnapshot.empty) {
            console.log("No user found with username:", username)
            setUserNotFound(true)
            setLoading(false)
            return
          }
        }

        // Get user data
        const userDoc = usersSnapshot.docs[0]
        const user = { id: userDoc.id, ...userDoc.data() } as UserData & { id: string }
        setUserData(user)

        // Use the actual username from the database for article queries
        const actualUsername = user.username

        // Fetch user's published articles
        try {
          const articlesQuery = query(
            collection(db, "Articles"),
            where("authorName", "==", actualUsername),
            where("published", "==", true),
            orderBy("createdAt", "desc")
          )

          const articlesSnapshot = await getDocs(articlesQuery)
          const fetchedArticles = articlesSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })) as Article[]

          setArticles(fetchedArticles)
        } catch (indexError: any) {
          console.error("Index error for articles:", indexError)
          
          // Check if it's a missing index error
          if (indexError.code === "failed-precondition" && indexError.message.includes("requires an index")) {
            console.log("Missing Firestore index. Using fallback query without ordering.")
            
            // Fallback: fetch without ordering
            const fallbackQuery = query(
              collection(db, "Articles"),
              where("authorName", "==", actualUsername),
              where("published", "==", true)
            )
            
            const fallbackSnapshot = await getDocs(fallbackQuery)
            const fallbackArticles = fallbackSnapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            })) as Article[]

            // Sort manually in JavaScript
            fallbackArticles.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0)
              const dateB = b.createdAt?.toDate?.() || new Date(0)
              return dateB.getTime() - dateA.getTime()
            })

            setArticles(fallbackArticles)
          } else {
            throw indexError
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching user profile:", error)
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
      }
    }

    fetchUserProfile()
  }, [username, toast])

  // Filter articles based on selected tag
  useEffect(() => {
    if (selectedTag) {
      setFilteredArticles(articles.filter(article => 
        article.tags?.includes(selectedTag)
      ))
    } else {
      setFilteredArticles(articles)
    }
  }, [articles, selectedTag])

  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="space-y-8">
         
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="py-4 px-2 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex gap-2">
                    {[...Array(2)].map((_, j) => (
                      <Skeleton key={j} className="h-5 w-12 rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (userNotFound) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl py-16 mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The user {username} doesn't exist or may have changed their username.
          </p>
          <Link href="/discover">
            <Button>Discover Articles</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Default layout if no custom layout is set
  const defaultLayout = `{displayProfileCard}

{displayPosts}`

  const layoutContent = userData.customLayout || defaultLayout

  // Get layout-specific classes
  const getLayoutClasses = () => {
    switch (userData.profileLayout) {
      case 'sidebar':
        return 'max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8'
      case 'centered':
        return 'max-w-3xl mx-auto'
      default:
        return 'max-w-5xl mx-auto'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Custom CSS */}
      {userData.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: userData.customCSS }} />
      )}
      
      <div className="p-4 lg:p-6">
        {/* Header Text - Custom site title */}
        {userData.headerText && (
          <div className=" mb-6 lg:mb-8">
            <h1 className="text-lg lg:text-xl font-semibold break-words" style={{ color: userData.accentColor || '#3b82f6' }}>
              {userData.headerText}
            </h1>
          </div>
        )}

        <div className={getLayoutClasses()}>
          {parseTokens({
            content: layoutContent,
            userData,
            articles: filteredArticles,
            allArticles: articles,
            linkPrefix: "/discover",
            onTagClick: handleTagClick,
            selectedTag
          })}
        </div>
      </div>
    </div>
  )
}
