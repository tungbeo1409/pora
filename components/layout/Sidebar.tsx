'use client'

import { motion } from 'framer-motion'
import { Home, User, Users, Heart, Bookmark, Settings, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const menuItems = [
  { icon: Home, label: 'Trang chủ', href: '/' },
  { icon: User, label: 'Hồ sơ', href: '/profile' },
  { icon: Users, label: 'Bạn bè', href: '/friends' },
  { icon: Heart, label: 'Yêu thích', href: '/favorites' },
  { icon: Bookmark, label: 'Đã lưu', href: '/saved' },
  { icon: TrendingUp, label: 'Xu hướng', href: '/trending' },
  { icon: Settings, label: 'Cài đặt', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <motion.aside
      className="hidden lg:block fixed left-4 top-20 w-64"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
    >
      <div className="glass rounded-apple-lg shadow-apple-lg p-4">
        <nav className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href} prefetch={true}>
                <div
                  className={clsx(
                    'flex items-center space-x-3 px-4 py-3 rounded-apple transition-all duration-200',
                    isActive
                      ? 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white'
                      : 'text-apple-secondary hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
    </motion.aside>
  )
}

