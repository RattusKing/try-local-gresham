  // For Hash Link Reliability

'use client'
import { useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'

export function ScrollHandler() {
  const searchParams = useSearchParams()
  const pathname = usePathname()

useEffect(() => {
  const id = searchParams.get('scrollTo')
  if (id) setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}, [pathname, searchParams])

  return null
}