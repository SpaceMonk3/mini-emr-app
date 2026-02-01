import { NextResponse } from 'next/server'
import { getAllDosages } from '@/lib/db'

export async function GET() {
  try {
    const dosages = await getAllDosages()
    return NextResponse.json(dosages.map(d => d.amount))
  } catch (error) {
    console.error('Error fetching dosages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dosages' },
      { status: 500 }
    )
  }
}
