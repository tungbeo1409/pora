'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface AppleCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function AppleCard({ children, className, onClick, hover = false }: AppleCardProps) {
  return (
    <motion.div
      className={clsx(
        'glass rounded-apple-lg shadow-apple',
        'border border-apple-gray-200/50 dark:border-apple-gray-800/50',
        hover && 'cursor-pointer transition-all duration-200',
        className
      )}
      onClick={onClick}
      whileHover={hover ? { scale: 1.01, y: -1 } : {}}
      whileTap={hover ? { scale: 0.99 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

