import { z } from 'zod'

// Email validation
export const emailSchema = z.string().email('Invalid email address')

// Phone validation (US format)
export const phoneSchema = z
  .string()
  .regex(/^\+?1?\d{9,15}$/, 'Invalid phone number format')
  .transform((v) => v.replace(/\D/g, ''))

// Order confirmation email schema
export const orderConfirmationSchema = z.object({
  customerEmail: emailSchema,
  customerName: z.string().min(1, 'Customer name is required').max(100),
  customerPhone: z.string().optional(),
  businessEmail: emailSchema,
  businessName: z.string().min(1, 'Business name is required').max(100),
  businessId: z.string().optional(), // For push notifications
  orderId: z.string().min(1, 'Order ID is required'),
  items: z.array(
    z.object({
      name: z.string().min(1, 'Item name is required'),
      quantity: z.number().positive('Quantity must be positive'),
      price: z.number().nonnegative('Price must be non-negative'),
    })
  ).min(1, 'At least one item is required'),
  total: z.number().positive('Total must be positive'),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
})

// Order status update email schema
export const orderStatusUpdateSchema = z.object({
  customerEmail: emailSchema,
  customerName: z.string().min(1).max(100),
  customerId: z.string().optional(), // For push notifications
  orderId: z.string().min(1, 'Order ID is required'),
  businessName: z.string().min(1).max(100),
  status: z.enum(['accepted', 'ready', 'completed', 'rejected']),
  statusMessage: z.string().optional(),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.string().optional(),
  pickupAddress: z.string().optional(),
})

// Business welcome email schema
export const businessWelcomeSchema = z.object({
  businessEmail: emailSchema,
  businessName: z.string().min(1).max(100),
  ownerName: z.string().min(1).max(100),
})

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

// Helper function to validate and return typed data
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // In Zod 4.x, the property is 'issues' not 'errors'
      const errorMessages = error.issues
        ?.map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      throw new Error(`Validation failed: ${errorMessages || 'Invalid data'}`)
    }
    throw error
  }
}
