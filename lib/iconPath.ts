/**
 * Get icon path with basePath support
 * In production with basePath, automatically adds /pora prefix
 * In development, returns path without prefix
 */
export function getIconPath(path: string): string {
  if (typeof window === 'undefined') {
    // Server-side: use basePath from environment
    const basePath = process.env.NODE_ENV === 'production' ? '/pora' : ''
    return `${basePath}${path}`
  }
  
  // Client-side: detect basePath from current path
  // If pathname starts with /pora, we're in production mode
  const isProduction = window.location.pathname.startsWith('/pora')
  const basePath = isProduction ? '/pora' : ''
  
  return `${basePath}${path}`
}

