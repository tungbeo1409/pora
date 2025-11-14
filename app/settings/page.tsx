'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { AppleCard } from '@/components/ui/AppleCard'
import { AppleInput } from '@/components/ui/AppleInput'
import { AppleButton } from '@/components/ui/AppleButton'
import { ChevronRight, Bell, Lock, Shield, Palette, Globe, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { useState } from 'react'

const settingsSections = [
  {
    title: 'Tài khoản',
    icon: User,
    items: [
      { label: 'Thông tin cá nhân', href: '/settings/profile' },
      { label: 'Bảo mật', href: '/settings/security' },
      { label: 'Quyền riêng tư', href: '/settings/privacy' },
    ],
  },
  {
    title: 'Thông báo',
    icon: Bell,
    items: [
      { label: 'Thông báo đẩy', href: '/settings/notifications' },
      { label: 'Email', href: '/settings/email' },
      { label: 'Tin nhắn', href: '/settings/messages' },
    ],
  },
  {
    title: 'Bảo mật',
    icon: Shield,
    items: [
      { label: 'Mật khẩu', href: '/settings/password' },
      { label: 'Xác thực hai yếu tố', href: '/settings/2fa' },
      { label: 'Hoạt động đăng nhập', href: '/settings/activity' },
    ],
  },
  {
    title: 'Giao diện',
    icon: Palette,
    items: [
      { label: 'Chủ đề', href: '/settings/theme' },
      { label: 'Ngôn ngữ', href: '/settings/language' },
      { label: 'Kích thước chữ', href: '/settings/font' },
    ],
  },
  {
    title: 'Khác',
    icon: Globe,
    items: [
      { label: 'Trợ giúp', href: '/settings/help' },
      { label: 'Về chúng tôi', href: '/settings/about' },
      { label: 'Đăng xuất', href: '/logout', danger: true },
    ],
  },
]

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)

  return (
    <GlobalLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <AppleCard className="p-6 mb-6">
            <h1 className="text-3xl font-bold text-apple-primary mb-2">Cài đặt</h1>
            <p className="text-apple-secondary">Quản lý tài khoản và tùy chọn của bạn</p>
          </AppleCard>
        </motion.div>

        <div className="space-y-6">
          {settingsSections.map((section, sectionIndex) => {
            const Icon = section.icon
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: sectionIndex * 0.1 }}
              >
                <AppleCard className="p-0 overflow-hidden">
                  <div className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-apple-secondary" />
                      <h2 className="font-semibold text-apple-primary">{section.title}</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-800">
                    {section.items.map((item, itemIndex) => (
                      <motion.a
                        key={item.label}
                        href={item.href}
                        className={`flex items-center justify-between p-4 transition-colors ${
                          item.danger
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                            : 'text-apple-primary hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900'
                        }`}
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <span className="font-medium">{item.label}</span>
                        <ChevronRight className="w-5 h-5 text-apple-tertiary" />
                      </motion.a>
                    ))}
                  </div>
                </AppleCard>
              </motion.div>
            )
          })}

          {/* Quick Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.5 }}
          >
            <AppleCard className="p-6">
              <h2 className="font-semibold text-apple-primary mb-4">Cài đặt nhanh</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-apple-primary">Chế độ tối</p>
                    <p className="text-sm text-apple-secondary">Chuyển đổi giữa chế độ sáng và tối</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="px-4 py-2 rounded-apple bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-primary font-medium hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors"
                  >
                    {theme === 'dark' ? 'Tối' : 'Sáng'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-apple-primary">Thông báo</p>
                    <p className="text-sm text-apple-secondary">Nhận thông báo từ ứng dụng</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-apple-gray-200 dark:bg-apple-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-apple-gray-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-apple-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-apple-primary">Thông báo email</p>
                    <p className="text-sm text-apple-secondary">Nhận thông báo qua email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-apple-gray-200 dark:bg-apple-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-apple-gray-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-apple-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>
            </AppleCard>
          </motion.div>
        </div>
      </div>
    </GlobalLayout>
  )
}

