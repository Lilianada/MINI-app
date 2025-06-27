"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface PostsDisplayProps {
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
  accentColor?: string
}

export function PostsDisplay({
  articles,
  variant = "public",
  showAuthor = false,
  onPublishToggle,
  onDelete,
  updatingId,
  deletingId,
  emptyMessage = "No articles found",
  emptySubtext,
  linkPrefix = "/articles",
  accentColor = "#3b82f6"
}: PostsDisplayProps) {
  if (articles.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        {emptySubtext && (
          <p className="text-xs text-muted-foreground mt-1">{emptySubtext}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Results header */}
      <div className="pb-4 mb-4 border-b">
        <p className="text-sm text-muted-foreground">
          Showing {articles.length} of {articles.length} writings
        </p>
      </div>

      {/* Articles list */}
      <div className="space-y-0">
        {articles.map((article) => (
          <PostItem
            key={article.id}
            article={article}
            variant={variant}
            showAuthor={showAuthor}
            onPublishToggle={onPublishToggle}
            onDelete={onDelete}
            updatingId={updatingId}
            deletingId={deletingId}
            linkPrefix={linkPrefix}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  )
}

interface PostItemProps {
  article: Article
  variant: "profile" | "public" | "discover"
  showAuthor: boolean
  onPublishToggle?: (articleId: string) => Promise<void>
  onDelete?: (article: Article) => void
  updatingId?: string | null
  deletingId?: string | null
  linkPrefix: string
  accentColor: string
}

function PostItem({
  article,
  variant,
  showAuthor,
  onPublishToggle,
  onDelete,
  updatingId,
  deletingId,
  linkPrefix,
  accentColor
}: PostItemProps) {
  const isProfile = variant === "profile"
  const isUpdating = updatingId === article.id
  const isDeleting = deletingId === article.id

  return (
    <div className="py-3 hover:bg-muted/30 transition-colors group flex items-center justify-between">
      {/* Left side - bullet and title */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Blue bullet point */}
        <div 
          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        
        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link 
              href={`${linkPrefix}/${article.id}`}
              className="text-base text-foreground hover:underline font-normal"
            >
              {article.title}
            </Link>
            
            {/* Word count and reading time (if available) */}
            {article.excerpt && (
              <span className="text-xs text-muted-foreground">
                {Math.ceil(article.excerpt.split(' ').length / 200)} min
              </span>
            )}
          </div>
          
          {/* Show author for discover variant */}
          {showAuthor && (
            <div className="mt-1">
              <Link 
                href={`/${article.authorName}`} 
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                by {article.authorName}
              </Link>
            </div>
          )}

          {/* Tags for profile variant - shown on hover */}
          {isProfile && article.tags && article.tags.length > 0 && (
            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1 flex-wrap">
                {article.tags.slice(0, 3).map((tag: string) => (
                  <span 
                    key={tag} 
                    className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
                {article.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{article.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - date and actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Date */}
        <span className="text-sm text-muted-foreground">
          {formatDate(article.createdAt)}
        </span>

        {/* Profile actions */}
        {isProfile && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 hover:bg-muted rounded"
              title={article.published ? "Unpublish" : "Publish"}
              onClick={() => onPublishToggle?.(article.id)}
              disabled={isUpdating}
            >
              {article.published ? (
                <Eye className="h-3 w-3 text-green-600" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            <Link href={`/edit/${article.id}`}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Edit className="h-3 w-3" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              disabled={isDeleting}
              onClick={() => onDelete?.(article)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper for formatting dates
function formatDate(dateObj: any) {
  let date: Date | null = null;
  if (typeof dateObj === "string" || typeof dateObj === "number") {
    date = new Date(dateObj);
  } else if (dateObj instanceof Date) {
    date = dateObj;
  } else if (dateObj?.toDate) {
    date = dateObj.toDate();
  }
  return date && !isNaN(date.getTime())
    ? date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
}