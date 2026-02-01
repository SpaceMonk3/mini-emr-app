import { NextRequest, NextResponse } from 'next/server'
import { getUserById, getAppointmentsByUserId, getPrescriptionsByUserId } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'
import { timestampToDate } from '@/lib/firestore'
import { calculateRecurringAppointments, calculateRefillDates, getAppointmentsInNext7Days, getRefillsInNext7Days, addMonths } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const appointments = await getAppointmentsByUserId(userId)
    const prescriptions = await getPrescriptionsByUserId(userId)

    const now = new Date()
    const threeMonthsFromNow = addMonths(now, 3)

    // Calculate all upcoming appointments
    const allAppointments: Array<{ date: Date; provider: string; repeatSchedule: string | null }> = []
    for (const apt of appointments) {
      const aptDate = timestampToDate(apt.datetime) || new Date()
      const endDate = apt.endDate ? timestampToDate(apt.endDate) : null
      const recurringDates = calculateRecurringAppointments(
        aptDate,
        apt.repeatSchedule,
        endDate,
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

    // Get appointments in next 7 days
    const appointments7Days = getAppointmentsInNext7Days(
      allAppointments.map(a => a.date)
    ).map(date => {
      const apt = allAppointments.find(a => a.date.getTime() === date.getTime())
      return { date: date.toISOString(), provider: apt?.provider || '', repeatSchedule: apt?.repeatSchedule || null }
    })

    // Calculate all upcoming refills
    const allRefills: Array<{ date: Date; medication: string; dosage: string; quantity: number }> = []
    for (const prescription of prescriptions) {
      const refillOn = timestampToDate(prescription.refillOn) || new Date()
      const refillDates = calculateRefillDates(
        refillOn,
        prescription.refillSchedule,
        threeMonthsFromNow
      )
      for (const date of refillDates) {
        allRefills.push({
          date,
          medication: prescription.medication,
          dosage: prescription.dosage,
          quantity: prescription.quantity,
        })
      }
    }
    allRefills.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Get refills in next 7 days
    const refills7Days = getRefillsInNext7Days(
      allRefills.map(r => r.date)
    ).map(date => {
      const refill = allRefills.find(r => r.date.getTime() === date.getTime())
      return {
        date: date.toISOString(),
        medication: refill?.medication || '',
        dosage: refill?.dosage || '',
        quantity: refill?.quantity || 0,
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      appointments7Days,
      refills7Days,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
