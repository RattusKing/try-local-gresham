'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Service } from '@/lib/types'
import './services.css'

export default function BusinessServices() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [hasAvailability, setHasAvailability] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '30',
    price: '',
    category: '',
    isActive: true,
    requiresDeposit: false,
    depositAmount: '',
    bufferTime: '0',
  })

  useEffect(() => {
    loadServices()
    checkAvailability()
  }, [user])

  const checkAvailability = async () => {
    if (!user || !db) return

    try {
      const availabilityQuery = query(
        collection(db, 'businessAvailability'),
        where('businessId', '==', user.uid)
      )
      const availabilitySnap = await getDocs(availabilityQuery)
      setHasAvailability(!availabilitySnap.empty)
    } catch (err: any) {
      console.error('Error checking availability:', err)
    }
  }

  const loadServices = async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      const servicesQuery = query(
        collection(db, 'services'),
        where('businessId', '==', user.uid)
      )
      const servicesSnap = await getDocs(servicesQuery)
      const servicesList = servicesSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Service[]

      setServices(servicesList)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    try {
      setError('')
      setSuccess('')

      const serviceData = {
        businessId: user.uid,
        name: formData.name,
        description: formData.description || '',
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        category: formData.category || '',
        isActive: formData.isActive,
        requiresDeposit: formData.requiresDeposit,
        depositAmount: formData.requiresDeposit && formData.depositAmount ? parseFloat(formData.depositAmount) : 0,
        bufferTime: parseInt(formData.bufferTime) || 0,
        updatedAt: new Date(),
      }

      if (editingService) {
        const serviceRef = doc(db, 'services', editingService.id)
        await updateDoc(serviceRef, serviceData)
        setSuccess('Service updated successfully!')
      } else {
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: new Date(),
        })
        setSuccess('Service added successfully!')
      }

      resetForm()
      await loadServices()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
      category: service.category || '',
      isActive: service.isActive,
      requiresDeposit: service.requiresDeposit || false,
      depositAmount: service.depositAmount?.toString() || '',
      bufferTime: service.bufferTime?.toString() || '0',
    })
    setShowForm(true)
  }

  const handleDelete = async (serviceId: string) => {
    if (!db) return
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      await deleteDoc(doc(db, 'services', serviceId))
      setSuccess('Service deleted successfully!')
      await loadServices()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '30',
      price: '',
      category: '',
      isActive: true,
      requiresDeposit: false,
      depositAmount: '',
      bufferTime: '0',
    })
    setEditingService(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading services...</p>
      </div>
    )
  }

  const activeServices = services.filter(s => s.isActive)
  const inactiveServices = services.filter(s => !s.isActive)

  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>Services</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      <div className="services-info">
        <p>Manage your appointment-based services. Customers can book these services directly through your business page.</p>
      </div>

      {!hasAvailability && services.length > 0 && (
        <div className="alert alert-warning" style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                Appointments Not Available Yet
              </strong>
              <p style={{ marginBottom: '0.75rem', color: '#92400e' }}>
                You've created services, but customers can't book them yet. You need to configure your appointment availability hours.
              </p>
              <a
                href="/dashboard/business/settings"
                className="btn btn-primary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Configure Availability in Settings →
              </a>
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="service-form-container">
          <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
          <form onSubmit={handleSubmit} className="service-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Service Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Men's Haircut, Oil Change, 60-min Massage"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Hair, Automotive, Wellness"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes) *</label>
                <input
                  type="number"
                  id="duration"
                  min="5"
                  step="5"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  required
                />
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                  How long does this service take?
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bufferTime">Buffer Time (minutes)</label>
                <input
                  type="number"
                  id="bufferTime"
                  min="0"
                  step="5"
                  value={formData.bufferTime}
                  onChange={(e) =>
                    setFormData({ ...formData, bufferTime: e.target.value })
                  }
                />
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                  Extra time for prep/cleanup between appointments
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                placeholder="Describe what's included in this service..."
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <span>Active (available for booking)</span>
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requiresDeposit}
                  onChange={(e) =>
                    setFormData({ ...formData, requiresDeposit: e.target.checked })
                  }
                />
                <span>Requires Deposit</span>
              </label>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                Require customers to pay a deposit when booking
              </small>
            </div>

            {formData.requiresDeposit && (
              <div className="form-group">
                <label htmlFor="depositAmount">Deposit Amount ($)</label>
                <input
                  type="number"
                  id="depositAmount"
                  step="0.01"
                  min="0"
                  value={formData.depositAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, depositAmount: e.target.value })
                  }
                  placeholder="e.g., 20.00"
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingService ? 'Update Service' : 'Add Service'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeServices.length === 0 && inactiveServices.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No services yet</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Add your first service to start accepting appointments
          </p>
        </div>
      ) : (
        <>
          {activeServices.length > 0 && (
            <div className="services-section">
              <h3>Active Services ({activeServices.length})</h3>
              <div className="services-grid">
                {activeServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveServices.length > 0 && (
            <div className="services-section">
              <h3>Inactive Services ({inactiveServices.length})</h3>
              <div className="services-grid">
                {inactiveServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => void
}) {
  return (
    <div className={`service-card ${!service.isActive ? 'inactive' : ''}`}>
      <div className="service-header">
        <h3>{service.name}</h3>
        <span className="service-price">${service.price.toFixed(2)}</span>
      </div>

      {service.category && (
        <span className="service-category">{service.category}</span>
      )}

      {service.description && (
        <p className="service-description">{service.description}</p>
      )}

      <div className="service-details">
        <div className="service-detail-item">
          <span className="detail-label">⏱ Duration:</span>
          <span className="detail-value">{service.duration} min</span>
        </div>
        {service.bufferTime !== undefined && service.bufferTime > 0 && (
          <div className="service-detail-item">
            <span className="detail-label">🔄 Buffer:</span>
            <span className="detail-value">{service.bufferTime} min</span>
          </div>
        )}
        {service.requiresDeposit && (
          <div className="service-detail-item">
            <span className="detail-label">💳 Deposit:</span>
            <span className="detail-value">${service.depositAmount?.toFixed(2) || '0.00'}</span>
          </div>
        )}
      </div>

      <div className="service-status">
        <span className={service.isActive ? 'status-active' : 'status-inactive'}>
          {service.isActive ? '✓ Active' : '✗ Inactive'}
        </span>
      </div>

      <div className="service-actions">
        <button
          className="btn-edit-small"
          onClick={() => onEdit(service)}
        >
          Edit
        </button>
        <button
          className="btn-delete-small"
          onClick={() => onDelete(service.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
