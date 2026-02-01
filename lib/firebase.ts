import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let app: App | undefined
let firestore: Firestore | undefined

// Initialize Firebase Admin SDK
function initializeFirebase(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error(
      'Missing Firebase configuration. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables.'
    )
  }

  return initializeApp({
    credential: cert({
      projectId,
      privateKey,
      clientEmail,
    }),
  })
}

// Get Firebase App instance 
export function getFirebaseApp(): App {
  if (!app) {
    app = initializeFirebase()
  }
  return app
}

// Get Firestore instance
export function getFirestoreInstance(): Firestore {
  if (!firestore) {
    const firebaseApp = getFirebaseApp()
    firestore = getFirestore(firebaseApp)
  }
  return firestore
}
