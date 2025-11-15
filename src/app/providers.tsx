'use client'

import { AuthProvider } from '@/lib/firebase/auth-context'
import { CartProvider } from '@/lib/cart-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )
}
