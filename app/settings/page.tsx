'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppleCard } from '@/components/ui/AppleCard'
import { AppleInput } from '@/components/ui/AppleInput'
import { AppleButton } from '@/components/ui/AppleButton'
import { ChevronRight, Bell, Lock, Shield, Palette, Globe, User } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/firebase/services/authService'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
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
        { label: 'Đăng xuất', onClick: handleLogout, danger: true },
      ],
    },
  ]

  return (
    <ProtectedRoute>
      <GlobalLayout>
      <div className="max-w-4xl mx-auto">
        <div>
          <AppleCard className="p-6 mb-6">
            <h1 className="text-3xl font-bold text-apple-primary mb-2">Cài đặt</h1>
            <p className="text-apple-secondary">Quản lý tài khoản và tùy chọn của bạn</p>
          </AppleCard>
        </div>

        <div className="space-y-6">
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.title}>
                <AppleCard className="p-0 overflow-hidden">
                  <div className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-apple-secondary" />
                      <h2 className="font-semibold text-apple-primary">{section.title}</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-800">
                    {section.items.map((item) => {
                      const isLink = 'href' in item
                      const Component = isLink ? 'a' : 'button'
                      const props = isLink 
                        ? { href: item.href } 
                        : { onClick: item.onClick, type: 'button' as const }
                      
                      return (
                        <Component
                          key={item.label}
                          {...props}
                          className={`w-full flex items-center justify-between p-4 transition-colors ${
                            item.danger
                              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                              : 'text-apple-primary hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900'
                          }`}
                        >
                          <span className="font-medium">{item.label}</span>
                          {isLink && <ChevronRight className="w-5 h-5 text-apple-tertiary" />}
                        </Component>
                      )
                    })}
                  </div>
                </AppleCard>
              </div>
            )
          })}

          {/* Quick Settings */}
          <div>
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
          </div>
        </div>
      </div>
      </GlobalLayout>
    </ProtectedRoute>
  )
}

