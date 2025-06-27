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
      <div className="py-8">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        {emptySubtext && (
          <p className="text-xs text-muted-foreground mt-1">{emptySubtext}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0 posts-container">
     
      {/* Articles list */}
      <div className="space-y-0 posts-list">
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
    <div className="py-2 hover:bg-muted/30 transition-colors group article-item"
      data-published={article.published}
    >
      <div className="flex items-center gap-3">
        {/* Blue bullet point */}
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${accentColor}30` }}
        />
        
        {/* Content line with title, tags, dotted line, and date */}
        <div className="flex items-center flex-1 min-w-0 gap-2">
          {/* Title */}
          <Link 
            href={`${linkPrefix}/${article.id}`}
            className="text-sm text-foreground hover:underline font-normal flex-shrink-0"
          >
            {article.title}
          </Link>
          
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              {article.tags.slice(0, 2).map((tag: string) => (
                <span 
                  key={tag} 
                  className="text-[10px] px-2 py-0.5 rounded-2xl text-zinc-500"
                  style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Dotted line that fills the space */}
          <div className="flex-1 border-b border-dashed border-border min-w-4"></div>
          
          {/* Date */}
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDateDDMMYYYY(article.createdAt)}
          </span>
          
          {/* Profile actions - only visible on hover */}
          {isProfile && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
    </div>
  )
}

// Helper for formatting dates in DD-MM-YYYY format
function formatDateDDMMYYYY(dateObj: any) {
  let date: Date | null = null;
  if (typeof dateObj === "string" || typeof dateObj === "number") {
    date = new Date(dateObj);
  } else if (dateObj instanceof Date) {
    date = dateObj;
  } else if (dateObj?.toDate) {
    date = dateObj.toDate();
  }
  if (date && !isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return "";
}