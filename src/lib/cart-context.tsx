'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem } from './types'

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  platformFee: number
  total: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const MAX_CART_ITEMS = 100 // Maximum number of items in cart
const CART_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const MAX_CART_SIZE = 1000000 // 1MB limit for cart data

interface CartData {
  items: CartItem[]
  savedAt: number
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const cartData: CartData = JSON.parse(savedCart)

        // Check if cart has expired
        const now = Date.now()
        const age = now - (cartData.savedAt || 0)

        if (age > CART_TTL) {
          // Cart expired, clear it
          localStorage.removeItem('cart')
          setItems([])
        } else {
          // Cart is still valid
          setItems(cartData.items || [])
        }
      } catch (error) {
        // Cart data is corrupted, clear it
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading cart, clearing corrupted data:', error)
        }
        localStorage.removeItem('cart')
        setItems([])
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      try {
        const cartData: CartData = {
          items,
          savedAt: Date.now(),
        }
        const json = JSON.stringify(cartData)

        // Check if cart data is too large
        if (json.length > MAX_CART_SIZE) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Cart data exceeds size limit')
          }
          return
        }

        localStorage.setItem('cart', json)
      } catch (error) {
        // localStorage quota exceeded or other error
        if (process.env.NODE_ENV === 'development') {
          console.error('Error saving cart:', error)
        }
      }
    }
  }, [items, mounted])

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const platformFee = subtotal * 0.02 // 2% platform fee
  const total = subtotal + platformFee
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((i) => i.productId === item.productId)

      // Calculate total item count
      const currentTotalItems = currentItems.reduce((sum, i) => sum + i.quantity, 0)

      if (existingItem) {
        // Check if adding would exceed limit
        if (currentTotalItems + quantity > MAX_CART_ITEMS) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Cart limit of ${MAX_CART_ITEMS} items reached`)
          }
          return currentItems
        }

        // Update quantity if item already exists
        return currentItems.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      } else {
        // Check if adding new item would exceed limit
        if (currentTotalItems + quantity > MAX_CART_ITEMS) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Cart limit of ${MAX_CART_ITEMS} items reached`)
          }
          return currentItems
        }

        // Add new item
        return [...currentItems, { ...item, quantity }]
      }
    })
  }

  const removeItem = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getItemQuantity = (productId: string): number => {
    const item = items.find((i) => i.productId === productId)
    return item ? item.quantity : 0
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        platformFee,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
