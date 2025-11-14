'use client'

import { motion } from 'framer-motion'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleInput } from '@/components/ui/AppleInput'
import { AppleCard } from '@/components/ui/AppleCard'
import Link from 'next/link'
import { useState } from 'react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-apple-gray-50 to-apple-gray-100 dark:from-black dark:to-apple-gray-900">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <AppleCard className="p-8">
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <div className="w-16 h-16 rounded-apple-lg bg-apple-gray-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-2xl">V</span>
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold text-apple-primary text-center mb-2">
            Tạo tài khoản
          </h1>
          <p className="text-apple-secondary text-center mb-8">
            Tham gia cùng chúng tôi ngay hôm nay
          </p>

          <div className="space-y-4">
            <AppleInput
              type="text"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <AppleInput
              type="email"
              label="Email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <AppleInput
              type="password"
              label="Mật khẩu"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <AppleInput
              type="password"
              label="Xác nhận mật khẩu"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

            <label className="flex items-start space-x-2">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-apple-gray-300 text-apple-gray-900 focus:ring-apple-gray-400"
              />
              <span className="text-sm text-apple-secondary">
                Tôi đồng ý với{' '}
                <Link href="/terms" className="text-apple-gray-900 dark:text-apple-gray-100 hover:underline">
                  Điều khoản dịch vụ
                </Link>{' '}
                và{' '}
                <Link href="/privacy" className="text-apple-gray-900 dark:text-apple-gray-100 hover:underline">
                  Chính sách bảo mật
                </Link>
              </span>
            </label>

            <AppleButton className="w-full mt-6" onClick={() => {}}>
              Đăng ký
            </AppleButton>

            <div className="text-center">
              <p className="text-sm text-apple-secondary">
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-apple-gray-900 dark:text-apple-gray-100 font-medium hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </AppleCard>
      </motion.div>
    </div>
  )
}

