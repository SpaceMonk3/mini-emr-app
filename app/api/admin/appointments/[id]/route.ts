import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 })
    }

    const body = await request.json()
    const { provider, datetime, repeatSchedule, endDate } = body

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        provider: provider !== undefined ? provider : undefined,
        datetime: datetime ? new Date(datetime) : undefined,
        repeatSchedule: repeatSchedule !== undefined ? repeatSchedule : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      },
    })

    return NextResponse.json(appointment)
  } catch (error: any) {
    console.error('Error updating appointment:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update appointment' },
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
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 })
    }

    await prisma.appointment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting appointment:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}
