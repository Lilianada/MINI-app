"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, orderBy, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Mail, UserIcon, PenLineIcon, Globe, PenBoxIcon } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { HelpModal } from "@/components/help-modal"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { ArticleList } from "@/components/article-list"

interface Article {
  id: string
  title: string
  excerpt: string
  createdAt: any
  published: boolean
  tags: string[]
  authorName: string
}

export default function ProfilePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handlePublishToggle = async (articleId: string) => {
    setUpdatingId(articleId);
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      await updateDoc(doc(db, "Articles", articleId), {
        published: !article.published,
      });
      setArticles((prev) => prev.map((a) =>
        a.id === articleId ? { ...a, published: !a.published } : a
      ));
      toast({
        title: "Success",
        description: `Article ${article.published ? "moved to Drafts" : "published"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update publish status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const handleDeleteClick = (article: Article) => {
    setArticleToDelete(article);
    setShowConfirm(true);
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    // Don't fetch articles until user and userData are loaded and authenticated
    if (loading || !user || !userData) {
      return;
    }

    const fetchUserArticles = async () => {
      try {
        if (!db) throw new Error("Firestore is not initialized")
        if (!user?.uid) {
          console.log("User UID is not available yet")
          return
        }

        // First try to fetch articles with the index
        try {
          const articlesQuery = query(
            collection(db, "Articles"),
            where("authorId", "==", user.uid),
            orderBy("createdAt", "desc"),
          )

          const querySnapshot = await getDocs(articlesQuery)

          const fetchedArticles = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            authorName: userData?.username || "Unknown"
          })) as Article[]

          setArticles(fetchedArticles)
        } catch (indexError: any) {
          console.error("Index error:", indexError)

          // If the error is about missing index
          if (indexError.code === "failed-precondition" && indexError.message.includes("requires an index")) {
            // Extract index URL for console logging
            const urlMatch = indexError.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
            const indexUrl = urlMatch ? urlMatch[0] : "https://console.firebase.google.com"
            console.log("Create Firestore index at:", indexUrl)

            // Try to fetch without ordering as a fallback
            const fallbackQuery = query(collection(db, "Articles"), where("authorId", "==", user.uid))

            const fallbackSnapshot = await getDocs(fallbackQuery)

            // Sort manually in JavaScript
            const fallbackArticles = fallbackSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              authorName: userData?.username || "Unknown"
            })) as Article[]

            // Sort by createdAt in descending order
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
        console.error("Error fetching articles:", error)
        setArticles([])
      } 
    }

    fetchUserArticles()
  }, [user, userData, router, loading]) // Added userData dependency

  if (!user || loading || !userData) {
    return (
      <>
        <div className="container mx-auto   py-8 px-4 min-h-[calc(100vh-8rem)]">
          <div className="mb-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  </div>
                </div>
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

  return (
    <>
      <div className="container mx-auto px-4  py-8 sm:px-8 min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">My Profile</h1>
          </div>
          <div className="flex gap-2">
             <HelpModal />
          </div>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader className=" py-4 px-6">
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-full h-10 w-10 flex items-center justify-center">
                    {userData?.profileEmoji ? (
                      <span className="text-base">{userData.profileEmoji}</span>
                    ) : (
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="text-sm font-medium">@{userData?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-full h-10 w-10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{userData?.email}</p>
                  </div>
                </div>
                {userData?.bio && (
                  <div className="flex items-start gap-3">
                    <div className="bg-muted rounded-full h-10 w-10 flex items-center justify-center mt-1">
                      <PenBoxIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bio</p>
                      <p className="text-sm font-medium whitespace-pre-wrap">{userData.bio}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-full h-10 w-10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Public Profile</p>
                    <Link href={`/${userData?.username}`} className="text-sm font-medium text-blue-600 hover:underline lowercase">
                      minispace.dev/{userData?.username}
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold px-2">My Articles</h2>
            <Link href="/write">
              <Button>
                <PenLineIcon className="w-4 h-4 mr-2" />
                Write New Article
              </Button>
            </Link>
          </div>

          <ArticleList
            articles={articles}
            variant="profile"
            onPublishToggle={handlePublishToggle}
            onDelete={handleDeleteClick}
            updatingId={updatingId}
            deletingId={deletingId}
            emptyMessage="You haven't written any articles yet"
            emptySubtext='Click "Write New Article" above to get started!'
          />
        </div>
      </div>
      
      {/* Confirm Delete Dialog */}
      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false)
          setArticleToDelete(null)
        }}
        onConfirm={async () => {
          if (!articleToDelete) return
          setDeletingId(articleToDelete.id)
          try {
            await deleteDoc(doc(db, "Articles", articleToDelete.id))
            setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id))
            toast({
              title: "Deleted",
              description: "Article deleted successfully.",
              variant: "destructive",
            })
            setShowConfirm(false)
            setArticleToDelete(null)
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to delete article.",
              variant: "destructive",
            })
          } finally {
            setDeletingId(null)
          }
        }}
        title="Delete Article"
        message={`Are you sure you want to delete <span class="font-bold">${articleToDelete?.title}</span>? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deletingId !== null}
        loadingText="Deleting..."
        variant="destructive"
      />
    </>
  )
}
