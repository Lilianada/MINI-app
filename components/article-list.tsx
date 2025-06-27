"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Edit, Trash2 } from "lucide-react"

interface Article {
  id: string
  title: string
  excerpt: string
  createdAt: any
  published: boolean
  tags: string[]
  authorName: string
}

interface ArticleListProps {
  articles: Article[]
  variant?: "profile" | "public" | "discover"
  showAuthor?: boolean
  onPublishToggle?: (articleId: string) => Promise<void>
  onDelete?: (article: Article) => void
  updatingId?: string | null
  deletingId?: string | null
  emptyMessage?: string
  emptySubtext?: string
  linkPrefix?: string
}

export function ArticleList({
  articles,
  variant = "public",
  showAuthor = false,
  onPublishToggle,
  onDelete,
  updatingId,
  deletingId,
  emptyMessage = "No articles found",
  emptySubtext,
  linkPrefix = "/articles"
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {emptySubtext && (
          <p className="text-sm text-muted-foreground">{emptySubtext}</p>
        )}
      </div>
    )
  }

  return (
    <div className="">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          variant={variant}
          showAuthor={showAuthor}
          onPublishToggle={onPublishToggle}
          onDelete={onDelete}
          updatingId={updatingId}
          deletingId={deletingId}
          linkPrefix={linkPrefix}
        />
      ))}
    </div>
  )
}

interface ArticleCardProps {
  article: Article
  variant: "profile" | "public" | "discover"
  showAuthor: boolean
  onPublishToggle?: (articleId: string) => Promise<void>
  onDelete?: (article: Article) => void
  updatingId?: string | null
  deletingId?: string | null
  linkPrefix: string
}

function ArticleCard({
  article,
  variant,
  showAuthor,
  onPublishToggle,
  onDelete,
  updatingId,
  deletingId,
  linkPrefix
}: ArticleCardProps) {
  const isProfile = variant === "profile"
  const isUpdating = updatingId === article.id
  const isDeleting = deletingId === article.id

  return (
    <div className="py-4 px-2 rounded-md hover:bg-muted/50 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex flex-wrap gap-2 items-center justify-start text-left">
          <Link href={`${linkPrefix}/${article.id}`}>
            <h3 className={`font-medium hover:text-blue-600 transition-colors cursor-pointer ${
              isProfile ? 'text-base' : 'text-base'
            }`}>
              {article.title}
            </h3>
          </Link>
          {showAuthor && (
            <span className="text-sm text-muted-foreground">
              by{" "}
              <Link 
                href={`/${article.authorName}`} 
                className="hover:text-blue-600 transition-colors"
              >
                {article.authorName}
              </Link>
            </span>
          )}
        </div>

        {/* Profile controls */}
        {isProfile && (
          <div className="flex items-center gap-2">
            <button
              className="focus:outline-none"
              title={article.published ? "Unpublish (move to Drafts)" : "Publish"}
              onClick={() => onPublishToggle?.(article.id)}
              disabled={isUpdating}
            >
              {article.published ? (
                <Eye className="h-3 w-3 text-green-600" />
              ) : (
                <EyeOff className="h-3 w-3 text-zinc-500" />
              )}
            </button>
            <Badge variant={article.published ? "outline" : "secondary"} className="text-xs">
              {article.published ? "Published" : "Draft"}
            </Badge>
          </div>
        )}
      </div>

      {/* Excerpt */}
      <Link href={`${linkPrefix}/${article.id}`}>
        <p className="text-sm text-muted-foreground mb-2 cursor-pointer">
          {article.excerpt}
        </p>
      </Link>

      {/* Footer */}
      <div className="flex justify-between items-center">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {article.tags && article.tags.length > 0 && (
            <>
              {isProfile ? (
                article.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))
              ) : (
                article.tags.map((tag: string) => (
                  <p className="text-muted-foreground text-[10px]" key={tag}>
                    #{tag}
                  </p>
                ))
              )}
            </>
          )}
        </div>

        {/* Profile actions */}
        {isProfile && (
          <div className="flex gap-2 items-center">
            <Link href={`/edit/${article.id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Edit className="h-3 w-3" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
              disabled={isDeleting}
              onClick={() => onDelete?.(article)}
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
