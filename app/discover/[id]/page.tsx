"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import { Footer } from "@/components/footer"

interface Article {
  title: string
  body: string
  authorName: string
  createdAt: any
  updatedAt: any
  tags: string[]
}

export default function ArticlePage() {
  const { id } = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        if (!id || typeof id !== "string") return
        if (!db) throw new Error("Firestore is not initialized")

        const articleRef = doc(db, "Articles", id)
        const articleSnap = await getDoc(articleRef)

        if (articleSnap.exists()) {
          const articleData = articleSnap.data() as Article
          setArticle(articleData)

          // Increment read count
          try {
            await updateDoc(articleRef, {
              readCount: increment(1),
            })
          } catch (updateError) {
            console.error("Error updating read count:", updateError)
            // Continue even if read count update fails
          }
        } else {
          // Article not found - this is a normal condition, not an error
          console.log("Article not found:", id)
          setNotFound(true)
        }
      } catch (error) {
        console.error("Error fetching article:", error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [id])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 px-4   min-h-[calc(100vh-8rem)]">
          <Link href="/discover">
            <Button variant="outline" className="mb-6">&larr; Back to Articles</Button>
          </Link>
          <article className="prose dark:prose-invert max-w-none">
            <Skeleton className="h-10 w-3/4 mb-4" /> {/* Title */}
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-4 w-1/3" /> {/* Author/Date */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
            <div className="space-y-4 mt-8">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </article>
        </div>
         
      </>
    )
  }

  if (notFound || !article) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 px-4 min-h-[calc(100vh-8rem)]">
          <div className="text-center py-12">
            <h1 className="text-xl font-bold mb-4">Article not found</h1>
            <p className="text-muted-foreground">The article you're looking for doesn't exist or has been removed.</p>
            <Link href="/discover">
              <Button variant="outline" className="mt-4">
                Back to Articles
              </Button>
            </Link>
          </div>
        </div>
         
      </>
    )
  }

  const formattedDate = article.updatedAt?.toDate
    ? new Date(article.updatedAt.toDate()).toLocaleDateString()
    : article.createdAt?.toDate
      ? new Date(article.createdAt.toDate()).toLocaleDateString()
      : "Unknown date"

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8 px-8 min-h-[calc(100vh-8rem)]">
        <Link href="/discover">
          <Button variant="outline" className="mb-6">&larr; Back to Articles</Button>
        </Link>
        <article className="prose dark:prose-invert max-w-none">
          <h1 className="text-xl font-semibold mb-2">{article.title}</h1>

          <div className="flex items-center flex-wrap gap-2 justify-between mb-8">
            <div className="text-sm text-muted-foreground">
              By{" "}
              <Link href={`/${article.authorName}`} className="hover:text-blue-600 transition-colors">
                {article.authorName}
              </Link>{" "}
              • {formattedDate}
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="flex gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <ReactMarkdown>{article.body}</ReactMarkdown>
          </div>
        </article>
      </div>
    </>
  )
}
