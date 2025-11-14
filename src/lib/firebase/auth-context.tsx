'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import type { UserProfile, UserRole, AuthUser } from '@/lib/types'

interface AuthContextType {
  user: AuthUser | null
  userProfile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, role: UserRole, displayName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Firebase is not initialized, just set loading to false
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && db) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const profile = userDoc.data() as UserProfile | undefined

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: profile?.role,
        })
        setUserProfile(profile || null)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = 'customer',
    displayName?: string
  ) => {
    if (!auth || !db) {
      throw new Error('Firebase is not initialized. Please check your configuration.')
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Create user profile in Firestore
    const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: displayName || undefined,
      role,
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase is not initialized. Please check your configuration.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
    if (!auth || !db) {
      throw new Error('Firebase is not initialized. Please check your configuration.')
    }

    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', result.user.uid))

    if (!userDoc.exists()) {
      // Create new user profile
      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || undefined,
        role: 'customer', // Default role
      }

      await setDoc(doc(db, 'users', result.user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }

  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase is not initialized. Please check your configuration.')
    }
    await firebaseSignOut(auth)
  }

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error('Firebase is not initialized. Please check your configuration.')
    }
    await sendPasswordResetEmail(auth, email)
  }

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
