'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/firebase/auth-context'
import type { UserRole } from '@/lib/types'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<UserRole>('customer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, signInWithGoogle } = useAuth()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
      // Reset form on close
      setEmail('')
      setPassword('')
      setDisplayName('')
      setRole('customer')
      setError('')
      setMode('signin')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, role, displayName)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <form className="modal-card" style={{ minWidth: '400px' }} onSubmit={handleSubmit}>
        <h3>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h3>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('signin')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: mode === 'signin' ? '2px solid var(--secondary)' : '2px solid transparent',
              fontWeight: mode === 'signin' ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: mode === 'signup' ? '2px solid var(--secondary)' : '2px solid transparent',
              fontWeight: mode === 'signup' ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              marginBottom: '15px',
              background: '#ffe5e5',
              color: '#8a0000',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {mode === 'signup' && (
          <>
            <label>
              Name
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </label>
            <label>
              Account Type
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} required>
                <option value="customer">Customer</option>
                <option value="business_owner">Business Owner</option>
              </select>
            </label>
          </>
        )}

        <label>
          Email
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <menu className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </menu>

        <div style={{ textAlign: 'center', margin: '20px 0', color: '#888' }}>or</div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Continue with Google
        </button>
      </form>
    </dialog>
  )
}
