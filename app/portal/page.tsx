import { redirect } from 'next/navigation'
import { getSessionUserId } from '@/lib/auth'
import { getUserById, getAppointmentsByUserId, getPrescriptionsByUserId } from '@/lib/db'
import { calculateRecurringAppointments, calculateRefillDates, getAppointmentsInNext7Days, getRefillsInNext7Days, addMonths } from '@/lib/dateUtils'
import DashboardSummary from '@/components/portal/DashboardSummary'
import Navbar from '@/components/portal/Navbar'

async function getDashboardData() {
  const userId = await getSessionUserId()
  if (!userId) {
    redirect('/')
  }

  const user = await getUserById(userId)
  if (!user) {
    redirect('/')
  }

  const appointments = await getAppointmentsByUserId(userId)
  const prescriptions = await getPrescriptionsByUserId(userId)

  const now = new Date()
  const threeMonthsFromNow = addMonths(now, 3)

  // Calculate all upcoming appointments
  const allAppointments: Array<{ date: Date; provider: string; repeatSchedule: string | null }> = []
  for (const apt of appointments) {
    const aptDate = apt.datetime instanceof Date ? apt.datetime : new Date(apt.datetime)
    const endDate = apt.endDate ? (apt.endDate instanceof Date ? apt.endDate : new Date(apt.endDate)) : null
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
    const refillOn = prescription.refillOn instanceof Date ? prescription.refillOn : new Date(prescription.refillOn)
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

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    appointments7Days,
    refills7Days,
  }
}

export default async function PortalPage() {
  const data = await getDashboardData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {data.user.name}</h1>
          <p className="mt-2 text-gray-600">{data.user.email}</p>
        </div>

        <DashboardSummary
          appointments7Days={data.appointments7Days}
          refills7Days={data.refills7Days}
        />
      </div>
    </div>
  )
}
