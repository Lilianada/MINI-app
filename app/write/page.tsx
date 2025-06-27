"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { X, ArrowLeft } from "lucide-react"

const MAX_EXCERPT_LENGTH = 150

export default function WritePage() {
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [body, setBody] = useState("")
  const [tag, setTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({
    title: "",
    excerpt: "",
    body: "",
  })
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();


  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_EXCERPT_LENGTH) {
      setExcerpt(value)
      setErrors((prev) => ({ ...prev, excerpt: "" }))
    } else {
      setExcerpt(value.substring(0, MAX_EXCERPT_LENGTH))
      setErrors((prev) => ({ ...prev, excerpt: `Excerpt cannot exceed ${MAX_EXCERPT_LENGTH} characters` }))
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = { title: "", excerpt: "", body: "" }

    if (!title.trim()) {
      newErrors.title = "Title is required"
      isValid = false
    }

    if (!excerpt.trim()) {
      newErrors.excerpt = "Excerpt is required"
      isValid = false
    } else if (excerpt.length > MAX_EXCERPT_LENGTH) {
      newErrors.excerpt = `Excerpt cannot exceed ${MAX_EXCERPT_LENGTH} characters`
      isValid = false
    }

    if (!body.trim()) {
      newErrors.body = "Content is required"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (published: boolean) => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (!db) {
        throw new Error("Firestore is not initialized")
      }

      await addDoc(collection(db, "Articles"), {
        title,
        excerpt,
        body,
        authorId: user?.uid,
        authorName: userData?.username,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags,
        readCount: 0,
        published,
      })

      toast({
        title: "Success",
        description: published ? "Article published successfully" : "Draft saved successfully",
        duration: 3000,
      })

      router.push("/profile")
    } catch (error) {
      console.error("Error saving article:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save article",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      
      <div className="container mx-auto py-8 sm:px-8">
        <div className="flex items-center mb-6">
          <h1 className="text-xl font-semibold">Start writing...</h1>
        </div>

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
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">
              Excerpt{" "}
              <span className="text-xs text-muted-foreground">
                ({excerpt.length}/{MAX_EXCERPT_LENGTH})
              </span>
            </Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={handleExcerptChange}
              placeholder="Write a short excerpt (appears in article listings)"
              disabled={isSubmitting}
              className="resize-none h-12"
            />
            {errors.excerpt && <p className="text-xs text-red-500">{errors.excerpt}</p>}
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
              {errors.body && <p className="text-xs text-red-500">{errors.body}</p>}
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

          <div className="flex gap-4 pt-4">
            <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
