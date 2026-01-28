'use client'

import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import PrescriptionForm from './PrescriptionForm'

interface Prescription {
  id: number
  medication: string
  dosage: string
  quantity: number
  refillOn: string
  refillSchedule: string
}

interface PrescriptionListProps {
  prescriptions: Prescription[]
  userId: number
  onUpdate: () => void
}

export default function PrescriptionList({
  prescriptions,
  userId,
  onUpdate,
}: PrescriptionListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [medications, setMedications] = useState<string[]>([])
  const [dosages, setDosages] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/admin/medications')
      .then((res) => res.json())
      .then((data) => setMedications(data))
    fetch('/api/admin/dosages')
      .then((res) => res.json())
      .then((data) => setDosages(data))
  }, [])

  const handleEdit = (id: number) => {
    setEditingId(id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return

    try {
      const response = await fetch(`/api/admin/prescriptions/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting prescription:', error)
    }
  }

  const handleSubmit = async (data: {
    userId: number
    medication: string
    dosage: string
    quantity: number
    refillOn: string
    refillSchedule: string
  }) => {
    try {
      const url = editingId
        ? `/api/admin/prescriptions/${editingId}`
        : '/api/admin/prescriptions'
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
      console.error('Error saving prescription:', error)
    }
  }

  const prescriptionToEdit = editingId
    ? prescriptions.find((p) => p.id === editingId)
    : undefined

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Prescriptions</h3>
        <button
          onClick={() => {
            setEditingId(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add Prescription
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <PrescriptionForm
            prescription={prescriptionToEdit}
            userId={userId}
            medications={medications}
            dosages={dosages}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingId(null)
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {prescriptions.length === 0 ? (
          <p className="text-gray-500">No prescriptions</p>
        ) : (
          prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="p-4 border border-gray-200 rounded-lg flex justify-between items-start"
            >
              <div>
                <p className="font-medium">
                  {prescription.medication} {prescription.dosage}
                </p>
                <p className="text-sm text-gray-600">
                  Quantity: {prescription.quantity} | Refill: {format(new Date(prescription.refillOn), 'MMM d, yyyy')} ({prescription.refillSchedule})
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(prescription.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(prescription.id)}
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
