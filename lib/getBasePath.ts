// Helper function to get base path for assets
export function getBasePath(): string {
  if (typeof window === 'undefined') {
    // Server-side: check environment
    return process.env.NODE_ENV === 'production' ? '/pora' : ''
  }
  
  // Client-side: detect from current pathname
  // If pathname starts with /pora, basePath is /pora
  if (window.location.pathname.startsWith('/pora')) {
    return '/pora'
  }
  
  return ''
}

