"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

interface Issue {
  id: string
  name: string
  issue: string
  createdAt: Timestamp
  resolved?: boolean
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const { user, userData, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      if (!db) throw new Error("Firestore is not initialized")

      // Try to fetch issues with ordering by createdAt
      try {
        const issuesQuery = query(
          collection(db, "issues"),
          orderBy("createdAt", "desc")
        )

        const querySnapshot = await getDocs(issuesQuery)

        const fetchedIssues = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Issue[]

        setIssues(fetchedIssues)
      } catch (indexError: any) {
        console.error("Index error:", indexError)

        // If the error is about missing index
        if (indexError.code === "failed-precondition" && indexError.message.includes("requires an index")) {
          // Extract index URL for console logging
          const urlMatch = indexError.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
          const indexUrl = urlMatch ? urlMatch[0] : "https://console.firebase.google.com"
          console.log("Create Firestore index at:", indexUrl)

          // Try to fetch without ordering as a fallback
          const fallbackQuery = query(collection(db, "issues"))

          const fallbackSnapshot = await getDocs(fallbackQuery)

          // Sort manually in JavaScript
          const fallbackIssues = fallbackSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Issue[]

          // Sort by createdAt in descending order
          fallbackIssues.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0)
            const dateB = b.createdAt?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime()
          })

          setIssues(fallbackIssues)
        } else {
          // If it's another type of error, rethrow it
          throw indexError
        }
      }
    } catch (error) {
      console.error("Error fetching issues:", error)
      toast({
        title: "Error",
        description: "Failed to fetch issues. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResolveIssue = async (issueId: string) => {
    try {
      setResolvingId(issueId)
      
      // Update the issue in Firestore
      await updateDoc(doc(db, "issues", issueId), {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: user?.uid || "unknown"
      })
      
      // Update the local state
      setIssues(issues.map(issue => 
        issue.id === issueId 
          ? { ...issue, resolved: true } 
          : issue
      ))
      
      toast({
        title: "Issue Resolved",
        description: "The issue has been marked as resolved.",
      })
    } catch (error) {
      console.error("Error resolving issue:", error)
      toast({
        title: "Error",
        description: "Failed to resolve the issue. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResolvingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <>
        
        <div className="container mx-auto py-8 px-4 min-h-[calc(100vh-146px)]">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    )
  }

  if (!user) {
    return <PageLoadingSkeleton />
  }

  return (
    <>
      
      <div className="container mx-auto py-8 px-4 min-h-[calc(100vh-146px)]">
        <div className="mb-8">
          <h1 className="text-xl font-semibold mb-2">Issues</h1>
          <p className="text-muted-foreground">
            View and manage all submitted issues.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {issues.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No issues have been submitted yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {issues.map((issue) => (
                  <Card key={issue.id} className={issue.resolved ? "border-green-200 bg-green-50 dark:bg-green-950/10" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{issue.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {issue.resolved ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              Resolved
                            </Badge>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleResolveIssue(issue.id)}
                              disabled={resolvingId === issue.id}
                            >
                              {resolvingId === issue.id ? "Resolving..." : "Resolve"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submitted on {issue.createdAt?.toDate ? format(issue.createdAt.toDate(), 'PPP') : 'Unknown date'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{issue.issue}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
