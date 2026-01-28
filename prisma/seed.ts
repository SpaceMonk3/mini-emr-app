import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  // Read and parse data.json
  const dataPath = path.join(process.cwd(), 'data.json')
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  // Seed medications lookup table
  console.log('Seeding medications...')
  for (const medicationName of data.medications) {
    await prisma.medication.upsert({
      where: { name: medicationName },
      update: {},
      create: { name: medicationName },
    })
  }

  // Seed dosages lookup table
  console.log('Seeding dosages...')
  for (const dosage of data.dosages) {
    await prisma.dosage.upsert({
      where: { amount: dosage },
      update: {},
      create: { amount: dosage },
    })
  }

  // Seed users with appointments and prescriptions
  console.log('Seeding users...')
  for (const userData of data.users) {
    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10)

    // Create user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        passwordHash: passwordHash,
      },
      create: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        passwordHash: passwordHash,
      },
    })

    // Create appointments
    console.log(`  Creating appointments for ${user.name}...`)
    for (const appointmentData of userData.appointments) {
      await prisma.appointment.upsert({
        where: { id: appointmentData.id },
        update: {
          provider: appointmentData.provider,
          datetime: new Date(appointmentData.datetime),
          repeatSchedule: appointmentData.repeat || null,
        },
        create: {
          id: appointmentData.id,
          userId: user.id,
          provider: appointmentData.provider,
          datetime: new Date(appointmentData.datetime),
          repeatSchedule: appointmentData.repeat || null,
        },
      })
    }

    // Create prescriptions
    console.log(`  Creating prescriptions for ${user.name}...`)
    for (const prescriptionData of userData.prescriptions) {
      await prisma.prescription.upsert({
        where: { id: prescriptionData.id },
        update: {
          medication: prescriptionData.medication,
          dosage: prescriptionData.dosage,
          quantity: prescriptionData.quantity,
          refillOn: new Date(prescriptionData.refill_on),
          refillSchedule: prescriptionData.refill_schedule,
        },
        create: {
          id: prescriptionData.id,
          userId: user.id,
          medication: prescriptionData.medication,
          dosage: prescriptionData.dosage,
          quantity: prescriptionData.quantity,
          refillOn: new Date(prescriptionData.refill_on),
          refillSchedule: prescriptionData.refill_schedule,
        },
      })
    }
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
