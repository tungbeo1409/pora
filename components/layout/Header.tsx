'use client'

import { motion } from 'framer-motion'
import { Search, Bell, MessageCircle, Home, User, Settings, Moon, Sun, MoreVertical, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { MessageDropdown } from '@/components/messages/MessageDropdown'
import type { Message } from '@/contexts/MessageContext'
import { Dropdown } from '@/components/ui/Dropdown'
import { useState } from 'react'
import { getIconPath } from '@/lib/iconPath'
import { authService } from '@/lib/firebase/services/authService'

interface HeaderProps {
  onOpenChat?: (message: Message) => void
}

export function Header({ onOpenChat }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authService.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect to login even if error
      router.push('/login')
    }
  }

  return (
    <motion.header
      className="sticky top-0 z-50 glass-strong border-b border-apple-gray-200/50 dark:border-apple-gray-800/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" suppressHydrationWarning>
            <div className="w-8 h-8 rounded-apple overflow-hidden transition-opacity hover:opacity-90" suppressHydrationWarning>
              <img src={getIconPath('/icon-192x192.png')} alt="Pora" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-semibold text-apple-primary hidden sm:block">
              Pora
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-apple-tertiary" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 transition-all duration-200"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <button
                className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors duration-200"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-apple-secondary" />
                ) : (
                  <Moon className="w-5 h-5 text-apple-secondary" />
                )}
              </button>

              <Link href="/" suppressHydrationWarning>
                <button className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors duration-200">
                  <Home className="w-5 h-5 text-apple-secondary" />
                </button>
              </Link>

              <MessageDropdown onOpenChat={onOpenChat} />

              <NotificationDropdown />

              <Link href="/profile" suppressHydrationWarning>
                <Avatar src="" size="sm" />
              </Link>

              <Dropdown
                items={[
                  {
                    label: 'Cài đặt',
                    icon: <Settings className="w-4 h-4" />,
                    onClick: () => (window.location.href = '/settings'),
                  },
                  {
                    label: 'Hồ sơ',
                    icon: <User className="w-4 h-4" />,
                    onClick: () => (window.location.href = '/profile'),
                  },
                  {
                    label: 'Đăng xuất',
                    icon: <X className="w-4 h-4" />,
                    onClick: handleLogout,
                    danger: true,
                  },
                ]}
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                position="auto"
              >
                <button
                  className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors duration-200"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <MoreVertical className="w-5 h-5 text-apple-secondary" />
                </button>
              </Dropdown>
            </div>

            {/* Mobile Actions - Only show important ones */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors duration-200"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-apple-secondary" />
                ) : (
                  <Moon className="w-5 h-5 text-apple-secondary" />
                )}
              </button>
              <MessageDropdown onOpenChat={onOpenChat} />
              <NotificationDropdown />
              <Link href="/profile" suppressHydrationWarning>
                <Avatar src="" size="sm" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

