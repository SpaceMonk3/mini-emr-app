import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'
import { calculateRecurringAppointments, addMonths } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        appointments: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const threeMonthsFromNow = addMonths(now, 3)

    // Calculate all upcoming appointments
    const allAppointments: Array<{ date: Date; provider: string; repeatSchedule: string | null }> = []
    for (const apt of user.appointments) {
      const recurringDates = calculateRecurringAppointments(
        apt.datetime,
        apt.repeatSchedule,
        apt.endDate,
        threeMonthsFromNow
      )
      for (const date of recurringDates) {
        allAppointments.push({
          date,
          provider: apt.provider,
          repeatSchedule: apt.repeatSchedule,
        })
      }
    }
    allAppointments.sort((a, b) => a.date.getTime() - b.date.getTime())

    return NextResponse.json({
      appointments: allAppointments.map(apt => ({
        date: apt.date.toISOString(),
        provider: apt.provider,
        repeatSchedule: apt.repeatSchedule,
      })),
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
