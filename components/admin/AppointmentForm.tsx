'use client'

import { useState, useEffect } from 'react'

interface AppointmentFormProps {
  appointment?: {
    id: number
    provider: string
    datetime: string
    repeatSchedule: string | null
    endDate: string | null
  }
  userId: number
  onSubmit: (data: {
    userId: number
    provider: string
    datetime: string
    repeatSchedule: string | null
    endDate: string | null
  }) => Promise<void>
  onCancel: () => void
}

export default function AppointmentForm({
  appointment,
  userId,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const [provider, setProvider] = useState(appointment?.provider || '')
  const [datetime, setDatetime] = useState(
    appointment ? new Date(appointment.datetime).toISOString().slice(0, 16) : ''
  )
  const [repeatSchedule, setRepeatSchedule] = useState(appointment?.repeatSchedule || '')
  const [endDate, setEndDate] = useState(
    appointment?.endDate ? new Date(appointment.endDate).toISOString().slice(0, 16) : ''
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        userId,
        provider,
        datetime,
        repeatSchedule: repeatSchedule || null,
        endDate: endDate || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
          Provider Name
        </label>
        <input
          type="text"
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
          Date & Time
        </label>
        <input
          type="datetime-local"
          id="datetime"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="repeatSchedule" className="block text-sm font-medium text-gray-700">
          Repeat Schedule
        </label>
        <select
          id="repeatSchedule"
          value={repeatSchedule}
          onChange={(e) => setRepeatSchedule(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {repeatSchedule && (
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date (optional)
          </label>
          <input
            type="datetime-local"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : appointment ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
