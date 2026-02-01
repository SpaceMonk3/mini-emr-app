import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { getSessionUserId } from '@/lib/auth'
import { getUserById, getAppointmentsByUserId } from '@/lib/db'
import { timestampToDate } from '@/lib/firestore'
import { calculateRecurringAppointments, addMonths } from '@/lib/dateUtils'
import Navbar from '@/components/portal/Navbar'

async function getAppointments() {
  const userId = await getSessionUserId()
  if (!userId) {
    redirect('/')
  }

  const user = await getUserById(userId)
  if (!user) {
    redirect('/')
  }

  const appointments = await getAppointmentsByUserId(userId)

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

  return {
    appointments: allAppointments.map(apt => ({
      date: apt.date.toISOString(),
      provider: apt.provider,
      repeatSchedule: apt.repeatSchedule,
    })),
  }
}

export default async function AppointmentsPage() {
  const data = await getAppointments()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="mt-2 text-gray-600">Upcoming appointments (next 3 months)</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {data.appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No upcoming appointments
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {data.appointments.map((apt: any, idx: number) => (
                <div key={idx} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{apt.provider}</h3>
                      <p className="text-gray-600 mt-1">
                        {format(new Date(apt.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-gray-600">
                        {format(new Date(apt.date), 'h:mm a')}
                      </p>
                      {apt.repeatSchedule && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Repeats: {apt.repeatSchedule}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
