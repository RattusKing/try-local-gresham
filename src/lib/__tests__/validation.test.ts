import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  contactFormSchema,
  orderConfirmationSchema,
  validateSchema,
} from '../validation'

describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'admin+tag@company.org',
    ]

    validEmails.forEach((email) => {
      expect(() => emailSchema.parse(email)).not.toThrow()
    })
  })

  it('should reject invalid email addresses', () => {
    const invalidEmails = ['notanemail', '@example.com', 'user@', 'user @example.com']

    invalidEmails.forEach((email) => {
      expect(() => emailSchema.parse(email)).toThrow()
    })
  })
})

describe('Contact Form Validation', () => {
  it('should validate correct contact form data', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question about services',
      message: 'I would like to know more about your services.',
    }

    expect(() => validateSchema(contactFormSchema, validData)).not.toThrow()
  })

  it('should reject short names', () => {
    const invalidData = {
      name: 'J',
      email: 'john@example.com',
      subject: 'Question',
      message: 'This is a message',
    }

    expect(() => validateSchema(contactFormSchema, invalidData)).toThrow(/Name must be at least/)
  })

  it('should reject short messages', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question',
      message: 'Too short',
    }

    expect(() => validateSchema(contactFormSchema, invalidData)).toThrow(/Message must be at least/)
  })

  it('should reject messages that are too long', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question',
      message: 'x'.repeat(2001),
    }

    expect(() => validateSchema(contactFormSchema, invalidData)).toThrow()
  })
})

describe('Order Confirmation Validation', () => {
  it('should validate correct order data', () => {
    const validData = {
      customerEmail: 'customer@example.com',
      customerName: 'Jane Doe',
      businessEmail: 'business@example.com',
      businessName: 'Local Coffee Shop',
      orderId: 'order-123',
      items: [
        { name: 'Latte', quantity: 2, price: 4.5 },
        { name: 'Croissant', quantity: 1, price: 3.0 },
      ],
      total: 12.0,
      deliveryMethod: 'pickup' as const,
    }

    expect(() => validateSchema(orderConfirmationSchema, validData)).not.toThrow()
  })

  it('should reject orders with no items', () => {
    const invalidData = {
      customerEmail: 'customer@example.com',
      customerName: 'Jane Doe',
      businessEmail: 'business@example.com',
      businessName: 'Local Coffee Shop',
      orderId: 'order-123',
      items: [],
      total: 0,
      deliveryMethod: 'pickup' as const,
    }

    expect(() => validateSchema(orderConfirmationSchema, invalidData)).toThrow(
      /At least one item is required/
    )
  })

  it('should reject negative item quantities', () => {
    const invalidData = {
      customerEmail: 'customer@example.com',
      customerName: 'Jane Doe',
      businessEmail: 'business@example.com',
      businessName: 'Local Coffee Shop',
      orderId: 'order-123',
      items: [{ name: 'Latte', quantity: -1, price: 4.5 }],
      total: -4.5,
      deliveryMethod: 'pickup' as const,
    }

    expect(() => validateSchema(orderConfirmationSchema, invalidData)).toThrow(
      /Quantity must be positive/
    )
  })

  it('should reject invalid delivery methods', () => {
    const invalidData = {
      customerEmail: 'customer@example.com',
      customerName: 'Jane Doe',
      businessEmail: 'business@example.com',
      businessName: 'Local Coffee Shop',
      orderId: 'order-123',
      items: [{ name: 'Latte', quantity: 1, price: 4.5 }],
      total: 4.5,
      deliveryMethod: 'invalid' as any,
    }

    expect(() => validateSchema(orderConfirmationSchema, invalidData)).toThrow()
  })
})

describe('ValidateSchema Helper', () => {
  it('should return typed data on success', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'This is a test message.',
    }

    const result = validateSchema(contactFormSchema, validData)

    expect(result).toEqual(validData)
    expect(result.name).toBe('John Doe')
  })

  it('should throw descriptive error on validation failure', () => {
    const invalidData = {
      name: 'J',
      email: 'invalid-email',
      subject: 'Test',
      message: 'Short',
    }

    expect(() => validateSchema(contactFormSchema, invalidData)).toThrow(/Validation failed/)
  })
})
