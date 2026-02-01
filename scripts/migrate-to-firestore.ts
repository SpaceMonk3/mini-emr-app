/**
 * Migration script to migrate data from Supabase/PostgreSQL to Firebase Firestore
 */

import { PrismaClient } from '@prisma/client'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const prisma = new PrismaClient()
const isDryRun = process.argv.includes('--dry-run')

// Initialize Firebase Admin
function initializeFirebase() {
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

const firebaseApp = initializeFirebase()
const firestore = getFirestore(firebaseApp)

// ID mapping to track old integer IDs to new string IDs
const idMappings: {
  users: Map<number, string>
  appointments: Map<number, string>
  prescriptions: Map<number, string>
  medications: Map<number, string>
  dosages: Map<number, string>
} = {
  users: new Map(),
  appointments: new Map(),
  prescriptions: new Map(),
  medications: new Map(),
  dosages: new Map(),
}

async function migrateUsers() {
  console.log('Migrating users...')
  const users = await prisma.user.findMany()

  for (const user of users) {
    const userData = {
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: Timestamp.fromDate(user.createdAt),
      updatedAt: Timestamp.fromDate(user.updatedAt),
    }

    if (isDryRun) {
      console.log(`  [DRY RUN] Would create user: ${user.email}`)
      idMappings.users.set(user.id, `user-${user.id}`)
    } else {
      const docRef = await firestore.collection('users').add(userData)
      idMappings.users.set(user.id, docRef.id)
      console.log(`  Migrated user: ${user.email} (${user.id} -> ${docRef.id})`)
    }
  }
}

async function migrateMedications() {
  console.log('Migrating medications...')
  const medications = await prisma.medication.findMany()

  for (const medication of medications) {
    const medicationData = {
      name: medication.name,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    if (isDryRun) {
      console.log(`  [DRY RUN] Would create medication: ${medication.name}`)
      idMappings.medications.set(medication.id, `medication-${medication.id}`)
    } else {
      const docRef = await firestore.collection('medications').add(medicationData)
      idMappings.medications.set(medication.id, docRef.id)
      console.log(`  Migrated medication: ${medication.name} (${medication.id} -> ${docRef.id})`)
    }
  }
}

async function migrateDosages() {
  console.log('Migrating dosages...')
  const dosages = await prisma.dosage.findMany()

  for (const dosage of dosages) {
    const dosageData = {
      amount: dosage.amount,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    if (isDryRun) {
      console.log(`  [DRY RUN] Would create dosage: ${dosage.amount}`)
      idMappings.dosages.set(dosage.id, `dosage-${dosage.id}`)
    } else {
      const docRef = await firestore.collection('dosages').add(dosageData)
      idMappings.dosages.set(dosage.id, docRef.id)
      console.log(`  Migrated dosage: ${dosage.amount} (${dosage.id} -> ${docRef.id})`)
    }
  }
}

async function migrateAppointments() {
  console.log('Migrating appointments...')
  const appointments = await prisma.appointment.findMany()

  for (const appointment of appointments) {
    const userId = idMappings.users.get(appointment.userId)
    if (!userId) {
      console.warn(`  Warning: User ${appointment.userId} not found in mappings, skipping appointment ${appointment.id}`)
      continue
    }

    const appointmentData = {
      userId,
      provider: appointment.provider,
      datetime: Timestamp.fromDate(appointment.datetime),
      repeatSchedule: appointment.repeatSchedule,
      endDate: appointment.endDate ? Timestamp.fromDate(appointment.endDate) : null,
      createdAt: Timestamp.fromDate(appointment.createdAt),
      updatedAt: Timestamp.fromDate(appointment.updatedAt),
    }

    if (isDryRun) {
      console.log(`  [DRY RUN] Would create appointment for user ${userId}`)
      idMappings.appointments.set(appointment.id, `appointment-${appointment.id}`)
    } else {
      const docRef = await firestore.collection('appointments').add(appointmentData)
      idMappings.appointments.set(appointment.id, docRef.id)
      console.log(`  Migrated appointment: ${appointment.id} -> ${docRef.id}`)
    }
  }
}

async function migratePrescriptions() {
  console.log('Migrating prescriptions...')
  const prescriptions = await prisma.prescription.findMany()

  for (const prescription of prescriptions) {
    const userId = idMappings.users.get(prescription.userId)
    if (!userId) {
      console.warn(`  Warning: User ${prescription.userId} not found in mappings, skipping prescription ${prescription.id}`)
      continue
    }

    const prescriptionData = {
      userId,
      medication: prescription.medication,
      dosage: prescription.dosage,
      quantity: prescription.quantity,
      refillOn: Timestamp.fromDate(prescription.refillOn),
      refillSchedule: prescription.refillSchedule,
      createdAt: Timestamp.fromDate(prescription.createdAt),
      updatedAt: Timestamp.fromDate(prescription.updatedAt),
    }

    if (isDryRun) {
      console.log(`  [DRY RUN] Would create prescription for user ${userId}`)
      idMappings.prescriptions.set(prescription.id, `prescription-${prescription.id}`)
    } else {
      const docRef = await firestore.collection('prescriptions').add(prescriptionData)
      idMappings.prescriptions.set(prescription.id, docRef.id)
      console.log(`  Migrated prescription: ${prescription.id} -> ${docRef.id}`)
    }
  }
}

async function main() {
  try {
    console.log(isDryRun ? '=== DRY RUN MODE ===' : '=== MIGRATION MODE ===')
    console.log('Starting migration from PostgreSQL to Firestore...\n')

    // Migrate in order
    await migrateUsers()
    await migrateMedications()
    await migrateDosages()
    await migrateAppointments()
    await migratePrescriptions()

    console.log('\n=== Migration completed! ===')
    if (isDryRun) {
      console.log('This was a dry run. No data was written to Firestore.')
      console.log('Run without --dry-run to perform the actual migration.')
    } else {
      console.log('All data has been migrated to Firestore.')
    }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
