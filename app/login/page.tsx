'use client'

import { motion } from 'framer-motion'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleInput } from '@/components/ui/AppleInput'
import { AppleCard } from '@/components/ui/AppleCard'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-apple-gray-50 to-apple-gray-100 dark:from-black dark:to-apple-gray-900">
        <div className="w-full max-w-md">
          <AppleCard className="p-8">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-apple-lg overflow-hidden">
                <img src="/icon-512x512.png" alt="Pora" className="w-full h-full object-cover" />
              </div>
            </div>
          </AppleCard>
        </div>
      </div>
    )
  }

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
            <div className="w-16 h-16 rounded-apple-lg overflow-hidden">
              <img src="/icon-512x512.png" alt="PORA" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold text-apple-primary text-center mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-apple-secondary text-center mb-8">
            Đăng nhập để tiếp tục
          </p>

          <div className="space-y-4">
            <AppleInput
              type="email"
              label="Email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AppleInput
              type="password"
              label="Mật khẩu"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-apple-gray-300 dark:border-apple-gray-700 text-apple-gray-900 dark:text-white bg-white dark:bg-apple-gray-800 focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 transition-colors"
                />
                <span className="text-sm text-apple-secondary">Ghi nhớ đăng nhập</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <AppleButton className="w-full mt-6" onClick={() => {}}>
              Đăng nhập
            </AppleButton>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-apple-gray-200 dark:border-apple-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-black text-apple-tertiary">hoặc</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-apple-secondary">
                Chưa có tài khoản?{' '}
                <Link href="/signup" className="text-blue-500 font-medium hover:underline transition-colors">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </AppleCard>
      </motion.div>
    </div>
  )
}

