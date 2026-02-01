import { NextRequest, NextResponse } from 'next/server'
import { getPrescriptionById, updatePrescription, deletePrescription } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const body = await request.json()
    const { medication, dosage, quantity, refillOn, refillSchedule } = body

    // Check if prescription exists
    const existing = await getPrescriptionById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (medication !== undefined) updateData.medication = medication
    if (dosage !== undefined) updateData.dosage = dosage
    if (quantity !== undefined) updateData.quantity = parseInt(quantity, 10)
    if (refillOn !== undefined) updateData.refillOn = refillOn
    if (refillSchedule !== undefined) updateData.refillSchedule = refillSchedule

    const prescription = await updatePrescription(id, updateData)

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

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating prescription:', error)
    if (error.message?.includes('not found')) {
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
    const id = params.id

    // Check if prescription exists
    const existing = await getPrescriptionById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    await deletePrescription(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting prescription:', error)
    return NextResponse.json(
      { error: 'Failed to delete prescription' },
      { status: 500 }
    )
  }
}
