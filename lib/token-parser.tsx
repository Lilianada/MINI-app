import React from "react"
import { ProfileCard } from "@/components/profile-card"
import { PostsDisplay } from "@/components/posts-display"

interface UserData {
  username: string
  email: string
  bio?: string
  profileEmoji?: string
  createdAt?: any
}

interface Article {
  id: string
  title: string
  excerpt: string
  createdAt: any
  published: boolean
  tags: string[]
  authorName: string
}

interface TokenParserProps {
  content: string
  userData: UserData
  articles: Article[]
  linkPrefix?: string
}

export function parseTokens({ content, userData, articles, linkPrefix = "/discover" }: TokenParserProps): React.ReactNode[] {
  const tokens = content.split(/(\{[^}]+\})/g)
  
  return tokens.map((token, index) => {
    switch (token) {
      case '{displayProfileCard}':
        return <ProfileCard key={index} userData={userData} />
      
      case '{displayPosts}':
        return <PostsDisplay key={index} articles={articles} linkPrefix={linkPrefix} />
      
      default:
        // Return regular text (non-token content)
        return token ? <div key={index} className="whitespace-pre-wrap">{token}</div> : null
    }
  }).filter(Boolean)
}
