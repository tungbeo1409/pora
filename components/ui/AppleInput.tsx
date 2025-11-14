'use client'

import { motion } from 'framer-motion'
import { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface AppleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function AppleInput({ label, error, className, ...props }: AppleInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-apple-secondary mb-2">
          {label}
        </label>
      )}
      <motion.input
        className={clsx(
          'w-full px-4 py-3 rounded-apple',
          'bg-apple-gray-50 dark:bg-apple-gray-900',
          'border border-apple-gray-200 dark:border-apple-gray-800',
          'text-apple-primary placeholder:text-apple-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600',
          'focus:border-transparent',
          'transition-all duration-200',
          error && 'border-red-500 dark:border-red-500',
          className
        )}
        whileFocus={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

