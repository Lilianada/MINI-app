"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { initializeFirebase } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, User, Palette, Layers, Settings as SettingsIcon } from "lucide-react"

export default function SettingsPage() {
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
  
  const { user, userData, logout, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

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
  }, [user, userData, router])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6 max-w-4xl">
          <p>Loading...</p>
        </div>
      </div>
    )
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

          {/* Profile Customization Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Visual Customization</CardTitle>
                  <CardDescription>Customize the look and feel of your profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="accentColor"
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bannerPreset">Banner Style</Label>
                      <select
                        id="bannerPreset"
                        value={bannerPreset}
                        onChange={(e) => setBannerPreset(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Default Gray</option>
                        <option value="garden-green">Garden Green</option>
                        <option value="sunset-orange">Sunset Orange</option>
                        <option value="ocean-blue">Ocean Blue</option>
                        <option value="lavender-purple">Lavender Purple</option>
                        <option value="warm-earth">Warm Earth</option>
                        <option value="cool-gray">Cool Gray</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profileTheme">Profile Theme</Label>
                      <select
                        id="profileTheme"
                        value={profileTheme}
                        onChange={(e) => setProfileTheme(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="minimal">Minimal - Clean and simple</option>
                        <option value="modern">Modern - Subtle gradients</option>
                        <option value="creative">Creative - Unique styling</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profileLayout">Page Layout</Label>
                      <select
                        id="profileLayout"
                        value={profileLayout}
                        onChange={(e) => setProfileLayout(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="default">Default - Standard layout</option>
                        <option value="sidebar">Sidebar - Side-by-side</option>
                        <option value="centered">Centered - Focused layout</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headerText">Site Title</Label>
                    <Input
                      id="headerText"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="Welcome to my space!"
                    />
                    <p className="text-xs text-muted-foreground">Custom title at the top of your profile page</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showJoinDate"
                      checked={showJoinDate}
                      onChange={(e) => setShowJoinDate(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="showJoinDate" className="text-sm">Show join date on profile</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Social Links</CardTitle>
                  <CardDescription>Add links to your social profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={socialLinks.website}
                        onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                        placeholder="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input
                        id="github"
                        value={socialLinks.github}
                        onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                        placeholder="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={socialLinks.linkedin}
                        onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                        placeholder="username"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections">
            <div className="space-y-6">
              {/* Projects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Projects
                    <Button onClick={addProject} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </CardTitle>
                  <CardDescription>Showcase your work and projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projects.map((project, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Project {index + 1}</h4>
                        <Button
                          onClick={() => removeProject(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={project.title}
                          onChange={(e) => updateProject(index, 'title', e.target.value)}
                          placeholder="Project title"
                        />
                        <Input
                          value={project.year || ""}
                          onChange={(e) => updateProject(index, 'year', e.target.value)}
                          placeholder="Year (e.g., 2024)"
                        />
                      </div>
                      <Textarea
                        value={project.description || ""}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                        placeholder="Project description"
                        rows={2}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={project.url || ""}
                          onChange={(e) => updateProject(index, 'url', e.target.value)}
                          placeholder="Project URL"
                        />
                        <select
                          value={project.status || "active"}
                          onChange={(e) => updateProject(index, 'status', e.target.value)}
                          className="px-3 py-2 border border-input rounded-md bg-background"
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No projects added yet. Click "Add Project" to get started.</p>
                  )}
                </CardContent>
              </Card>

              {/* Bookshelf */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Bookshelf
                    <Button onClick={addBook} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Book
                    </Button>
                  </CardTitle>
                  <CardDescription>Share what you're reading or have read</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookshelf.map((book, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Book {index + 1}</h4>
                        <Button
                          onClick={() => removeBook(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={book.title}
                          onChange={(e) => updateBook(index, 'title', e.target.value)}
                          placeholder="Book title"
                        />
                        <Input
                          value={book.author}
                          onChange={(e) => updateBook(index, 'author', e.target.value)}
                          placeholder="Author name"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          value={book.status || "want-to-read"}
                          onChange={(e) => updateBook(index, 'status', e.target.value)}
                          className="px-3 py-2 border border-input rounded-md bg-background"
                        >
                          <option value="want-to-read">Want to Read</option>
                          <option value="reading">Currently Reading</option>
                          <option value="completed">Completed</option>
                        </select>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={book.rating || ""}
                          onChange={(e) => updateBook(index, 'rating', parseInt(e.target.value) || 0)}
                          placeholder="Rating (1-5)"
                        />
                      </div>
                    </div>
                  ))}
                  {bookshelf.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No books added yet. Click "Add Book" to get started.</p>
                  )}
                </CardContent>
              </Card>

              {/* Skills & Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Skills</CardTitle>
                    <CardDescription>Your areas of expertise</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill(e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addSkill(input.value)
                          input.value = ''
                        }}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="gap-1">
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Tools</CardTitle>
                    <CardDescription>Software and tools you use</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tool"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTool(e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addTool(input.value)
                          input.value = ''
                        }}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tools.map((tool, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tool}
                          <button
                            onClick={() => removeTool(tool)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Custom Layout</CardTitle>
                  <CardDescription>
                    Design your profile page using tokens. Available tokens: {'{displayProfileCard}'}, {'{displayPosts}'}, {'{projects}'}, {'{bookshelf}'}, {'{skills}'}, {'{displayName}'}, {'{profession}'}, {'{location}'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={customLayout}
                    onChange={(e) => setCustomLayout(e.target.value)}
                    placeholder="# Hello, I'm {displayName} 👋
I'm a {profession} based in {location}

{displayProfileCard}

## My Work
{projects}

## Currently Reading
{bookshelf}

## Skills & Expertise
{skills}

## Latest Posts
{displayPosts}

---
*Thanks for visiting my space!*"
                    rows={16}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Custom CSS</CardTitle>
                  <CardDescription>Add custom CSS to style your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={customCSS}
                    onChange={(e) => setCustomCSS(e.target.value)}
                    placeholder="/* Style your profile with custom CSS */

/* Profile card styling */
.profile-card {
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

/* Project cards */
.project-item:hover {
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

/* Custom colors */
.skill-item {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
}"
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p>Available CSS classes: .profile-card, .profile-banner, .project-item, .book-item, .skill-item, .tool-item, .article-item, .tag-item</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
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
