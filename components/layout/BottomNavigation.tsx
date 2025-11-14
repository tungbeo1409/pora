'use client'

import { motion } from 'framer-motion'
import { Home, User, Users, Heart, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const menuItems = [
  { icon: Home, label: 'Trang chủ', href: '/' },
  { icon: Heart, label: 'Yêu thích', href: '/favorites' },
  { icon: Users, label: 'Bạn bè', href: '/friends' },
  { icon: User, label: 'Hồ sơ', href: '/profile' },
  { icon: Settings, label: 'Cài đặt', href: '/settings' },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-[9999] lg:hidden glass-strong border-t border-apple-gray-200/50 dark:border-apple-gray-800/50 bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-apple-lg"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
      }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} className="flex-1 max-w-[20%] min-w-0">
              <motion.div
                className={clsx(
                  'flex flex-col items-center justify-center h-full rounded-apple transition-all duration-200 py-1.5',
                  isActive
                    ? 'text-blue-500'
                    : 'text-apple-tertiary'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="relative mb-1">
                  <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive && 'text-blue-500')} />
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <span className={clsx('text-[10px] font-medium truncate w-full text-center px-0.5', isActive && 'text-blue-500')}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}

