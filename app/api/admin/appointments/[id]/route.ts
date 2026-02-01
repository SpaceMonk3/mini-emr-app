import { NextRequest, NextResponse } from 'next/server'
import { getAppointmentById, updateAppointment, deleteAppointment } from '@/lib/db'
import { timestampToDate } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const body = await request.json()
    const { provider, datetime, repeatSchedule, endDate } = body

    // Check if appointment exists
    const existing = await getAppointmentById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (provider !== undefined) updateData.provider = provider
    if (datetime !== undefined) updateData.datetime = datetime
    if (repeatSchedule !== undefined) updateData.repeatSchedule = repeatSchedule
    if (endDate !== undefined) updateData.endDate = endDate ? endDate : null

    const appointment = await updateAppointment(id, updateData)

    // Convert dates to ISO strings for response
    const datetimeDate = timestampToDate(appointment.datetime)
    const endDateDate = appointment.endDate ? timestampToDate(appointment.endDate) : null
    const createdAtDate = timestampToDate(appointment.createdAt)
    const updatedAtDate = timestampToDate(appointment.updatedAt)

    const response = {
      id: appointment.id,
      userId: appointment.userId,
      provider: appointment.provider,
      datetime: datetimeDate ? datetimeDate.toISOString() : null,
      repeatSchedule: appointment.repeatSchedule,
      endDate: endDateDate ? endDateDate.toISOString() : null,
      createdAt: createdAtDate ? createdAtDate.toISOString() : null,
      updatedAt: updatedAtDate ? updatedAtDate.toISOString() : null,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating appointment:', error)
    if (error.message?.includes('not found')) {
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
    const id = params.id

    // Check if appointment exists
    const existing = await getAppointmentById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    await deleteAppointment(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}
