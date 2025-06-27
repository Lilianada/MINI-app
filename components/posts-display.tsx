"use client"

import React from "react"
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

interface PostsDisplayProps {
  articles: Article[]
  linkPrefix?: string
}

export function PostsDisplay({ articles, linkPrefix = "/discover" }: PostsDisplayProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">
          Published Articles ({articles.length})
        </h2>
      </div>

      <ArticleList
        articles={articles}
        variant="public"
        showAuthor={false}
        linkPrefix={linkPrefix}
        emptyMessage="No published articles yet"
      />
    </div>
  )
}
