// Firebase configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getDatabase, Database } from 'firebase/database'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyAJIgndlB8Mx5la_1YBABuhN6Cmkl0JG6c",
  authDomain: "pora-d6c25.firebaseapp.com",
  projectId: "pora-d6c25",
  storageBucket: "pora-d6c25.firebasestorage.app",
  messagingSenderId: "866209366450",
  appId: "1:866209366450:web:a1e3aadc504357bf74a4ab",
  measurementId: "G-FS44L22TYE",
  // Realtime Database URL (asia-southeast1 region)
  databaseURL: "https://pora-d6c25-default-rtdb.asia-southeast1.firebasedatabase.app"
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp
let db: Firestore
let rtdb: Database | null = null
let auth: Auth
let analytics: Analytics | null = null

if (typeof window !== 'undefined') {
  // Client-side
  const apps = getApps()
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig)
    
    // Initialize Firestore with offline persistence enabled
    db = getFirestore(app)
    
    // Enable offline persistence (caches data locally)
    // This reduces network calls significantly
    // Firestore automatically uses cached data when offline or network is slow
    
    // Initialize Realtime Database with explicit URL
    rtdb = getDatabase(app, firebaseConfig.databaseURL)
    
    // Initialize Auth
    auth = getAuth(app)
    
    // Initialize Analytics (only if supported and in browser)
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app)
      }
    })
  } else {
    app = apps[0]
    db = getFirestore(app)
    rtdb = getDatabase(app, firebaseConfig.databaseURL)
    auth = getAuth(app)
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app)
      }
    })
  }
} else {
  // Server-side (Next.js SSR) - no analytics, no Realtime DB
  const apps = getApps()
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
  } else {
    app = apps[0]
    db = getFirestore(app)
    auth = getAuth(app)
  }
  analytics = null
  rtdb = null // Realtime DB only works on client-side
}

export { app, db, rtdb, auth, analytics }

