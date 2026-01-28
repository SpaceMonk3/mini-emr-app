import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 })
    }

    const body = await request.json()
    const { medication, dosage, quantity, refillOn, refillSchedule } = body

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        medication: medication !== undefined ? medication : undefined,
        dosage: dosage !== undefined ? dosage : undefined,
        quantity: quantity !== undefined ? parseInt(quantity, 10) : undefined,
        refillOn: refillOn ? new Date(refillOn) : undefined,
        refillSchedule: refillSchedule !== undefined ? refillSchedule : undefined,
      },
    })

    return NextResponse.json(prescription)
  } catch (error: any) {
    console.error('Error updating prescription:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update prescription' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 })
    }

    await prisma.prescription.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting prescription:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete prescription' },
      { status: 500 }
    )
  }
}
