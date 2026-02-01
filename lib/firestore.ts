import { getFirestoreInstance } from './firebase'
import { CollectionReference, DocumentReference, Timestamp } from 'firebase-admin/firestore'

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  APPOINTMENTS: 'appointments',
  PRESCRIPTIONS: 'prescriptions',
  MEDICATIONS: 'medications',
  DOSAGES: 'dosages',
} as const

// Get Firestore instance
function getDb() {
  return getFirestoreInstance()
}

// Collection references 
export const usersCollection = (): CollectionReference => getDb().collection(COLLECTIONS.USERS)
export const appointmentsCollection = (): CollectionReference => getDb().collection(COLLECTIONS.APPOINTMENTS)
export const prescriptionsCollection = (): CollectionReference => getDb().collection(COLLECTIONS.PRESCRIPTIONS)
export const medicationsCollection = (): CollectionReference => getDb().collection(COLLECTIONS.MEDICATIONS)
export const dosagesCollection = (): CollectionReference => getDb().collection(COLLECTIONS.DOSAGES)

// Helper to convert Firestore Timestamp to Date
export function timestampToDate(timestamp: Timestamp | Date | null | undefined): Date | null {
  if (!timestamp) return null
  if (timestamp instanceof Date) return timestamp
  if (timestamp instanceof Timestamp) return timestamp.toDate()
  return null
}

// Helper to convert Date to Firestore Timestamp
export function dateToTimestamp(date: Date | string | Timestamp | null | undefined): Timestamp | null {
  if (!date) return null
  
  if (date instanceof Timestamp) return date
  const dateObj = date instanceof Date ? date : new Date(date)
  if (isNaN(dateObj.getTime())) return null
  return Timestamp.fromDate(dateObj)
}

// Type guard to check if value is a Timestamp
function isTimestamp(value: any): value is Timestamp {
  return value && typeof value === 'object' && value.constructor === Timestamp
}

// Helper to convert Firestore document to plain object with dates
export function convertTimestamps<T extends Record<string, any>>(data: T): T {
  const converted = { ...data }
  for (const key in converted) {
    const value = converted[key]
    if (isTimestamp(value)) {
      converted[key] = value.toDate() as any
    }
  }
  return converted
}
