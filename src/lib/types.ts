export interface Business {
  id: string
  name: string
  tags: string[]
  neighborhood: string
  hours: string
  phone: string
  website: string
  map: string
  cover: string
  description?: string
  ownerId?: string
  status?: 'pending' | 'approved' | 'rejected'
  subscriptionTier?: 'free' | 'standard' | 'premium'
  averageRating?: number
  reviewCount?: number
  createdAt?: Date
  updatedAt?: Date
}

export type UserRole = 'customer' | 'business_owner' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  phone?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  businessId?: string // For business owners
}

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role?: UserRole
}

export interface Product {
  id: string
  businessId: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  inStock: boolean
  trackInventory?: boolean // Whether to track inventory for this product
  stockQuantity?: number // Current stock quantity (null/undefined = unlimited)
  lowStockThreshold?: number // Alert when stock is below this number
  createdAt?: Date
  updatedAt?: Date
}

export interface Review {
  id: string
  businessId: string
  userId: string
  userName: string
  userPhotoURL?: string
  rating: number
  comment: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CartItem {
  productId: string
  businessId: string
  businessName: string
  productName: string
  productImage?: string
  price: number
  quantity: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'

export type DeliveryMethod = 'pickup' | 'delivery'

export interface Order {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  businessId: string
  businessName: string
  items: CartItem[]
  subtotal: number
  platformFee: number // 2%
  discount?: number // Discount amount applied
  discountCode?: string // Code used for discount
  total: number
  status: OrderStatus
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
  deliveryNotes?: string
  pickupTime?: string
  paymentStatus: 'pending' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export type DiscountType = 'percentage' | 'fixed'

export interface DiscountCode {
  id: string
  businessId: string
  code: string // Unique code (e.g., "SAVE20")
  description: string
  type: DiscountType
  value: number // Percentage (20) or fixed amount ($10)
  minPurchase?: number // Minimum purchase required
  maxDiscount?: number // Max discount for percentage types
  usageLimit?: number // Total uses allowed (null = unlimited)
  usageCount: number // Times used so far
  isActive: boolean
  validFrom: Date
  validUntil?: Date // null = no expiration
  createdAt: Date
  updatedAt: Date
}

export type BannerLocation = 'homepage' | 'all_pages' | 'business_pages'

export interface PromoBanner {
  id: string
  title: string
  message: string
  ctaText?: string // Call to action button text
  ctaLink?: string // Call to action link
  backgroundColor?: string // Hex color code
  textColor?: string // Hex color code
  location: BannerLocation
  isActive: boolean
  validFrom: Date
  validUntil?: Date // null = no expiration
  displayOrder: number // Lower numbers display first
  createdAt: Date
  updatedAt: Date
}

export type FavoriteType = 'business' | 'product'

export interface Favorite {
  id: string
  userId: string
  itemId: string // Business ID or Product ID
  itemType: FavoriteType
  itemName: string // For display purposes
  itemImage?: string // For display purposes
  businessName?: string // For products, store the business name
  createdAt: Date
}

// Appointment Scheduling Types

export interface Service {
  id: string
  businessId: string
  name: string
  description?: string
  duration: number // Duration in minutes
  price: number
  category?: string
  isActive: boolean
  requiresDeposit?: boolean
  depositAmount?: number
  bufferTime?: number // Minutes before/after for prep/cleanup
  createdAt: Date
  updatedAt: Date
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface TimeSlot {
  start: string // Format: "HH:MM" (24-hour)
  end: string // Format: "HH:MM" (24-hour)
}

export interface DayAvailability {
  isOpen: boolean
  slots: TimeSlot[] // Can have multiple slots for breaks (e.g., 9-12, 1-5)
}

export interface BusinessAvailability {
  id: string
  businessId: string
  monday: DayAvailability
  tuesday: DayAvailability
  wednesday: DayAvailability
  thursday: DayAvailability
  friday: DayAvailability
  saturday: DayAvailability
  sunday: DayAvailability
  timezone: string // e.g., "America/Los_Angeles"
  advanceBookingDays: number // How far in advance customers can book (default 30)
  minAdvanceHours: number // Minimum hours in advance required (default 2)
  createdAt: Date
  updatedAt: Date
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: string
  serviceId: string
  serviceName: string
  businessId: string
  businessName: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  scheduledDate: string // ISO date string YYYY-MM-DD
  scheduledTime: string // Format: "HH:MM" (24-hour)
  duration: number // Minutes (copied from service)
  price: number // Price at time of booking
  status: AppointmentStatus
  notes?: string // Customer notes
  businessNotes?: string // Internal business notes
  reminderSent?: boolean
  createdAt: Date
  updatedAt: Date
}

// CSV Import Types

export interface CSVProductRow {
  name: string
  description?: string
  price: string | number
  category?: string
  inStock?: string | boolean
  trackInventory?: string | boolean
  stockQuantity?: string | number
  lowStockThreshold?: string | number
  image?: string
}

export interface CSVImportResult {
  success: boolean
  imported: number
  failed: number
  errors: CSVImportError[]
}

export interface CSVImportError {
  row: number
  field?: string
  message: string
  data?: CSVProductRow
}
