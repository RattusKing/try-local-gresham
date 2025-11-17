import { doc, getDoc, updateDoc, increment, runTransaction } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/config'

export interface InventoryItem {
  productId: string
  productName: string
  quantity: number
}

export interface InventoryCheckResult {
  success: boolean
  insufficientStock?: {
    productId: string
    productName: string
    requested: number
    available: number
  }[]
}

/**
 * Check if sufficient inventory is available for all items
 * @param items - Array of items to check
 * @returns Result indicating if inventory is sufficient
 */
export async function checkInventoryAvailability(
  items: InventoryItem[]
): Promise<InventoryCheckResult> {
  const insufficientStock: InventoryCheckResult['insufficientStock'] = []

  for (const item of items) {
    const productRef = doc(firestore, 'products', item.productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      insufficientStock!.push({
        productId: item.productId,
        productName: item.productName,
        requested: item.quantity,
        available: 0,
      })
      continue
    }

    const productData = productDoc.data()

    // Only check inventory if product tracks it
    if (productData.trackInventory && productData.stockQuantity !== undefined) {
      const available = productData.stockQuantity as number

      if (available < item.quantity) {
        insufficientStock!.push({
          productId: item.productId,
          productName: item.productName,
          requested: item.quantity,
          available,
        })
      }
    }
  }

  if (insufficientStock.length > 0) {
    return {
      success: false,
      insufficientStock,
    }
  }

  return { success: true }
}

/**
 * Atomically reserve inventory for items using Firestore transaction
 * This prevents race conditions by ensuring inventory is checked and updated atomically
 * @param items - Array of items to reserve
 * @returns Promise that resolves when inventory is reserved
 * @throws Error if insufficient inventory or transaction fails
 */
export async function reserveInventory(items: InventoryItem[]): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const insufficientStock: InventoryCheckResult['insufficientStock'] = []

    // First, read all product docs and check inventory
    const productChecks = await Promise.all(
      items.map(async (item) => {
        const productRef = doc(firestore, 'products', item.productId)
        const productDoc = await transaction.get(productRef)

        if (!productDoc.exists()) {
          insufficientStock!.push({
            productId: item.productId,
            productName: item.productName,
            requested: item.quantity,
            available: 0,
          })
          return null
        }

        const productData = productDoc.data()

        // Only check/reserve if product tracks inventory
        if (productData.trackInventory && productData.stockQuantity !== undefined) {
          const available = productData.stockQuantity as number

          if (available < item.quantity) {
            insufficientStock!.push({
              productId: item.productId,
              productName: item.productName,
              requested: item.quantity,
              available,
            })
            return null
          }

          return {
            ref: productRef,
            currentStock: available,
            quantity: item.quantity,
          }
        }

        return null
      })
    )

    // If any items have insufficient stock, abort transaction
    if (insufficientStock.length > 0) {
      const errors = insufficientStock
        .map((item) => `${item!.productName}: requested ${item!.requested}, only ${item!.available} available`)
        .join('; ')
      throw new Error(`Insufficient inventory: ${errors}`)
    }

    // All checks passed, now update inventory
    for (const check of productChecks) {
      if (check) {
        const newStock = check.currentStock - check.quantity
        transaction.update(check.ref, {
          stockQuantity: newStock,
          inStock: newStock > 0,
        })
      }
    }
  })
}

/**
 * Release reserved inventory (e.g., when order is cancelled)
 * @param items - Array of items to release
 */
export async function releaseInventory(items: InventoryItem[]): Promise<void> {
  const updates = items.map(async (item) => {
    const productRef = doc(firestore, 'products', item.productId)
    const productDoc = await getDoc(productRef)

    if (productDoc.exists()) {
      const productData = productDoc.data()

      if (productData.trackInventory && productData.stockQuantity !== undefined) {
        await updateDoc(productRef, {
          stockQuantity: increment(item.quantity),
          inStock: true, // Mark as in stock when releasing
        })
      }
    }
  })

  await Promise.all(updates)
}
