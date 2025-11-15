'use client'

import { motion } from 'framer-motion'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleInput } from '@/components/ui/AppleInput'
import { AppleCard } from '@/components/ui/AppleCard'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { getBasePath } from '@/lib/getBasePath'

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [mounted, setMounted] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp')
      return
    }
    // Simulate password reset
    setPasswordReset(true)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-apple-gray-50 to-apple-gray-100 dark:from-black dark:to-apple-gray-900">
        <div className="w-full max-w-md">
          <AppleCard className="p-8">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-apple-lg overflow-hidden">
                <img src={`${getBasePath()}/icon-512x512.png`} alt="Pora" className="w-full h-full object-cover" />
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

          {!passwordReset ? (
            <>
              <h1 className="text-3xl font-bold text-apple-primary text-center mb-2">
                Đặt lại mật khẩu
              </h1>
              <p className="text-apple-secondary text-center mb-8">
                Nhập mật khẩu mới của bạn
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AppleInput
                  type="password"
                  label="Mật khẩu mới"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <AppleInput
                  type="password"
                  label="Xác nhận mật khẩu"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />

                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-500">Mật khẩu xác nhận không khớp</p>
                )}

                <AppleButton type="submit" className="w-full mt-6">
                  Đặt lại mật khẩu
                </AppleButton>

                <div className="text-center mt-4">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center space-x-2 text-sm text-blue-500 hover:underline transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại đăng nhập</span>
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-apple-primary mb-2">
                Mật khẩu đã được đặt lại!
              </h2>
              <p className="text-apple-secondary mb-6">
                Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <Link href="/login">
                <AppleButton className="w-full">
                  Đăng nhập ngay
                </AppleButton>
              </Link>
            </motion.div>
          )}
        </AppleCard>
      </motion.div>
    </div>
  )
}

