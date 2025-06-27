"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { Footer } from "@/components/footer"

interface Article {
  title: string
  excerpt: string
  body: string
  authorId: string
  tags: string[]
  published: boolean
}

export default function EditArticlePage() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { id } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [body, setBody] = useState("")
  const [tag, setTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchArticle = async () => {
      try {
        if (!id || typeof id !== "string") return

        const articleRef = doc(db, "Articles", id)
        const articleSnap = await getDoc(articleRef)

        if (articleSnap.exists()) {
          const articleData = articleSnap.data() as Article

          // Check if the current user is the author
          if (articleData.authorId !== user.uid) {
            console.error("Unauthorized: You don't have permission to edit this article")
            router.push("/profile")
            return
          }

          setArticle(articleData)
          setTitle(articleData.title)
          setExcerpt(articleData.excerpt)
          setBody(articleData.body)
          setTags(articleData.tags || [])
          setPublished(articleData.published)
        } else {
          console.log("Article not found")
          router.push("/profile")
        }
      } catch (error) {
        console.error("Error fetching article:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [id, user, router])

  const handleAddTag = () => {
    if (tag.trim() && tags.length < 3 && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()])
      setTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (newPublishedState: boolean) => {
    if (!title || !excerpt || !body) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      if (!id || typeof id !== "string") return

      setIsSubmitting(true)

      await updateDoc(doc(db, "Articles", id), {
        title,
        excerpt,
        body,
        updatedAt: serverTimestamp(),
        tags,
        published: newPublishedState,
      })

      toast({
        title: "Success",
        description: newPublishedState ? "Article published successfully" : "Draft saved successfully",
      })

      router.push("/profile")
    } catch (error) {
      console.error("Error updating article:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/profile")
  }

  // Delete handler
  const handleDeleteArticle = () => {
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    if (!id || typeof id !== "string") return
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "Articles", id))
      toast({
        title: "Deleted",
        description: "Article deleted successfully.",
        variant: "destructive",
      })
      router.push("/profile")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete article.",
        variant: "destructive",
      })
      setShowConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowConfirm(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 px-4 min-h-[calc(100vh-146px)]">
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
         
      </>
    )
  }

  if (!article) {
    return (
      <>
        <Navbar />
        <div className="container  mx-auto py-8 px-4 min-h-[calc(100vh-146px)]">
          <div className="text-center py-12">
            <h1 className="text-xl font-bold mb-4">Article not found</h1>
            <p className="text-muted-foreground">The article you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
         
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8 px-8   min-h-[calc(100vh-146px)]">
        <h1 className="text-xl font-bold mb-8">Edit Article</h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Write a short excerpt (appears in article listings)"
              disabled={isSubmitting}
              className="resize-none h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <div className="border rounded-md p-2">
              <div className="text-xs text-muted-foreground mb-2">
                Supports Markdown: **bold**, *italic*, # heading, &gt; quote
              </div>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your article content here..."
                disabled={isSubmitting}
                className="resize-none h-64 border-0 focus-visible:ring-0 p-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (max 3)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag"
                disabled={isSubmitting || tags.length >= 3}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} disabled={isSubmitting || tags.length >= 3 || !tag.trim()}>
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t) => (
                  <Badge key={t} className="flex items-center gap-1">
                    {t}
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="rounded-full hover:bg-muted p-1"
                      aria-label={`Remove ${t} tag`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </Button>
            <Button variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>

          {/* Delete Button */}
          <div className="flex justify-end mt-4">
            <Button variant="destructive" onClick={handleDeleteArticle} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Article"}
            </Button>
          </div>

          {/* Confirm Delete Dialog */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-semibold mb-4">Delete Article</h2>
                <p className="mb-4">Are you sure you want to delete <span className="font-bold">{title}</span>? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
       
    </>
  )
}
