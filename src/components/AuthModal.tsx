'use client'

import { useEffect, useRef } from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Demo: just close the modal
    onClose()
    alert('Demo: Authentication will be implemented with Firebase')
  }

  return (
    <dialog ref={dialogRef} id="authModal" className="modal" onClose={onClose}>
      <form method="dialog" className="modal-card" onSubmit={handleSubmit}>
        <h3>Sign In</h3>
        <p>This demo uses local storage. Firebase Auth will be integrated.</p>
        <label>
          Email <input type="email" placeholder="you@example.com" required />
        </label>
        <label>
          Password <input type="password" placeholder="••••••••" required />
        </label>
        <menu className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit">
            Continue
          </button>
        </menu>
      </form>
    </dialog>
  )
}
