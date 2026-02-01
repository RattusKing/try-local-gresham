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
  headerImage?: string // Header/banner image separate from cover
  gallery?: string[] // Array of additional business images
  description?: string
  address?: string
  email?: string
  instagram?: string
  ownerId?: string
  status?: 'pending' | 'approved' | 'rejected'
  averageRating?: number
  reviewCount?: number
  createdAt?: Date
  updatedAt?: Date
  // Stripe Connect fields
  stripeConnectedAccountId?: string // Stripe Connect account ID
  stripeAccountStatus?: 'pending' | 'verified' | 'restricted' // Account verification status
  payoutsEnabled?: boolean // Whether payouts are enabled for this account
  stripeOnboardingCompletedAt?: Date // When Stripe onboarding was completed
  // Subscription fields
  stripeCustomerId?: string // Stripe Customer ID for subscriptions
  stripeSubscriptionId?: string // Stripe Subscription ID
  subscriptionStatus?: SubscriptionStatus // Current subscription status
  subscriptionTier?: SubscriptionTier // Which subscription plan (monthly, yearly, nonprofit)
  subscriptionCurrentPeriodEnd?: Date // When current billing period ends
  subscriptionCancelAtPeriodEnd?: boolean // Whether subscription will cancel at period end
  hasFirstMonthFree?: boolean // Whether this business got first month free promotion
  subscriptionCreatedAt?: Date // When subscription was created
  grandfathered?: boolean // Exempt from subscription requirements (for early/existing businesses)
  isNonProfit?: boolean // Non-profit organizations get free access
  approvedAt?: Date // When business was approved by admin
}

export type UserRole = 'customer' | 'business_owner' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  phone?: string
  photoURL?: string // Profile picture URL
  coverPhotoURL?: string // Background/cover photo URL
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
  photos?: string[] // Customer-uploaded review photos
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
  userId?: string // Optional for guest checkout
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
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  createdAt: Date
  updatedAt: Date
  // Stripe payment fields
  stripePaymentIntentId?: string // Stripe Payment Intent ID
  stripeChargeId?: string // Stripe Charge ID
  stripeTransferId?: string // Transfer ID for Connect payments
  refundId?: string // Stripe Refund ID if order was refunded
  refundAmount?: number // Amount refunded
  refundedAt?: Date // When refund was processed
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
  acceptingAppointments: boolean // Master toggle - whether appointments are enabled at all
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

// Stripe Subscription Types

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'unpaid'

export type SubscriptionTier = 'monthly' | 'yearly' | 'nonprofit'

// Subscription pricing (in cents)
export const SUBSCRIPTION_PRICE_MONTHLY = 3900 // $39.00/month
export const SUBSCRIPTION_PRICE_YEARLY = 43000 // $430.00/year (saves $38/year vs monthly)
export const SUBSCRIPTION_PRICE_NONPROFIT = 0 // Free for non-profits

// Subscription metadata
export const SUBSCRIPTION_TIERS = {
  monthly: {
    price: SUBSCRIPTION_PRICE_MONTHLY,
    interval: 'month' as const,
    displayName: 'Monthly Plan',
    description: '$39/month',
    savings: null,
  },
  yearly: {
    price: SUBSCRIPTION_PRICE_YEARLY,
    interval: 'year' as const,
    displayName: 'Annual Plan',
    description: '$430/year',
    savings: 'Save $38/year',
  },
  nonprofit: {
    price: SUBSCRIPTION_PRICE_NONPROFIT,
    interval: 'year' as const,
    displayName: 'Non-Profit',
    description: 'Free for verified non-profits',
    savings: 'Free forever',
  },
} as const

export interface Subscription {
  id: string
  businessId: string
  stripeSubscriptionId: string // Stripe Subscription ID
  stripeCustomerId: string // Stripe Customer ID
  stripePriceId: string // Stripe Price ID
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
  hasFirstMonthFree: boolean // Whether first month was free
  createdAt: Date
  updatedAt: Date
}

// Push Notification Types

export interface PushSubscription {
  id: string
  userId: string
  userType: 'customer' | 'business_owner'
  businessId?: string // For business owners, to receive business-specific notifications
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

// Sponsored Banner Types (Paid Business Promotions)

export type SponsoredBannerStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'expired' | 'cancelled'

export interface SponsoredBanner {
  id: string
  businessId: string
  businessName: string // Denormalized for display
  businessCover?: string // Business cover image
  headline?: string // Optional custom promotional headline
  status: SponsoredBannerStatus
  isPaid: boolean
  // Payment details
  stripePaymentIntentId?: string
  amountPaid?: number // In cents
  // Scheduling
  startDate: Date
  endDate: Date
  durationDays: number // 7, 14, or 30 days
  // Admin notes
  adminNotes?: string
  rejectionReason?: string
  approvedBy?: string
  approvedAt?: Date
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Sponsored banner pricing (in cents)
export const SPONSORED_BANNER_PRICING = {
  '7': { days: 7, price: 2500, displayPrice: '$25', label: '1 Week' },
  '14': { days: 14, price: 4500, displayPrice: '$45', label: '2 Weeks' },
  '30': { days: 30, price: 7500, displayPrice: '$75', label: '1 Month' },
} as const

export type SponsoredBannerDuration = keyof typeof SPONSORED_BANNER_PRICING

// Business Tags System - Comprehensive categorized tags for business visibility

export interface BusinessTagCategory {
  name: string
  icon: string
  tags: string[]
}

export const BUSINESS_TAG_CATEGORIES: BusinessTagCategory[] = [
  {
    name: 'Food & Dining',
    icon: '🍽️',
    tags: [
      'Restaurant', 'Cafe', 'Coffee Shop', 'Bakery', 'Deli', 'Food Truck',
      'Pizza', 'Mexican', 'Asian', 'Italian', 'American', 'Thai', 'Chinese',
      'Japanese', 'Sushi', 'BBQ', 'Seafood', 'Vegetarian', 'Vegan',
      'Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Fine Dining', 'Casual Dining',
      'Fast Food', 'Takeout', 'Delivery', 'Catering', 'Food Vendor',
      'Ice Cream', 'Desserts', 'Donuts', 'Sandwiches', 'Burgers', 'Tacos',
      'Smoothies', 'Juice Bar', 'Tea House', 'Wine Bar', 'Sports Bar',
      'Brewery', 'Pub', 'Cocktails', 'Happy Hour'
    ]
  },
  {
    name: 'Shopping & Retail',
    icon: '🛍️',
    tags: [
      'Retail', 'Boutique', 'Clothing', 'Shoes', 'Accessories', 'Jewelry', 'Watches',
      'Vintage', 'Thrift Store', 'Consignment', 'Antiques', 'Collectibles',
      'Gift Shop', 'Home Decor', 'Furniture', 'Art Gallery', 'Craft Supplies',
      'Florist', 'Plants', 'Garden Center', 'Home and Garden', 'Hardware Store', 'Electronics',
      'Phone Repair', 'Computer Store', 'Books', 'Records', 'Music Store',
      'Toys', 'Games', 'Sports Equipment', 'Outdoor Gear', 'Camping',
      'Bike Shop', 'Skate Shop', 'Smoke Shop', 'CBD', 'Supplements',
      'Grocery', 'Specialty Foods', 'Organic', 'Farmers Market', 'Butcher',
      'Seafood Market', 'Liquor Store', 'Wine Shop', 'Party Supplies'
    ]
  },
  {
    name: 'Health & Wellness',
    icon: '💆',
    tags: [
      'Gym', 'Fitness Center', 'Yoga', 'Pilates', 'CrossFit', 'Personal Training',
      'Martial Arts', 'Boxing', 'Dance Studio', 'Spa', 'Massage', 'Acupuncture',
      'Chiropractic', 'Physical Therapy', 'Mental Health', 'Counseling',
      'Meditation', 'Wellness Center', 'Nutrition', 'Weight Loss', 'Health Food',
      'Pharmacy', 'Medical Clinic', 'Urgent Care', 'Dental', 'Orthodontist',
      'Eye Care', 'Optometrist', 'Dermatology', 'Primary Care', 'Pediatrics',
      'Veterinarian', 'Alternative Medicine', 'Holistic Health', 'Reiki',
      'Hypnotherapy', 'Life Coaching', 'Recovery', 'Addiction Services'
    ]
  },
  {
    name: 'Beauty & Personal Care',
    icon: '💇',
    tags: [
      'Hair Salon', 'Barbershop', 'Nail Salon', 'Manicure', 'Pedicure',
      'Skincare', 'Facial', 'Waxing', 'Lash Extensions', 'Brow Bar',
      'Makeup Artist', 'Tanning', 'Tattoo', 'Piercing', 'Beauty Supply',
      'Cosmetics', 'Fragrance', 'Mens Grooming', 'Braiding', 'Extensions',
      'Color Specialist', 'Blowout Bar', 'Hair Removal', 'Permanent Makeup'
    ]
  },
  {
    name: 'Professional Services',
    icon: '💼',
    tags: [
      'Accountant', 'Tax Services', 'Bookkeeping', 'Financial Advisor',
      'Insurance', 'Real Estate', 'Property Management', 'Mortgage',
      'Attorney', 'Legal Services', 'Notary', 'Immigration', 'Consulting',
      'Marketing', 'Web Design', 'Graphic Design', 'Photography', 'Videography',
      'Printing', 'Signs', 'IT Services', 'Tech Support', 'Software',
      'Staffing', 'HR Services', 'Business Coach', 'Translation', 'Interpreter'
    ]
  },
  {
    name: 'Home Services',
    icon: '🏠',
    tags: [
      'Cleaning', 'House Cleaning', 'Carpet Cleaning', 'Pressure Washing',
      'Landscaping', 'Lawn Care', 'Tree Service', 'Pest Control', 'Plumbing',
      'Electrician', 'HVAC', 'HVAC Repair', 'Heating', 'Cooling', 'Air Conditioning',
      'Furnace', 'Heat Pump', 'Roofing', 'Roof Repair', 'Roofing Contractor',
      'Painting', 'Handyman', 'Contractor', 'General Contractor', 'Construction',
      'Home Builder', 'Builder', 'Commercial Construction', 'Remodeling',
      'Kitchen Remodel', 'Bathroom Remodel', 'Flooring', 'Concrete', 'Masonry',
      'Framing', 'Drywall', 'Siding', 'Insulation', 'Excavation', 'Demolition',
      'Windows', 'Doors', 'Garage Door', 'Locksmith', 'Security', 'Smart Home',
      'Pool Service', 'Moving', 'Storage', 'Junk Removal', 'Appliance Repair',
      'Furniture Repair', 'Upholstery', 'Curtains', 'Blinds', 'Interior Design'
    ]
  },
  {
    name: 'Automotive',
    icon: '🚗',
    tags: [
      'Auto Repair', 'Mechanic', 'Oil Change', 'Brakes', 'Tires', 'Auto Body',
      'Collision Repair', 'Detailing', 'Car Wash', 'Towing', 'Roadside Assistance',
      'Auto Parts', 'Auto Glass', 'Muffler', 'Transmission', 'Alignment',
      'Car Dealership', 'Car Dealer', 'Auto Dealer', 'New Cars', 'Used Cars',
      'Pre-Owned Cars', 'Auto Sales', 'Car Sales', 'Truck Sales', 'SUV',
      'Motorcycle', 'Motorcycle Dealer', 'RV', 'RV Dealer', 'Boat', 'Boat Dealer',
      'Rental Car', 'EV Charging', 'Electric Vehicle', 'Fleet Services', 'Truck Repair'
    ]
  },
  {
    name: 'Pets & Animals',
    icon: '🐾',
    tags: [
      'Pet Store', 'Pet Supplies', 'Dog Grooming', 'Cat Grooming', 'Pet Salon',
      'Dog Training', 'Obedience', 'Pet Boarding', 'Kennel', 'Pet Daycare',
      'Dog Walking', 'Pet Sitting', 'Veterinarian', 'Animal Hospital',
      'Pet Adoption', 'Rescue', 'Aquarium', 'Fish Store', 'Bird Store',
      'Reptiles', 'Pet Photography', 'Pet Bakery', 'Pet Food', 'Raw Diet'
    ]
  },
  {
    name: 'Entertainment & Recreation',
    icon: '🎉',
    tags: [
      'Movie Theater', 'Bowling', 'Arcade', 'Escape Room', 'Laser Tag',
      'Mini Golf', 'Go Karts', 'Trampoline Park', 'Amusement', 'Skating Rink',
      'Pool Hall', 'Karaoke', 'Comedy Club', 'Live Music', 'Concert Venue',
      'Nightclub', 'Dance Club', 'Casino', 'Bingo', 'Axe Throwing',
      'Golf Course', 'Driving Range', 'Batting Cages', 'Sports Complex',
      'Recreation Center', 'Community Center', 'Museum', 'Art Museum',
      'Science Center', 'Zoo', 'Aquarium', 'Theme Park', 'Water Park'
    ]
  },
  {
    name: 'Education & Learning',
    icon: '📚',
    tags: [
      'Tutoring', 'Test Prep', 'SAT Prep', 'ACT Prep', 'GED', 'ESL',
      'Language School', 'Music Lessons', 'Art Classes', 'Dance Lessons',
      'Driving School', 'Cooking Class', 'Sewing Class', 'Craft Workshop',
      'STEM Education', 'Coding Bootcamp', 'Trade School', 'Vocational',
      'College Prep', 'Early Learning', 'Preschool', 'Daycare', 'After School',
      'Summer Camp', 'Sports Camp', 'Art Camp', 'Music Camp', 'Online Courses',
      'Library', 'Study Space', 'Coworking', 'Professional Development'
    ]
  },
  {
    name: 'Events & Celebrations',
    icon: '🎊',
    tags: [
      'Event Venue', 'Wedding Venue', 'Banquet Hall', 'Conference Center',
      'Event Planning', 'Wedding Planner', 'Party Planner', 'Catering',
      'DJ', 'Band', 'Entertainment', 'Photo Booth', 'Balloon Artist',
      'Face Painting', 'Magician', 'Clown', 'Bounce House', 'Party Rentals',
      'Tent Rental', 'Chair Rental', 'Table Rental', 'Linens', 'Wedding Dress',
      'Tuxedo Rental', 'Invitations', 'Flowers', 'Wedding Cake', 'Party Cake',
      'Bartender', 'Officiant', 'Wedding Photography', 'Event Photography'
    ]
  },
  {
    name: 'Family & Kids',
    icon: '👨‍👩‍👧‍👦',
    tags: [
      'Family Friendly', 'Kid Friendly', 'Playground', 'Play Place',
      'Indoor Playground', 'Kids Activities', 'Kids Classes', 'Kids Sports',
      'Birthday Parties', 'Family Entertainment', 'Baby Store', 'Kids Clothing',
      'Maternity', 'Toy Store', 'Kids Haircut', 'Pediatric', 'Family Dining',
      'Kids Menu', 'Stroller Friendly', 'Nursing Room', 'Diaper Changing',
      'Family Photography', 'Newborn Photography', 'Tutoring'
    ]
  },
  {
    name: 'Community & Nonprofit',
    icon: '🤝',
    tags: [
      'Nonprofit', 'Charity', 'Community Organization', 'Church', 'Mosque',
      'Synagogue', 'Temple', 'Religious', 'Food Bank', 'Homeless Services',
      'Youth Services', 'Senior Services', 'Disability Services', 'Veterans',
      'Women Services', 'LGBTQ+', 'Cultural Center', 'Community Garden',
      'Volunteer', 'Donation Center', 'Thrift Benefiting Charity', 'Fundraising'
    ]
  },
  {
    name: 'Outdoors & Nature',
    icon: '🌲',
    tags: [
      'Outdoors', 'Hiking', 'Camping', 'Fishing', 'Hunting', 'Outdoor Sports',
      'Rock Climbing', 'Kayaking', 'Paddleboarding', 'Surfing', 'Skiing',
      'Snowboarding', 'Mountain Biking', 'Trail Running', 'Parks', 'Nature',
      'Wildlife', 'Bird Watching', 'Scenic Views', 'River', 'Lake', 'Beach',
      'Adventure', 'Tours', 'Guide Services', 'Outdoor Gear', 'Rentals'
    ]
  },
  {
    name: 'Travel & Lodging',
    icon: '✈️',
    tags: [
      'Hotel', 'Motel', 'Bed & Breakfast', 'Inn', 'Resort', 'Vacation Rental',
      'Airbnb', 'Hostel', 'Campground', 'RV Park', 'Travel Agency',
      'Tour Operator', 'Airport Shuttle', 'Limo Service', 'Charter Bus',
      'Passport Services', 'Visa Services', 'Travel Insurance', 'Currency Exchange'
    ]
  }
]

// Flatten all tags for easy access
export const ALL_BUSINESS_TAGS: string[] = BUSINESS_TAG_CATEGORIES.flatMap(
  category => category.tags
)

// Maximum number of tags a business can select
export const MAX_BUSINESS_TAGS = 10

// Minimum number of tags required
export const MIN_BUSINESS_TAGS = 1
