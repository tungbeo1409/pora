'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share2 } from 'lucide-react'
import { AppleButton } from './ui/AppleButton'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Detect if device is iOS
function isIOS() {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

// Detect if device is Android
function isAndroid() {
  if (typeof window === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

// Detect if device is mobile
function isMobile() {
  if (typeof window === 'undefined') return false
  return isIOS() || isAndroid() || /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop')

  useEffect(() => {
    // Check if already installed
    if (typeof window === 'undefined') return
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect device type
    if (isIOS()) {
      setDeviceType('ios')
    } else if (isAndroid()) {
      setDeviceType('android')
    }

    // Check if already dismissed
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    
    // Listen for beforeinstallprompt event (Chrome/Edge Android & Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Only preventDefault if we want to show our custom prompt
      // Don't prevent default on mobile - let browser show native prompt if available
      if (!isMobile()) {
        e.preventDefault()
      }
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      if (!dismissed) {
        // On desktop, show our custom prompt
        // On mobile, only show if it's iOS (Android will use native prompt)
        if (!isMobile() || isIOS()) {
          setShowInstallPrompt(true)
        }
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app was installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    // Track if beforeinstallprompt has fired
    let promptFired = false
    const handlePromptFired = () => {
      promptFired = true
    }
    window.addEventListener('beforeinstallprompt', handlePromptFired, { once: true })

    // On mobile (iOS or Android without beforeinstallprompt), show install option after delay
    if (isMobile() && !dismissed) {
      // Show after 3 seconds on mobile if no beforeinstallprompt event fired
      const timer = setTimeout(() => {
        setShowInstallPrompt((prev) => {
          // Only show if beforeinstallprompt didn't fire (for iOS or older Android)
          if (!promptFired) {
            return true
          }
          return prev
        })
      }, 3000)

      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('beforeinstallprompt', handlePromptFired)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }

    // On desktop, cleanup listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('beforeinstallprompt', handlePromptFired)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    // For Chrome/Edge Android/Desktop with beforeinstallprompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          setShowInstallPrompt(false)
        }
        
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Error showing install prompt:', error)
        // If prompt fails, show instructions for mobile
        if (isMobile()) {
          setShowInstructions(true)
        }
      }
      return
    }

    // For iOS and other mobile browsers without beforeinstallprompt, show instructions
    if (isMobile()) {
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setShowInstructions(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if installed
  if (typeof window === 'undefined' || isInstalled) {
    return null
  }

  // Show instructions modal
  if (showInstructions) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[10001] flex items-end lg:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        >
          <motion.div
            className="glass-strong rounded-apple-lg shadow-apple-lg p-6 w-full max-w-md"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-apple-primary">Cài đặt Pora</h3>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-apple-secondary" />
              </button>
            </div>

            {deviceType === 'ios' ? (
              <div className="space-y-4">
                <p className="text-apple-secondary">Để cài đặt trên iPhone/iPad:</p>
                <ol className="list-decimal list-inside space-y-2 text-apple-primary">
                  <li>Nhấn vào nút <Share2 className="w-4 h-4 inline mx-1" /> <strong>Share</strong> ở dưới cùng màn hình</li>
                  <li>Cuộn xuống và chọn <strong>"Thêm vào Màn hình chủ"</strong> hoặc <strong>"Add to Home Screen"</strong></li>
                  <li>Nhấn <strong>"Thêm"</strong> để xác nhận</li>
                </ol>
                <div className="pt-4 border-t border-apple-gray-200 dark:border-apple-gray-800">
                  <AppleButton onClick={handleDismiss} className="w-full">
                    Đã hiểu
                  </AppleButton>
                </div>
              </div>
            ) : deviceType === 'android' ? (
              <div className="space-y-4">
                <p className="text-apple-secondary">Để cài đặt trên Android:</p>
                <ol className="list-decimal list-inside space-y-2 text-apple-primary">
                  <li>Nhấn vào menu <strong>⋮</strong> (3 chấm) ở góc trên bên phải</li>
                  <li>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Install app"</strong></li>
                  <li>Nhấn <strong>"Cài đặt"</strong> để xác nhận</li>
                </ol>
                <div className="pt-4 border-t border-apple-gray-200 dark:border-apple-gray-800">
                  <AppleButton onClick={handleDismiss} className="w-full">
                    Đã hiểu
                  </AppleButton>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Don't show prompt if dismissed
  if (!showInstallPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
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
                <div className="w-12 h-12 rounded-apple overflow-hidden flex-shrink-0">
                  <img src="/icon-192x192.png" alt="Pora" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold text-apple-primary">Cài đặt Pora</h3>
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
            <div className="flex items-center gap-2">
              <AppleButton
                variant="primary"
                size="sm"
                className="flex-1 flex items-center justify-center"
                onClick={handleInstall}
              >
                {deviceType === 'ios' ? (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Hướng dẫn cài đặt
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Cài đặt
                  </>
                )}
              </AppleButton>
              <AppleButton
                variant="ghost"
                size="sm"
                className="flex items-center justify-center"
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

