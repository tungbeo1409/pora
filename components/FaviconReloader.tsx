'use client'

import { useEffect } from 'react'

export function FaviconReloader() {
  useEffect(() => {
    // Chỉ chạy trong development mode
    if (process.env.NODE_ENV !== 'development') return

    const reloadFavicon = () => {
      const timestamp = Date.now()
      const links = document.querySelectorAll('link[rel*="icon"]')
      
      links.forEach((link) => {
        const href = link.getAttribute('href')
        if (href) {
          // Loại bỏ query params cũ và thêm timestamp mới
          const baseHref = href.split('?')[0]
          link.setAttribute('href', `${baseHref}?v=${timestamp}`)
        }
      })
    }

    // Reload ngay khi component mount
    reloadFavicon()

    // Reload lại mỗi khi có hot reload (Next.js sẽ trigger này)
    if (typeof window !== 'undefined' && (window as any).__NEXT_HOT_RELOAD__) {
      const interval = setInterval(() => {
        reloadFavicon()
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [])

  return null // Component này không render gì
}

