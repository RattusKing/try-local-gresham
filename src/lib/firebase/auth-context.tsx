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
  sendEmailVerification,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import type { UserProfile, UserRole, AuthUser } from '@/lib/types'
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: AuthUser | null
  userProfile: UserProfile | null
  loading: boolean
  justSignedUp: boolean
  clearJustSignedUp: () => void
  signUp: (email: string, password: string, role: UserRole, displayName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [justSignedUp, setJustSignedUp] = useState(false)

  const clearJustSignedUp = () => setJustSignedUp(false)

  useEffect(() => {
    // If Firebase is not initialized, just set loading to false
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && db) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid)
        const userDoc = await getDoc(userDocRef)
        let profile = userDoc.data() as UserProfile | undefined

        // Auto-create profile if user is authenticated but has no Firestore document
        if (!userDoc.exists()) {
          try {
            // Note: Firestore does not accept undefined values — use null for absent fields
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || null,
              photoURL: firebaseUser.photoURL || null,
              coverPhotoURL: null,
              role: 'customer' as const,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }
            await setDoc(userDocRef, newProfile)
            profile = newProfile as unknown as UserProfile
            logger.log('Auto-created user profile for:', firebaseUser.uid)
          } catch (err) {
            logger.error('Failed to auto-create user profile:', err)
          }
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: profile?.displayName || firebaseUser.displayName,
          photoURL: profile?.photoURL || firebaseUser.photoURL,
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

    // Send email verification
    try {
      await sendEmailVerification(userCredential.user)
      logger.log('Verification email sent successfully')
    } catch (error) {
      logger.error('Failed to send verification email:', error)
      // Don't fail signup if verification email fails
    }

    // Create user profile in Firestore
    // Note: Firestore does not accept undefined values — use null for absent fields
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: displayName || null,
      photoURL: null,
      coverPhotoURL: null,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Mark that user just signed up (for PWA install prompt)
    setJustSignedUp(true)
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
      // Note: Firestore does not accept undefined values — use null for absent fields
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || null,
        photoURL: result.user.photoURL || null,
        coverPhotoURL: null,
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Mark that user just signed up (for PWA install prompt)
      setJustSignedUp(true)
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

  const refreshProfile = async () => {
    if (!auth?.currentUser || !db) return

    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
    const profile = userDoc.data() as UserProfile | undefined

    if (profile) {
      setUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: profile.displayName || auth.currentUser.displayName,
        photoURL: profile.photoURL || auth.currentUser.photoURL,
        role: profile.role,
      })
      setUserProfile(profile)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    justSignedUp,
    clearJustSignedUp,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshProfile,
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
