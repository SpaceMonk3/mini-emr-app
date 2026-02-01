import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser, getAppointmentsByUserId, getPrescriptionsByUserId, getUserByEmail } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const appointments = await getAppointmentsByUserId(id)
    const prescriptions = await getPrescriptionsByUserId(id)

    // Convert dates to ISO strings for API response
    const appointmentsResponse = appointments.map(apt => ({
      id: apt.id,
      userId: apt.userId,
      provider: apt.provider,
      datetime: apt.datetime instanceof Date ? apt.datetime.toISOString() : apt.datetime,
      repeatSchedule: apt.repeatSchedule,
      endDate: apt.endDate ? (apt.endDate instanceof Date ? apt.endDate.toISOString() : apt.endDate) : null,
      createdAt: apt.createdAt instanceof Date ? apt.createdAt.toISOString() : apt.createdAt,
      updatedAt: apt.updatedAt instanceof Date ? apt.updatedAt.toISOString() : apt.updatedAt,
    }))

    const prescriptionsResponse = prescriptions.map(pres => ({
      id: pres.id,
      userId: pres.userId,
      medication: pres.medication,
      dosage: pres.dosage,
      quantity: pres.quantity,
      refillOn: pres.refillOn instanceof Date ? pres.refillOn.toISOString() : pres.refillOn,
      refillSchedule: pres.refillSchedule,
      createdAt: pres.createdAt instanceof Date ? pres.createdAt.toISOString() : pres.createdAt,
      updatedAt: pres.updatedAt instanceof Date ? pres.updatedAt.toISOString() : pres.updatedAt,
    }))

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      appointments: appointmentsResponse,
      prescriptions: prescriptionsResponse,
    })
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const body = await request.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await getUserById(id)
    if (!existingUser) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check if email is already taken by another user
    const emailUser = await getUserByEmail(email)
    if (emailUser && emailUser.id !== id) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    const user = await updateUser(id, { name, email })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email })
  } catch (error: any) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}
