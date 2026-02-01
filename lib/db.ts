// Firestore database helpers
// database access layer 

import {
  usersCollection,
  appointmentsCollection,
  prescriptionsCollection,
  medicationsCollection,
  dosagesCollection,
  timestampToDate,
  dateToTimestamp,
  convertTimestamps,
} from './firestore'
import { Timestamp } from 'firebase-admin/firestore'
import type {
  UserDocument,
  AppointmentDocument,
  PrescriptionDocument,
  MedicationDocument,
  DosageDocument,
} from './types'

// User helpers
export async function getUserById(id: string): Promise<UserDocument | null> {
  const doc = await usersCollection().doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...convertTimestamps(doc.data()!) } as UserDocument
}

export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  const snapshot = await usersCollection().where('email', '==', email).limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...convertTimestamps(doc.data()) } as UserDocument
}

export async function createUser(data: {
  name: string
  email: string
  passwordHash: string
}): Promise<UserDocument> {
  const now = Timestamp.now()
  const userData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  const docRef = await usersCollection().add(userData)
  const doc = await docRef.get()
  return { id: doc.id, ...convertTimestamps(doc.data()!) } as UserDocument
}

export async function updateUser(id: string, data: Partial<Omit<UserDocument, 'id' | 'createdAt'>>): Promise<UserDocument> {
  const updateData = {
    ...data,
    updatedAt: Timestamp.now(),
  }
  await usersCollection().doc(id).update(updateData)
  const updated = await getUserById(id)
  if (!updated) throw new Error('User not found after update')
  return updated
}

export async function getAllUsers(): Promise<UserDocument[]> {
  const snapshot = await usersCollection().orderBy('name', 'asc').get()
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as UserDocument[]
}

// Appointment helpers
export async function getAppointmentById(id: string): Promise<AppointmentDocument | null> {
  const doc = await appointmentsCollection().doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...convertTimestamps(doc.data()!) } as AppointmentDocument
}

export async function getAppointmentsByUserId(userId: string): Promise<AppointmentDocument[]> {
  const snapshot = await appointmentsCollection()
    .where('userId', '==', userId)
    .get()
  const appointments = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as AppointmentDocument[]
  
  // Sort by datetime in memory 
  return appointments.sort((a, b) => {
    const dateA = timestampToDate(a.datetime) || new Date(0)
    const dateB = timestampToDate(b.datetime) || new Date(0)
    return dateA.getTime() - dateB.getTime()
  })
}

export async function createAppointment(data: {
  userId: string
  provider: string
  datetime: Date | string
  repeatSchedule?: string | null
  endDate?: Date | string | null
}): Promise<AppointmentDocument> {
  const now = Timestamp.now()
  const appointmentData = {
    userId: data.userId,
    provider: data.provider,
    datetime: dateToTimestamp(data.datetime)!,
    repeatSchedule: data.repeatSchedule ?? null,
    endDate: data.endDate ? dateToTimestamp(data.endDate) : null,
    createdAt: now,
    updatedAt: now,
  }
  const docRef = await appointmentsCollection().add(appointmentData)
  const doc = await docRef.get()
  return { id: doc.id, ...convertTimestamps(doc.data()!) } as AppointmentDocument
}

export async function updateAppointment(
  id: string,
  data: Partial<Omit<AppointmentDocument, 'id' | 'createdAt'>>
): Promise<AppointmentDocument> {
  const updateData: any = {
    updatedAt: Timestamp.now(),
  }
  if (data.provider !== undefined) updateData.provider = data.provider
  if (data.datetime !== undefined) updateData.datetime = dateToTimestamp(data.datetime)
  if (data.repeatSchedule !== undefined) updateData.repeatSchedule = data.repeatSchedule
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? dateToTimestamp(data.endDate) : null

  await appointmentsCollection().doc(id).update(updateData)
  const updated = await getAppointmentById(id)
  if (!updated) throw new Error('Appointment not found after update')
  return updated
}

export async function deleteAppointment(id: string): Promise<void> {
  await appointmentsCollection().doc(id).delete()
}

// Prescription helpers
export async function getPrescriptionById(id: string): Promise<PrescriptionDocument | null> {
  const doc = await prescriptionsCollection().doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...convertTimestamps(doc.data()!) } as PrescriptionDocument
}

export async function getPrescriptionsByUserId(userId: string): Promise<PrescriptionDocument[]> {
  const snapshot = await prescriptionsCollection()
    .where('userId', '==', userId)
    .get()
  const prescriptions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as PrescriptionDocument[]
  
  // Sort by refillOn in memory 
  return prescriptions.sort((a, b) => {
    const dateA = timestampToDate(a.refillOn) || new Date(0)
    const dateB = timestampToDate(b.refillOn) || new Date(0)
    return dateA.getTime() - dateB.getTime()
  })
}

export async function createPrescription(data: {
  userId: string
  medication: string
  dosage: string
  quantity: number
  refillOn: Date | string
  refillSchedule: string
}): Promise<PrescriptionDocument> {
  const now = Timestamp.now()
  const prescriptionData = {
    userId: data.userId,
    medication: data.medication,
    dosage: data.dosage,
    quantity: data.quantity,
    refillOn: dateToTimestamp(data.refillOn)!,
    refillSchedule: data.refillSchedule,
    createdAt: now,
    updatedAt: now,
  }
  const docRef = await prescriptionsCollection().add(prescriptionData)
  const doc = await docRef.get()
  return { id: doc.id, ...convertTimestamps(doc.data()!) } as PrescriptionDocument
}

export async function updatePrescription(
  id: string,
  data: Partial<Omit<PrescriptionDocument, 'id' | 'createdAt'>>
): Promise<PrescriptionDocument> {
  const updateData: any = {
    updatedAt: Timestamp.now(),
  }
  if (data.medication !== undefined) updateData.medication = data.medication
  if (data.dosage !== undefined) updateData.dosage = data.dosage
  if (data.quantity !== undefined) updateData.quantity = data.quantity
  if (data.refillOn !== undefined) updateData.refillOn = dateToTimestamp(data.refillOn)
  if (data.refillSchedule !== undefined) updateData.refillSchedule = data.refillSchedule

  await prescriptionsCollection().doc(id).update(updateData)
  const updated = await getPrescriptionById(id)
  if (!updated) throw new Error('Prescription not found after update')
  return updated
}

export async function deletePrescription(id: string): Promise<void> {
  await prescriptionsCollection().doc(id).delete()
}

// Medication helpers
export async function getAllMedications(): Promise<MedicationDocument[]> {
  const snapshot = await medicationsCollection().orderBy('name', 'asc').get()
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as MedicationDocument[]
}

// Dosage helpers
export async function getAllDosages(): Promise<DosageDocument[]> {
  const snapshot = await dosagesCollection().orderBy('amount', 'asc').get()
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as DosageDocument[]
}
