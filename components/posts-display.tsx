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
