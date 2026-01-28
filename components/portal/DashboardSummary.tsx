'use client'

import { format } from 'date-fns'
import Link from 'next/link'

interface Appointment {
  date: string
  provider: string
  repeatSchedule: string | null
}

interface Refill {
  date: string
  medication: string
  dosage: string
  quantity: number
}

interface DashboardSummaryProps {
  appointments7Days: Appointment[]
  refills7Days: Refill[]
}

export default function DashboardSummary({
  appointments7Days,
  refills7Days,
}: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
          <Link
            href="/portal/appointments"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All →
          </Link>
        </div>
        {appointments7Days.length === 0 ? (
          <p className="text-gray-500">No appointments in the next 7 days</p>
        ) : (
          <div className="space-y-3">
            {appointments7Days.map((apt, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900">{apt.provider}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(apt.date), 'MMM d, yyyy h:mm a')}
                </p>
                {apt.repeatSchedule && (
                  <p className="text-xs text-gray-500">Repeats: {apt.repeatSchedule}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Refills</h2>
          <Link
            href="/portal/prescriptions"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All →
          </Link>
        </div>
        {refills7Days.length === 0 ? (
          <p className="text-gray-500">No refills in the next 7 days</p>
        ) : (
          <div className="space-y-3">
            {refills7Days.map((refill, idx) => (
              <div key={idx} className="border-l-4 border-green-500 pl-4">
                <p className="font-medium text-gray-900">
                  {refill.medication} {refill.dosage}
                </p>
                <p className="text-sm text-gray-600">
                  Refill: {format(new Date(refill.date), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-500">Quantity: {refill.quantity}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
