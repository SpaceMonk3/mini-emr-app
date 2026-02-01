import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, createUser, getAppointmentsByUserId, getPrescriptionsByUserId, getUserByEmail } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { timestampToDate } from '@/lib/firestore'
import { calculateRecurringAppointments } from '@/lib/dateUtils'
import { addDays } from 'date-fns'

export async function GET() {
  try {
    const users = await getAllUsers()

    // Fetch appointments and prescriptions for each user
    const patientsWithStats = await Promise.all(
      users.map(async (user) => {
        const appointments = await getAppointmentsByUserId(user.id)
        const prescriptions = await getPrescriptionsByUserId(user.id)

        // Find next appointment
        let nextAppointment: Date | null = null
        const now = new Date()
        const threeMonthsFromNow = new Date()
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

        for (const apt of appointments) {
          const aptDate = timestampToDate(apt.datetime) || new Date()
          const endDate = apt.endDate ? timestampToDate(apt.endDate) : null
          const recurringDates = calculateRecurringAppointments(
            aptDate,
            apt.repeatSchedule,
            endDate,
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
        const activePrescriptions = prescriptions.length

        // Count upcoming refills in next 7 days
        const sevenDaysFromNow = addDays(now, 7)
        const upcomingRefills = prescriptions.filter(p => {
          const refillDate = timestampToDate(p.refillOn) || new Date()
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
    )

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

    // Check if email already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    const user = await createUser({
      name,
      email,
      passwordHash,
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
