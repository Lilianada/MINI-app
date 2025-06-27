"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { initializeFirebase } from "./firebase"

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
  customLayout?: string
  bannerImage?: string
  bannerPreset?: string
  accentColor?: string
  createdAt?: any
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

  // Helper functions for localStorage
  const saveUserToStorage = (user: User, userData: UserData) => {
    try {
      localStorage.setItem('minispace_user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        userData: userData
      }))
    } catch (error) {
      console.error('Error saving user to localStorage:', error)
    }
  }

  const loadUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('minispace_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
      localStorage.removeItem('minispace_user')
    }
    return null
  }

  const clearUserFromStorage = () => {
    try {
      localStorage.removeItem('minispace_user')
    } catch (error) {
      console.error('Error clearing user from localStorage:', error)
    }
  }

  // Initialize user from localStorage on mount
  useEffect(() => {
    const storedUser = loadUserFromStorage()
    if (storedUser) {
      // Create a mock user object with essential properties
      const mockUser = {
        uid: storedUser.uid,
        email: storedUser.email,
      } as User
      
      setUser(mockUser)
      setUserData(storedUser.userData)
    }
  }, [])

  // Check if Firebase is initialized
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        const { auth, db } = await initializeFirebase()
        const isInitialized = !!auth && !!db
        setIsFirebaseInitialized(isInitialized)

        if (!isInitialized) {
          console.error("Firebase auth or Firestore is not initialized")
        }

        return isInitialized
      } catch (error) {
        console.error("Error initializing Firebase:", error)
        setIsFirebaseInitialized(false)
        return false
      }
    }

    // Check Firebase initialization
    checkFirebase()
  }, [])

  // Set up auth state listener
  useEffect(() => {
    if (!isFirebaseInitialized) {
      setLoading(false)
      return () => {}
    }

    const setupAuthListener = async () => {
      try {
        const { auth, db } = await initializeFirebase()
        
        if (!auth) {
          setLoading(false)
          return () => {}
        }

        const { onAuthStateChanged, setPersistence, browserLocalPersistence } = await import("firebase/auth")
        const { doc, getDoc } = await import("firebase/firestore")

        // Set persistence to local
        setPersistence(auth, browserLocalPersistence).catch((error: any) => {
          console.error("Error setting auth persistence:", error)
        })

        const unsubscribe = onAuthStateChanged(
          auth,
          async (user: User | null) => {
         
            setUser(user)

            if (user && db) {
              try {
                // Fetch user data from Firestore
                const userDocRef = doc(db, "Users", user.uid)
                const userDoc = await getDoc(userDocRef)

                if (userDoc.exists()) {
                  const userData = userDoc.data() as UserData
                  setUserData(userData)
                  
                  // Save to localStorage
                  saveUserToStorage(user, userData)

                  // Show welcome message based on time of day (only if not already shown)
                  const lastWelcome = localStorage.getItem('minispace_last_welcome')
                  const today = new Date().toDateString()
                  
                  if (lastWelcome !== today) {
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
                    
                    localStorage.setItem('minispace_last_welcome', today)
                  }
                } else {
                  console.warn("User document does not exist for authenticated user")
                }
              } catch (error) {
                console.error("Error fetching user data:", error)
              }
            } else {
              setUserData(null)
              clearUserFromStorage()
            }

            setLoading(false)
          },
          (error: any) => {
            console.error("Auth state change error:", error)
            setLoading(false)
          },
        )

        return unsubscribe
      } catch (error) {
        console.error("Error setting up auth listener:", error)
        setLoading(false)
        return () => {}
      }
    }

    setupAuthListener().then((unsubscribe) => {
      return unsubscribe
    })

    return () => {
      // The unsubscribe function will be handled by the async setup
    }
  }, [toast, isFirebaseInitialized])

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { auth } = await initializeFirebase()
      if (!auth) return false

      const { fetchSignInMethodsForEmail } = await import("firebase/auth")
      const methods = await fetchSignInMethodsForEmail(auth, email)
      return methods.length > 0
    } catch (error) {
      console.error("Error checking email existence:", error)
      return false
    }
  }

  const signup = async (email: string, password: string, username: string) => {
    try {
      const { auth, db } = await initializeFirebase()
      
      if (!auth || !db) {
        return {
          success: false,
          error: "Firebase is not initialized. Please check your configuration.",
        }
      }

      const { createUserWithEmailAndPassword } = await import("firebase/auth")
      const { doc, setDoc } = await import("firebase/firestore")
     
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      

      // Save user data to Firestore
      const userData = {
        username,
        email,
        createdAt: new Date(),
      }
      
      await setDoc(doc(db, "Users", user.uid), userData)

      // Immediately save to localStorage for instant availability
      saveUserToStorage(user, userData as UserData)
      setUser(user)
      setUserData(userData as UserData)

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
    try {
      const { auth } = await initializeFirebase()
      
      if (!auth) {
        return {
          success: false,
          error: "Firebase is not initialized. Please check your configuration.",
        }
      }

      const { signInWithEmailAndPassword } = await import("firebase/auth")
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
    try {
      const { auth } = await initializeFirebase()
      
      if (!auth) {
        throw new Error("Firebase is not initialized")
      }

      const { signOut } = await import("firebase/auth")

      setLoggingOut(true)
      
      // Show logout message
      toast({
        title: "Signing out...",
        description: "Thank you for using MINISPACE. See you soon!",
        duration: 2000,
      })

      // Clear user data immediately for better UX
      setUserData(null)
      clearUserFromStorage()
      
      // Sign out from Firebase
      await signOut(auth)

      // Wait for 1.5 seconds to show the goodbye message
      setTimeout(() => {
        router.push("/")
        setLoggingOut(false)
      }, 1500)
    } catch (error) {
      console.error("Logout error:", error)
      setLoggingOut(false)
      toast({
        title: "Logout Error",
        description: "There was an issue signing out. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { auth } = await initializeFirebase()
      
      if (!auth) {
        return {
          success: false,
          error: "Firebase is not initialized. Please check your configuration.",
        }
      }

      const { sendPasswordResetEmail } = await import("firebase/auth")
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
