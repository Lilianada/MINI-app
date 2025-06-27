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
  onTagClick?: (tag: string) => void
  selectedTag?: string | null
}

export function TagsDisplay({ 
  articles, 
  accentColor = "#3b82f6", 
  onTagClick,
  selectedTag 
}: TagsDisplayProps) {
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

  const totalCount = articles.length

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
        {selectedTag && (
          <button
            onClick={() => onTagClick?.(null as any)}
            className="text-xs text-blue-600 hover:underline"
          >
            + View All Tags ({totalCount})
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {/* All Tags button */}
        {!selectedTag && tagCounts.length > 0 && (
          <button
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            <span>All Tags</span>
            <span className="bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
              {totalCount}
            </span>
          </button>
        )}

        {tagCounts.map(([tag, count]) => {
          const isSelected = selectedTag === tag
          return (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${
                isSelected 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>#{tag}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                isSelected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          )
        })}

        {/* +55 more tags button if there are many tags */}
        {tagCounts.length > 12 && (
          <button className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            +{tagCounts.length - 12} more tags
          </button>
        )}
      </div>

      {/* Results indicator */}
      {selectedTag && (
        <p className="text-xs text-muted-foreground">
          Showing {articles.filter(article => article.tags?.includes(selectedTag)).length} of {totalCount} writings
        </p>
      )}
    </div>
  )
}
