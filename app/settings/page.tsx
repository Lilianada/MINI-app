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
      setCustomLayout(userData.customLayout || `{displayProfileCard}

{displayPosts}`)
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
      
      // Check if username has changed
      const usernameChanged = username !== userData?.username

      // Update Firestore document
      await updateDoc(doc(db, "Users", user.uid), {
        username,
        email,
        bio,
        profileEmoji,
        customLayout,
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
              authorName: username
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
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isEditing || isSubmitting}
                />
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

{displayPosts}"
                  rows={6}
                  disabled={!isEditing || isSubmitting}
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Available tokens:</p>
                  <p><code className="bg-muted px-1 rounded">{"{displayProfileCard}"}</code> - Shows your profile information</p>
                  <p><code className="bg-muted px-1 rounded">{"{displayPosts}"}</code> - Shows your published articles</p>
                  <p>You can add any text between tokens and they will be displayed as-is.</p>
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
