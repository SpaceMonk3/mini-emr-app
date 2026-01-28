import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateRecurringAppointments } from '@/lib/dateUtils'
import { addDays } from 'date-fns'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        appointments: true,
        prescriptions: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Calculate at-a-glance data for each user
    const patientsWithStats = users.map(user => {
      // Find next appointment
      let nextAppointment: Date | null = null
      const now = new Date()
      const threeMonthsFromNow = new Date()
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

      for (const apt of user.appointments) {
        const recurringDates = calculateRecurringAppointments(
          apt.datetime,
          apt.repeatSchedule,
          apt.endDate,
          threeMonthsFromNow
        )
        const upcomingDates = recurringDates.filter(d => d > now)
        if (upcomingDates.length > 0) {
          const earliest = upcomingDates[0]
          if (!nextAppointment || earliest < nextAppointment) {
            nextAppointment = earliest
          }
        }
      }

      // Count active prescriptions
      const activePrescriptions = user.prescriptions.length

      // Count upcoming refills in next 7 days
      const sevenDaysFromNow = addDays(now, 7)
      const upcomingRefills = user.prescriptions.filter(p => {
        const refillDate = new Date(p.refillOn)
        return refillDate >= now && refillDate <= sevenDaysFromNow
      }).length

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        nextAppointment: nextAppointment?.toISOString() || null,
        activePrescriptions,
        upcomingRefills,
      }
    })

    return NextResponse.json(patientsWithStats)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Hash password
    const bcrypt = require('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating patient:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
