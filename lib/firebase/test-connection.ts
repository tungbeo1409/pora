/**
 * Test Firebase connection
 * Chạy file này để kiểm tra kết nối Firebase
 */

import { db } from './config'
import { collection, getDocs } from 'firebase/firestore'

/**
 * Test Firestore connection
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    console.log('Testing Firestore connection...')
    
    // Thử đọc một collection (sẽ không lỗi nếu collection chưa tồn tại)
    const testCollection = collection(db, '_test')
    await getDocs(testCollection)
    
    console.log('✅ Firestore connected successfully!')
    return true
  } catch (error) {
    console.error('❌ Firestore connection failed:', error)
    return false
  }
}

/**
 * Test Auth connection
 */
export async function testAuthConnection(): Promise<boolean> {
  try {
    const { auth } = await import('./config')
    
    console.log('Testing Auth connection...')
    console.log('✅ Auth initialized:', auth.app.name)
    return true
  } catch (error) {
    console.error('❌ Auth connection failed:', error)
    return false
  }
}

/**
 * Run all tests
 */
export async function testFirebaseConnection(): Promise<void> {
  console.log('🔥 Firebase Connection Test\n')
  
  const firestoreOk = await testFirestoreConnection()
  const authOk = await testAuthConnection()
  
  console.log('\n📊 Test Results:')
  console.log(`  Firestore: ${firestoreOk ? '✅ OK' : '❌ FAILED'}`)
  console.log(`  Auth: ${authOk ? '✅ OK' : '❌ FAILED'}`)
  
  if (firestoreOk && authOk) {
    console.log('\n🎉 All tests passed! Firebase is ready to use.')
  } else {
    console.log('\n⚠️ Some tests failed. Please check your Firebase configuration.')
  }
}

// Auto-run if imported directly
if (typeof window !== 'undefined') {
  // Client-side: uncomment to test
  // testFirebaseConnection()
}

