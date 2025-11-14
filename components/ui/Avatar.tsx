'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'
import Image from 'next/image'
import { useState } from 'react'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  online?: boolean
}

export function Avatar({ src, alt = 'Avatar', size = 'md', className, online }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  }

  // Loại bỏ các border classes từ className để tránh conflict
  const cleanClassName = className?.replace(/\bborder-\d+\b/g, '').replace(/\bborder-\w+\b/g, '').trim() || ''
  
  return (
    <div className={clsx('relative inline-block', cleanClassName)}>
      <motion.div
        className={clsx(
          'overflow-hidden',
          'bg-apple-gray-100 dark:bg-apple-gray-800',
          sizes[size],
          'border-2 border-apple-gray-200 dark:border-apple-gray-800'
        )}
        style={{
          borderRadius: '50%',
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {src && !imgError ? (
          <Image
            src={src}
            alt={alt}
            width={sizeMap[size]}
            height={sizeMap[size]}
            className="w-full h-full object-cover"
            style={{
              borderRadius: '50%',
            }}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-apple-tertiary"
            style={{
              borderRadius: '50%',
            }}
          >
            <span className="text-lg font-medium">
              {alt.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </motion.div>
      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black z-10" />
      )}
    </div>
  )
}

