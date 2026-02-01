'use client'

import { format } from 'date-fns'
import { useState } from 'react'
import AppointmentForm from './AppointmentForm'

interface Appointment {
  id: string
  provider: string
  datetime: string
  repeatSchedule: string | null
  endDate: string | null
}

interface AppointmentListProps {
  appointments: Appointment[]
  userId: string
  onUpdate: () => void
}

export default function AppointmentList({ appointments, userId, onUpdate }: AppointmentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleEdit = (id: string) => {
    setEditingId(id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return

    try {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  const handleSubmit = async (data: {
    userId: string
    provider: string
    datetime: string
    repeatSchedule: string | null
    endDate: string | null
  }) => {
    try {
      const url = editingId
        ? `/api/admin/appointments/${editingId}`
        : '/api/admin/appointments'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingId(null)
        onUpdate()
      }
    } catch (error) {
      console.error('Error saving appointment:', error)
    }
  }

  const appointmentToEdit = editingId
    ? appointments.find((a) => a.id === editingId)
    : undefined

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Appointments</h3>
        <button
          onClick={() => {
            setEditingId(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add Appointment
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <AppointmentForm
            appointment={appointmentToEdit}
            userId={userId}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingId(null)
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {appointments.length === 0 ? (
          <p className="text-gray-500">No appointments</p>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="p-4 border border-gray-200 rounded-lg flex justify-between items-start"
            >
              <div>
                <p className="font-medium">{appointment.provider}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(appointment.datetime), 'MMM d, yyyy h:mm a')}
                </p>
                {appointment.repeatSchedule && (
                  <p className="text-sm text-gray-500">
                    Repeats: {appointment.repeatSchedule}
                    {appointment.endDate &&
                      ` until ${format(new Date(appointment.endDate), 'MMM d, yyyy')}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(appointment.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(appointment.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
