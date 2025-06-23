"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  loggingOut: boolean
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  userData: UserData | null
  checkEmailExists: (email: string) => Promise<boolean>
  isFirebaseInitialized: boolean
}

interface UserData {
  username: string
  email: string
  bio?: string
  profileEmoji?: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loggingOut: false,
  signup: async () => ({ success: false }),
  login: async () => ({ success: false }),
  logout: async () => {},
  resetPassword: async () => ({ success: false }),
  userData: null,
  checkEmailExists: async () => false,
  isFirebaseInitialized: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check if Firebase is initialized
  useEffect(() => {
    const checkFirebase = () => {
      const isInitialized = !!auth && !!db
      setIsFirebaseInitialized(isInitialized)

      if (!isInitialized) {
        console.error("Firebase auth or Firestore is not initialized")
      }

      return isInitialized
    }

    // Check immediately and set up an interval to keep checking
    const isInitialized = checkFirebase()

    if (!isInitialized) {
      // If not initialized, check again in 2 seconds
      const interval = setInterval(() => {
        if (checkFirebase()) {
          clearInterval(interval)
        }
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [])

  // Set up auth state listener
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return () => {}
    }

    // Set persistence to local
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Error setting auth persistence:", error)
    })

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
     
        setUser(user)

        if (user && db) {
          try {
            // Fetch user data from Firestore
            const userDocRef = doc(db, "Users", user.uid)
            const userDoc = await getDoc(userDocRef)

            if (userDoc.exists()) {
              const userData = userDoc.data() as UserData
              setUserData(userData)
              

              // Show welcome message based on time of day
              const hour = new Date().getHours()
              let greeting = "Hello"

              if (hour < 12) greeting = "Good morning"
              else if (hour < 18) greeting = "Good afternoon"
              else greeting = "Good evening"

              toast({
                title: `${greeting}, ${userData.username}!`,
                description:
                  hour < 12
                    ? "Start your day with a great read."
                    : hour < 18
                      ? "Take a break with some interesting articles."
                      : "Unwind with some reading or writing.",
                duration: 5000,
              })
            } else {
              console.warn("User document does not exist for authenticated user")
            }
          } catch (error) {
            console.error("Error fetching user data:", error)
          }
        } else {
          setUserData(null)
        }

        setLoading(false)
      },
      (error) => {
        console.error("Auth state change error:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [toast, isFirebaseInitialized])

  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!auth) return false

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email)
      return methods.length > 0
    } catch (error) {
      console.error("Error checking email existence:", error)
      return false
    }
  }

  const signup = async (email: string, password: string, username: string) => {
    if (!auth || !db) {
      return {
        success: false,
        error: "Firebase is not initialized. Please check your configuration.",
      }
    }

    try {
     
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      

      // Save user data to Firestore
      await setDoc(doc(db, "Users", user.uid), {
        username,
        email,
        createdAt: new Date(),
      })

      return { success: true }
    } catch (error) {
      console.error("Signup error:", error)
      let errorMessage = "Failed to create account. Please try again."

      if (error instanceof Error) {
        const errorCode = (error as any).code

        switch (errorCode) {
          case "auth/email-already-in-use":
            errorMessage = "This email is already in use. Please use a different email."
            break
          case "auth/weak-password":
            errorMessage = "Password is too weak. Please use a stronger password."
            break
          case "auth/invalid-email":
            errorMessage = "Invalid email address. Please check your email."
            break
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your internet connection."
            break
          default:
            errorMessage = `Error: ${errorCode || error.message}`
        }
      }

      return { success: false, error: errorMessage }
    }
  }

  const login = async (email: string, password: string) => {
    if (!auth) {
      return {
        success: false,
        error: "Firebase is not initialized. Please check your configuration.",
      }
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      let errorMessage = "Failed to log in. Please check your credentials."

      if (error instanceof Error) {
        const errorCode = (error as any).code

        switch (errorCode) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email. Please check your email or sign up."
            break
          case "auth/wrong-password":
            errorMessage = "Incorrect password. Please try again."
            break
          case "auth/invalid-email":
            errorMessage = "Invalid email address. Please check your email."
            break
          case "auth/user-disabled":
            errorMessage = "This account has been disabled. Please contact support."
            break
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your internet connection."
            break
          default:
            errorMessage = `Error: ${errorCode || error.message}`
        }
      }

      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    if (!auth) {
      throw new Error("Firebase is not initialized")
    }

    try {
      setLoggingOut(true)
      await signOut(auth)

      // Wait for 2 seconds before redirecting
      setTimeout(() => {
        router.push("/articles")
        setLoggingOut(false)
      }, 2000)
    } catch (error) {
      console.error("Logout error:", error)
      setLoggingOut(false)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    if (!auth) {
      return {
        success: false,
        error: "Firebase is not initialized. Please check your configuration.",
      }
    }

    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error) {
      console.error("Reset password error:", error)
      let errorMessage = "Failed to send reset email. Please try again."

      if (error instanceof Error) {
        const errorCode = (error as any).code

        switch (errorCode) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email. Please check your email or sign up."
            break
          case "auth/invalid-email":
            errorMessage = "Invalid email address. Please check your email."
            break
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your internet connection."
            break
          default:
            errorMessage = `Error: ${errorCode || error.message}`
        }
      }

      return { success: false, error: errorMessage }
    }
  }

  const value = {
    user,
    loading,
    loggingOut,
    signup,
    login,
    logout,
    resetPassword,
    userData,
    checkEmailExists,
    isFirebaseInitialized,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
