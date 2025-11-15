/**
 * Auth hook for managing authentication state
 */

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { authService } from '../services/authService'
import { chatService } from '../services/chatService'

interface UseAuthResult {
  user: User | null
  loading: boolean
  error: Error | null
}

/**
 * Hook to get current authentication state
 * Uses realtime listener for automatic updates
 * Also manages online status in Realtime Database
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Set initial loading state
    setLoading(true)

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged(
      async (user) => {
        try {
          setUser(user)
          setLoading(false)
          setError(null)

          // Update online status when user logs in
          if (user?.uid) {
            try {
              await chatService.setOnlineStatus(user.uid, true)
            } catch (err) {
              console.error('Error setting online status:', err)
            }

            // Update last seen periodically (heartbeat every 30 seconds)
            const heartbeatInterval = setInterval(() => {
              chatService.updateLastSeen(user.uid).catch(console.error)
            }, 30000) // Update every 30 seconds

            // Set offline when page unloads
            const handleBeforeUnload = async () => {
              try {
                clearInterval(heartbeatInterval)
                await chatService.setOnlineStatus(user.uid, false)
              } catch (err) {
                console.error('Error setting offline status:', err)
              }
            }

            window.addEventListener('beforeunload', handleBeforeUnload)

            // Cleanup listener
            return () => {
              clearInterval(heartbeatInterval)
              window.removeEventListener('beforeunload', handleBeforeUnload)
              // Set offline on unmount
              chatService.setOnlineStatus(user.uid, false).catch(console.error)
            }
          }
        } catch (err) {
          setError(err as Error)
          setLoading(false)
        }
      }
    )

    // Cleanup subscription
    return () => {
      unsubscribe()
      // Set offline when auth changes
      if (user?.uid) {
        chatService.setOnlineStatus(user.uid, false).catch(console.error)
      }
    }
  }, [])

  return { user, loading, error }
}

