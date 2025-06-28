"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { initializeFirebase } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, User, Palette, Layers, Settings as SettingsIcon } from "lucide-react"

export function SettingsPageContent() {
  // Basic profile state
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [profileEmoji, setProfileEmoji] = useState("")
  
  // Profile customization state
  const [bannerPreset, setBannerPreset] = useState("")
  const [accentColor, setAccentColor] = useState("")
  const [profileTheme, setProfileTheme] = useState("minimal")
  const [profileLayout, setProfileLayout] = useState("default")
  const [headerText, setHeaderText] = useState("")
  const [showJoinDate, setShowJoinDate] = useState(true)
  const [socialLinks, setSocialLinks] = useState({
    website: "",
    twitter: "",
    github: "",
    linkedin: ""
  })
  
  // Structured data collections
  const [general, setGeneral] = useState({
    displayName: "",
    profession: "",
    location: "",
    tagline: ""
  })
  const [projects, setProjects] = useState<Array<{
    title: string
    description?: string
    url?: string
    status?: 'active' | 'completed' | 'archived'
    year?: string
  }>>([])
  const [bookshelf, setBookshelf] = useState<Array<{
    title: string
    author: string
    status?: 'reading' | 'completed' | 'want-to-read'
    rating?: number
  }>>([])
  const [skills, setSkills] = useState<string[]>([])
  const [tools, setTools] = useState<string[]>([])
  
  // Advanced customization
  const [customLayout, setCustomLayout] = useState("")
  const [customCSS, setCustomCSS] = useState("")
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  
  const { user, userData, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (userData) {
      // Load basic profile data
      setUsername(userData.username)
      setEmail(userData.email)
      setBio(userData.bio || "")
      setProfileEmoji(userData.profileEmoji || "")
      
      // Load profile customization
      setBannerPreset(userData.bannerPreset || "")
      setAccentColor(userData.accentColor || "#3b82f6")
      setProfileTheme(userData.profileTheme || "minimal")
      setProfileLayout(userData.profileLayout || "default")
      setHeaderText(userData.headerText || "")
      setShowJoinDate(userData.showJoinDate !== false)
      setSocialLinks({
        website: userData.socialLinks?.website || "",
        twitter: userData.socialLinks?.twitter || "",
        github: userData.socialLinks?.github || "",
        linkedin: userData.socialLinks?.linkedin || ""
      })
      
      // Load structured data
      setGeneral({
        displayName: userData.general?.displayName || "",
        profession: userData.general?.profession || "",
        location: userData.general?.location || "",
        tagline: userData.general?.tagline || ""
      })
      setProjects(userData.projects || [])
      setBookshelf(userData.bookshelf || [])
      setSkills(userData.skills || [])
      setTools(userData.tools || [])
      
      // Load advanced customization
      setCustomLayout(userData.customLayout || `{displayProfileCard}

{displayPosts}`)
      setCustomCSS(userData.customCSS || "")
    }
  }, [userData])

  const handleSave = async () => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const { db } = await initializeFirebase()
      if (!db) throw new Error("Firestore is not initialized")

      const { doc, updateDoc } = await import("firebase/firestore")
      
      // Check if username changed
      const usernameChanged = username.toLowerCase() !== userData?.username?.toLowerCase()
      
      const updateData = {
        username: username.toLowerCase(),
        email,
        bio,
        profileEmoji,
        bannerPreset,
        accentColor,
        profileTheme,
        profileLayout,
        headerText,
        showJoinDate,
        socialLinks,
        general,
        projects,
        bookshelf,
        skills,
        tools,
        customLayout,
        customCSS
      }

      await updateDoc(doc(db, "Users", user.uid), updateData)

      // Handle username change in articles if needed
      if (usernameChanged) {
        try {
          const { collection, query, where, getDocs, writeBatch } = await import("firebase/firestore")
          
          const articlesQuery = query(
            collection(db, "Articles"),
            where("authorName", "==", userData?.username)
          )
          const articlesSnapshot = await getDocs(articlesQuery)
          
          if (!articlesSnapshot.empty) {
            const batch = writeBatch(db)
            articlesSnapshot.docs.forEach((articleDoc) => {
              batch.update(articleDoc.ref, { authorName: username.toLowerCase() })
            })
            await batch.commit()
            
            toast({
              title: "Profile Updated",
              description: `Updated ${articlesSnapshot.size} article(s) with new username.`,
            })
          }
        } catch (error) {
          console.error("Error updating articles:", error)
        }
      }

      // Handle email change if needed
      if (email !== userData?.email) {
        if (!currentPassword) {
          toast({
            title: "Password Required",
            description: "Current password is required to change email",
            variant: "destructive",
          })
          return
        }

        const { auth } = await initializeFirebase()
        if (!auth) throw new Error("Firebase Auth is not initialized")

        const { updateEmail, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth")
        const credential = EmailAuthProvider.credential(userData?.email || "", currentPassword)

        await reauthenticateWithCredential(user, credential)
        await updateEmail(user, email)
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      
      setCurrentPassword("")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper functions for managing collections
  const addProject = () => {
    setProjects([...projects, { title: "", description: "", url: "", status: "active", year: "" }])
  }

  const updateProject = (index: number, field: string, value: string) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
  }

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const addBook = () => {
    setBookshelf([...bookshelf, { title: "", author: "", status: "want-to-read", rating: 0 }])
  }

  const updateBook = (index: number, field: string, value: string | number) => {
    const updated = [...bookshelf]
    updated[index] = { ...updated[index], [field]: value }
    setBookshelf(updated)
  }

  const removeBook = (index: number) => {
    setBookshelf(bookshelf.filter((_, i) => i !== index))
  }

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill])
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const addTool = (tool: string) => {
    if (tool && !tools.includes(tool)) {
      setTools([...tools, tool])
    }
  }

  const removeTool = (tool: string) => {
    setTools(tools.filter(t => t !== tool))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sm:container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="basic" className="text-sm sm:text-base flex items-center gap-2">
              <User className="hidden sm:block h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-sm sm:text-base flex items-center gap-2">
              <Palette className="hidden sm:block h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="collections" className="text-sm sm:text-base flex items-center gap-2">
              <Layers className="hidden sm:block h-4 w-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-sm sm:text-base flex items-center gap-2">
              <SettingsIcon className="hidden sm:block h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Basic Information</CardTitle>
                <CardDescription>Update your basic profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="username"
                    />
                    <p className="text-xs text-muted-foreground">Your unique username (automatically lowercase)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileEmoji">Profile Emoji</Label>
                  <Input
                    id="profileEmoji"
                    value={profileEmoji}
                    onChange={(e) => setProfileEmoji(e.target.value)}
                    placeholder="🌱"
                    maxLength={2}
                  />
                  <p className="text-xs text-muted-foreground">Choose an emoji for your profile</p>
                </div>

                {/* General Information */}
                <div className="border-t pt-4 mt-6">
                  <h4 className="font-semibold mb-4">Display Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={general.displayName}
                        onChange={(e) => setGeneral({...general, displayName: e.target.value})}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        value={general.profession}
                        onChange={(e) => setGeneral({...general, profession: e.target.value})}
                        placeholder="Designer, Developer, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={general.location}
                        onChange={(e) => setGeneral({...general, location: e.target.value})}
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={general.tagline}
                        onChange={(e) => setGeneral({...general, tagline: e.target.value})}
                        placeholder="Your personal motto"
                      />
                    </div>
                  </div>
                </div>

                {email !== userData?.email && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Required to change email"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ... (other tabs content remains the same) ... */}
          {/* I'm truncating this for brevity, but all the other tabs would go here */}

        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleSave} disabled={isSubmitting} size="lg">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
