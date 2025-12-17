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
import { DiscountCode, DiscountType } from '@/lib/types'
import './discounts.css'

export default function BusinessDiscounts() {
  const { user } = useAuth()
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage' as DiscountType,
    value: '',
    minPurchase: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    isActive: true,
  })

  useEffect(() => {
    loadDiscounts()
  }, [user])

  const loadDiscounts = async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      const discountsQuery = query(
        collection(db, 'discountCodes'),
        where('businessId', '==', user.uid)
      )
      const discountsSnap = await getDocs(discountsQuery)
      const discountsList = discountsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        validFrom: doc.data().validFrom?.toDate(),
        validUntil: doc.data().validUntil?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as DiscountCode[]

      setDiscounts(discountsList)
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

      // Validate code format
      if (!/^[A-Z0-9]{3,20}$/.test(formData.code)) {
        setError('Code must be 3-20 characters, uppercase letters and numbers only')
        return
      }

      const discountData = {
        businessId: user.uid,
        code: formData.code.toUpperCase(),
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : 0,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : 0,
        usageCount: editingDiscount?.usageCount || 0,
        isActive: formData.isActive,
        validFrom: new Date(formData.validFrom),
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
        updatedAt: new Date(),
      }

      if (editingDiscount) {
        const discountRef = doc(db, 'discountCodes', editingDiscount.id)
        await updateDoc(discountRef, discountData)
        setSuccess('Discount code updated successfully!')
      } else {
        await addDoc(collection(db, 'discountCodes'), {
          ...discountData,
          createdAt: new Date(),
        })
        setSuccess('Discount code created successfully!')
      }

      resetForm()
      await loadDiscounts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount)
    setFormData({
      code: discount.code,
      description: discount.description,
      type: discount.type,
      value: discount.value.toString(),
      minPurchase: discount.minPurchase?.toString() || '',
      maxDiscount: discount.maxDiscount?.toString() || '',
      usageLimit: discount.usageLimit?.toString() || '',
      validFrom: discount.validFrom.toISOString().split('T')[0],
      validUntil: discount.validUntil?.toISOString().split('T')[0] || '',
      isActive: discount.isActive,
    })
    setShowForm(true)
  }

  const handleDelete = async (discountId: string) => {
    if (!db) return
    if (!confirm('Are you sure you want to delete this discount code?')) return

    try {
      await deleteDoc(doc(db, 'discountCodes', discountId))
      setSuccess('Discount code deleted successfully!')
      await loadDiscounts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleActive = async (discount: DiscountCode) => {
    if (!db) return

    try {
      const discountRef = doc(db, 'discountCodes', discount.id)
      await updateDoc(discountRef, {
        isActive: !discount.isActive,
        updatedAt: new Date(),
      })
      setSuccess(`Discount code ${!discount.isActive ? 'activated' : 'deactivated'}!`)
      await loadDiscounts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: '',
      minPurchase: '',
      maxDiscount: '',
      usageLimit: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      isActive: true,
    })
    setEditingDiscount(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading discount codes...</p>
      </div>
    )
  }

  const activeDiscounts = discounts.filter((d) => d.isActive)
  const inactiveDiscounts = discounts.filter((d) => !d.isActive)

  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>Discount Codes</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Discount Code'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="discount-form-container">
          <h2>{editingDiscount ? 'Edit Discount Code' : 'Create New Discount Code'}</h2>
          <form onSubmit={handleSubmit} className="discount-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="code">Discount Code *</label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="SAVE20"
                  pattern="[A-Z0-9]{3,20}"
                  required
                />
                <small>3-20 characters, uppercase letters and numbers only</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <input
                  type="text"
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="20% off all items"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Discount Type *</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as DiscountType })
                  }
                  required
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="value">
                  {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                </label>
                <input
                  type="number"
                  id="value"
                  step="0.01"
                  min="0"
                  max={formData.type === 'percentage' ? '100' : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minPurchase">Minimum Purchase ($)</label>
                <input
                  type="number"
                  id="minPurchase"
                  step="0.01"
                  min="0"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              {formData.type === 'percentage' && (
                <div className="form-group">
                  <label htmlFor="maxDiscount">Maximum Discount ($)</label>
                  <input
                    type="number"
                    id="maxDiscount"
                    step="0.01"
                    min="0"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="usageLimit">Usage Limit</label>
                <input
                  type="number"
                  id="usageLimit"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="validFrom">Valid From *</label>
                <input
                  type="date"
                  id="validFrom"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="validUntil">Valid Until</label>
                <input
                  type="date"
                  id="validUntil"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  min={formData.validFrom}
                />
                <small>Leave empty for no expiration</small>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Active (customers can use this code)</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingDiscount ? 'Update Code' : 'Create Code'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Discounts */}
      <div className="discounts-section">
        <h2>Active Discount Codes ({activeDiscounts.length})</h2>
        {activeDiscounts.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</span>
            <h3>No active discount codes</h3>
            <p>Create discount codes to attract and reward customers</p>
          </div>
        ) : (
          <div className="discounts-grid">
            {activeDiscounts.map((discount) => (
              <div key={discount.id} className="discount-card active">
                <div className="discount-header">
                  <div className="discount-code">{discount.code}</div>
                  <div className="discount-value">
                    {discount.type === 'percentage'
                      ? `${discount.value}% OFF`
                      : `$${discount.value} OFF`}
                  </div>
                </div>

                <p className="discount-description">{discount.description}</p>

                <div className="discount-details">
                  {discount.minPurchase && (
                    <div className="detail-item">
                      <span className="detail-label">Min Purchase:</span>
                      <span>${discount.minPurchase.toFixed(2)}</span>
                    </div>
                  )}
                  {discount.maxDiscount && (
                    <div className="detail-item">
                      <span className="detail-label">Max Discount:</span>
                      <span>${discount.maxDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Usage:</span>
                    <span>
                      {discount.usageCount}
                      {discount.usageLimit ? ` / ${discount.usageLimit}` : ' (unlimited)'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Valid Until:</span>
                    <span>
                      {discount.validUntil
                        ? discount.validUntil.toLocaleDateString()
                        : 'No expiration'}
                    </span>
                  </div>
                </div>

                <div className="discount-actions">
                  <button className="btn-edit-small" onClick={() => handleEdit(discount)}>
                    Edit
                  </button>
                  <button
                    className="btn-toggle-small"
                    onClick={() => toggleActive(discount)}
                  >
                    Deactivate
                  </button>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDelete(discount.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Discounts */}
      {inactiveDiscounts.length > 0 && (
        <div className="discounts-section">
          <h2>Inactive Discount Codes ({inactiveDiscounts.length})</h2>
          <div className="discounts-grid">
            {inactiveDiscounts.map((discount) => (
              <div key={discount.id} className="discount-card inactive">
                <div className="discount-header">
                  <div className="discount-code">{discount.code}</div>
                  <div className="discount-value">
                    {discount.type === 'percentage'
                      ? `${discount.value}% OFF`
                      : `$${discount.value} OFF`}
                  </div>
                </div>

                <p className="discount-description">{discount.description}</p>

                <div className="discount-details">
                  <div className="detail-item">
                    <span className="detail-label">Usage:</span>
                    <span>
                      {discount.usageCount}
                      {discount.usageLimit ? ` / ${discount.usageLimit}` : ' (unlimited)'}
                    </span>
                  </div>
                </div>

                <div className="discount-actions">
                  <button className="btn-edit-small" onClick={() => handleEdit(discount)}>
                    Edit
                  </button>
                  <button
                    className="btn-toggle-small active"
                    onClick={() => toggleActive(discount)}
                  >
                    Activate
                  </button>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDelete(discount.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
