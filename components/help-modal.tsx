"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { HelpCircle, BookOpen, PenLine, User, Settings, Globe, AlertCircle } from "lucide-react"

export function HelpModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="w-4 h-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Welcome to MINI
          </DialogTitle>
          <DialogDescription>
            A minimalist platform for reading and writing without the noise.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* What is MINI */}
          <div>
            <h3 className="text-lg font-semibold mb-3">What is MINI?</h3>
            <p className="text-muted-foreground leading-relaxed">
              MINI is a distraction-free platform designed for writers and readers who value simplicity. 
              Focus on what matters most - your words and ideas - without ads, algorithms, or clutter.
            </p>
          </div>

          <Separator />

          {/* Getting Started */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Complete your profile</p>
                  <p className="text-sm text-muted-foreground">Add a bio and profile emoji in Settings to personalize your presence.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Write your first article</p>
                  <p className="text-sm text-muted-foreground">Click the write button to create and publish your first article.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Discover great content</p>
                  <p className="text-sm text-muted-foreground">Browse articles from other writers and find interesting topics.</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pages & Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pages & Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Articles</p>
                  <p className="text-sm text-muted-foreground">Discover and read articles from the community</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PenLine className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Write</p>
                  <p className="text-sm text-muted-foreground">Create and publish your articles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Profile</p>
                  <p className="text-sm text-muted-foreground">Manage your articles and drafts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-sm text-muted-foreground">Update your bio and profile details</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-muted-foreground">Your clean public profile at /username</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Issues</p>
                  <p className="text-sm text-muted-foreground">Report bugs or request features</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Publishing & Privacy */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Publishing & Privacy</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Articles can be saved as drafts or published publicly</p>
              <p>• Published articles appear on your public profile</p>
              <p>• You can toggle between draft and published status anytime</p>
              <p>• Your public profile is accessible at <code className="bg-muted px-1 rounded">minispace.dev/yourusername</code></p>
            </div>
          </div>

          <Separator />

          {/* Tips */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Pro Tips</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Use tags to categorize your articles and make them discoverable</p>
              <p>• Add a compelling excerpt to give readers a preview</p>
              <p>• Set a profile emoji to make your profile more personal</p>
              <p>• Keep your bio short and engaging</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => setOpen(false)}>
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
