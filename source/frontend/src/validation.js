// ============================================================
// validation.js — the SAME rules the PHP API enforces, checked
// in the browser first so the user gets instant feedback.
// The server still checks everything again (never trust the
// browser alone). Each function returns an object of
// field -> error message (empty object = everything is fine).
// ============================================================
import { BLOOD_GROUPS } from './config.js'

// Pakistani mobile: 11 digits starting with 03.
// Accepts "0301-2345678" or "03012345678" (dash/space ignored).
export function isValidPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  return /^03\d{9}$/.test(digits)
}

// Date must look like YYYY-MM-DD and be a real calendar date.
export function isValidDateString(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return false
  const [y, m, d] = String(date).split('-').map(Number)
  const parsed = new Date(y, m - 1, d)
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d
}

// Is this date in the future?
export function isFutureDate(date) {
  return String(date) > new Date().toISOString().slice(0, 10)
}

// Can this person donate? Last donation must be 3+ months ago.
export function isEligibleDonor(lastDonationDate) {
  if (!lastDonationDate) return true
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  return String(lastDonationDate) <= threeMonthsAgo.toISOString().slice(0, 10)
}

// --- Donor form ---
// name: required, min 3 chars. bloodGroup: must be selected.
// city: required. phone: required + Pakistani format.
// lastDonation: if given, valid date, not future, 3+ months ago.
export function validateDonor({ name, bloodGroup, city, phone, lastDonation }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Name is required.'
  else if (name.trim().length < 3) errors.name = 'Name must be at least 3 characters.'

  if (!bloodGroup) errors.blood_group = 'Please select a blood group.'
  else if (!BLOOD_GROUPS.includes(bloodGroup)) errors.blood_group = 'Invalid blood group.'

  if (!city.trim()) errors.city = 'City is required.'

  if (!phone.trim()) errors.phone = 'Phone is required.'
  else if (!isValidPhone(phone)) errors.phone = 'Phone must look like 03XX-XXXXXXX (11 digits starting with 03).'

  if (lastDonation) {
    if (!isValidDateString(lastDonation)) errors.last_donation_date = 'Date must look like YYYY-MM-DD.'
    else if (isFutureDate(lastDonation)) errors.last_donation_date = 'Last donation date cannot be in the future.'
    else if (!isEligibleDonor(lastDonation)) errors.last_donation_date = 'Not eligible yet — you can donate again 3 months after your last donation.'
  }
  return errors
}

// --- Blood request form ---
// patientName: required, min 3 chars. bloodGroup: must be selected.
// city + hospital: required. urgency: must be selected.
export function validateRequest({ patientName, bloodGroup, city, hospital, urgency }) {
  const errors = {}
  if (!patientName.trim()) errors.patient_name = 'Patient name is required.'
  else if (patientName.trim().length < 3) errors.patient_name = 'Patient name must be at least 3 characters.'

  if (!bloodGroup) errors.blood_group = 'Please select a blood group.'
  else if (!BLOOD_GROUPS.includes(bloodGroup)) errors.blood_group = 'Invalid blood group.'

  if (!city.trim()) errors.city = 'City is required.'
  if (!hospital.trim()) errors.hospital = 'Hospital is required.'

  if (!urgency) errors.urgency = 'Please select an urgency.'
  else if (!['Normal', 'Urgent', 'Critical'].includes(urgency)) errors.urgency = 'Invalid urgency.'
  return errors
}

// --- Admin login form ---
export function validateLogin({ username, password }) {
  const errors = {}
  if (!username.trim()) errors.username = 'Username is required.'
  if (!password) errors.password = 'Password is required.'
  return errors
}
