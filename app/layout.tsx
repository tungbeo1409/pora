import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { PWAInstaller } from '@/components/PWAInstaller'

export const metadata: Metadata = {
  title: 'VnSocial - Mạng xã hội phong cách Apple',
  description: 'Mạng xã hội với thiết kế tối giản, sang trọng',
  manifest: '/pora/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VnSocial',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/pora/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pora/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/pora/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ServiceWorkerRegister />
          {children}
          <PWAInstaller />
        </ThemeProvider>
      </body>
    </html>
  )
}

