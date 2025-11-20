'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, getDocs, doc, deleteDoc, addDoc, setDoc, getDoc, orderBy } from 'firebase/firestore'
import { motion } from 'framer-motion'
import StatusBadge from '@/components/StatusBadge'
import '../admin.css'

interface BusinessApplication {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  address: string
  neighborhood: string
  category: string
  description: string
  website?: string
  instagram?: string
  userId?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

export default function BusinessApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [applications, setApplications] = useState<BusinessApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/dashboard')
      return
    }

    if (user.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    loadApplications()
  }, [user, router])

  const loadApplications = async () => {
    if (!db) return

    try {
      setLoading(true)
      const applicationsQuery = query(
        collection(db, 'business_applications'),
        orderBy('createdAt', 'desc')
      )

      const applicationsSnap = await getDocs(applicationsQuery)
      const appsList = applicationsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as BusinessApplication[]

      setApplications(appsList.filter((app) => app.status === 'pending'))
    } catch (err: any) {
      console.error('Error loading applications:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (application: BusinessApplication) => {
    if (!db) return

    const confirmApprove = confirm(
      `Approve ${application.businessName}? This will create a business account and send a welcome email.`
    )
    if (!confirmApprove) return

    try {
      setProcessing(application.id)

      // Create the business
      const businessData = {
        name: application.businessName,
        tags: [application.category],
        neighborhood: application.neighborhood,
        hours: 'Mon-Fri 9am-5pm', // Default hours
        phone: application.phone,
        website: application.website || '',
        map: '', // Can be added later
        cover: '', // Can be added later
        description: application.description,
        ownerId: application.userId || '',
        status: 'approved',
        subscriptionTier: 'free', // Admin can change this later
        createdAt: new Date(),
        updatedAt: new Date(),
        email: application.email, // Store email for notifications
      }

      const businessRef = await addDoc(collection(db, 'businesses'), businessData)

      // If user already exists, update their businessId and role (only if not admin)
      if (application.userId) {
        const userRef = doc(db, 'users', application.userId)
        const userSnap = await getDoc(userRef)
        const currentUserData = userSnap.data()

        // Only update role if user is not an admin
        // Admins should keep their admin role even if they own a business
        const updateData: any = {
          businessId: businessRef.id,
          updatedAt: new Date(),
        }

        if (currentUserData?.role !== 'admin') {
          updateData.role = 'business_owner'
        }

        await setDoc(userRef, updateData, { merge: true })
      }

      // Send approval email
      fetch('/api/emails/business-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessEmail: application.email,
          businessName: application.businessName,
          ownerName: application.ownerName,
          dashboardUrl: 'https://try-local.com/dashboard/business',
        }),
      }).catch((err) => console.error('Email error:', err))

      // Delete the application
      await deleteDoc(doc(db, 'business_applications', application.id))

      // Reload applications
      await loadApplications()

      alert('Business approved successfully!')
    } catch (err: any) {
      console.error('Error approving application:', err)
      alert('Failed to approve application: ' + err.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (application: BusinessApplication) => {
    const reason = prompt(
      `Reject ${application.businessName}? Enter a reason (optional):`
    )
    if (reason === null) return // User cancelled

    if (!db) return

    try {
      setProcessing(application.id)

      // Send rejection email
      if (reason) {
        fetch('/api/emails/business-rejected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessEmail: application.email,
            businessName: application.businessName,
            ownerName: application.ownerName,
            reason,
          }),
        }).catch((err) => console.error('Email error:', err))
      }

      // Delete the application
      await deleteDoc(doc(db, 'business_applications', application.id))

      // Reload applications
      await loadApplications()

      alert('Application rejected')
    } catch (err: any) {
      console.error('Error rejecting application:', err)
      alert('Failed to reject application: ' + err.message)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading applications...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-error">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Business Applications</h1>
        <p className="admin-subtitle">{applications.length} pending applications</p>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>No pending applications</h3>
          <p>New business applications will appear here for review.</p>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((app, index) => (
            <motion.div
              key={app.id}
              className="application-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="application-header">
                <h3>{app.businessName}</h3>
                <span className="application-date">
                  {app.createdAt.toLocaleDateString()}
                </span>
              </div>

              <div className="application-details">
                <div className="application-row">
                  <strong>Owner:</strong>
                  <span>{app.ownerName}</span>
                </div>
                <div className="application-row">
                  <strong>Email:</strong>
                  <span>{app.email}</span>
                </div>
                <div className="application-row">
                  <strong>Phone:</strong>
                  <span>{app.phone}</span>
                </div>
                <div className="application-row">
                  <strong>Address:</strong>
                  <span>{app.address}</span>
                </div>
                <div className="application-row">
                  <strong>Neighborhood:</strong>
                  <span>{app.neighborhood}</span>
                </div>
                <div className="application-row">
                  <strong>Category:</strong>
                  <span>{app.category}</span>
                </div>
                {app.website && (
                  <div className="application-row">
                    <strong>Website:</strong>
                    <a href={app.website} target="_blank" rel="noopener noreferrer">
                      {app.website}
                    </a>
                  </div>
                )}
                {app.instagram && (
                  <div className="application-row">
                    <strong>Instagram:</strong>
                    <span>{app.instagram}</span>
                  </div>
                )}
              </div>

              <div className="application-description">
                <strong>Description:</strong>
                <p>{app.description}</p>
              </div>

              <div className="application-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleApprove(app)}
                  disabled={processing === app.id}
                >
                  {processing === app.id ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleReject(app)}
                  disabled={processing === app.id}
                  style={{ color: '#dc2626', borderColor: '#dc2626' }}
                >
                  Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
