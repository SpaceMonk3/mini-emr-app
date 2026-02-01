import { NextResponse } from 'next/server'
import { getAllMedications } from '@/lib/db'

export async function GET() {
  try {
    const medications = await getAllMedications()
    return NextResponse.json(medications.map(m => m.name))
  } catch (error) {
    console.error('Error fetching medications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medications' },
      { status: 500 }
    )
  }
}
