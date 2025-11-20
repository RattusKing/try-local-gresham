'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db, storage } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { Product } from '@/lib/types'
import { exportProductsToCSV } from '@/lib/csv-import'
import CSVImportModal from '@/components/CSVImportModal'
import './products.css'

export default function BusinessProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    inStock: true,
    trackInventory: false,
    stockQuantity: '',
    lowStockThreshold: '',
    image: '',
  })

  useEffect(() => {
    loadProducts()
  }, [user])

  const loadProducts = async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      const productsQuery = query(
        collection(db, 'products'),
        where('businessId', '==', user.uid)
      )
      const productsSnap = await getDocs(productsQuery)
      const productsList = productsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Product[]

      setProducts(productsList)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user || !storage) return

    const file = e.target.files[0]

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      setError('')

      const storageRef = ref(
        storage,
        `products/${user.uid}/${Date.now()}_${file.name}`
      )
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      setFormData({ ...formData, image: downloadURL })
      setSuccess('Image uploaded successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    try {
      setError('')
      setSuccess('')

      const productData = {
        businessId: user.uid,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        inStock: formData.inStock,
        trackInventory: formData.trackInventory,
        stockQuantity: formData.trackInventory && formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
        lowStockThreshold: formData.trackInventory && formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : 0,
        image: formData.image || '',
        updatedAt: new Date(),
      }

      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id)
        await updateDoc(productRef, productData)
        setSuccess('Product updated successfully!')
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date(),
        })
        setSuccess('Product added successfully!')
      }

      resetForm()
      await loadProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category || '',
      inStock: product.inStock,
      trackInventory: product.trackInventory || false,
      stockQuantity: product.stockQuantity?.toString() || '',
      lowStockThreshold: product.lowStockThreshold?.toString() || '',
      image: product.image || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (productId: string) => {
    if (!db) return
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await deleteDoc(doc(db, 'products', productId))
      setSuccess('Product deleted successfully!')
      await loadProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      inStock: true,
      trackInventory: false,
      stockQuantity: '',
      lowStockThreshold: '',
      image: '',
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  const handleBulkImport = async (productsToImport: any[]) => {
    if (!db) return

    try {
      setError('')
      setSuccess('')

      // Use Firestore batch write for better performance
      const batch = writeBatch(db)
      const productsRef = collection(db, 'products')

      productsToImport.forEach((product) => {
        const newDocRef = doc(productsRef)
        batch.set(newDocRef, product)
      })

      await batch.commit()

      setSuccess(`Successfully imported ${productsToImport.length} products!`)
      await loadProducts()
    } catch (err: any) {
      setError(`Failed to import products: ${err.message}`)
      throw err
    }
  }

  const handleExportCSV = () => {
    const csv = exportProductsToCSV(products)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    setSuccess('Products exported successfully!')
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    )
  }

  // Calculate low stock and out of stock products
  const lowStockProducts = products.filter(
    (p) =>
      p.trackInventory &&
      p.stockQuantity !== undefined &&
      p.lowStockThreshold !== undefined &&
      p.stockQuantity > 0 &&
      p.stockQuantity <= p.lowStockThreshold
  )

  const outOfStockProducts = products.filter(
    (p) =>
      p.trackInventory &&
      p.stockQuantity !== undefined &&
      p.stockQuantity === 0
  )

  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>Products & Services</h1>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={handleExportCSV}
            disabled={products.length === 0}
            title={products.length === 0 ? 'No products to export' : 'Export products to CSV'}
          >
            📤 Export CSV
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowCSVImport(true)}
          >
            📥 Import CSV
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Inventory Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#92400e' }}>
            ⚠️ Inventory Alerts
          </h3>
          {outOfStockProducts.length > 0 && (
            <div style={{ marginBottom: lowStockProducts.length > 0 ? '0.75rem' : 0 }}>
              <strong style={{ color: '#dc2626' }}>Out of Stock ({outOfStockProducts.length}):</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                {outOfStockProducts.map((product) => (
                  <li key={product.id} style={{ color: '#dc2626' }}>
                    {product.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div>
              <strong style={{ color: '#f59e0b' }}>Low Stock ({lowStockProducts.length}):</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                {lowStockProducts.map((product) => (
                  <li key={product.id} style={{ color: '#92400e' }}>
                    {product.name} - {product.stockQuantity} left (threshold: {product.lowStockThreshold})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="product-form-container">
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Product/Service Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
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
                placeholder="e.g., Coffee, Pastries, Services"
              />
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
                placeholder="Describe your product or service..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="image">Product Image</label>
              {formData.image && (
                <div className="image-preview">
                  <img src={formData.image} alt="Product preview" />
                </div>
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <p className="upload-status">Uploading...</p>}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) =>
                    setFormData({ ...formData, inStock: e.target.checked })
                  }
                />
                <span>In Stock / Available</span>
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.trackInventory}
                  onChange={(e) =>
                    setFormData({ ...formData, trackInventory: e.target.checked })
                  }
                />
                <span>Track Inventory (for physical products)</span>
              </label>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                Enable this to track stock quantity and get low stock alerts
              </small>
            </div>

            {formData.trackInventory && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stockQuantity">Stock Quantity</label>
                  <input
                    type="number"
                    id="stockQuantity"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: e.target.value })
                    }
                    placeholder="Current stock"
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                    How many units you currently have in stock
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="lowStockThreshold">Low Stock Alert</label>
                  <input
                    type="number"
                    id="lowStockThreshold"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, lowStockThreshold: e.target.value })
                    }
                    placeholder="Alert threshold"
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                    Alert when stock falls below this number
                  </small>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingProduct ? 'Update Product' : 'Add Product'}
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

      <div className="products-grid">
        {products.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</span>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No products yet</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Add your first product or service to get started
            </p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                />
              ) : (
                <div className="product-image-placeholder">
                  <span>📦</span>
                </div>
              )}
              <div className="product-content">
                <div className="product-header">
                  <h3>{product.name}</h3>
                  <span className="product-price">${product.price.toFixed(2)}</span>
                </div>
                {product.category && (
                  <span className="product-category">{product.category}</span>
                )}
                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}
                <div className="product-status">
                  <span className={product.inStock ? 'in-stock' : 'out-stock'}>
                    {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                  </span>
                </div>
                {product.trackInventory && (
                  <div className="product-inventory" style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Stock:</span>
                      <span style={{
                        color: product.lowStockThreshold && product.stockQuantity !== undefined && product.stockQuantity <= product.lowStockThreshold
                          ? '#dc2626'
                          : product.stockQuantity === 0
                          ? '#dc2626'
                          : '#059669'
                      }}>
                        {product.stockQuantity !== undefined ? `${product.stockQuantity} units` : 'Not set'}
                      </span>
                    </div>
                    {product.lowStockThreshold !== undefined && product.stockQuantity !== undefined && product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: '#fef3c7',
                        borderLeft: '3px solid #f59e0b',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        ⚠️ Low stock alert (threshold: {product.lowStockThreshold})
                      </div>
                    )}
                    {product.stockQuantity === 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: '#fee2e2',
                        borderLeft: '3px solid #dc2626',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        ⚠️ Out of stock!
                      </div>
                    )}
                  </div>
                )}
                <div className="product-actions">
                  <button
                    className="btn-edit-small"
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCSVImport && user && (
        <CSVImportModal
          businessId={user.uid}
          onImport={handleBulkImport}
          onClose={() => setShowCSVImport(false)}
        />
      )}
    </div>
  )
}
