import { CSVProductRow, CSVImportResult, CSVImportError, Product } from './types'

/**
 * Parse CSV content into product rows
 * Expected CSV format:
 * name,description,price,category,inStock,trackInventory,stockQuantity,lowStockThreshold,image
 */
export function parseCSV(csvContent: string): CSVProductRow[] {
  const lines = csvContent.trim().split('\n')

  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: CSVProductRow[] = []

  // Validate headers
  if (!headers.includes('name') || !headers.includes('price')) {
    throw new Error('CSV must include at minimum "name" and "price" columns')
  }

  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    const values = parseCSVLine(line)
    const row: any = {}

    headers.forEach((header, index) => {
      const value = values[index]?.trim() || ''
      row[header] = value
    })

    rows.push(row as CSVProductRow)
  }

  return rows
}

/**
 * Parse a single CSV line, handling quoted values with commas
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current) // Push the last value
  return values
}

/**
 * Validate and convert CSV rows to Product objects
 */
export function validateCSVRows(
  rows: CSVProductRow[],
  businessId: string
): CSVImportResult {
  const errors: CSVImportError[] = []
  const validProducts: Partial<Product>[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2 // +2 because of header row and 0-indexing
    const rowErrors = validateRow(row, rowNumber)

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
    } else {
      // Convert to Product
      const product = convertToProduct(row, businessId)
      validProducts.push(product)
    }
  })

  return {
    success: errors.length === 0,
    imported: validProducts.length,
    failed: errors.length,
    errors
  }
}

/**
 * Validate a single CSV row
 */
function validateRow(row: CSVProductRow, rowNumber: number): CSVImportError[] {
  const errors: CSVImportError[] = []

  // Required: name
  if (!row.name || row.name.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'name',
      message: 'Product name is required',
      data: row
    })
  }

  // Required: price
  if (!row.price && row.price !== 0) {
    errors.push({
      row: rowNumber,
      field: 'price',
      message: 'Price is required',
      data: row
    })
  } else {
    const price = parseFloat(String(row.price))
    if (isNaN(price)) {
      errors.push({
        row: rowNumber,
        field: 'price',
        message: `Invalid price: "${row.price}". Must be a number.`,
        data: row
      })
    } else if (price < 0) {
      errors.push({
        row: rowNumber,
        field: 'price',
        message: 'Price cannot be negative',
        data: row
      })
    }
  }

  // Optional: stockQuantity (if provided, must be valid)
  if (row.stockQuantity !== undefined && row.stockQuantity !== '') {
    const stock = parseInt(String(row.stockQuantity))
    if (isNaN(stock)) {
      errors.push({
        row: rowNumber,
        field: 'stockQuantity',
        message: `Invalid stock quantity: "${row.stockQuantity}". Must be a whole number.`,
        data: row
      })
    } else if (stock < 0) {
      errors.push({
        row: rowNumber,
        field: 'stockQuantity',
        message: 'Stock quantity cannot be negative',
        data: row
      })
    }
  }

  // Optional: lowStockThreshold (if provided, must be valid)
  if (row.lowStockThreshold !== undefined && row.lowStockThreshold !== '') {
    const threshold = parseInt(String(row.lowStockThreshold))
    if (isNaN(threshold)) {
      errors.push({
        row: rowNumber,
        field: 'lowStockThreshold',
        message: `Invalid low stock threshold: "${row.lowStockThreshold}". Must be a whole number.`,
        data: row
      })
    } else if (threshold < 0) {
      errors.push({
        row: rowNumber,
        field: 'lowStockThreshold',
        message: 'Low stock threshold cannot be negative',
        data: row
      })
    }
  }

  return errors
}

/**
 * Convert a validated CSV row to a Product object
 */
function convertToProduct(row: CSVProductRow, businessId: string): Partial<Product> {
  const price = parseFloat(String(row.price))

  // Parse boolean values
  const inStock = parseBooleanValue(row.inStock, true) // Default to true
  const trackInventory = parseBooleanValue(row.trackInventory, false) // Default to false

  // Parse numeric values
  const stockQuantity = row.stockQuantity ? parseInt(String(row.stockQuantity)) : undefined
  const lowStockThreshold = row.lowStockThreshold ? parseInt(String(row.lowStockThreshold)) : undefined

  return {
    businessId,
    name: row.name.trim(),
    description: row.description?.trim() || undefined,
    price,
    category: row.category?.trim() || undefined,
    inStock,
    trackInventory,
    stockQuantity: trackInventory ? stockQuantity : undefined,
    lowStockThreshold: trackInventory ? lowStockThreshold : undefined,
    image: row.image?.trim() || undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

/**
 * Parse boolean values from CSV (handles various formats)
 */
function parseBooleanValue(value: string | boolean | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue
  if (typeof value === 'boolean') return value

  const str = String(value).toLowerCase().trim()
  if (['true', 'yes', '1', 'y'].includes(str)) return true
  if (['false', 'no', '0', 'n'].includes(str)) return false

  return defaultValue
}

/**
 * Generate a CSV template for download
 */
export function generateCSVTemplate(): string {
  const headers = [
    'name',
    'description',
    'price',
    'category',
    'inStock',
    'trackInventory',
    'stockQuantity',
    'lowStockThreshold',
    'image'
  ]

  const exampleRow = [
    'Example Product',
    'A great product description',
    '29.99',
    'Electronics',
    'true',
    'true',
    '100',
    '10',
    'https://example.com/image.jpg'
  ]

  return [
    headers.join(','),
    exampleRow.join(',')
  ].join('\n')
}

/**
 * Export existing products to CSV
 */
export function exportProductsToCSV(products: Product[]): string {
  const headers = [
    'name',
    'description',
    'price',
    'category',
    'inStock',
    'trackInventory',
    'stockQuantity',
    'lowStockThreshold',
    'image'
  ]

  const rows = products.map(product => [
    escapeCSVValue(product.name),
    escapeCSVValue(product.description || ''),
    product.price.toString(),
    escapeCSVValue(product.category || ''),
    product.inStock ? 'true' : 'false',
    product.trackInventory ? 'true' : 'false',
    product.stockQuantity?.toString() || '',
    product.lowStockThreshold?.toString() || '',
    escapeCSVValue(product.image || '')
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

/**
 * Escape CSV values that contain commas or quotes
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
