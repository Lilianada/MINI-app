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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [profileEmoji, setProfileEmoji] = useState("")
  const [customLayout, setCustomLayout] = useState("")
  const [bannerPreset, setBannerPreset] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [accentColor, setAccentColor] = useState("")
  // Enhanced customization options
  const [profileTheme, setProfileTheme] = useState("minimal") // minimal, modern, creative
  const [customCSS, setCustomCSS] = useState("")
  const [socialLinks, setSocialLinks] = useState({
    website: "",
    twitter: "",
    github: "",
    linkedin: ""
  })
  const [headerText, setHeaderText] = useState("")
  const [showJoinDate, setShowJoinDate] = useState(true)
  const [profileLayout, setProfileLayout] = useState("default") // default, sidebar, centered
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("")
  const { user, userData, logout, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (userData) {
      setUsername(userData.username)
      setEmail(userData.email)
      setBio(userData.bio || "")
      setProfileEmoji(userData.profileEmoji || "")
      setBannerPreset(userData.bannerPreset || "")
      setBannerImage(userData.bannerImage || "")
      setAccentColor(userData.accentColor || "#3b82f6")
      setCustomLayout(userData.customLayout || `{displayProfileCard}

{displayPosts}`)
      // Load enhanced customization options
      setProfileTheme(userData.profileTheme || "minimal")
      setCustomCSS(userData.customCSS || "")
      setSocialLinks({
        website: userData.socialLinks?.website || "",
        twitter: userData.socialLinks?.twitter || "",
        github: userData.socialLinks?.github || "",
        linkedin: userData.socialLinks?.linkedin || ""
      })
      setHeaderText(userData.headerText || "")
      setShowJoinDate(userData.showJoinDate !== false) // default to true
      setProfileLayout(userData.profileLayout || "default")
    }
  }, [user, userData, router])

  const handleUpdateProfile = async () => {
    if (!user) return

    if (!username || !email) {
      toast({
        title: "Error",
        description: "Username and email are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Initialize Firebase
      const { db } = await initializeFirebase()
      if (!db) {
        throw new Error("Firestore is not initialized")
      }

      const { doc, updateDoc, collection, query, where, getDocs } = await import("firebase/firestore")
      
      // Check if username has changed (normalize to lowercase)
      const normalizedUsername = username.toLowerCase()
      const usernameChanged = normalizedUsername !== userData?.username

      // Update Firestore document
      await updateDoc(doc(db, "Users", user.uid), {
        username: normalizedUsername,
        email,
        bio,
        profileEmoji,
        bannerPreset,
        bannerImage,
        accentColor,
        customLayout,
        // Enhanced customization options
        profileTheme,
        customCSS,
        socialLinks,
        headerText,
        showJoinDate,
        profileLayout,
      })

      // Update username in all past articles if it changed
      if (usernameChanged) {
        try {
          // Query all articles by this author
          const articlesQuery = query(
            collection(db, "Articles"),
            where("authorId", "==", user.uid)
          )
          
          const articlesSnapshot = await getDocs(articlesQuery)
          
          // Update each article with the new username
          const updatePromises = articlesSnapshot.docs.map((articleDoc: any) => {
            return updateDoc(doc(db, "Articles", articleDoc.id), {
              authorName: normalizedUsername
            })
          })
          
          await Promise.all(updatePromises)
          
          toast({
            title: "Username Updated",
            description: `Username updated in ${articlesSnapshot.size} article${articlesSnapshot.size !== 1 ? 's' : ''}.`,
          })
        } catch (articlesError) {
          console.error("Error updating articles:", articlesError)
          toast({
            title: "Warning",
            description: "Profile updated but there was an issue updating your username in past articles.",
            variant: "destructive",
          })
        }
      }

      // Update email in Firebase Auth if it changed
      if (email !== userData?.email) {
        if (!currentPassword) {
          toast({
            title: "Error",
            description: "Current password is required to change email",
            variant: "destructive",
          })
          return
        }

        const { auth } = await initializeFirebase()
        if (!auth) {
          throw new Error("Firebase Auth is not initialized")
        }

        const { updateEmail, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth")
        const credential = EmailAuthProvider.credential(userData?.email || "", currentPassword)

        await reauthenticateWithCredential(user, credential)
        await updateEmail(user, email)
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      setIsEditing(false)
      setCurrentPassword("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const { auth } = await initializeFirebase()
      if (!auth) {
        throw new Error("Firebase Auth is not initialized")
      }

      const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth")
      const credential = EmailAuthProvider.credential(userData?.email || "", currentPassword)

      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      toast({
        title: "Success",
        description: "Password updated successfully",
      })

      setIsChangingPassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    if (!deleteConfirmPassword) {
      toast({
        title: "Error",
        description: "Password is required to delete account",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const { auth } = await initializeFirebase()
      if (!auth) {
        throw new Error("Firebase Auth is not initialized")
      }

      const { deleteUser, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth")
      const credential = EmailAuthProvider.credential(userData?.email || "", deleteConfirmPassword)

      await reauthenticateWithCredential(user, credential)
      await deleteUser(user)

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsDeleteDialogOpen(false)
      setDeleteConfirmPassword("")
    }
  }

  if (!user) {
    return (
      <>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mx-auto py-8 px-4 sm:px-8">
        <h1 className="text-xl font-semibold mb-8">Settings</h1>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  disabled={!isEditing || isSubmitting}
                  placeholder="username (lowercase only)"
                />
                <p className="text-xs text-muted-foreground">Usernames are automatically converted to lowercase</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing || isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileEmoji">Profile Emoji</Label>
                <Input
                  id="profileEmoji"
                  type="text"
                  value={profileEmoji}
                  onChange={(e) => setProfileEmoji(e.target.value)}
                  placeholder="😊"
                  maxLength={2}
                  disabled={!isEditing || isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerPreset">Banner Style</Label>
                <select
                  id="bannerPreset"
                  value={bannerPreset}
                  onChange={(e) => setBannerPreset(e.target.value)}
                  disabled={!isEditing || isSubmitting}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Default Gray</option>
                  <option value="garden-green">Garden Green</option>
                  <option value="sunset-orange">Sunset Orange</option>
                  <option value="ocean-blue">Ocean Blue</option>
                  <option value="lavender-purple">Lavender Purple</option>
                  <option value="warm-earth">Warm Earth</option>
                  <option value="cool-gray">Cool Gray</option>
                  <option value="minimal-dots">Minimal Dots</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="accentColor"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    disabled={!isEditing || isSubmitting}
                    className="w-12 h-8 border border-input rounded cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-muted-foreground">
                    Used for links, borders, and highlights
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccentColor(color)}
                      disabled={!isEditing || isSubmitting}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform disabled:cursor-not-allowed"
                      style={{ backgroundColor: color }}
                      title={`Set accent color to ${color}`}
                    />
                  ))}
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
                  maxLength={500}
                  disabled={!isEditing || isSubmitting}
                />
                <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customLayout">Public Profile Layout</Label>
                <Textarea
                  id="customLayout"
                  value={customLayout}
                  onChange={(e) => setCustomLayout(e.target.value)}
                  placeholder="{displayProfileCard}

## My Articles
{displayPosts}

## Topics I Write About
{displayTags}"
                  rows={6}
                  disabled={!isEditing || isSubmitting}
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Available tokens:</p>
                  <p><code className="bg-muted px-1 rounded">{"{displayProfileCard}"}</code> - Shows your profile information</p>
                  <p><code className="bg-muted px-1 rounded">{"{displayPosts}"}</code> - Shows your published articles</p>
                  <p><code className="bg-muted px-1 rounded">{"{displayTags}"}</code> - Shows all tags from your articles</p>
                  <p>You can add any text between tokens and they will be displayed as-is. Markdown is supported!</p>
                </div>
              </div>

              {isEditing && email !== userData?.email && (
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password (required to change email)</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </CardFooter>
          </Card>

          {/* Enhanced Customization Card */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Customization</CardTitle>
              <CardDescription>Add more personality to your public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Theme */}
              <div className="space-y-2">
                <Label htmlFor="profileTheme">Profile Theme</Label>
                <select
                  id="profileTheme"
                  value={profileTheme}
                  onChange={(e) => setProfileTheme(e.target.value)}
                  disabled={!isEditing || isSubmitting}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="minimal">Minimal - Clean and simple design</option>
                  <option value="modern">Modern - Subtle gradients and enhanced shadows</option>
                  <option value="creative">Creative - Unique styling with decorative borders</option>
                </select>
                <p className="text-xs text-muted-foreground">Choose the visual style for your profile card</p>
              </div>

              {/* Profile Layout */}
              <div className="space-y-2">
                <Label htmlFor="profileLayout">Page Layout</Label>
                <select
                  id="profileLayout"
                  value={profileLayout}
                  onChange={(e) => setProfileLayout(e.target.value)}
                  disabled={!isEditing || isSubmitting}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="default">Default - Standard responsive layout</option>
                  <option value="sidebar">Sidebar - Profile and posts side-by-side</option>
                  <option value="centered">Centered - Narrow, focused layout</option>
                </select>
                <p className="text-xs text-muted-foreground">Choose how your profile page content is arranged</p>
              </div>

              {/* Header and Footer Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headerText">Site Title</Label>
                  <Input
                    id="headerText"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    placeholder="Welcome to my space!"
                    disabled={!isEditing || isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">Custom title displayed at the top of your profile page</p>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <Label>Social Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input
                      placeholder="Website URL"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                      disabled={!isEditing || isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="Twitter/X username"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                      disabled={!isEditing || isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="GitHub username"
                      value={socialLinks.github}
                      onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                      disabled={!isEditing || isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="LinkedIn username"
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                      disabled={!isEditing || isSubmitting}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Add links to your social profiles</p>
              </div>

              {/* Custom CSS */}
              <div className="space-y-2">
                <Label htmlFor="customCSS">Custom CSS</Label>
                <Textarea
                  id="customCSS"
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                  placeholder="/* Style your profile with custom CSS */

/* Change profile card style */
.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
}

/* Animate articles on hover */
.article-item:hover {
  transform: translateX(10px);
  transition: all 0.3s ease;
}

/* Style tags */
.tag-item {
  border-radius: 15px;
  font-weight: 600;
}

/* Custom banner overlay */
.profile-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
}"
                  rows={12}
                  disabled={!isEditing || isSubmitting}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Style your profile with custom CSS. Available classes:</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <code className="bg-muted px-2 py-1 rounded">.profile-card</code>
                    <code className="bg-muted px-2 py-1 rounded">.profile-banner</code>
                    <code className="bg-muted px-2 py-1 rounded">.profile-avatar</code>
                    <code className="bg-muted px-2 py-1 rounded">.social-links</code>
                    <code className="bg-muted px-2 py-1 rounded">.posts-container</code>
                    <code className="bg-muted px-2 py-1 rounded">.article-item</code>
                    <code className="bg-muted px-2 py-1 rounded">.tags-container</code>
                    <code className="bg-muted px-2 py-1 rounded">.tag-item</code>
                  </div>
                  <p className="mt-2">Use data attributes like <code className="bg-muted px-1 rounded">[data-published="true"]</code> for conditional styling</p>
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-3">
                <Label>Display Options</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showJoinDate"
                    checked={showJoinDate}
                    onChange={(e) => setShowJoinDate(e.target.checked)}
                    disabled={!isEditing || isSubmitting}
                    className="rounded"
                  />
                  <Label htmlFor="showJoinDate" className="text-sm">Show join date on profile</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isChangingPassword ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="current-password-change">Current Password</Label>
                    <Input
                      id="current-password-change"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  For security reasons, you'll need to confirm your current password before setting a new one.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {isChangingPassword ? (
                <>
                  <Button variant="outline" onClick={() => setIsChangingPassword(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleChangePassword} disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsChangingPassword(true)}>Change Password</Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all your data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This action cannot be undone. All your data, including articles and profile information, will be
                permanently deleted.
              </p>
            </CardContent>
            <CardFooter>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data
                      from our servers.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2 py-4">
                    <Label htmlFor="delete-confirm-password">Enter your password to confirm</Label>
                    <Input
                      id="delete-confirm-password"
                      type="password"
                      value={deleteConfirmPassword}
                      onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={isSubmitting}>
                      {isSubmitting ? "Deleting..." : "Delete Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}
