import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { PWAInstaller } from '@/components/PWAInstaller'
import { FaviconReloader } from '@/components/FaviconReloader'

// Base path cho production, empty cho development
const basePath = process.env.NODE_ENV === 'production' ? '/pora' : ''

export const metadata: Metadata = {
  title: 'Pora',
  description: 'Mạng xã hội với thiết kế tối giản, sang trọng',
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pora',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: `${basePath}/icon-192x192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${basePath}/icon-512x512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: `${basePath}/icon-192x192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${basePath}/icon-512x512.png`, sizes: '512x512', type: 'image/png' },
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
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Favicon - đặt trước để browser ưu tiên */}
        <link rel="shortcut icon" href={`${basePath}/icon-192x192.png`} type="image/png" />
        <link rel="icon" href={`${basePath}/icon-192x192.png`} type="image/png" />
        <link rel="icon" type="image/png" sizes="16x16" href={`${basePath}/icon-192x192.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${basePath}/icon-192x192.png`} />
        <link rel="icon" type="image/png" sizes="96x96" href={`${basePath}/icon-192x192.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${basePath}/icon-192x192.png`} />
        <link rel="icon" type="image/png" sizes="512x512" href={`${basePath}/icon-512x512.png`} />
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href={`${basePath}/icon-192x192.png`} />
        <link rel="apple-touch-icon" sizes="192x192" href={`${basePath}/icon-192x192.png`} />
        <link rel="apple-touch-icon" sizes="512x512" href={`${basePath}/icon-512x512.png`} />
        {/* Script để reload favicon và redirect trong development mode */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  if (typeof window === 'undefined') return;
                  
                  // Reload favicon với timestamp
                  const timestamp = Date.now();
                  const updateFavicon = () => {
                    const links = document.querySelectorAll('link[rel*="icon"]');
                    links.forEach(link => {
                      const href = link.getAttribute('href');
                      if (href && !href.includes('?')) {
                        link.setAttribute('href', href + '?v=' + timestamp);
                      }
                    });
                  };
                  updateFavicon();
                  // Update lại mỗi khi page load trong dev mode
                  if (window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1')) {
                    window.addEventListener('load', updateFavicon);
                  }
                })();
              `,
            }}
          />
        )}
      </head>
      <body suppressHydrationWarning>
        <FaviconReloader />
        <ThemeProvider>
          <ServiceWorkerRegister />
          {children}
          <PWAInstaller />
        </ThemeProvider>
      </body>
    </html>
  )
}

