import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { ProfileCard } from "@/components/profile-card"
import { PostsDisplay } from "@/components/posts-display"
import { TagsDisplay } from "@/components/tags-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Star, Calendar, MapPin, Briefcase, GraduationCap, Trophy } from "lucide-react"
import Link from "next/link"

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
  showJoinDate?: boolean
  profileLayout?: string
  // Structured data collections
  general?: {
    displayName?: string
    profession?: string
    location?: string
    tagline?: string
  }
  projects?: Array<{
    title: string
    description?: string
    url?: string
    status?: 'active' | 'completed' | 'archived'
    year?: string
  }>
  bookshelf?: Array<{
    title: string
    author: string
    status?: 'reading' | 'completed' | 'want-to-read'
    rating?: number
  }>
  timeline?: Array<{
    title: string
    organization?: string
    period: string
    description?: string
    type: 'work' | 'education' | 'project' | 'achievement'
  }>
  skills?: string[]
  tools?: string[]
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
      
      // Structured data tokens (read.cv style)
      case '{projects}':
        return userData.projects && userData.projects.length > 0 ? (
          <Card key={index} className="mb-6 projects-section">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" style={{ color: accentColor }} />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userData.projects.map((project, i) => (
                  <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow project-item">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{project.title}</h4>
                      {project.year && <span className="text-xs text-muted-foreground">{project.year}</span>}
                    </div>
                    {project.description && <p className="text-sm text-muted-foreground mb-2">{project.description}</p>}
                    <div className="flex items-center justify-between">
                      {project.status && (
                        <Badge variant="outline" className="text-xs" style={{ borderColor: `${accentColor}40`, color: accentColor }}>
                          {project.status}
                        </Badge>
                      )}
                      {project.url && (
                        <Link href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: accentColor }}>
                          <ExternalLink className="h-3 w-3 inline" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null
      
      case '{bookshelf}':
        return userData.bookshelf && userData.bookshelf.length > 0 ? (
          <Card key={index} className="mb-6 bookshelf-section">
            <CardHeader>
              <CardTitle className="text-lg">📚 Bookshelf</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData.bookshelf.map((book, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg book-item">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{book.title}</h4>
                      <p className="text-xs text-muted-foreground">by {book.author}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {book.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, starIndex) => (
                            <Star key={starIndex} className={`h-3 w-3 ${starIndex < book.rating! ? 'fill-current' : ''}`} style={{ color: starIndex < book.rating! ? accentColor : '#e5e7eb' }} />
                          ))}
                        </div>
                      )}
                      {book.status && (
                        <Badge variant="outline" className="text-xs" style={{ borderColor: `${accentColor}40`, color: accentColor }}>
                          {book.status === 'want-to-read' ? 'Want to read' : book.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null
      
      case '{skills}':
        return userData.skills && userData.skills.length > 0 ? (
          <Card key={index} className="mb-6 skills-section">
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userData.skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="skill-item" style={{ borderColor: `${accentColor}40`, color: accentColor }}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null
      
      // Dynamic text tokens
      case '{displayName}':
        return userData.general?.displayName ? (
          <span key={index} className="font-semibold" style={{ color: accentColor }}>
            {userData.general.displayName}
          </span>
        ) : userData.username
      
      case '{profession}':
        return userData.general?.profession ? (
          <span key={index} className="text-muted-foreground">
            {userData.general.profession}
          </span>
        ) : null
      
      case '{location}':
        return userData.general?.location ? (
          <span key={index} className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {userData.general.location}
          </span>
        ) : null
      
      default:
        // Render markdown for non-token content, preserving line breaks
        return token ? (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
              h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 mt-6" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mb-3 mt-5" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-3 mt-4" {...props} />,
              h4: ({node, ...props}) => <h4 className="text-lg font-semibold mb-2 mt-4" {...props} />,
              h5: ({node, ...props}) => <h5 className="text-base font-semibold mb-2 mt-3" {...props} />,
              h6: ({node, ...props}) => <h6 className="text-sm font-semibold mb-2 mt-3" {...props} />,
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
