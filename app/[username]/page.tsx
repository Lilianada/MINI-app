"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UserIcon, CalendarIcon, Globe } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { useToast } from "@/components/ui/use-toast"
import { ArticleList } from "@/components/article-list"

interface UserData {
  username: string
  email: string
  bio?: string
  profileEmoji?: string
  createdAt?: any
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
  const username = params.username as string
  const [userData, setUserData] = useState<UserData | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [userNotFound, setUserNotFound] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!db) throw new Error("Firestore is not initialized")
        if (!username) {
          console.log("Username parameter is not available")
          setLoading(false)
          return
        }

        // First, find the user by username (try case-insensitive)
        let usersSnapshot
        
        // Try exact match first
        let usersQuery = query(
          collection(db, "Users"),
          where("username", "==", username)
        )
        
        usersSnapshot = await getDocs(usersQuery)
        
        // If no exact match, try with different casing
        if (usersSnapshot.empty) {
          // Try with first letter capitalized
          const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase()
          usersQuery = query(
            collection(db, "Users"),
            where("username", "==", capitalizedUsername)
          )
          usersSnapshot = await getDocs(usersQuery)
        }
        
        // If still no match, try all lowercase
        if (usersSnapshot.empty) {
          usersQuery = query(
            collection(db, "Users"),
            where("username", "==", username.toLowerCase())
          )
          usersSnapshot = await getDocs(usersQuery)
        }
        
        // If still no match, try all uppercase
        if (usersSnapshot.empty) {
          usersQuery = query(
            collection(db, "Users"),
            where("username", "==", username.toUpperCase())
          )
          usersSnapshot = await getDocs(usersQuery)
        }
        
        if (usersSnapshot.empty) {
          setUserNotFound(true)
          setLoading(false)
          return
        }

        // Get user data
        const userDoc = usersSnapshot.docs[0]
        const user = { ...userDoc.data() } as UserData
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
          const fetchedArticles = articlesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Article[]

          setArticles(fetchedArticles)
        } catch (indexError: any) {
          console.error("Index error for articles:", indexError)
          
          // Check if it's a missing index error
          if (indexError.code === "failed-precondition" && indexError.message.includes("requires an index")) {
            console.log("Missing Firestore index. Using fallback query without ordering.")
            console.log("Create index at:", indexError.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0])
            
            // Fallback: fetch without ordering
            const fallbackQuery = query(
              collection(db, "Articles"),
              where("authorName", "==", actualUsername),
              where("published", "==", true)
            )
            
            const fallbackSnapshot = await getDocs(fallbackQuery)
            const fallbackArticles = fallbackSnapshot.docs.map((doc) => ({
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
            // If it's another type of error, rethrow it
            throw indexError
          }
        }

      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchUserProfile()
    }
  }, [username, toast])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 sm:px-8 min-h-[calc(100vh-146px)]">
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Skeleton className="h-7 w-52 mb-4" />
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
      </>
    )
  }

  if (userNotFound) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 sm:px-8 min-h-[calc(100vh-146px)]">
          <div className="text-center py-16">
            <UserIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The user {username} doesn't exist or may have changed their username.
            </p>
            <Link href="/discover">
              <Button>Discover Articles</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  const joinDate = userData?.createdAt?.toDate?.()

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 sm:px-8 min-h-[calc(100vh-146px)]">
        {/* Profile Header */}
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
                  <span className="text-sm text-muted-foreground lowercase">
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

        {/* Published Articles */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              Published Articles ({articles.length})
            </h2>
          </div>

          <ArticleList
            articles={articles}
            variant="public"
            showAuthor={true}
            linkPrefix="/discover"
            emptyMessage={`${userData?.username} hasn't published any articles yet`}
          />
        </div>
      </div>
    </>
  )
}
