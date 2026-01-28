import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    const prescription = await prisma.prescription.create({
      data: {
        userId: parseInt(userId, 10),
        medication,
        dosage,
        quantity: parseInt(quantity, 10),
        refillOn: new Date(refillOn),
        refillSchedule,
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error: any) {
    console.error('Error creating prescription:', error)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    )
  }
}
