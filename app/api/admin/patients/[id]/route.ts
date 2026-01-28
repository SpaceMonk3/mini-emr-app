import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { datetime: 'asc' },
        },
        prescriptions: {
          orderBy: { refillOn: 'asc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      appointments: user.appointments,
      prescriptions: user.prescriptions,
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
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, email },
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email })
  } catch (error: any) {
    console.error('Error updating patient:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}
