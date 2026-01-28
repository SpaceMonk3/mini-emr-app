'use client'

import { useState, useEffect } from 'react'

interface PrescriptionFormProps {
  prescription?: {
    id: number
    medication: string
    dosage: string
    quantity: number
    refillOn: string
    refillSchedule: string
  }
  userId: number
  medications: string[]
  dosages: string[]
  onSubmit: (data: {
    userId: number
    medication: string
    dosage: string
    quantity: number
    refillOn: string
    refillSchedule: string
  }) => Promise<void>
  onCancel: () => void
}

export default function PrescriptionForm({
  prescription,
  userId,
  medications,
  dosages,
  onSubmit,
  onCancel,
}: PrescriptionFormProps) {
  const [medication, setMedication] = useState(prescription?.medication || '')
  const [dosage, setDosage] = useState(prescription?.dosage || '')
  const [quantity, setQuantity] = useState(prescription?.quantity.toString() || '1')
  const [refillOn, setRefillOn] = useState(
    prescription ? new Date(prescription.refillOn).toISOString().slice(0, 10) : ''
  )
  const [refillSchedule, setRefillSchedule] = useState(prescription?.refillSchedule || 'monthly')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch medications and dosages if not provided
    if (medications.length === 0) {
      fetch('/api/admin/medications')
        .then((res) => res.json())
        .then((data) => {
          // Medications will be set via props
        })
    }
  }, [medications.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        userId,
        medication,
        dosage,
        quantity: parseInt(quantity, 10),
        refillOn,
        refillSchedule,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="medication" className="block text-sm font-medium text-gray-700">
          Medication
        </label>
        <select
          id="medication"
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select medication</option>
          {medications.map((med) => (
            <option key={med} value={med}>
              {med}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
          Dosage
        </label>
        <select
          id="dosage"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select dosage</option>
          {dosages.map((dos) => (
            <option key={dos} value={dos}>
              {dos}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          Quantity
        </label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          min="1"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="refillOn" className="block text-sm font-medium text-gray-700">
          Refill Date
        </label>
        <input
          type="date"
          id="refillOn"
          value={refillOn}
          onChange={(e) => setRefillOn(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="refillSchedule" className="block text-sm font-medium text-gray-700">
          Refill Schedule
        </label>
        <select
          id="refillSchedule"
          value={refillSchedule}
          onChange={(e) => setRefillSchedule(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : prescription ? 'Update' : 'Create'}
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
