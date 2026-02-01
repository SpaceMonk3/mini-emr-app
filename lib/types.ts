import { Timestamp } from 'firebase-admin/firestore'

// Base document interface
export interface FirestoreDocument {
  id: string
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

// User document
export interface UserDocument extends FirestoreDocument {
  name: string
  email: string
  passwordHash: string
}

// Appointment document
export interface AppointmentDocument extends FirestoreDocument {
  userId: string
  provider: string
  datetime: Date | Timestamp
  repeatSchedule: string | null // "weekly", "monthly", null for one-time
  endDate: Date | Timestamp | null // For ending recurring appointments
}

// Prescription document
export interface PrescriptionDocument extends FirestoreDocument {
  userId: string
  medication: string
  dosage: string
  quantity: number
  refillOn: Date | Timestamp
  refillSchedule: string // "monthly", "weekly", etc.
}

// Medication document
export interface MedicationDocument extends FirestoreDocument {
  name: string
}

// Dosage document
export interface DosageDocument extends FirestoreDocument {
  amount: string
}

// API response types (with dates converted to ISO strings)
export interface UserResponse {
  id: string
  name: string
  email: string
}

export interface AppointmentResponse {
  id: string
  userId: string
  provider: string
  datetime: string
  repeatSchedule: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface PrescriptionResponse {
  id: string
  userId: string
  medication: string
  dosage: string
  quantity: number
  refillOn: string
  refillSchedule: string
  createdAt: string
  updatedAt: string
}
