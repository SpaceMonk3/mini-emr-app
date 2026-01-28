import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { getSessionUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calculateRefillDates, addMonths } from '@/lib/dateUtils'
import Navbar from '@/components/portal/Navbar'

async function getPrescriptions() {
  const userId = await getSessionUserId()
  if (!userId) {
    redirect('/')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      prescriptions: true,
    },
  })

  if (!user) {
    redirect('/')
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

  return {
    prescriptions: prescriptionsWithRefills,
  }
}

export default async function PrescriptionsPage() {
  const data = await getPrescriptions()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
          <p className="mt-2 text-gray-600">All prescriptions and upcoming refills (next 3 months)</p>
        </div>

        <div className="space-y-6">
          {data.prescriptions.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No prescriptions
            </div>
          ) : (
            data.prescriptions.map((prescription: any) => (
              <div key={prescription.id} className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {prescription.medication} {prescription.dosage}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Quantity: {prescription.quantity} | Refill Schedule: {prescription.refillSchedule}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming Refills:</h4>
                  {prescription.refills.length === 0 ? (
                    <p className="text-gray-500 text-sm">No upcoming refills</p>
                  ) : (
                    <div className="space-y-2">
                      {prescription.refills.map((refillDate: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center p-2 bg-gray-50 rounded border-l-4 border-green-500"
                        >
                          <span className="text-sm text-gray-700">
                            {format(new Date(refillDate), 'MMMM d, yyyy')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
