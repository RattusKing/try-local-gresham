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
