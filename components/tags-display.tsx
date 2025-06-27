"use client"

import React, { useState, useMemo } from "react"

interface Article {
  id: string
  title: string
  excerpt: string
  createdAt: any
  published: boolean
  tags: string[]
  authorName: string
}

interface TagsDisplayProps {
  articles: Article[]
  accentColor?: string
  onTagClick?: (tag: string | null) => void
  selectedTag?: string | null
}

export function TagsDisplay({ 
  articles, 
  accentColor = "#3b82f6", 
  onTagClick,
  selectedTag 
}: TagsDisplayProps) {
  const [showAllTags, setShowAllTags] = useState(false)
  
  // Extract all unique tags from articles with their counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    articles.forEach(article => {
      article.tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a) // Sort by count descending
  }, [articles])

  const displayedTags = showAllTags ? tagCounts : tagCounts.slice(0, 12)
  const hasMoreTags = tagCounts.length > 12

  if (tagCounts.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-muted-foreground">No tags found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Tags <span className="text-muted-foreground">(click to filter)</span>
        </h3>
        {hasMoreTags && (
          <button
            onClick={() => setShowAllTags(!showAllTags)}
            className="text-xs hover:underline"
            style={{ color: accentColor }}
          >
            {showAllTags ? `- Hide Tags` : `+ View All Tags (${tagCounts.length})`}
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {/* All Tags button */}
        <button
          onClick={() => onTagClick?.(null)}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${
            !selectedTag 
              ? 'text-white' 
              : 'hover:opacity-80'
          }`}
          style={{ 
            backgroundColor: !selectedTag ? accentColor : `${accentColor}20`,
            color: !selectedTag ? 'white' : accentColor
          }}
        >
          <span>All Tags</span>
          <span 
            className="text-[10px] font-medium"
          >
           ({tagCounts.length})
          </span>
        </button>

        {displayedTags.map(([tag, count]) => {
          const isSelected = selectedTag === tag
          return (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors hover:opacity-80"
              style={{
                backgroundColor: isSelected ? accentColor : `${accentColor}20`,
                color: isSelected ? 'white' : accentColor
              }}
            >
              <span>#{tag}</span>
              <span 
              >
                ({count})
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
