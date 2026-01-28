import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    const appointment = await prisma.appointment.create({
      data: {
        userId: parseInt(userId, 10),
        provider,
        datetime: new Date(datetime),
        repeatSchedule: repeatSchedule || null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
