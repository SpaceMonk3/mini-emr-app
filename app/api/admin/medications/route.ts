import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const medications = await prisma.medication.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(medications.map(m => m.name))
  } catch (error) {
    console.error('Error fetching medications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medications' },
      { status: 500 }
    )
  }
}
