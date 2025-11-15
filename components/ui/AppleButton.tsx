'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface AppleButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function AppleButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
}: AppleButtonProps) {
  const baseStyles = 'font-medium rounded-apple transition-all duration-200'
  
  const variants = {
    primary: 'bg-apple-gray-900 dark:bg-white text-white dark:text-black hover:opacity-90',
    secondary: 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700',
    ghost: 'bg-transparent hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 text-apple-gray-900 dark:text-white',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <motion.button
      type={type}
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.button>
  )
}

