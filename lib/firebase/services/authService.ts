/**
 * Authentication Service
 * Handles user authentication with Firebase Auth
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  UserCredential,
  onAuthStateChanged,
  AuthError,
} from 'firebase/auth'
import { auth } from '../config'
import { userService } from './userService'

export interface SignUpData {
  name: string
  email: string
  password: string
  username: string
}

export interface SignInData {
  emailOrUsername: string // Can be email or username
  password: string
}

export class AuthService {
  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpData): Promise<UserCredential> {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )

      // Update display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.name,
        })

        // Create user document in Firestore
        await userService.create(userCredential.user.uid, {
          name: data.name,
          username: data.username,
          email: data.email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
          bio: '',
          followers: 0,
          following: 0,
          posts: 0,
        }, false) // Don't use batch for user creation
      }

      return userCredential
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw this.handleAuthError(error)
    }
  }

  /**
   * Sign in with email/username and password
   * Supports both email and username login
   */
  async signIn(data: SignInData): Promise<UserCredential> {
    try {
      let email = data.emailOrUsername.trim()

      // Check if input is email (contains @) or username
      if (!email.includes('@')) {
        // It's a username, find the user by username
        const user = await userService.getByUsername(email.toLowerCase())
        
        if (!user || !user.email) {
          throw new Error('Không tìm thấy tài khoản với username này.')
        }
        
        email = user.email
      }

      // Sign in with email and password
      return await signInWithEmailAndPassword(auth, email, data.password)
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw this.handleAuthError(error)
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)

      // Create or update user document in Firestore
      if (userCredential.user) {
        const existingUser = await userService.getById(userCredential.user.uid, false)
        
        if (!existingUser) {
          // New user - create document
          const username = userCredential.user.email?.split('@')[0] || `user_${Date.now()}`
          await userService.create(userCredential.user.uid, {
            name: userCredential.user.displayName || 'User',
            username: username,
            email: userCredential.user.email || '',
            avatar: userCredential.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userCredential.user.displayName || 'User')}&background=random`,
            bio: '',
            followers: 0,
            following: 0,
            posts: 0,
          }, false) // Don't use batch for user creation
        } else {
          // Existing user - update last login
          await userService.update(userCredential.user.uid, {
            updatedAt: new Date(),
          }, false)
        }
      }

      return userCredential
    } catch (error: any) {
      console.error('Google sign in error:', error)
      throw this.handleAuthError(error)
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth)
      // Clear cache on sign out
      const { firebaseCache } = await import('../utils/cache')
      firebaseCache.clear()
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw this.handleAuthError(error)
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error('Password reset error:', error)
      throw this.handleAuthError(error)
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  }

  /**
   * Handle auth errors and convert to user-friendly messages
   */
  private handleAuthError(error: AuthError): Error {
    let message = 'Đã xảy ra lỗi. Vui lòng thử lại.'

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Email này đã được sử dụng.'
        break
      case 'auth/invalid-email':
        message = 'Email không hợp lệ.'
        break
      case 'auth/operation-not-allowed':
        message = 'Phương thức đăng nhập không được phép.'
        break
      case 'auth/weak-password':
        message = 'Mật khẩu quá yếu. Vui lòng sử dụng ít nhất 6 ký tự.'
        break
      case 'auth/user-disabled':
        message = 'Tài khoản này đã bị vô hiệu hóa.'
        break
      case 'auth/user-not-found':
        message = 'Không tìm thấy tài khoản với email này.'
        break
      case 'auth/wrong-password':
        message = 'Mật khẩu không chính xác.'
        break
      case 'auth/invalid-credential':
        message = 'Email hoặc mật khẩu không chính xác.'
        break
      case 'auth/too-many-requests':
        message = 'Quá nhiều lần thử. Vui lòng thử lại sau.'
        break
      case 'auth/network-request-failed':
        message = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối.'
        break
      case 'auth/popup-closed-by-user':
        message = 'Đăng nhập đã bị hủy.'
        break
      default:
        message = error.message || message
    }

    return new Error(message)
  }
}

export const authService = new AuthService()

