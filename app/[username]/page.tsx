"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UserIcon, CalendarIcon, Globe } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { useToast } from "@/components/ui/use-toast"

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
  tags: string[]
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
        if (!username) {
          setUserNotFound(true)
          setLoading(false)
          return
        }

        if (!db) throw new Error("Firestore is not initialized")

        // First, find the user by username
        const usersQuery = query(
          collection(db, "Users"),
          where("username", "==", username)
        )
        
        const usersSnapshot = await getDocs(usersQuery)
        
        if (usersSnapshot.empty) {
          setUserNotFound(true)
          setLoading(false)
          return
        }

        // Get user data
        const userDoc = usersSnapshot.docs[0]
        const user = { ...userDoc.data() } as UserData
        setUserData(user)

        // Fetch user's published articles
        try {
          const articlesQuery = query(
            collection(db, "Articles"),
            where("authorName", "==", username),
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
          
          // Fallback: fetch without ordering
          const fallbackQuery = query(
            collection(db, "Articles"),
            where("authorName", "==", username),
            where("published", "==", true)
          )
          
          const fallbackSnapshot = await getDocs(fallbackQuery)
          const fallbackArticles = fallbackSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Article[]

          // Sort manually
          fallbackArticles.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0)
            const dateB = b.createdAt?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime()
          })

          setArticles(fallbackArticles)
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
        <div className="container mx-auto px-4 py-8 sm:px-8 min-h-[calc(100vh-8rem)]">
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
        <Footer />
      </>
    )
  }

  if (userNotFound) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 sm:px-8 min-h-[calc(100vh-8rem)]">
          <div className="text-center py-16">
            <UserIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {username ? `The user @${username} doesn't exist or may have changed their username.` : "Invalid user profile URL."}
            </p>
            <Link href="/articles">
              <Button>Browse Articles</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const joinDate = userData?.createdAt?.toDate?.()

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 sm:px-8 min-h-[calc(100vh-8rem)]">
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl">
                  {userData?.profileEmoji || <UserIcon className="h-8 w-8 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">
                    @{userData?.username}
                  </h1>
                  {joinDate && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <CalendarIcon className="h-4 w-4" />
                      Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">minispace.dev/@{userData?.username}</span>
                  <span className="sm:hidden">@{userData?.username}</span>
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
            <h2 className="text-xl font-semibold">
              Published Articles ({articles.length})
            </h2>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground mb-4">
                @{userData?.username} hasn't published any articles yet
              </p>
              <Link href="/articles">
                <Button variant="outline">Browse Other Articles</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <Link href={`/articles/${article.id}`} className="flex-1">
                        <h3 className="text-lg font-medium hover:text-blue-600 transition-colors cursor-pointer">
                          {article.title}
                        </h3>
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {article.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                      </span>
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {article.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
