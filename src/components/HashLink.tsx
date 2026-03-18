'use client'
// This is so you can have a link that can both change page and go to an ID - used in global elements like Navbar and Footer.

import { useRouter, usePathname } from 'next/navigation'

export function HashLink({ href, ...props }) {
  const router = useRouter()
  const pathname = usePathname()
  const [path, hash] = href.split('#')

  const handleClick = (e) => {
    e.preventDefault()
    if (pathname === (path || '/')) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push(href)
    }
  }

  return <a href={href} onClick={handleClick} {...props} />
}