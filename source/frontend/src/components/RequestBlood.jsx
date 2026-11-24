// ============================================================
// RequestBlood — form to send a blood request for a patient.
// Validation runs on submit AND when you leave a field (blur),
// and each error appears right under its field. The same rules
// are checked again by the PHP API. On success a toast appears.
// New requests start with status "Pending"; the admin marks
// them "Fulfilled" on the dashboard.
// ============================================================
import { useState } from 'react'
import { api } from '../api.js'
import { BLOOD_GROUPS } from '../config.js'
import { validateRequest } from '../validation.js'

const URGENCIES = ['Normal', 'Urgent', 'Critical']

export default function RequestBlood({ showToast }) {
  const [patientName, setPatientName] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [city, setCity] = useState('')
  const [hospital, setHospital] = useState('')
  const [urgency, setUrgency] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [saving, setSaving] = useState(false)

  const values = { patientName, bloodGroup, city, hospital, urgency }
  const liveErrors = validateRequest(values)
  // Show an error only after the field was touched or the form was submitted.
  const showError = (field) => (touched[field] || submitted) && liveErrors[field]
  const hasErrors = Object.keys(liveErrors).length > 0

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setGeneralError('')
    if (hasErrors) return // stop here — the inline errors show what to fix

    setSaving(true)
    try {
      await api.createRequest({
        patient_name: patientName.trim(),
        blood_group: bloodGroup,
        city: city.trim(),
        hospital: hospital.trim(),
        urgency,
      })
      showToast('Blood request sent for ' + patientName.trim() + '. Status: Pending.')
      // Clear the form for the next request.
      setPatientName('')
      setBloodGroup('')
      setCity('')
      setHospital('')
      setUrgency('')
      setErrors({})
      setTouched({})
      setSubmitted(false)
    } catch (err) {
      // Field errors from the server (same rules, checked again).
      if (err.errors) setErrors(err.errors)
      else setGeneralError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Server-side field errors win over the live ones.
  const fieldError = (field) => errors[field] || showError(field)

  return (
    <section>
      <h2>Request Blood</h2>
      <p className="muted">Send a request for a patient. The blood bank admin will see it on the dashboard.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <label>
          Patient name
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            onBlur={() => handleBlur('patient_name')}
            placeholder="For example: Muhammad Asif"
            className={fieldError('patient_name') ? 'invalid' : ''}
          />
          {fieldError('patient_name') && <span className="field-error">{fieldError('patient_name')}</span>}
        </label>

        <label>
          Blood group needed
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            onBlur={() => handleBlur('blood_group')}
            className={fieldError('blood_group') ? 'invalid' : ''}
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {fieldError('blood_group') && <span className="field-error">{fieldError('blood_group')}</span>}
        </label>

        <label>
          City
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onBlur={() => handleBlur('city')}
            placeholder="For example: Gujrat"
            className={fieldError('city') ? 'invalid' : ''}
          />
          {fieldError('city') && <span className="field-error">{fieldError('city')}</span>}
        </label>

        <label>
          Hospital
          <input
            type="text"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            onBlur={() => handleBlur('hospital')}
            placeholder="For example: Aziz Bhatti Shaheed Hospital"
            className={fieldError('hospital') ? 'invalid' : ''}
          />
          {fieldError('hospital') && <span className="field-error">{fieldError('hospital')}</span>}
        </label>

        <label>
          Urgency
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            onBlur={() => handleBlur('urgency')}
            className={fieldError('urgency') ? 'invalid' : ''}
          >
            <option value="">Select urgency</option>
            {URGENCIES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          {fieldError('urgency') && <span className="field-error">{fieldError('urgency')}</span>}
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Sending...' : 'Send Blood Request'}
        </button>
      </form>

      {generalError && <p className="error">{generalError}</p>}
    </section>
  )
}
