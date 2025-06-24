import type React from "react"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/lib/auth-context"
import { FirebaseInitializer } from "@/components/firebase-initializer"
import { LogoutOverlay } from "@/components/logout-overlay"
import Sidebar from "@/components/sidebar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>MINISPACE – Your Quiet Corner of the Internet</title>
        <meta name="description" content="Create your own small world on the internet. Read, write, build, and connect without all the noise. Experience the quiet and calm of the web again." />
        <meta name="keywords" content="minimalist, writing, reading, building, connecting, personal space, distraction-free, MINISPACE" />
        <meta name="author" content="Lily's Lab" />
        <meta property="og:title" content="MINISPACE – Your Quiet Corner of the Internet" />
        <meta property="og:description" content="Create your own small world on the internet. Read, write, build, and connect without all the noise." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mini.lilyslab.xyz/" />
        <meta property="og:image" content="/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MINISPACE – Your Quiet Corner of the Internet" />
        <meta name="twitter:description" content="Create your own small world on the internet. Read, write, build, and connect without all the noise." />
        <meta name="twitter:image" content="/logo.png" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="canonical" href="https://mini.lilyslab.xyz/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "MINISPACE – Your Quiet Corner of the Internet",
              "url": "https://mini.lilyslab.xyz/",
              "description": "Create your own small world on the internet. Read, write, build, and connect without all the noise.",
              "image": "https://mini.lilyslab.xyz/logo.png",
              "publisher": {
                "@type": "Organization",
                "name": "Lily's Lab",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://mini.lilyslab.xyz/logo.png"
                }
              },
              "sameAs": [
                "https://twitter.com/lilian_ada_",
                "https://github.com/Lilianada"
              ]
            })
          }}
        />
      </head>
      <body className={`${GeistSans.className} antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <FirebaseInitializer />
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" themes={['dark']} enableSystem={false} disableTransitionOnChange>
            <div className=" max-w-4xl mx-auto w-full flex relative">
            {/* <Sidebar /> */}
            <main className="flex-1 flex flex-col  border-x">
              {children}
              </main>
            </div>
            <LogoutOverlay />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
