"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 sm:px-8 min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        <div className="max-w-2xl mx-auto flex flex-col align-center  items-center justify-center space-y-6">
          {/* Title like a note heading */}
          
          {/* Content like flowing poetry/notes */}
          <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-4 text-left">
            <p className="text-base font-medium">  Welcome to Minispace. </p>
            <p>
              Experience the quiet and calm of the internet again.  <br />
              Focus fully on what you love most:  <br /> 
              <strong>Reading. Writing. Building. Connecting.</strong>
            </p>

            <p>
              Get inspired by your neighbours.  <br />
              Discover and explore their small worlds.  <br />
              Build a presence, an identity, a space.  <br />
              Design it. Refine it. Make it yours.
            </p>

            <p>
              Create something unique. <br /> 
              Something that inspires.  <br />
              Something small — just for you. <br />
              A space for <strong>serendipitous encounters</strong>. <br /> 
              A space for your learnings.  <br />
              A space for your musings and ideas.
            </p>

            <p>
              <strong>Write to think better.</strong><br />
              <strong>Build to learn better.</strong><br />
              <strong>Connect to feel more.</strong>
            </p>

            <p>
              Explore, and learn to create your own experiences. <br/>
              This is your minispace. <strong>Make it matter.</strong>
            </p>

            {/* Signature-like ending */}
            <div className="mt-8">
              <p className="text-muted-foreground italic text-xs">
               Lily.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
