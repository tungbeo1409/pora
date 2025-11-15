'use client'

import { motion } from 'framer-motion'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleInput } from '@/components/ui/AppleInput'
import { AppleCard } from '@/components/ui/AppleCard'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { getIconPath } from '@/lib/iconPath'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [mounted, setMounted] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate sending email
    setEmailSent(true)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-apple-gray-50 to-apple-gray-100 dark:from-black dark:to-apple-gray-900">
        <div className="w-full max-w-md">
          <AppleCard className="p-8">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-apple-lg overflow-hidden">
                <img src={getIconPath('/icon-512x512.png')} alt="Pora" className="w-full h-full object-cover" />
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

          {!emailSent ? (
            <>
              <h1 className="text-3xl font-bold text-apple-primary text-center mb-2">
                Quên mật khẩu?
              </h1>
              <p className="text-apple-secondary text-center mb-8">
                Nhập email của bạn để nhận liên kết đặt lại mật khẩu
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AppleInput
                  type="email"
                  label="Email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <AppleButton type="submit" className="w-full mt-6">
                  Gửi liên kết đặt lại
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
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-apple-primary mb-2">
                Email đã được gửi!
              </h2>
              <p className="text-apple-secondary mb-6">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư của bạn.
              </p>
              <div className="space-y-3">
                <AppleButton 
                  className="w-full" 
                  onClick={() => setEmailSent(false)}
                  variant="secondary"
                >
                  Gửi lại email
                </AppleButton>
                <Link 
                  href="/login" 
                  className="block text-center text-sm text-blue-500 hover:underline transition-colors"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </motion.div>
          )}
        </AppleCard>
      </motion.div>
    </div>
  )
}

