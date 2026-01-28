import { addWeeks, addMonths, isBefore, isAfter, addDays, startOfDay } from 'date-fns'

export { addMonths }

/**
 * Calculate all recurring appointment dates up to 3 months from today
 */
export function calculateRecurringAppointments(
  startDate: Date,
  repeatSchedule: string | null,
  endDate: Date | null,
  maxDate: Date = addMonths(new Date(), 3)
): Date[] {
  const appointments: Date[] = []
  let currentDate = new Date(startDate)

  // If no repeat schedule, return just the start date if it's in the future
  if (!repeatSchedule) {
    if (isAfter(currentDate, new Date()) && isBefore(currentDate, maxDate)) {
      appointments.push(currentDate)
    }
    return appointments
  }

  // recurring appointments
  while (isBefore(currentDate, maxDate)) {
    // Check if appointment is after today and before end date (if set)
    if (isAfter(currentDate, new Date())) {
      if (!endDate || isBefore(currentDate, endDate)) {
        appointments.push(new Date(currentDate))
      }
    }

    // Move to next appointment based on schedule
    if (repeatSchedule === 'weekly') {
      currentDate = addWeeks(currentDate, 1)
    } else if (repeatSchedule === 'monthly') {
      currentDate = addMonths(currentDate, 1)
    } else {
      // Unknown schedule, break
      break
    }


    if (endDate && isAfter(currentDate, endDate)) {
      break
    }
  }

  return appointments
}

/**
 * Calculate all medication refill dates up to 3 months from today
 */
export function calculateRefillDates(
  refillOn: Date,
  refillSchedule: string,
  maxDate: Date = addMonths(new Date(), 3)
): Date[] {
  const refills: Date[] = []
  let currentDate = new Date(refillOn)

  while (isBefore(currentDate, maxDate)) {
    // Only include refills that are today or in the future
    if (isAfter(currentDate, startOfDay(new Date())) || 
        currentDate.toDateString() === new Date().toDateString()) {
      refills.push(new Date(currentDate))
    }

    // Move to next refill based on schedule
    if (refillSchedule === 'weekly') {
      currentDate = addWeeks(currentDate, 1)
    } else if (refillSchedule === 'monthly') {
      currentDate = addMonths(currentDate, 1)
    } else {
      // Unknown schedule, break
      break
    }
  }

  return refills
}

/**
 * Get appointments within the next 7 days
 */
export function getAppointmentsInNext7Days(appointments: Date[]): Date[] {
  const sevenDaysFromNow = addDays(new Date(), 7)
  return appointments.filter(apt => 
    isAfter(apt, new Date()) && isBefore(apt, sevenDaysFromNow)
  )
}

/**
 * Get refills within the next 7 days
 */
export function getRefillsInNext7Days(refills: Date[]): Date[] {
  const sevenDaysFromNow = addDays(new Date(), 7)
  return refills.filter(refill => 
    isAfter(refill, startOfDay(new Date())) && isBefore(refill, sevenDaysFromNow)
  )
}
