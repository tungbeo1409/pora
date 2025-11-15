'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { AppleButton } from './ui/AppleButton'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (typeof window === 'undefined') return
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if already dismissed
    if (sessionStorage.getItem('pwa-install-dismissed')) {
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app was installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstallPrompt(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if dismissed or installed
  if (typeof window === 'undefined' || isInstalled || !showInstallPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null
  }

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-[10000]"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="glass-strong rounded-apple-lg shadow-apple-lg p-4 border border-apple-gray-200 dark:border-apple-gray-800">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-apple bg-apple-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                  <span className="text-white dark:text-black font-bold text-lg">V</span>
                </div>
                <div>
                  <h3 className="font-semibold text-apple-primary">Cài đặt VnSocial</h3>
                  <p className="text-sm text-apple-secondary">Thêm vào màn hình chính để truy cập nhanh hơn</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-apple-secondary" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <AppleButton
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleInstall}
              >
                <Download className="w-4 h-4 mr-2" />
                Cài đặt
              </AppleButton>
              <AppleButton
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                Bỏ qua
              </AppleButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

