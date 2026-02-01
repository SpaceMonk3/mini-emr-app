import { NextRequest, NextResponse } from 'next/server'
import { createPrescription, getUserById } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, medication, dosage, quantity, refillOn, refillSchedule } = body

    if (!userId || !medication || !dosage || !quantity || !refillOn || !refillSchedule) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const prescription = await createPrescription({
      userId,
      medication,
      dosage,
      quantity: parseInt(quantity, 10),
      refillOn,
      refillSchedule,
    })

    // Convert dates to ISO strings for response
    const response = {
      id: prescription.id,
      userId: prescription.userId,
      medication: prescription.medication,
      dosage: prescription.dosage,
      quantity: prescription.quantity,
      refillOn: prescription.refillOn instanceof Date ? prescription.refillOn.toISOString() : prescription.refillOn,
      refillSchedule: prescription.refillSchedule,
      createdAt: prescription.createdAt instanceof Date ? prescription.createdAt.toISOString() : prescription.createdAt,
      updatedAt: prescription.updatedAt instanceof Date ? prescription.updatedAt.toISOString() : prescription.updatedAt,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating prescription:', error)
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    )
  }
}
