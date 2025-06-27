import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { ProfileCard } from "@/components/profile-card"
import { PostsDisplay } from "@/components/posts-display"
import { TagsDisplay } from "@/components/tags-display"

interface UserData {
  username: string
  email: string
  bio?: string
  profileEmoji?: string
  bannerImage?: string
  bannerPreset?: string
  accentColor?: string
  createdAt?: any
  // Enhanced customization options
  profileTheme?: string
  customCSS?: string
  socialLinks?: {
    website?: string
    twitter?: string
    github?: string
    linkedin?: string
  }
  headerText?: string
  footerText?: string
  showJoinDate?: boolean
  profileLayout?: string
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
  allArticles?: Article[]  // For tags display to show all available tags
  linkPrefix?: string
  onTagClick?: (tag: string | null) => void
  selectedTag?: string | null
}

export function parseTokens({ content, userData, articles, allArticles, linkPrefix = "/discover", onTagClick, selectedTag }: TokenParserProps): React.ReactNode[] {
  const tokens = content.split(/(\{[^}]+\})/g)
  const accentColor = userData.accentColor || '#3b82f6' // default blue
  
  return tokens.map((token, index) => {
    switch (token) {
      case '{displayProfileCard}':
        return <ProfileCard key={index} userData={userData} />
      
      case '{displayPosts}':
        return <PostsDisplay key={index} articles={articles} linkPrefix={linkPrefix} accentColor={accentColor} />
      
      case '{displayTags}':
        return <TagsDisplay key={index} articles={allArticles || articles} accentColor={accentColor} onTagClick={onTagClick} selectedTag={selectedTag} />
      
      default:
        // Render markdown for non-token content, preserving line breaks
        return token ? (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
              h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 mt-6" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3 mt-5" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-bold mb-3 mt-4" {...props} />,
              h4: ({node, ...props}) => <h4 className="text-lg font-bold mb-2 mt-4" {...props} />,
              h5: ({node, ...props}) => <h5 className="text-base font-bold mb-2 mt-3" {...props} />,
              h6: ({node, ...props}) => <h6 className="text-sm font-bold mb-2 mt-3" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-3" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-3" {...props} />,
              li: ({node, ...props}) => <li className="mb-1" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 pl-4 italic mb-3" style={{ borderColor: accentColor }} {...props} />,
              code: ({node, className, children, ...props}: any) => {
                const isInline = !className?.includes('language-')
                return isInline ? 
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code> :
                  <code className="block bg-gray-100 p-3 rounded mb-3 text-sm overflow-x-auto" {...props}>{children}</code>
              },
              pre: ({node, ...props}) => <pre className="bg-gray-100 p-3 rounded mb-3 text-sm overflow-x-auto" {...props} />,
              a: ({node, ...props}) => <a className="hover:underline" style={{ color: accentColor }} {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
              em: ({node, ...props}) => <em className="italic" {...props} />,
            }}
          >
            {token}
          </ReactMarkdown>
        ) : null
    }
  }).filter(Boolean)
}
