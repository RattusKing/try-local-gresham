'use client'

import { useState } from 'react'
import { parseCSV, validateCSVRows, generateCSVTemplate } from '@/lib/csv-import'
import { CSVImportError } from '@/lib/types'
import './CSVImportModal.css'

interface CSVImportModalProps {
  businessId: string
  onImport: (products: any[]) => Promise<void>
  onClose: () => void
}

export default function CSVImportModal({ businessId, onImport, onClose }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [errors, setErrors] = useState<CSVImportError[]>([])
  const [success, setSuccess] = useState<{ imported: number; failed: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setErrors([])
      setSuccess(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    try {
      setImporting(true)
      setErrors([])
      setSuccess(null)

      // Read file content
      const content = await file.text()

      // Parse CSV
      const rows = parseCSV(content)

      // Validate rows
      const validationResult = validateCSVRows(rows, businessId)

      if (validationResult.errors.length > 0) {
        setErrors(validationResult.errors)
        setSuccess({
          imported: validationResult.imported,
          failed: validationResult.failed
        })

        // If there are ANY valid rows, still allow import
        if (validationResult.imported > 0) {
          // Filter out the rows with errors and prepare valid products
          const validProducts = rows
            .map((row, index) => {
              const rowNumber = index + 2
              const hasError = validationResult.errors.some(err => err.row === rowNumber)
              if (hasError) return null

              return {
                businessId,
                name: row.name.trim(),
                description: row.description?.trim() || undefined,
                price: parseFloat(String(row.price)),
                category: row.category?.trim() || undefined,
                inStock: parseBooleanValue(row.inStock, true),
                trackInventory: parseBooleanValue(row.trackInventory, false),
                stockQuantity: row.stockQuantity ? parseInt(String(row.stockQuantity)) : undefined,
                lowStockThreshold: row.lowStockThreshold ? parseInt(String(row.lowStockThreshold)) : undefined,
                image: row.image?.trim() || undefined,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
            .filter(p => p !== null)

          await onImport(validProducts)
        }
        return
      }

      // All rows valid - prepare products
      const products = rows.map(row => ({
        businessId,
        name: row.name.trim(),
        description: row.description?.trim() || undefined,
        price: parseFloat(String(row.price)),
        category: row.category?.trim() || undefined,
        inStock: parseBooleanValue(row.inStock, true),
        trackInventory: parseBooleanValue(row.trackInventory, false),
        stockQuantity: row.stockQuantity ? parseInt(String(row.stockQuantity)) : undefined,
        lowStockThreshold: row.lowStockThreshold ? parseInt(String(row.lowStockThreshold)) : undefined,
        image: row.image?.trim() || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      await onImport(products)
      setSuccess({ imported: products.length, failed: 0 })

      // Close modal after successful import (with no errors)
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err: any) {
      setErrors([{
        row: 0,
        message: err.message || 'Failed to import CSV'
      }])
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate()
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-import-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content csv-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Products from CSV</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="csv-instructions">
            <h3>Instructions</h3>
            <ol>
              <li>Download the CSV template to see the correct format</li>
              <li>Fill in your product data (name and price are required)</li>
              <li>Upload the completed CSV file</li>
            </ol>
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              📥 Download Template
            </button>
          </div>

          <div className="csv-format-info">
            <h4>CSV Format</h4>
            <p><strong>Required columns:</strong> name, price</p>
            <p><strong>Optional columns:</strong> description, category, inStock, trackInventory, stockQuantity, lowStockThreshold, image</p>
            <p><strong>Boolean values:</strong> Use true/false, yes/no, or 1/0</p>
          </div>

          <div className="file-upload-section">
            <label htmlFor="csv-file" className="file-upload-label">
              <span>📄 {file ? file.name : 'Choose CSV file'}</span>
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {errors.length > 0 && (
            <div className="csv-errors">
              <h4>Import Errors ({errors.length})</h4>
              <div className="error-list">
                {errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="error-item">
                    <strong>Row {error.row}:</strong> {error.message}
                    {error.field && <span className="error-field"> (Field: {error.field})</span>}
                  </div>
                ))}
                {errors.length > 10 && (
                  <p className="error-more">...and {errors.length - 10} more errors</p>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className={`csv-result ${errors.length > 0 ? 'warning' : 'success'}`}>
              <p>
                ✓ Successfully imported: <strong>{success.imported}</strong> products
              </p>
              {success.failed > 0 && (
                <p>
                  ✗ Failed to import: <strong>{success.failed}</strong> rows
                </p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-primary"
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? 'Importing...' : 'Import Products'}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to parse boolean values
function parseBooleanValue(value: string | boolean | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue
  if (typeof value === 'boolean') return value

  const str = String(value).toLowerCase().trim()
  if (['true', 'yes', '1', 'y'].includes(str)) return true
  if (['false', 'no', '0', 'n'].includes(str)) return false

  return defaultValue
}
