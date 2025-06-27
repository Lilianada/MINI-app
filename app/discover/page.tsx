"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  getCountFromServer,
} from "firebase/firestore"
import * as firebase from "@/lib/firebase"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface Article {
  id: string
  title: string
  excerpt: string
  authorName: string
  tags: string[]
  createdAt: any
}

const ARTICLES_PER_PAGE = 20
const MAX_EXCERPT_LENGTH = 150 // Character limit for excerpts

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const lastVisibleRef = React.useRef<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [totalArticles, setTotalArticles] = useState(0)
  const [indexError, setIndexError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchArticles(searchTerm, selectedTag, true)
    }, 350)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedTag])

  const fetchArticleCount = async () => {
    try {
      if (!firebase.db) throw new Error("Firestore is not initialized")

      const articlesQuery = query(collection(firebase.db, "Articles"), where("published", "==", true))
      const snapshot = await getCountFromServer(articlesQuery)
      const count = snapshot.data().count
      setTotalArticles(count)
      setTotalPages(Math.ceil(count / ARTICLES_PER_PAGE))
    } catch (error) {
      console.error("Error fetching article count:", error)
    }
  }

  // Helper function to extract the index URL from the error message
  const extractIndexUrl = (errorMessage: string) => {
    const urlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
    return urlMatch ? urlMatch[0] : "https://console.firebase.google.com"
  }

  const fetchArticles = useCallback(
    async (searchTerm = "", tag: string | null = null, pageReset = false) => {
      try {
        setLoading(true)

        if (!firebase.db) throw new Error("Firestore is not initialized")

        let articlesQuery = query(
          collection(firebase.db, "Articles"),
          where("published", "==", true),
          orderBy("createdAt", "desc"),
          limit(ARTICLES_PER_PAGE),
        )

        if (pageReset) {
          setLastVisible(null)
          setCurrentPage(1)
        } else if (lastVisible && !pageReset && currentPage > 1) {
          articlesQuery = query(
            collection(firebase.db, "Articles"),
            where("published", "==", true),
            orderBy("createdAt", "desc"),
            startAfter(lastVisible),
            limit(ARTICLES_PER_PAGE),
          )
        }

        try {
          const querySnapshot = await getDocs(articlesQuery)

          if (!querySnapshot.empty) {
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1])
            lastVisibleRef.current = querySnapshot.docs[querySnapshot.docs.length - 1]
          }

          const fetchedArticles = querySnapshot.docs.map((doc) => {
            const data = doc.data()
            // Truncate excerpt if it exceeds the maximum length
            let excerpt = data.excerpt || ""
            if (excerpt.length > MAX_EXCERPT_LENGTH) {
              excerpt = excerpt.substring(0, MAX_EXCERPT_LENGTH) + "..."
            }

            return {
              id: doc.id,
              ...data,
              excerpt,
            }
          }) as Article[]

          // Filter by search term if provided
          let filteredArticles = fetchedArticles
          if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filteredArticles = fetchedArticles.filter(
              (article) =>
                article.title.toLowerCase().includes(lowerSearchTerm) ||
                article.authorName?.toLowerCase().includes(lowerSearchTerm) ||
                (Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
            );
          }

          // Filter by tag if selected
          if (tag) {
            filteredArticles = filteredArticles.filter((article) => article.tags && article.tags.includes(tag))
          }

          setArticles(filteredArticles)
          setIndexError(null)

          // Collect all unique tags
          const tags = new Set<string>()
          fetchedArticles.forEach((article) => {
            if (article.tags) {
              article.tags.forEach((tag) => tags.add(tag))
            }
          })
          setAllTags(Array.from(tags))

          // Update total count
          await fetchArticleCount()
        } catch (indexErr: any) {
          console.error("Index error:", indexErr)

          // If the error is about missing index
          if (indexErr.code === "failed-precondition" && indexErr.message.includes("requires an index")) {
            setIndexError(indexErr.message)
            console.log("Create Firestore index at:", extractIndexUrl(indexErr.message))

            // Try to fetch without ordering as a fallback
            const fallbackQuery = query(
              collection(firebase.db, "Articles"),
              where("published", "==", true),
              limit(ARTICLES_PER_PAGE),
            )

            const fallbackSnapshot = await getDocs(fallbackQuery)

            // Sort manually in JavaScript
            const fallbackArticles = fallbackSnapshot.docs.map((doc) => {
              const data = doc.data()
              // Truncate excerpt if it exceeds the maximum length
              let excerpt = data.excerpt || ""
              if (excerpt.length > MAX_EXCERPT_LENGTH) {
                excerpt = excerpt.substring(0, MAX_EXCERPT_LENGTH) + "..."
              }

              return {
                id: doc.id,
                ...data,
                excerpt,
              }
            }) as Article[]

            // Sort by createdAt in descending order
            fallbackArticles.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0)
              const dateB = b.createdAt?.toDate?.() || new Date(0)
              return dateB.getTime() - dateA.getTime()
            })

            setArticles(fallbackArticles)
          } else {
            // If it's another type of error, rethrow it
            throw indexErr
          }
        }
      } catch (error) {
        console.error("Error fetching articles:", error)
        setArticles([])
      } finally {
        setLoading(false)
      }
    },
    [firebase.db],
  )

  useEffect(() => {
    fetchArticles().catch((err) => {
      console.error("Error in initial fetch:", err)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebase.db])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchArticles(searchTerm, selectedTag, true)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
      fetchArticles(searchTerm, selectedTag)
    }
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1)
    fetchArticles(searchTerm, selectedTag)
  }

  const handlePageClick = (page: number) => {
    setCurrentPage(page)
    fetchArticles(searchTerm, selectedTag)
  }

  // Calculate pagination display
  const showPagination = totalArticles > ARTICLES_PER_PAGE
  const maxPageButtons = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2))
  const endPage = Math.min(totalPages, startPage + maxPageButtons - 1)

  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1)
  }

  return (
    <>
      <Navbar />
      <div className="py-8 px-4 sm:px-8 min-h-[calc(100vh-8rem)] ">

        <div className="mb-8">
          <form className="flex gap-2 mb-4 max-w-xl" onSubmit={e => e.preventDefault()}>
            <Input
              type="text"
              placeholder="Search by title, author, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </form>
        </div>

        {loading ? (
          <div className="space-y-6 my-12">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-4 px-2 rounded-md">
                <div className="flex flex-wrap gap-2 items-center justify-start text-left mb-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-24 ml-2" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-5 w-12 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles found</p>
                <Link href="/write" className="mt-4 inline-block">
                  <Button variant="outline" className="mt-4">
                    Write Your First Article
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="transition-all duration-500" style={{ opacity: loading ? 0.5 : 1 }}>
                  {articles.map((article) => (
                    <div key={article.id} className="py-4 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex flex-wrap gap-2 items-center justify-start text-left">
                        <Link href={`/articles/${article.id}`}>
                          <h2 className="text-base font-semibold hover:text-blue-600 transition-colors cursor-pointer">
                            {article.title}
                          </h2>
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          by{" "}
                          <Link href={`/${article.authorName}`} className="hover:text-blue-600 transition-colors">
                            {article.authorName}
                          </Link>
                        </span>
                      </div>
                      <Link href={`/articles/${article.id}`}>
                        <p className="text-sm text-muted-foreground cursor-pointer">{article.excerpt}</p>
                      </Link>
                      <div className="flex flex-wrap justify-start items-center gap-2">
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {article.tags.map((tag) => (
                              <p className="text-muted-foreground text-[10px]" key={tag}>#{tag}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Only show pagination if there are more than one page of articles */}
                {showPagination && (
                  <div className="flex justify-center mt-8 overflow-x-auto">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" onClick={handlePreviousPage} disabled={currentPage === 1}>
                        Previous
                      </Button>

                      {startPage > 1 && (
                        <>
                          <Button
                            variant={currentPage === 1 ? "default" : "outline"}
                            onClick={() => handlePageClick(1)}
                            className="w-10 h-10 p-0"
                          >
                            1
                          </Button>
                          {startPage > 2 && <span className="mx-1">...</span>}
                        </>
                      )}

                      {Array.from({ length: endPage - startPage + 1 }, (_, i) => (
                        <Button
                          key={startPage + i}
                          variant={currentPage === startPage + i ? "default" : "outline"}
                          onClick={() => handlePageClick(startPage + i)}
                          className="w-10 h-10 p-0"
                        >
                          {startPage + i}
                        </Button>
                      ))}

                      {endPage < totalPages && (
                        <>
                          {endPage < totalPages - 1 && <span className="mx-1">...</span>}
                          <Button
                            variant={currentPage === totalPages ? "default" : "outline"}
                            onClick={() => handlePageClick(totalPages)}
                            className="w-10 h-10 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}

                      <Button
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages || articles.length < ARTICLES_PER_PAGE}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )
          }
          </>
        )}
      </div>
      </>
    )
}
