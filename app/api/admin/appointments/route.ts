import { NextRequest, NextResponse } from 'next/server'
import { createAppointment, getUserById } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, provider, datetime, repeatSchedule, endDate } = body

    if (!userId || !provider || !datetime) {
      return NextResponse.json(
        { error: 'User ID, provider, and datetime are required' },
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

    const appointment = await createAppointment({
      userId,
      provider,
      datetime,
      repeatSchedule: repeatSchedule || null,
      endDate: endDate || null,
    })

    // Convert dates to ISO strings for response
    const response = {
      id: appointment.id,
      userId: appointment.userId,
      provider: appointment.provider,
      datetime: appointment.datetime instanceof Date ? appointment.datetime.toISOString() : appointment.datetime,
      repeatSchedule: appointment.repeatSchedule,
      endDate: appointment.endDate ? (appointment.endDate instanceof Date ? appointment.endDate.toISOString() : appointment.endDate) : null,
      createdAt: appointment.createdAt instanceof Date ? appointment.createdAt.toISOString() : appointment.createdAt,
      updatedAt: appointment.updatedAt instanceof Date ? appointment.updatedAt.toISOString() : appointment.updatedAt,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
