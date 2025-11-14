'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Home, User, Users, Heart, Bookmark, Settings, TrendingUp, X, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import clsx from 'clsx'
import { useState } from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { icon: Home, label: 'Trang chủ', href: '/' },
  { icon: User, label: 'Hồ sơ', href: '/profile' },
  { icon: Users, label: 'Bạn bè', href: '/friends' },
  { icon: Heart, label: 'Yêu thích', href: '/favorites' },
  { icon: Bookmark, label: 'Đã lưu', href: '/saved' },
  { icon: TrendingUp, label: 'Xu hướng', href: '/trending' },
  { icon: Settings, label: 'Cài đặt', href: '/settings' },
]

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[9999] glass-strong rounded-t-apple-lg shadow-apple-lg border-t border-apple-gray-200 dark:border-apple-gray-800"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                <h2 className="text-xl font-semibold text-apple-primary">Menu</h2>
                <motion.button
                  className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                >
                  <X className="w-5 h-5 text-apple-secondary" />
                </motion.button>
              </div>

              {/* Menu Items */}
              <nav className="space-y-1">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}>
                      <motion.div
                        className={clsx(
                          'flex items-center space-x-3 px-4 py-3 rounded-apple transition-all duration-200',
                          isActive
                            ? 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white'
                            : 'text-apple-secondary hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900'
                        )}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.05 }}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  )
                })}
              </nav>

              {/* Theme Toggle */}
              <div className="mt-4 pt-4 border-t border-apple-gray-200 dark:border-apple-gray-800">
                <motion.button
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-apple text-apple-secondary hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900 transition-colors"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

