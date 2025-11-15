'use client'

import { motion } from 'framer-motion'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleInput } from '@/components/ui/AppleInput'
import { AppleCard } from '@/components/ui/AppleCard'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getIconPath } from '@/lib/iconPath'
import { authService } from '@/lib/firebase/services/authService'
import { useAuth } from '@/lib/firebase/hooks/useAuth'

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

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
                <img src={getIconPath('/icon-512x512.png')} alt="Pora" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold text-apple-primary text-center mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-apple-secondary text-center mb-8">
            Đăng nhập để tiếp tục
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              setLoading(true)

              try {
                await authService.signIn({ emailOrUsername, password })
                router.push('/')
              } catch (err: any) {
                setError(err.message || 'Đăng nhập thất bại')
              } finally {
                setLoading(false)
              }
            }}
            className="space-y-4"
          >
            {error && (
              <div className="p-3 rounded-apple bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <AppleInput
              type="text"
              label="Email hoặc Username"
              placeholder="email@example.com hoặc username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              disabled={loading}
            />
            <AppleInput
              type="password"
              label="Mật khẩu"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-apple-gray-300 dark:border-apple-gray-700 text-apple-gray-900 dark:text-white bg-white dark:bg-apple-gray-800 focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 transition-colors"
                  disabled={loading}
                />
                <span className="text-sm text-apple-secondary">Ghi nhớ đăng nhập</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <AppleButton type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </AppleButton>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-apple-gray-200 dark:border-apple-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-black text-apple-tertiary">hoặc</span>
              </div>
            </div>

            <AppleButton
              type="button"
              variant="secondary"
              className="w-full"
              onClick={async () => {
                setError(null)
                setLoading(true)
                try {
                  await authService.signInWithGoogle()
                  router.push('/')
                } catch (err: any) {
                  setError(err.message || 'Đăng nhập Google thất bại')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Đăng nhập với Google
            </AppleButton>
          </form>

            <div className="text-center">
              <p className="text-sm text-apple-secondary">
                Chưa có tài khoản?{' '}
                <Link href="/signup" className="text-blue-500 font-medium hover:underline transition-colors">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
        </AppleCard>
      </motion.div>
    </div>
  )
}

