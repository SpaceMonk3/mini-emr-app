'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PatientForm from '@/components/admin/PatientForm'
import AppointmentList from '@/components/admin/AppointmentList'
import PrescriptionList from '@/components/admin/PrescriptionList'

interface Patient {
  id: string
  name: string
  email: string
  appointments: Array<{
    id: string
    provider: string
    datetime: string
    repeatSchedule: string | null
    endDate: string | null
  }>
  prescriptions: Array<{
    id: string
    medication: string
    dosage: string
    quantity: number
    refillOn: string
    refillSchedule: string
  }>
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPatient, setEditingPatient] = useState(false)

  const patientId = params.id as string

  const fetchPatient = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data)
      }
    } catch (error) {
      console.error('Error fetching patient:', error)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  const handlePatientUpdate = async (data: {
    name: string
    email: string
    password?: string
  }) => {
    try {
      const response = await fetch(`/api/admin/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setEditingPatient(false)
        fetchPatient()
      }
    } catch (error) {
      console.error('Error updating patient:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Patient not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Patient List
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Patient Details</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{patient.name}</h2>
              <p className="text-gray-600">{patient.email}</p>
            </div>
            <button
              onClick={() => setEditingPatient(!editingPatient)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingPatient ? 'Cancel Edit' : 'Edit Patient'}
            </button>
          </div>

          {editingPatient && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <PatientForm
                patient={patient}
                onSubmit={handlePatientUpdate}
                onCancel={() => setEditingPatient(false)}
              />
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <AppointmentList
            appointments={patient.appointments}
            userId={patient.id}
            onUpdate={fetchPatient}
          />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <PrescriptionList
            prescriptions={patient.prescriptions}
            userId={patient.id}
            onUpdate={fetchPatient}
          />
        </div>
      </div>
    </div>
  )
}
