'use client'

import { motion } from 'framer-motion'

interface CategoryCardProps {
  name: string
  count: number
}

export default function CategoryCard({ name, count }: CategoryCardProps) {
  return (
    <motion.div
      className="category-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div style={{ fontWeight: 800 }}>{name}</div>
      <div style={{ color: '#444' }}>{count} places</div>
    </motion.div>
  )
}
