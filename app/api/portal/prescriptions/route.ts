import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'
import { calculateRefillDates, addMonths } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        prescriptions: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const threeMonthsFromNow = addMonths(now, 3)

    // Calculate all upcoming refills for each prescription
    const prescriptionsWithRefills = user.prescriptions.map(prescription => {
      const refillDates = calculateRefillDates(
        prescription.refillOn,
        prescription.refillSchedule,
        threeMonthsFromNow
      )

      return {
        id: prescription.id,
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        refillSchedule: prescription.refillSchedule,
        refills: refillDates.map(date => date.toISOString()),
      }
    })

    return NextResponse.json({
      prescriptions: prescriptionsWithRefills,
    })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    )
  }
}
